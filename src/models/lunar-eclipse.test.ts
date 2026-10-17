import { describe, expect, it } from 'vitest';
import { lunarConstants, lunarEclipse, lunarOverlap } from './lunar-eclipse';
describe('full-Moon eclipse geometry', () => {
  it('matches independent strip quadrature for disk overlap and respects area bounds', () => {
    for (const [a, b, d] of [
      [3, 1, 0],
      [3, 1, 2.5],
      [3, 1, 3.5],
      [1, 1, 1],
      [1, 1, 3],
    ]) {
      let integral = 0;
      const lo = Math.max(-a, d - b),
        hi = Math.min(a, d + b),
        count = 50000;
      if (hi > lo)
        for (let i = 0; i < count; i++) {
          const x = lo + ((i + 0.5) * (hi - lo)) / count;
          integral +=
            (2 *
              Math.min(
                Math.sqrt(Math.max(0, a * a - x * x)),
                Math.sqrt(Math.max(0, b * b - (x - d) ** 2)),
              ) *
              (hi - lo)) /
            count;
        }
      expect(lunarOverlap(a, b, d)).toBeCloseTo(integral, 5);
      expect(lunarOverlap(a, b, d)).toBeCloseTo(lunarOverlap(b, a, d), 12);
    }
  });
  it('distinguishes none, penumbral, partial and total with actual boundaries', () => {
    expect(lunarEclipse(35).kind).toBe('none');
    expect(lunarEclipse(14).kind).toBe('penumbral');
    expect(lunarEclipse(8).kind).toBe('partial');
    expect(lunarEclipse(0).kind).toBe('total');
    expect(lunarEclipse(35, 0).kind).toBe('total');
    expect(lunarEclipse(0).umbraFraction).toBeCloseTo(1, 12);
    expect(lunarEclipse(8).umbraFraction).toBeGreaterThan(0);
    expect(lunarEclipse(8).umbraFraction).toBeLessThan(1);
  });
  it('uses distance-dependent cones and an independent trigonometric projection', () => {
    for (const distance of [356500, 384400, 405500])
      for (const angle of [0, 8, 14, 35]) {
        const q = lunarEclipse(angle, 5.145, distance);
        expect(q.offset).toBeCloseTo(
          distance * Math.sin((5.145 * Math.PI) / 180) * Math.sin((angle * Math.PI) / 180),
          8,
        );
        expect(q.axial ** 2 + q.offset ** 2).toBeCloseTo(distance ** 2, 3);
        expect((lunarConstants.earthRadius - q.umbra) / q.axial).toBeCloseTo(
          (lunarConstants.sunRadius - lunarConstants.earthRadius) / lunarConstants.sunDistance,
          14,
        );
        expect(q.penumbraFraction).toBeGreaterThanOrEqual(q.umbraFraction - 1e-12);
      }
    expect(lunarEclipse(8, 5.145, 405500).umbra).toBeLessThan(lunarEclipse(8, 5.145, 356500).umbra);
  });
  it('rejects unsupported geometry', () => {
    expect(() => lunarEclipse(-1)).toThrow();
    expect(() => lunarEclipse(8, NaN)).toThrow();
    expect(() => lunarEclipse(8, 5, 1)).toThrow();
    expect(() => lunarOverlap(0, 1, 1)).toThrow();
  });
});
