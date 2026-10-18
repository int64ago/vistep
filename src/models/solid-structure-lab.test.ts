import { describe, it, expect } from 'vitest';
import { sheetTemperature, waxContour, exfoliation, honeycomb } from './solid-structure-lab';
describe('solid structure and thermal anisotropy', () => {
  it('has no melted wax before heating and isotropic circular isotherms', () => {
    expect(sheetTemperature(0, 0, 0)).toBe(20);
    const p = waxContour(25);
    const r = p.map((q) => Math.hypot(q.x, q.y));
    expect(Math.max(...r) - Math.min(...r)).toBeLessThan(1e-5);
  });
  it('derives the anisotropic boundary from a common melting temperature', () => {
    const p = waxContour(30, 0.8, 0.25);
    expect(p[0].x).toBeGreaterThan(p[16].y * 1.5);
    p.forEach((q) => expect(sheetTemperature(q.x, q.y, 30, 0.8, 0.25)).toBeCloseTo(50, 3));
  });
  it('conserves each selected layer stack and ends at one atomic layer', () => {
    for (let i = 0; i <= 3; i++) {
      const s = exfoliation(i);
      expect(s.remaining + s.removed).toBe(s.before);
    }
    expect(exfoliation(3).thicknessNm).toBe(0.335);
  });
  it('constructs a connected honeycomb with equal-length bonds', () => {
    const { points, edges } = honeycomb();
    edges.forEach(([a, b]) =>
      expect(Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y)).toBeCloseTo(1, 10),
    );
    expect(new Set(edges.flat()).size).toBe(points.length);
  });
});
