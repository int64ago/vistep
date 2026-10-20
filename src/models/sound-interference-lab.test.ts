import { describe, it, expect } from 'vitest';
import {
  soundInterferencePoint as point,
  soundPressureAt,
  soundPathPressure,
  soundFlagTargets,
  SOUND_OLD_FLAGS,
  soundIntensityField,
  soundDirector,
  SOUND_MEASURED_CUTS,
} from './sound-interference-lab';
describe('coherent pressure superposition', () => {
  it('opens with the same receiver and one-source versus two-source steady fields', () => {
    const a = soundDirector(0, 2),
      b = soundDirector(0, 7);
    expect(a.secondOn).toBe(false);
    expect(b.secondOn).toBe(true);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
    expect(soundInterferencePointForTest(a)).toBeGreaterThan(soundInterferencePointForTest(b) * 40);
    function soundInterferencePointForTest(d: ReturnType<typeof soundDirector>) {
      return point(d.x, d.y, d.frequency, 0, d.secondOn).meanSquare;
    }
  });
  it('matches independent centre and half-wave benchmarks without making unequal waves vanish', () => {
    expect(point(0, 0).meanSquare).toBeCloseTo(1, 12);
    const q = point(0.125, 0);
    expect(q.r1).toBe(2.125);
    expect(q.r2).toBe(1.875);
    expect(q.pathDifference).toBe(-0.25);
    expect(q.phaseDifference).toBeCloseTo(Math.PI, 12);
    expect(q.meanSquare).toBeCloseTo((1 / 2.125 - 1 / 1.875) ** 2, 12);
    expect(q.meanSquare).toBeGreaterThan(0);
    expect(point(0.125, 0, 340).meanSquare).toBeCloseTo(1 / 2.125 ** 2 + 1 / 1.875 ** 2, 12);
  });
  it('integrates the actual instantaneous sum at one clock to the displayed cycle mean', () => {
    for (const [x, y, f, phi] of [
      [0, 0, 680, 0],
      [0.125, 0, 680, 0],
      [0.125, 0, 340, 0],
      [0.8, 0.7, 1000, 1.4],
    ]) {
      const p = point(x!, y!, f!, phi!);
      let ms = 0;
      for (let i = 0; i < 4096; i++) {
        const s = soundPressureAt(p, i / 4096);
        expect(s.sum).toBe(s.p1 + s.p2);
        ms += s.sum ** 2 / 4096;
      }
      expect(2 * ms).toBeCloseTo(p.meanSquare, 11);
    }
  });
  it('one additional source can reduce receiver pressure, with reversed polarity restoring a maximum', () => {
    expect(point(0.125, 0, 680, 0, true).meanSquare).toBeLessThan(
      point(0.125, 0, 680, 0, false).meanSquare,
    );
    expect(point(0, 0, 680, Math.PI).meanSquare).toBeLessThan(1e-25);
    expect(point(0.125, 0, 680, Math.PI).meanSquare).toBeCloseTo((1 / 2.125 + 1 / 1.875) ** 2, 12);
  });
  it('ray endpoint and receiver waveform use the same retarded phase', () => {
    const p = point(0.125, 0.3, 840, 0.8);
    for (const t of [0, 0.125, 0.5, 1.7]) {
      const s = soundPressureAt(p, t);
      expect(s.p1).toBeCloseTo(p.a * soundPathPressure(p.r1, p.frequency, t), 12);
      expect(s.p2).toBeCloseTo(p.b * soundPathPressure(p.r2, p.frequency, t, p.sourcePhase), 12);
    }
  });
  it('retains twelve immutable identities and uses local field search, not decorative positions', () => {
    const before = JSON.stringify(SOUND_OLD_FLAGS);
    for (const a of soundFlagTargets()) {
      expect(Math.abs(a.target - a.x0)).toBeLessThanOrEqual(0.160001);
      const old = point(a.x0, a.y).meanSquare;
      expect(a.group === 'loud' ? a.meanSquare >= old - 1e-12 : a.meanSquare <= old + 1e-12).toBe(
        true,
      );
    }
    soundFlagTargets(340, Math.PI);
    expect(JSON.stringify(SOUND_OLD_FLAGS)).toBe(before);
    expect(Object.isFrozen(SOUND_OLD_FLAGS[0])).toBe(true);
  });
  it('holds the new-frequency prediction and reconstructs fixed flags when seeking backwards', () => {
    const early = soundDirector(3, 2),
      later = soundDirector(3, 24);
    expect(early.question).toBe(true);
    expect(early.frequency).toBe(680);
    expect(later.frequency).toBe(340);
    expect(later.x).toBe(early.x);
    expect(later.y).toBe(early.y);
    expect(point(later.x, later.y, later.frequency).meanSquare).toBeGreaterThan(
      100 * point(early.x, early.y).meanSquare,
    );
    expect(soundDirector(3, 2)).toEqual(early);
  });
  it('uses both actual voices for source, receiver, flag and prediction events', () => {
    for (const locale of ['zh', 'en'] as const) {
      const c = SOUND_MEASURED_CUTS[locale];
      expect(soundDirector(0, c.secondOn - 0.01, locale).secondOn).toBe(false);
      expect(soundDirector(0, c.secondOn + 0.01, locale).secondOn).toBe(true);
      expect(soundDirector(0, c.paths - 0.01, locale).view).toBe('field');
      expect(soundDirector(0, c.paths, locale).view).toBe('paths');
      expect(soundDirector(1, c.pressure, locale).view).toBe('pressure');
      expect(soundDirector(1, c.pressure, locale).x).toBe(0.125);
      expect(soundDirector(2, c.searchStart, locale).search).toBe(0);
      expect(soundDirector(2, (c.searchStart + c.searchEnd) / 2, locale).search).toBeCloseTo(
        0.5,
        12,
      );
      expect(soundDirector(2, c.searchEnd, locale).search).toBe(1);
      const held = soundDirector(3, c.frequencyStart - 0.01, locale),
        answer = soundDirector(3, 11.1, locale);
      expect(held.question).toBe(true);
      expect(held.frequency).toBe(680);
      expect(answer.question).toBe(false);
      expect(answer.frequency).toBe(340);
      expect(answer.changed).toBe(true);
      expect([answer.x, answer.y, answer.selectedFlag]).toEqual([
        held.x,
        held.y,
        held.selectedFlag,
      ]);
      expect(soundDirector(3, c.frequencyStart - 0.01, locale)).toEqual(held);
      for (const t of [c.frequencyStart, c.frequencyEnd])
        expect(
          Math.abs(
            soundDirector(3, t + 1e-6, locale).frequency -
              soundDirector(3, t - 1e-6, locale).frequency,
          ),
        ).toBeLessThan(0.001);
      for (const [ch, keys, field] of [
        [1, [c.moveStart, c.moveEnd], 'x'],
        [2, [c.searchStart, c.searchEnd], 'search'],
      ] as const)
        for (const t of keys)
          expect(
            Math.abs(
              soundDirector(ch, t + 1e-6, locale)[field] -
                soundDirector(ch, t - 1e-6, locale)[field],
            ),
          ).toBeLessThan(1e-5);
      expect(soundDirector(1, 2, locale).showFlags).toBe(false);
    }
  });
  it('bounds nonfinite/near-source inputs and allocation sizes', () => {
    for (const p of [
      point(NaN, Infinity, NaN, Infinity),
      point(-2, 0, 0),
      point(Infinity, -Infinity, -100),
    ])
      for (const v of Object.values(p))
        if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    expect(soundIntensityField(NaN, Infinity, -1).length).toBe(100);
    expect(soundIntensityField(680, 1e9, 1e9).length).toBe(256 * 256);
    expect(soundDirector(Infinity, NaN).time).toBe(0);
  });
});
