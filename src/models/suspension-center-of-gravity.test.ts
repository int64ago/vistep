import { describe, it, expect } from 'vitest';
import {
  polygonCentroid,
  suspensionState,
  LAMINA_SHAPES,
  laminaCenter,
  plumbTrace,
  lineIntersection,
  suspensionOffset,
} from './suspension-center-of-gravity';
describe('suspended lamina geometry', () => {
  it('matches the independent triangle centroid and area', () => {
    const p = [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 0, y: 3 },
      ],
      c = polygonCentroid(p);
    expect(c.x).toBe(2);
    expect(c.y).toBe(1);
    expect(c.area).toBe(9);
  });
  it('hangs the center directly below every suspension point', () => {
    for (let i = 0; i < 6; i++) {
      const s = suspensionState(LAMINA_SHAPES.irregular, i, 0.7);
      expect(s.centerWorld.x).toBeCloseTo(0, 10);
      expect(s.centerWorld.y).toBeGreaterThan(0);
    }
  });
  it('different plumb traces intersect at the same material point', () => {
    const p = LAMINA_SHAPES.irregular,
      c = laminaCenter(p),
      a = plumbTrace(p[0], c),
      b = plumbTrace(p[2], c),
      i = lineIntersection(a[0], a[1], b[0], b[1])!;
    expect(i.x).toBeCloseTo(c.x, 10);
    expect(i.y).toBeCloseTo(c.y, 10);
  });
  it('added mass breaks the median-centroid identification', () => {
    const c = laminaCenter(LAMINA_SHAPES.triangle),
      d = laminaCenter(LAMINA_SHAPES.triangle, 1);
    expect(Math.hypot(d.x - c.x, d.y - c.y)).toBeGreaterThan(10);
  });
  it('settles with the specified initial displacement and no sudden release velocity', () => {
    const p = LAMINA_SHAPES.irregular;
    expect(suspensionOffset(p, 0, 0)).toBeCloseTo(0.18);
    expect(Math.abs((suspensionOffset(p, 0, 0.000001) - 0.18) / 0.000001)).toBeLessThan(0.0001);
    expect(Math.abs(suspensionOffset(p, 0, 9))).toBeLessThan(0.00001);
  });
  it('keeps all legal exploration poses within the viewport', () => {
    for (const p of Object.values(LAMINA_SHAPES))
      for (let i = 0; i < p.length; i++)
        for (const m of [0, 1.5])
          for (const v of p) {
            const q = suspensionState(p, i, m).transform(v);
            expect(160 + 0.96 * q.x).toBeGreaterThan(0);
            expect(160 + 0.96 * q.x).toBeLessThan(320);
            expect(43 + 0.96 * q.y).toBeGreaterThan(0);
            expect(43 + 0.96 * q.y).toBeLessThan(300);
          }
  });
  it('parallel traces and degenerate polygons fail explicitly', () => {
    expect(
      lineIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }),
    ).toBeNull();
    expect(() =>
      polygonCentroid([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]),
    ).toThrow();
  });
});
