import { describe, expect, it } from 'vitest';
import { cltDistribution, cltNormalDensity } from './central-limit-theorem';

describe('exact Bernoulli sums and CLT conditions', () => {
  it('matches an independent binomial-coefficient oracle, mass and moments', () => {
    for (const n of [1, 2, 8, 32, 64])
      for (const p of [0, 0.05, 0.5, 0.9, 1]) {
        const q = cltDistribution(n, p);
        let coefficient = 1;
        q.items.forEach((item, k) => {
          if (k) coefficient *= (n - k + 1) / k;
          expect(item.probability).toBeCloseTo(coefficient * p ** k * (1 - p) ** (n - k), 12);
        });
        expect(q.items.reduce((v, x) => v + x.probability, 0)).toBeCloseTo(1, 12);
        expect(q.items.reduce((v, x) => v + x.k * x.probability, 0)).toBeCloseTo(q.mean, 11);
        expect(q.items.reduce((v, x) => v + (x.k - q.mean) ** 2 * x.probability, 0)).toBeCloseTo(
          q.variance,
          10,
        );
      }
  });
  it('standardizes nondegenerate sums without confusing mean variance with sum variance', () => {
    const a = cltDistribution(8),
      b = cltDistribution(32);
    expect(b.meanVariance).toBe(a.meanVariance / 4);
    for (const q of [a, b, cltDistribution(8, 0.05)]) {
      expect(q.items.reduce((v, x) => v + x.z! * x.probability, 0)).toBeCloseTo(0, 12);
      expect(q.items.reduce((v, x) => v + x.z! ** 2 * x.probability, 0)).toBeCloseTo(1, 12);
    }
    expect(cltDistribution(8, 0).items.every((v) => v.z === null)).toBe(true);
  });
  it('shows rare-event skew and perfectly dependent copies defeating the same argument', () => {
    expect(cltDistribution(8, 0.05).items[0].probability).toBeCloseTo(0.95 ** 8, 12);
    const independent = cltDistribution(32),
      copied = cltDistribution(32, 0.5, true);
    expect(copied.items.filter((x) => x.probability > 0).map((x) => [x.k, x.probability])).toEqual([
      [0, 0.5],
      [32, 0.5],
    ]);
    expect(copied.variance).toBe(32 * independent.variance);
    expect(copied.meanVariance).toBe(0.25);
    expect(cltNormalDensity(0)).toBeCloseTo(0.3989422804014327, 14);
  });
  it('rejects invalid sample sizes and probabilities', () => {
    for (const n of [0, 65, 1.5, NaN]) expect(() => cltDistribution(n)).toThrow();
    for (const p of [-0.1, 1.1, Infinity]) expect(() => cltDistribution(4, p)).toThrow();
  });
});
