import { describe, expect, it } from 'vitest';
import {
  INTERFERENCE_DEFAULT as base,
  INTERFERENCE_STRING as constants,
  interferenceAt as at,
  interferenceEnergy as energy,
  interferenceSamples,
  interferenceShot,
  samePointAmplitude,
  singlePulseEnergy,
  standingNodes,
  stringHarmonic,
  stringPulse,
  stringSpeed,
  type InterferenceInput,
} from './wave-interference';
const close = (actual: number, expected: number, tol = 1e-8) =>
  expect(Math.abs(actual - expected)).toBeLessThan(tol);
describe('linear string interference', () => {
  it('uses SI speed, finite supports and smooth zero boundaries', () => {
    expect(stringSpeed()).toBe(10);
    for (const x of [-0.4, 0.4, 2])
      expect(Object.values(stringPulse(x, 0, 1)).every((v) => v === 0)).toBe(true);
    close(stringPulse(0, 0, 1).y, 0.004);
    close(stringPulse(0.4 - 1e-7, 0, 1).dxx, 0, 1e-10);
    expect(() => stringSpeed(-1)).toThrow();
  });
  it('differentiates compact pulses independently in space and time', () => {
    const x = 0.133,
      t = 0.004,
      h = 1e-6,
      s = stringPulse(x, t, 1);
    close(s.dx, (stringPulse(x + h, t, 1).y - stringPulse(x - h, t, 1).y) / (2 * h));
    close(s.dt, (stringPulse(x, t + h, 1).y - stringPulse(x, t - h, 1).y) / (2 * h));
    close(s.dxx, (stringPulse(x + h, t, 1).dx - stringPulse(x - h, t, 1).dx) / (2 * h));
    close(s.dtt, (stringPulse(x, t + h, 1).dt - stringPulse(x, t - h, 1).dt) / (2 * h), 2e-7);
  });
  it('has exactly zero displacement but nonzero kinetic energy at cancellation', () => {
    const p = { ...base, time: 0 };
    for (const s of interferenceSamples(p)) {
      expect(s.y).toBe(0);
      expect(s.dx).toBe(0);
      expect(s.potential).toBe(0);
      expect(s.flux).toBe(0);
    }
    expect(at(p, 0.2).dt).not.toBe(0);
    close(energy(p).kinetic, 2 * singlePulseEnergy(), 1e-12);
  });
  it('same-sign coincident pulses double displacement and store potential energy', () => {
    const p = { ...base, time: 0, ratio: 1 };
    close(at(p, 0).y, 2 * constants.amplitude);
    expect(energy(p).kinetic).toBe(0);
    close(energy(p).potential, 2 * singlePulseEnergy(), 1e-12);
  });
  it('pulses pass through without exchanging shape or material coordinates', () => {
    for (const time of [-0.1, 0.1]) {
      const a = at({ ...base, time }, 10 * time);
      close(a.first.y, 0.004);
      close(a.second.y, 0);
    }
    const points = [-0.8, -0.2, 0, 0.2, 0.8];
    expect(points.map((x) => at({ ...base, time: 0.08 }, x).x)).toEqual(points);
  });
  it('conserves integrated compact-pulse energy for both signs and unequal amplitudes', () => {
    for (const ratio of [-1, -0.45, 0, 0.6, 1])
      for (let i = 0; i <= 32; i++) {
        close(
          energy({ ...base, ratio, time: -0.1 + (i * 0.2) / 32 }).total,
          singlePulseEnergy() * (1 + ratio * ratio),
          2e-11,
        );
      }
  });
  it('satisfies local energy continuity by finite differences', () => {
    const h = 1e-6;
    const states: InterferenceInput[] = [
      { ...base, time: -0.012 },
      { ...base, mode: 'trains', time: 0.17, ratio: 1 },
      { ...base, mode: 'standing', time: 0.037, ratio: 1 },
      { ...base, mode: 'phase', time: 0.023, ratio: 0.6, phase: 0.7 },
    ];
    for (const p of states)
      for (const x of [-0.55, -0.13, 0.19, 0.63]) {
        const dedt =
          (at({ ...p, time: p.time + h }, x).energy - at({ ...p, time: p.time - h }, x).energy) /
          (2 * h);
        const dsdx = (at(p, x + h).flux - at(p, x - h).flux) / (2 * h);
        close(dedt + dsdx, 0, 2e-8);
        close(at(p, x).dtt, 100 * at(p, x).dxx, 1e-10);
      }
  });
  it('accounts for wave-train energy entering the finite observation window', () => {
    const p: InterferenceInput = { ...base, mode: 'trains', time: 0.23, ratio: 1 },
      h = 1e-5;
    const derivative =
      (energy({ ...p, time: p.time + h }).total - energy({ ...p, time: p.time - h }).total) /
      (2 * h);
    close(derivative, energy(p).incoming, 2e-6);
    const j = stringHarmonic(0.17, 0.17, 1, 0.004, 0, true),
      dx = 1e-6;
    close(
      j.dx,
      (stringHarmonic(0.17 + dx, 0.17, 1, 0.004, 0, true).y -
        stringHarmonic(0.17 - dx, 0.17, 1, 0.004, 0, true).y) /
        (2 * dx),
    );
    close(
      j.dxx,
      (stringHarmonic(0.17 + dx, 0.17, 1, 0.004, 0, true).dx -
        stringHarmonic(0.17 - dx, 0.17, 1, 0.004, 0, true).dx) /
        (2 * dx),
    );
  });
  it('derives phase and amplitude limits at the same point', () => {
    close(samePointAmplitude(1, 0), 0.008);
    close(samePointAmplitude(1, Math.PI), 0);
    close(samePointAmplitude(0.5, Math.PI), 0.002);
    close(samePointAmplitude(1, Math.PI / 2), Math.sqrt(2) * 0.004);
    for (const t of [0, 0.021, 0.06])
      expect(at({ ...base, mode: 'phase', ratio: 1, phase: Math.PI, time: t }, 0.2).y).toBe(0);
  });
  it('forms exact standing nodes and conserves energy through kinetic/potential exchange', () => {
    const p: InterferenceInput = { ...base, mode: 'standing', ratio: 1 };
    expect(standingNodes(-1.6, 1.6)).toEqual([-1.6, -0.8, 0, 0.8, 1.6]);
    for (let i = 0; i <= 32; i++) {
      p.time = (i * 0.16) / 32;
      for (const x of standingNodes(-1.6, 1.6)) {
        expect(at(p, x).y).toBe(0);
        expect(at(p, x).dt).toBe(0);
      }
      close(
        energy(p).total,
        constants.tension * constants.amplitude ** 2 * ((2 * Math.PI) / 1.6) ** 2 * 3.2,
        1e-12,
      );
    }
    p.time = 0;
    expect(energy(p).kinetic).toBe(0);
    p.time = 0.04;
    expect(energy(p).potential).toBe(0);
    let flux = 0;
    for (let i = 0; i < 256; i++) flux += at({ ...p, time: (0.16 * i) / 256 }, 0.2).flux / 256;
    close(flux, 0, 1e-12);
    expect(Math.abs(at({ ...p, time: 0.02 }, 0.2).flux)).toBeGreaterThan(0);
  });
  it('wavefront completion equals counterpropagating harmonic waves', () => {
    for (const x of [-1.6, -0.9, 0, 0.3, 1.6])
      for (const key of ['y', 'dx', 'dt', 'energy', 'flux'] as const)
        close(
          at({ ...base, mode: 'trains', ratio: 1, time: 0.36 }, x)[key],
          at({ ...base, mode: 'standing', ratio: 1, time: 0.36 }, x)[key],
          1e-12,
        );
  });
  it('bounds sample work, rejects nonfinite values, and reconstructs all shots directly', () => {
    expect(interferenceSamples(base, -1, 1, 1e6)).toHaveLength(641);
    expect(() => interferenceSamples(base, -1, 1, Infinity)).toThrow();
    expect(() => at({ ...base, ratio: 2 }, 0)).toThrow();
    expect(() => at({ ...base, time: NaN }, 0)).toThrow();
    const frames = Array.from({ length: 808 }, (_, i) =>
      interferenceShot(Math.floor(i / 101), (i % 101) / 100),
    );
    for (let i = 807; i >= 0; i--)
      expect(interferenceShot(Math.floor(i / 101), (i % 101) / 100)).toEqual(frames[i]);
    expect(interferenceShot(1, 1).input.time).toBe(0);
    expect(interferenceShot(7, 0).input.time).toBe(0.36);
  });
});
