import { describe, it, expect } from 'vitest';
import { apparentMotion, leakingBottle, squatKnee } from './apparent-weight-lab';
describe('apparent weight apparatus', () => {
  it('downward motion can give either lower or higher scale reading', () => {
    const early = apparentMotion('squat', 0.85),
      late = apparentMotion('squat', 1.55);
    expect(early.v).toBeLessThan(0);
    expect(late.v).toBeLessThan(0);
    expect(early.normal).toBeLessThan(588);
    expect(late.normal).toBeGreaterThan(588);
  });
  it('analytic acceleration agrees with differentiation of both trajectories', () => {
    for (const trial of ['squat', 'lift'] as const)
      for (const t of [0.8, 1.4, 2.9, 3.4, 4.8, 5.7]) {
        const h = 0.0001,
          s = apparentMotion(trial, t);
        expect(
          (apparentMotion(trial, t + h).v - apparentMotion(trial, t - h).v) / (2 * h),
        ).toBeCloseTo(s.a, 6);
        expect(
          (apparentMotion(trial, t + h).z - apparentMotion(trial, t - h).z) / (2 * h),
        ).toBeCloseTo(s.v, 6);
      }
  });
  it('upward lift brakes with a lower reading, cruising reads real mass', () => {
    expect(apparentMotion('lift', 3.5).scaleMass).toBeCloseTo(60);
    expect(apparentMotion('lift', 5.5).v).toBeGreaterThan(0);
    expect(apparentMotion('lift', 5.5).normal).toBeLessThan(588);
    expect(apparentMotion('lift', 8).v).toBe(0);
  });
  it('reversing lift direction reverses acceleration but not gravity', () => {
    const a = apparentMotion('lift', 1.5, 60, 1),
      b = apparentMotion('lift', 1.5, 60, -1);
    expect(a.a).toBe(-b.a);
    expect(a.normal + b.normal).toBeCloseTo(1176);
  });
  it('feet and both limb lengths stay physically connected through the squat', () => {
    for (const h of [0.5, 0.65, 0.82]) {
      const k = squatKnee(h);
      expect(Math.hypot(k.x, k.height)).toBeCloseTo(0.44, 12);
      expect(Math.hypot(k.x, h - k.height)).toBeCloseTo(0.44, 12);
    }
  });
  it('freefall removes hydrostatic pressure head, not gravity', () => {
    expect(leakingBottle(-0.1).pressure).toBeCloseTo(1176);
    const s = leakingBottle(0.2);
    expect(s.a).toBe(-9.8);
    expect(s.pressure).toBe(0);
    expect(s.speed).toBe(0);
    expect(s.z).toBeCloseTo(-0.196);
  });
  it('already emitted water persists and follows a gravitational parabola', () => {
    const s = leakingBottle(0.2);
    expect(s.drops.length).toBeGreaterThan(0);
    for (const d of s.drops) {
      expect(d.emitted).toBeLessThan(0);
      expect(d.z).toBeCloseTo(-4.9 * (0.2 - d.emitted) ** 2);
      expect(d.x).toBeGreaterThan(0);
    }
  });
});
