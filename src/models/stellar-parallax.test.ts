import { describe, expect, it } from 'vitest';
import {
  PARALLAX_AU_PER_PC,
  parallaxDistance,
  parallaxModel,
  parallaxState,
} from './stellar-parallax';
describe('annual geometric parallax', () => {
  it('matches independent three-dimensional tangent projections', () => {
    for (const latitude of [0, 30, 90])
      for (const year of [0, 0.125, 0.25, 0.75, 1.4]) {
        const q = parallaxModel(1.3, 0.7, latitude, 0.08),
          s = parallaxState(year, q),
          beta = (latitude * Math.PI) / 180,
          star = [
            q.distance * PARALLAX_AU_PER_PC * Math.cos(beta),
            0,
            q.distance * PARALLAX_AU_PER_PC * Math.sin(beta),
          ],
          ray = [star[0] - s.observer.x, -s.observer.y, star[2]],
          n = [Math.cos(beta), 0, Math.sin(beta)],
          u = [0, 1, 0],
          v = [-Math.sin(beta), 0, Math.cos(beta)],
          dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i], 0);
        expect(s.parallaxX).toBeCloseTo(
          Math.atan2(dot(ray, u), dot(ray, n)) * PARALLAX_AU_PER_PC,
          9,
        );
        expect(s.parallaxY).toBeCloseTo(
          Math.atan2(dot(ray, v), dot(ray, n)) * PARALLAX_AU_PER_PC,
          9,
        );
      }
  });
  it('distinguishes the half-year displacement2p and baseline-aware inverse distance', () => {
    for (const distance of [0.2, 1, 2, 10])
      for (const baseline of [0.5, 1, 2]) {
        const q = parallaxModel(distance, baseline),
          a = parallaxState(0.25, q),
          b = parallaxState(0.75, q);
        expect(b.x - a.x).toBeCloseTo(2 * q.arcseconds, 11);
        expect(parallaxDistance(baseline, q.arcseconds)).toBeCloseTo(distance, 12);
        expect(q.arcseconds).toBeCloseTo(baseline / distance, 7);
      }
    expect(parallaxModel(2).arcseconds).toBeCloseTo(parallaxModel(1).arcseconds / 2, 10);
  });
  it('keeps ecliptic projection and proper motion separate from periodic parallax', () => {
    for (const year of [0, 0.125, 0.25, 0.5]) {
      expect(parallaxState(year, parallaxModel(1, 1, 0)).y).toBeCloseTo(0, 12);
      const a = parallaxState(year, parallaxModel(1, 1, 90, 0.35)),
        b = parallaxState(year + 1, parallaxModel(1, 1, 90, 0.35));
      expect(b.parallaxX).toBeCloseTo(a.parallaxX, 12);
      expect(b.y).toBeCloseTo(a.y, 12);
      expect(b.x - a.x).toBeCloseTo(0.35, 12);
    }
    expect(parallaxDistance(0, 0)).toBeNull();
    expect(parallaxState(1, parallaxModel(1, 0)).x).toBe(0);
  });
  it('rejects unsupported parameters', () => {
    expect(() => parallaxModel(0)).toThrow();
    expect(() => parallaxModel(1, -1)).toThrow();
    expect(() => parallaxState(-1)).toThrow();
    expect(() => parallaxDistance(1, NaN)).toThrow();
  });
});
