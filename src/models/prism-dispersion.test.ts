import { describe, it, expect } from 'vitest';
import { bk7, prismRay } from './prism-dispersion';
describe('N-BK7 prism trace', () => {
  it('matches independent SCHOTT refractive-index lines', () => {
    expect(bk7(587.6)).toBeCloseTo(1.5168, 5);
    expect(bk7(486.1)).toBeCloseTo(1.52238, 5);
    expect(bk7(656.3)).toBeCloseTo(1.51432, 5);
  });
  it('matches the independent minimum-deviation formula for a 60 degree prism', () => {
    const n = bk7(587.6),
      incidence = (Math.asin(n * 0.5) * 180) / Math.PI,
      s = prismRay(587.6, 30 - incidence);
    expect(s.deviation).toBeCloseTo(2 * incidence - 60, 9);
  });
  it('preserves ray continuity, unit directions and tangential Snell components', () => {
    for (const w of [430, 550, 680])
      for (const rotation of [-10, -20, -30]) {
        const s = prismRay(w, rotation);
        expect(s.outgoing).not.toBeNull();
        expect(Math.hypot(s.inside.x, s.inside.y)).toBeCloseTo(1, 12);
        expect(Math.hypot(s.outgoing!.x, s.outgoing!.y)).toBeCloseTo(1, 12);
        expect(s.points[1]).toEqual(s.entry.point);
        expect(s.points[2]).toEqual(s.exit.point);
        const tangent = { x: -s.entry.normal.y, y: s.entry.normal.x };
        expect(tangent.x).toBeCloseTo(
          s.index * (s.inside.x * tangent.x + s.inside.y * tangent.y),
          11,
        );
      }
  });
  it('deflects blue more than red and removes spectral splitting without dispersion', () => {
    expect(prismRay(430).deviation!).toBeGreaterThan(prismRay(680).deviation!);
    expect(prismRay(430, -20, false).deviation).toBe(prismRay(680, -20, false).deviation);
    expect(() => bk7(100)).toThrow(RangeError);
  });
});
