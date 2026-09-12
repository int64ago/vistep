import { describe, expect, it } from 'vitest';
import {
  KEYBOARD_SWITCH_SPECS,
  KEYBOARD_SWITCH_VARIANTS,
  keyboardBlueJacketReplay,
  keyboardContactReplay,
  keyboardHallPosition,
  keyboardHallSignal,
  keyboardRapidReplay,
  keyboardSwitchForceAt,
  keyboardSwitchForceCurve,
  keyboardSwitchShot,
  keyboardSwitchState,
  keyboardSwitchStateAtTravel,
  type KeyboardSwitchVariant,
} from './keyboard-switch';

/** Add samples without changing any extrema of the prescribed motion. */
function refine(history: number[], steps: number) {
  return history.flatMap((d, i) =>
    i === 0
      ? [d]
      : Array.from(
          { length: steps },
          (_, j) => history[i - 1] + ((d - history[i - 1]) * (j + 1)) / steps,
        ),
  );
}

describe('published MX2A anchors and declared force fits', () => {
  it('keeps actuation force distinct from tactile pressure-point force', () => {
    const expected: [KeyboardSwitchVariant, number, number, number][] = [
      ['red', 45, 2, 4],
      ['black', 60, 2, 4],
      ['brown', 45, 2, 4],
      ['blue', 50, 2.2, 4],
      ['silver', 45, 1.2, 3.4],
      ['silent-red', 45, 1.9, 3.7],
    ];
    for (const [variant, force, pre, total] of expected) {
      const spec = KEYBOARD_SWITCH_SPECS[variant];
      expect([spec.actuationForceCn, spec.preTravelMm, spec.totalTravelMm]).toEqual([
        force,
        pre,
        total,
      ]);
      expect(keyboardSwitchForceAt(variant, pre, 'press')).toBeCloseTo(force, 10);
      expect(pre).toBeLessThan(total);
    }
    expect(KEYBOARD_SWITCH_SPECS.brown.pressurePointForceCn).toBe(55);
    expect(KEYBOARD_SWITCH_SPECS.blue.pressurePointForceCn).toBe(60);
    expect(keyboardSwitchForceAt('brown', 1.5)).toBe(55);
    expect(keyboardSwitchForceAt('blue', 2.05)).toBe(60);
    expect(KEYBOARD_SWITCH_SPECS.hall.published).toBe(false);
    expect(KEYBOARD_SWITCH_SPECS.optical.published).toBe(false);
  });

  it('separates rising linear resistance, a tactile drop, and dissipative return paths', () => {
    for (let d = 0; d < 4; d += 0.025) {
      expect(keyboardSwitchForceAt('red', d + 0.01)).toBeGreaterThan(
        keyboardSwitchForceAt('red', d),
      );
      expect(keyboardSwitchForceAt('black', d)).toBeGreaterThan(keyboardSwitchForceAt('red', d));
    }
    expect(keyboardSwitchForceAt('brown', 1.85)).toBeLessThan(keyboardSwitchForceAt('brown', 1.5));
    expect(keyboardSwitchForceAt('blue', 2.2)).toBeLessThan(keyboardSwitchForceAt('blue', 2.05));
    // Independently integrate external work around the cycle. A teaching fit
    // may have local assistance from the leaf, but cannot return net extra work.
    for (const variant of KEYBOARD_SWITCH_VARIANTS) {
      const total = KEYBOARD_SWITCH_SPECS[variant].totalTravelMm;
      const step = total / 4096;
      let pressWorkCnMm = 0,
        releaseWorkCnMm = 0;
      for (let i = 0; i <= 4096; i++) {
        const d = i * step,
          weight = i === 0 || i === 4096 ? 0.5 : 1;
        pressWorkCnMm += weight * step * keyboardSwitchForceAt(variant, d, 'press');
        releaseWorkCnMm += weight * step * keyboardSwitchForceAt(variant, d, 'release');
        // Check every partial-stroke prefix, including before the tactile snap.
        expect(pressWorkCnMm + 1e-8).toBeGreaterThanOrEqual(releaseWorkCnMm);
      }
      expect(pressWorkCnMm + 1e-8).toBeGreaterThanOrEqual(releaseWorkCnMm);
      if (variant === 'brown' || variant === 'blue')
        expect(pressWorkCnMm - releaseWorkCnMm).toBeGreaterThan(5);
    }
    expect(keyboardSwitchForceCurve('silver', 41)).toHaveLength(41);
  });
});

