import { describe, expect, it } from 'vitest';
import {
  dampedMotion,
  meterDamping,
  discBraking,
  frameDrive,
  tubeFall,
  springDamping,
} from './eddy-current-lab';
describe('electromagnetic damping apparatuses', () => {
  it('preserves oscillator initial conditions and removes energy through viscous loss', () => {
    for (const c of [0.01, 2, 5]) {
      const s = dampedMotion(0, 1, 1, c, 0.5);
      expect(s.position).toBeCloseTo(0.5, 12);
      expect(s.velocity).toBeCloseTo(0, 12);
    }
    const t = 0.2,
      e = 1e-6,
      s = springDamping(t, true);
    const derivative =
      (springDamping(t + e, true).energy - springDamping(t - e, true).energy) / (2 * e);
    expect(-derivative).toBeCloseTo(s.heatPower, 7);
    expect(meterDamping(2, true).energy).toBeLessThan(meterDamping(2, false).energy);
  });
  it('brakes for either field sign, without prescribing rotor speed', () => {
    expect(discBraking(1, 0.3).omega).toBeLessThan(discBraking(1, 0).omega);
    expect(discBraking(1, -0.3).omega).toBe(discBraking(1, 0.3).omega);
    const t = 0.4,
      e = 1e-6;
    expect(-(discBraking(t + e).energy - discBraking(t - e).energy) / (2 * e)).toBeCloseTo(
      discBraking(t).heatPower,
      7,
    );
  });
  it('keeps driven frame below field speed and balances slip power', () => {
    const s = frameDrive(4);
    expect(s.omega).toBeLessThan(1.6);
    expect(s.omega).toBeGreaterThan(0);
    expect(s.inputPower - s.mechanicalPower).toBeCloseTo(s.joulePower, 12);
    expect(frameDrive(4, -1.6).angle).toBeCloseTo(-s.angle, 12);
  });
  it('reduces tube braking with a slit and clamps the magnet at the catch tray', () => {
    expect(tubeFall(0.4, true).position).toBeGreaterThan(tubeFall(0.4, false).position);
    expect(tubeFall(1, false).velocity).toBeCloseTo(0.7, 5);
    expect(tubeFall(10, false).position).toBe(1);
    expect(tubeFall(10, false).velocity).toBe(0);
  });
});

import {
  resistiveCoupling,
  oscillatorAccount,
  discLoop,
  frameFlux,
  tubeRing,
  TUBE,
  eddyDirector,
} from './eddy-current-lab';
describe('visible induction and energy accounting', () => {
  it('reciprocal emf/current/force turns exactly removed mechanical power into heat', () => {
    for (const v of [-3, -0.2, 0, 0.2, 3])
      for (const K of [-2, 0, 2]) {
        const q = resistiveCoupling(v, K, 5);
        expect(q.emf).toBe(-K * v);
        expect(q.current).toBe((-K * v) / 5);
        expect(q.force * v + q.joulePower).toBeCloseTo(0, 12);
        expect(q.force * v).toBeLessThanOrEqual(0);
        expect(resistiveCoupling(v, K, 5, false).current).toBe(0);
      }
  });
  it('same initial energy is split into mechanical, electrical and background losses', () => {
    for (const kind of ['meter', 'spring'] as const)
      for (const closed of [false, true])
        for (const t of [0, 0.1, 0.4, 1, 4]) {
          const q = oscillatorAccount(kind, t, closed);
          expect(q.energy + q.jouleHeat + q.otherHeat).toBeCloseTo(q.initialEnergy, 12);
          expect(q.joulePower).toBeCloseTo(
            (closed ? (kind === 'meter' ? 3.7e-5 : 0.262) : 0) * q.velocity ** 2,
            12,
          );
        }
  });
  it('two disc-edge equivalent loops reproduce the actual electromagnetic braking coefficient', () => {
    for (const B of [-0.6, -0.3, 0, 0.3, 0.6])
      for (const t of [0, 0.2, 1, 3]) {
        const d = discBraking(t, B),
          a = discLoop(d.omega, B, 1),
          b = discLoop(d.omega, B, -1);
        expect(a.current).toBeCloseTo(-b.current, 12);
        expect(a.force + b.force).toBeCloseTo(d.emTorque, 12);
        expect(a.joulePower + b.joulePower).toBeCloseTo(d.joulePower, 12);
        expect(d.energy + d.jouleHeat + d.otherHeat).toBeCloseTo(d.initialEnergy, 12);
      }
  });
  it('field reversal changes each current but does not make the brake propel the disc', () => {
    const a = discLoop(8, 0.3, 1),
      b = discLoop(8, -0.3, 1);
    expect(b.current).toBe(-a.current);
    expect(b.force).toBe(a.force);
    expect(b.joulePower).toBe(a.joulePower);
  });
  it('the real-frame flux and its phase average are distinguished and consistent', () => {
    for (const slip of [-2, 0, 2]) {
      let torque = 0,
        heat = 0;
      for (let i = 0; i < 2048; i++) {
        const p = frameFlux((2 * Math.PI * i) / 2048, slip);
        torque += p.instantTorque / 2048;
        heat += p.instantJoulePower / 2048;
      }
      expect(torque).toBeCloseTo(0.004 * slip, 12);
      expect(heat).toBeCloseTo(0.004 * slip ** 2, 12);
    }
  });
  it('tube loop emf differentiates the same fixed-ring flux and always opposes motion', () => {
    for (const zm of [0.3, 0.46, 0.5, 0.54, 0.7])
      for (const v of [-0.7, 0, 0.7]) {
        const h = 1e-6,
          q = tubeRing(0.5, zm, v),
          derivative = (tubeRing(0.5, zm + h, v).flux - tubeRing(0.5, zm - h, v).flux) / (2 * h);
        expect(q.gradient).toBeCloseTo(derivative, 7);
        expect(q.force * v + q.joulePower).toBeCloseTo(0, 10);
      }
    expect(tubeRing(0.5, 0.46, 0.7).current).toBeLessThan(0);
    expect(tubeRing(0.5, 0.54, 0.7).current).toBeGreaterThan(0);
  });
  it('a stationary magnet has nonzero flux but no emf/current, unlike moving with a slit', () => {
    const held = tubeRing(0.5, 0.46, 0),
      cut = tubeRing(0.5, 0.46, 0.7, 1, false);
    expect(held.flux).toBeGreaterThan(0);
    expect(held.current).toBeCloseTo(0, 12);
    expect(held.emf).toBeCloseTo(0, 12);
    expect(cut.emf).not.toBe(0);
    expect(cut.current).toBe(0);
    expect(tubeFall(0.3, true).heatPower).toBeGreaterThan(0);
  });
  it('integrating physical thin-ring losses recovers the same pipe c, without counting drawn rings as the mesh', () => {
    let loss = 0;
    const dz = 0.0005;
    for (let z = -1; z <= 1; z += dz) loss += tubeRing(z, 0, 1, 1, true, dz).joulePower;
    expect(loss).toBeCloseTo(TUBE.coefficient, 7);
  });
  it('the catch energy is separate from Joule heat and the fall budget closes', () => {
    for (const slit of [false, true])
      for (const t of [0, 1e-8, 0.4, 1, 4]) {
        const q = tubeFall(t, slit);
        expect(q.position).toBeGreaterThanOrEqual(0);
        expect(q.energy + q.jouleHeat + q.catchHeat).toBeCloseTo(q.gravityReleased, 12);
        if (q.landed) expect(q.heatPower).toBe(0);
      }
  });
  it('rejects nonfinite and unphysical denominators rather than draw NaN', () => {
    for (const x of [NaN, Infinity, -Infinity]) {
      expect(() => meterDamping(x, true)).toThrow();
      expect(() => tubeRing(0.5, x, 0)).toThrow();
      expect(() => eddyDirector(0, x)).toThrow();
      expect(() => discBraking(1, x)).toThrow();
    }
    expect(() => resistiveCoupling(1, 1, 0)).toThrow();
    expect(() => dampedMotion(1, 0, 1, 1, 1)).toThrow();
    expect(() => dampedMotion(1, 1, -1, 1, 1)).toThrow();
    expect(dampedMotion(100, 1, 0, 0, 1).position).toBe(1);
  });
  it('holds predictions before reversal and explicitly stops an intact-tube magnet', () => {
    expect(eddyDirector(5, 19)).toMatchObject({ question: true, field: 0.3 });
    expect(eddyDirector(5, 23)).toMatchObject({ question: false, field: -0.3 });
    expect(eddyDirector(7, 16).question).toBe(true);
    expect(eddyDirector(7, 24)).toMatchObject({ held: true, enabled: false, view: 'loop' });
  });
});

