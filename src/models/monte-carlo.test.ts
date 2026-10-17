import { describe, expect, it } from 'vitest';
import {
  monteInside,
  monteSample,
  monteStandardError,
  monteSummary,
  monteWilson,
} from './monte-carlo';

describe('seeded area Monte Carlo', () => {
  it('classifies geometry independently and preserves every replay prefix', () => {
    const q = monteSample(8192, 7);
    let hits = 0;
    q.points.forEach((p, i) => {
      expect(p.hit).toBe(p.y <= Math.sqrt(1 - p.x * p.x));
      hits += Number(p.hit);
      expect(q.hits[i + 1]).toBe(hits);
    });
    expect(monteSample(32, 7).points).toEqual(q.points.slice(0, 32));
    expect(monteSummary(q, 8192).estimate).toBe((4 * hits) / 8192);
    expect(monteInside(0, 1)).toBe(true);
    expect(monteInside(1, 1)).toBe(false);
  });
  it('keeps uncertainty at all-hit/no-hit boundaries and uses the Wilson formula', () => {
    const interval = monteWilson(2, 4)!;
    expect(interval[0]).toBeCloseTo(0.15003898915214947, 12);
    expect(interval[1]).toBeCloseTo(0.8499610108478506, 12);
    expect(monteWilson(1, 1)![0]).toBeLessThan(0.21);
    expect(monteWilson(0, 1)![1]).toBeGreaterThan(0.79);
    expect(monteSummary(monteSample(1), 0)).toEqual({
      count: 0,
      hits: 0,
      estimate: null,
      interval: null,
    });
    expect(monteStandardError(4096)).toBeCloseTo(monteStandardError(1024) / 2, 12);
  });
  it('exposes sampling bias against independent quadrature rather than hiding it with more points', () => {
    const uniform = monteSample(8192, 7),
      biased = monteSample(8192, 7, 'biased');
    uniform.points.forEach((p, i) => {
      expect(biased.points[i].x).toBe(p.x * p.x);
      expect(biased.points[i].y).toBe(p.y);
    });
    let integral = 0;
    for (let i = 0; i < 100000; i++) integral += Math.sqrt(1 - ((i + 0.5) / 100000) ** 4) / 100000;
    const bad = monteSummary(biased, 8192),
      good = monteSummary(uniform, 8192);
    // Fixed deterministic regression against a separately integrated probability; no probabilistic pass claim.
    expect(bad.estimate!).toBeCloseTo(4 * integral, 1);
    expect(Math.abs(good.estimate! - Math.PI)).toBeLessThan(0.08);
    expect(bad.estimate! - Math.PI).toBeGreaterThan(0.25);
    expect(bad.interval).toBeNull();
  });
  it('rejects invalid coordinates, seeds, counts and prefixes', () => {
    expect(() => monteInside(-0.1, 0)).toThrow();
    expect(() => monteSample(8193)).toThrow();
    expect(() => monteSample(10, NaN)).toThrow();
    expect(() => monteWilson(2, 1)).toThrow();
    expect(() => monteSummary(monteSample(4), 5)).toThrow();
    expect(() => monteStandardError(0)).toThrow();
  });
});