describe('connected structure and mechanical contact history', () => {
  it('derives spring seats, slider displacement and contact tips from one travel', () => {
    for (const variant of KEYBOARD_SWITCH_VARIANTS)
      for (let i = 0; i <= 80; i++) {
        const state = keyboardSwitchState(variant, i / 80);
        expect(state.springBottom).toEqual([0, 2, 0]);
        expect(state.springTop[1] + state.travelMm).toBeCloseTo(11, 12);
        expect(state.springTop[1] - state.springBottom[1]).toBeCloseTo(state.springLengthMm, 12);
        expect(state.springLengthMm).toBeGreaterThanOrEqual(5);
        expect(state.stemOffsetMm).toBe(-state.travelMm);
        expect(state.contact.fixedPoint[0] - state.contact.movingPoint[0]).toBeCloseTo(
          state.contact.gapMm,
          12,
        );
        expect(state.contact.gapMm).toBeGreaterThanOrEqual(0);
        expect(state.contact.gapMm).toBeLessThanOrEqual(0.65);
        if (state.contact.present) expect(state.active).toBe(state.contact.gapMm === 0);
        else expect(state.contact.closed).toBe(false);
      }
  });

  it('cannot actuate on release after a partial press that never crossed actuation', () => {
    // This catches the false-on result from choosing resetMm only by direction.
    for (let i = 0; i <= 400; i++) {
      const state = keyboardSwitchState('red', i / 400, { peakTravelMm: 1.9 });
      expect(state.active).toBe(false);
      expect(state.contact.gapMm).toBeGreaterThan(0);
    }
    expect(keyboardSwitchStateAtTravel('red', 1.9, 'release', {}, [0, 1.9, 1.9]).active).toBe(
      false,
    );
    expect(keyboardSwitchStateAtTravel('red', 1.9, 'release', {}, [0, 3, 1.9]).active).toBe(true);
    expect(keyboardSwitchStateAtTravel('red', 1.8, 'release', {}, [0, 3, 1.8]).active).toBe(false);
  });

  it('preserves gaps at reversal and is independent of monotonic sampling density', () => {
    for (const variant of ['red', 'brown', 'blue'] as const) {
      const history = [0, 0.8, 1.7, 1.35, 2.4, 1.5, 1.75, 3.5, 0];
      for (let n = 1; n <= history.length; n++) {
        const prefix = history.slice(0, n);
        expect(keyboardContactReplay(variant, refine(prefix, 53))).toEqual(
          keyboardContactReplay(variant, prefix),
        );
      }
      const gapAtTurn = keyboardContactReplay(variant, [0, 1.7]).gapMm;
      const gapJustReturning = keyboardContactReplay(variant, [0, 1.7, 1.7 - 1e-7]).gapMm;
      expect(Math.abs(gapAtTurn - gapJustReturning)).toBeLessThan(1e-6);
    }
  });

  it('constrains the blue jacket to its shared stem slot and makes its snap traceable', () => {
    for (let i = 0; i <= 500; i++) {
      const s = keyboardSwitchShot(3, i / 500).state;
      expect(s.click.relativeTravelMm).toBeGreaterThanOrEqual(-0.65000001);
      expect(s.click.relativeTravelMm).toBeLessThanOrEqual(0.00000001);
      expect(s.click.sleeveTravelMm).toBeGreaterThanOrEqual(0);
      expect(s.click.sleeveOffsetMm).toBe(-s.click.sleeveTravelMm);
      expect(s.click.sleeveTravelMm - s.travelMm).toBe(s.click.relativeTravelMm);
    }
    const before = keyboardSwitchStateAtTravel('blue', 2.05, 'press');
    const after = keyboardSwitchStateAtTravel('blue', 2.2, 'press');
    expect(before.click.sleeveTravelMm).toBeCloseTo(1.4, 10);
    expect(after.click.sleeveTravelMm).toBeCloseTo(2.2, 10);
    expect(before.active).toBe(false);
    expect(after.active).toBe(true);
    expect(keyboardSwitchStateAtTravel('blue', 2.12, 'press').click.event).toBe('down');
    expect(keyboardSwitchStateAtTravel('blue', 1.5, 'release').click.event).toBe('up');
  });

  it('distinguishes shorter pre-travel from damping at the two travel limits', () => {
    expect(keyboardSwitchStateAtTravel('silver', 1.6).active).toBe(true);
    expect(keyboardSwitchStateAtTravel('red', 1.6).active).toBe(false);
    const top = keyboardSwitchState('silent-red', 0),
      bottom = keyboardSwitchState('silent-red', 0.5);
    expect(top.silent.topCompressionMm).toBeGreaterThan(0);
    expect(top.silent.bottomCompressionMm).toBe(0);
    expect(bottom.silent.topCompressionMm).toBe(0);
    expect(bottom.silent.bottomCompressionMm).toBeCloseTo(0.25);
    expect(keyboardSwitchStateAtTravel('silent-red', 2).silent).toEqual({
      topCompressionMm: 0,
      bottomCompressionMm: 0,
    });
  });
});

