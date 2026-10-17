import { describe, expect, it } from 'vitest';
import { thermalExpansion, expandPoint } from './thermal-expansion';
describe('Uniform expansion and restrained elastic rod', () => {
  it('matches the independent Golden Gate steel benchmark', () => {
    expect(thermalExpansion({ length: 1275, alpha: 12e-6, deltaT: 55 }).freeChange).toBeCloseTo(
      0.8415,
      12,
    );
  });
  it('enlarges a hole like the missing material instead of filling it inward', () => {
    const s = thermalExpansion();
    const points = [0, Math.PI / 3, (2 * Math.PI) / 3].map((a) =>
      expandPoint(0.02 * Math.cos(a), 0.02 * Math.sin(a), 100),
    );
    for (const p of points) expect(Math.hypot(p.x, p.y)).toBeCloseTo(s.holeRadius, 12);
    expect(s.holeRadius).toBeGreaterThan(0.02);
    expect(s.outerRadius / 0.05).toBeCloseTo(s.holeRadius / 0.02, 12);
  });
  it('preserves mass under isotropic expansion and keeps the small-strain volume approximation explicit', () => {
    const s = thermalExpansion();
    expect(s.volumeRatio * s.densityRatio).toBeCloseTo(1, 14);
    expect((s.volumeRatio - 1) / (3 * s.strain)).toBeCloseTo(1, 2);
  });
  it('distinguishes cold and equally heated plugs using actual radii', () => {
    const cold = thermalExpansion(),
      hot = thermalExpansion({ plugDeltaT: 100 });
    expect(cold.clearance * 1e6).toBeCloseTo(70, 8);
    expect(hot.clearance * 1e6).toBeCloseTo(20.05, 8);
    expect(hot.clearance / 0.00002).toBeCloseTo(hot.scale, 11);
  });
  it('satisfies compatibility and stress reversal for a fully restrained rod', () => {
    for (const deltaT of [-40, 0, 100]) {
      const s = thermalExpansion({ deltaT, locked: true, alpha: 12e-6, young: 200e9 });
      expect(s.actualLength).toBe(1);
      expect(s.stress / s.young + s.strain).toBeCloseTo(0, 14);
    }
    expect(
      thermalExpansion({ deltaT: 100, locked: true, alpha: 12e-6, young: 200e9 }).stress,
    ).toBeCloseTo(-240e6, 5);
    expect(thermalExpansion({ deltaT: -40, locked: true }).stress).toBeGreaterThan(0);
    expect(thermalExpansion({ deltaT: 100 }).stress).toBe(0);
  });
  it('separates display magnification from physical dimensions and rejects invalid inputs', () => {
    const physical = expandPoint(0.02, 0, 100),
      display = expandPoint(0.02, 0, 100, 25e-6, 100);
    expect(display.x - 0.02).toBeCloseTo(100 * (physical.x - 0.02), 12);
    for (const o of [{ deltaT: NaN }, { alpha: -1 }, { young: 0 }, { length: 0 }])
      expect(() => thermalExpansion(o)).toThrow(RangeError);
  });
});
