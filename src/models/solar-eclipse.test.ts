import { describe, expect, it } from 'vitest';
import { eclipseFrame, eclipseShot, ECLIPSE } from './solar-eclipse';
const base = {
  distance: 360000,
  longitude: 0,
  nodeAngle: 0,
  inclination: ECLIPSE.inclination,
  observerOffset: 0,
};
describe('one solar eclipse geometry', () => {
  it('distinguishes alignment, partial overlap and orbital misses', () => {
    expect(eclipseFrame(base).kind).toBe('total');
    expect(eclipseFrame({ ...base, distance: 405000 }).kind).toBe('annular');
    expect(eclipseFrame({ ...base, longitude: 0.3 }).kind).toBe('partial');
    expect(eclipseFrame({ ...base, nodeAngle: 90 }).kind).toBe('none');
  });
  it('derives both shadow tangents and angular coverage from the same dimensions', () => {
    const near = eclipseFrame(base),
      far = eclipseFrame({ ...base, distance: 405000 });
    expect(near.umbra).toBeGreaterThan(0);
    expect(far.umbra).toBeLessThan(0);
    expect(near.obscured).toBeCloseTo(1);
    expect(far.obscured).toBeLessThan(1);
    expect(near.penumbra).toBeGreaterThan(near.umbra);
  });
  it('bounds coverage and preserves north/south symmetry at grazing conditions', () => {
    for (const offset of [0, 100, 2000, 6371]) {
      const a = eclipseFrame({ ...base, observerOffset: offset }),
        b = eclipseFrame({ ...base, observerOffset: -offset });
      expect(a.obscured).toBeGreaterThanOrEqual(0);
      expect(a.obscured).toBeLessThanOrEqual(1.0000001);
      expect(a.obscured).toBeCloseTo(b.obscured, 8);
    }
    expect(() => eclipseFrame({ ...base, distance: 0 })).toThrow();
    for (let i = 0; i < 8; i++) expect(eclipseShot(i, 0.4)).toEqual(eclipseShot(i, 0.4));
  });
});