describe('two-piece jacket return-point memory', () => {
  it('does not teleport when a partial stroke reverses or depend on sampling density', () => {
    for (const peak of [1.3, 1.9, 2.1, 2.15, 2.3, 4]) {
      const before = keyboardBlueJacketReplay([0, peak]);
      const returning = keyboardBlueJacketReplay([0, peak, peak - 1e-7]);
      expect(Math.abs(before.sleeveTravelMm - returning.sleeveTravelMm)).toBeLessThan(1e-6);
    }
    const histories = [
      [0, 1.9, 1.7, 2.12, 2.08, 2.15, 0],
      [0, 4, 1.5, 1.8, 1.25, 2.1, 2.3, 0.3, 1.2, 0],
      [0, 2.3, 1.8, 1.800001, 2.1, 1.3, 2.12],
      [0, 2.15, 1.8, 1.800001, 2.15, 0.1, 1.7, 2.2],
    ];
    for (const history of histories)
      for (let n = 1; n <= history.length; n++) {
        const prefix = history.slice(0, n);
        const coarse = keyboardBlueJacketReplay(prefix),
          dense = keyboardBlueJacketReplay(refine(prefix, 89));
        expect(dense.sleeveTravelMm).toBeCloseTo(coarse.sleeveTravelMm, 11);
        expect(dense.resetArmed).toBe(coarse.resetArmed);
      }
    expect(
      keyboardSwitchStateAtTravel('blue', 1.5, 'release', {}, [0, 1.9, 1.5]).click.event,
    ).toBeNull();
    const beforeReset = [0, 2.3, 1.8, 2.1];
    expect(
      keyboardSwitchStateAtTravel('blue', 2.1, 'press', {}, beforeReset).click.event,
    ).toBeNull();
    let seed = 0x6d2b79f5;
    const history = [0];
    for (let i = 0; i < 180; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const d = (seed / 2 ** 32) * 4;
      history.push(d);
      const at = keyboardBlueJacketReplay(history);
      for (const tiny of [-1e-8, 1e-8]) {
        const next = keyboardBlueJacketReplay([...history, d + tiny]);
        expect(Math.abs(next.sleeveTravelMm - at.sleeveTravelMm)).toBeLessThan(2e-7);
      }
    }
  });
});

