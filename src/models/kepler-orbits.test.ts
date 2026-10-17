import { describe, expect, it } from 'vitest';
import { KEPLER_MU, keplerAt, keplerE, keplerSector } from './kepler-orbits';
describe('ideal two-body Kepler geometry', () => {
  it('matches circular motion and independently known periapsis/apoapsis speed ratios', () => {
    const quarter = keplerAt(0, 1, 0.25);
    expect(quarter.x).toBeCloseTo(0, 12);
    expect(quarter.y).toBeCloseTo(1, 12);
    expect(quarter.speed).toBeCloseTo(2 * Math.PI, 12);
    expect(quarter.period).toBe(1);
    const near = keplerAt(0.6),
      far = keplerAt(0.6, 1, 0.5);
    expect(near.radius).toBeCloseTo(0.4, 12);
    expect(far.radius).toBeCloseTo(1.6, 12);
    expect(near.speed / far.speed).toBeCloseTo(4, 12);
    expect(keplerAt(0.6, 4).period).toBe(8);
  });
  it('satisfies Kepler’s equation across negative phases, many turns, and high eccentricity', () => {
    for (const e of [0, 0.3, 0.65, 0.85, 0.98])
      for (const m of [-100, -Math.PI, -0.01, 0, 0.01, Math.PI, 100]) {
        const E = keplerE(m, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(m, 10);
      }
  });
  it('conserves angular momentum and energy at 101 independently sampled phases', () => {
    const expectedH = Math.sqrt(KEPLER_MU * 1.7 * (1 - 0.73 ** 2));
    for (let i = 0; i <= 100; i++) {
      const q = keplerAt(0.73, 1.7, i / 100);
      expect(q.angularMomentum).toBeCloseTo(expectedH, 10);
      expect(q.speed ** 2 / 2 - KEPLER_MU / q.radius).toBeCloseTo(-KEPLER_MU / (2 * 1.7), 10);
    }
  });
  it('produces equal swept areas for equal time, including a sector across periapsis', () => {
    for (const e of [0, 0.65, 0.85]) {
      const near = keplerSector(e, 1, -0.06, 0.12),
        far = keplerSector(e, 1, 0.44, 0.12);
      expect(near.area).toBeCloseTo(far.area, 12);
      expect(near.fraction).toBeCloseTo(0.12, 12);
      expect(near.duration).toBeCloseTo(far.duration, 12);
      const polygon = (points: { x: number; y: number }[]) =>
        Math.abs(
          points.reduce((sum, p, i) => {
            const next = points[i + 1] ?? { x: 0, y: 0 };
            return sum + p.x * next.y - p.y * next.x;
          }, 0),
        ) / 2;
      expect(polygon(near.points)).toBeCloseTo(near.area, 3);
      expect(polygon(far.points)).toBeCloseTo(far.area, 3);
    }
    expect(() => keplerAt(1)).toThrow(RangeError);
    expect(() => keplerAt(0.3, 0)).toThrow(RangeError);
    expect(() => keplerSector(0.2, 1, 0, 2)).toThrow(RangeError);
  });
});