// Actual bilingual words determine evidence changes, not a shared provisional percentage.
describe('measured bilingual evidence cuts', () => {
  it('holds both predictions until the recorded answers, with separate language timing', () => {
    for (const [lang, first, hold, reverse] of [
      ['zh', 5.65, 18.29, 21.45],
      ['en', 3.53, 17.55, 20.19],
    ] as const) {
      expect(eddyDirector(7, first - 0.01, lang)).toMatchObject({
        question: true,
        reveal: false,
        view: 'compare',
      });
      expect(eddyDirector(7, first, lang)).toMatchObject({ question: false, reveal: true });
      expect(eddyDirector(7, hold - 0.01, lang)).toMatchObject({
        held: false,
        enabled: false,
        question: true,
      });
      expect(eddyDirector(7, hold, lang)).toMatchObject({
        held: true,
        enabled: false,
        question: false,
        view: 'loop',
      });
      expect(eddyDirector(5, reverse - 0.01, lang)).toMatchObject({ field: 0.3, question: true });
      expect(eddyDirector(5, reverse, lang)).toMatchObject({ field: -0.3, question: false });
    }
  });
  it('shows zero slip and the normal-drive energy account at their actual clauses', () => {
    expect(eddyDirector(3, 12.25, 'en')).toMatchObject({ held: true, view: 'loop' });
    expect(eddyDirector(3, 12.25, 'zh')).toMatchObject({ held: false, question: true });
    expect(eddyDirector(3, 16.53, 'en')).toMatchObject({ held: false, view: 'energy' });
    expect(eddyDirector(3, 17.93, 'zh')).toMatchObject({ held: false, view: 'energy' });
  });
  it('shows sampled physical rings when the narration qualifies their identity', () => {
    for (const [lang, energy, samples] of [
      ['zh', 15.91, 20.91],
      ['en', 15.87, 20.41],
    ] as const) {
      expect(eddyDirector(6, energy, lang).view).toBe('energy');
      expect(eddyDirector(6, samples, lang).view).toBe('loop');
      let previous = -1;
      for (let t = 0; t <= 30; t += 0.02) {
        const s = eddyDirector(6, t, lang);
        expect(s.time).toBeGreaterThanOrEqual(previous);
        expect(tubeFall(s.time, false).landed).toBe(false);
        previous = s.time;
      }
    }
  });
});