describe('position sensing and deterministic firmware state', () => {
  it('maps connected magnet distance monotonically to a calibrated position coordinate', () => {
    let previous = -1;
    for (let i = 0; i <= 100; i++) {
      const d = i / 25,
        signal = keyboardHallSignal(d),
        state = keyboardSwitchStateAtTravel('hall', d);
      expect(signal).toBeGreaterThan(previous);
      expect(keyboardHallPosition(signal)).toBeCloseTo(d, 11);
      expect(state.hall.magnetYmm - state.hall.sensorYmm).toBeCloseTo(state.hall.distanceMm, 12);
      expect(state.hall.distanceMm).toBeGreaterThan(2);
      expect(state.hall.fixedActive).toBe(d >= 2);
      previous = signal;
    }
    expect(keyboardHallSignal(0)).toBe(0);
    expect(keyboardHallSignal(4)).toBe(1);
  });

  it('uses extrema and movement thresholds rather than turning every reversal into a key event', () => {
    expect(keyboardRapidReplay([0, 2.7]).active).toBe(true);
    expect(keyboardRapidReplay([0, 3.2, 3.05]).active).toBe(true);
    expect(keyboardRapidReplay([0, 3.2, 2.7]).active).toBe(false);
    expect(keyboardRapidReplay([0, 3.2, 2.7, 2.9]).active).toBe(false);
    expect(keyboardRapidReplay([0, 3.2, 2.7, 3]).active).toBe(true);
    const history = [0, 3.2, 2.7, 2.85, 3.05, 2.55, 2.95, 1, 1.5, 2.6, 0];
    for (const rapidContinuous of [false, true])
      for (let n = 1; n <= history.length; n++) {
        const prefix = history.slice(0, n),
          options = { rapidContinuous };
        expect(keyboardRapidReplay(refine(prefix, 79), options)).toEqual(
          keyboardRapidReplay(prefix, options),
        );
      }
    expect(keyboardRapidReplay([0, 3, 1, 1.4]).active).toBe(false);
    expect(keyboardRapidReplay([0, 3, 1, 1.4], { rapidContinuous: true }).active).toBe(true);
    expect(keyboardRapidReplay([0, 3, 0], { rapidContinuous: true }).armed).toBe(false);
  });

  it('gets optical actuation from the same moving aperture and finite beam overlap', () => {
    for (let i = 0; i <= 400; i++) {
      const d = i / 100,
        s = keyboardSwitchStateAtTravel('optical', d),
        o = s.optical;
      // Independent equal-area ray count across the beam cross-section strip.
      let transmitted = 0;
      for (let ray = 0; ray < 400; ray++) {
        const y = -o.beamRadiusMm + ((ray + 0.5) / 400) * 2 * o.beamRadiusMm;
        if (Math.abs(y - o.apertureCenterMm) <= o.apertureHalfHeightMm) transmitted++;
      }
      expect(Math.abs(o.transmission - transmitted / 400)).toBeLessThan(0.003);
      expect(s.active).toBe(d >= 2);
      expect(s.contact.present).toBe(false);
    }
    expect(keyboardSwitchStateAtTravel('optical', 0).optical.transmission).toBe(0);
    expect(keyboardSwitchStateAtTravel('optical', 4).optical.transmission).toBe(1);
  });

  it('seeks every chapter independently and keeps paired observations on the same travel', () => {
    const expected = keyboardSwitchShot(6, 0.45);
    expect(expected.state.hall.fixedActive).toBe(true);
    expect(expected.state.hall.rapidActive).toBe(false);
    keyboardSwitchShot(6, 0.9);
    expect(keyboardSwitchShot(6, 0.45)).toEqual(expected);
    expect(keyboardSwitchShot(1, 0.2).variant).toBe('red');
    expect(keyboardSwitchShot(1, 0.7).variant).toBe('black');
    for (const p of [0.05, 0.25, 0.45, 0.55, 0.75, 0.95]) {
      const shot = keyboardSwitchShot(1, p);
      expect(shot.state.travelMm).toBe(shot.compareState?.travelMm);
    }
    expect(keyboardSwitchShot(4, 0.28).state.travelMm).toBe(2);
    expect(keyboardSwitchShot(4, 0.47).state.travelMm).toBe(2.5);
    expect(keyboardSwitchShot(4, 0.65).state.travelMm).toBe(4);
    expect([0.1, 0.5, 0.9].map((p) => keyboardSwitchShot(8, p).variant)).toEqual([
      'red',
      'brown',
      'blue',
    ]);
    for (let chapter = 0; chapter <= 8; chapter++)
      for (const p of [-2, 0, 0.5, 1, 2, NaN]) {
        const s = keyboardSwitchShot(chapter, p).state;
        expect(Number.isFinite(s.travelMm + s.forceCn + s.hall.signal)).toBe(true);
        expect(s.travelMm).toBeGreaterThanOrEqual(0);
        expect(s.travelMm).toBeLessThanOrEqual(s.totalTravelMm);
      }
  });
});
