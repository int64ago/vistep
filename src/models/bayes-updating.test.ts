import { describe, expect, it } from 'vitest';
import { bayesUpdate } from './bayes-updating';
describe('Bayesian updating as natural-frequency selection', () => {
  it('matches a hand-counted 10000-ticket benchmark and an independent odds calculation', () => {
    const q = bayesUpdate({ prior: 0.1, hit: 0.8, otherHit: 0.1 });
    expect(q.blue).toBe(1000);
    expect(q.other).toBe(9000);
    expect(q.blueMarked).toBe(800);
    expect(q.otherMarked).toBe(900);
    expect(q.selected).toBe(1700);
    expect(q.posterior).toBeCloseTo(8 / 17, 14);
    const priorOdds = 1 / 9,
      likelihoodRatio = 8,
      posteriorOdds = priorOdds * likelihoodRatio;
    expect(q.posterior).toBeCloseTo(posteriorOdds / (1 + posteriorOdds), 14);
    expect(bayesUpdate({ prior: 0.01, hit: 0.8, otherHit: 0.1 }).posterior).toBeCloseTo(
      8 / 107,
      14,
    );
  });
  it('counts a second conditionally independent observation but never counts the same evidence twice', () => {
    const base = { prior: 0.1, hit: 0.8, otherHit: 0.1 };
    const repeated = bayesUpdate({ ...base, observations: 2, conditionallyIndependent: false }),
      fresh = bayesUpdate({ ...base, observations: 2 });
    expect(repeated.posterior).toBeCloseTo(8 / 17, 14);
    expect(fresh.posterior).toBeCloseTo(64 / 73, 14);
    const first = bayesUpdate(base).posterior!;
    expect(bayesUpdate({ ...base, prior: first }).posterior).toBeCloseTo(fresh.posterior!, 14);
    expect(fresh.blueMarked).toBeCloseTo(640, 12);
    expect(fresh.otherMarked).toBeCloseTo(90, 12);
  });
  it('keeps all supported UI natural frequencies integral, with joint areas summing to evidence area', () => {
    for (let p = 1; p <= 50; p++)
      for (let h = 10; h <= 100; h += 10)
        for (let f = 0; f <= 50; f += 10)
          for (const n of [1, 2]) {
            const q = bayesUpdate({
              prior: p / 100,
              hit: h / 100,
              otherHit: f / 100,
              observations: n,
            });
            expect(q.blueMarked).toBeCloseTo(Math.round(q.blueMarked), 8);
            expect(q.otherMarked).toBeCloseTo(Math.round(q.otherMarked), 8);
            expect(q.blueMarked / 10000 + q.otherMarked / 10000).toBeCloseTo(q.probability, 12);
            expect(q.posterior).toBeGreaterThanOrEqual(0);
            expect(q.posterior).toBeLessThanOrEqual(1);
          }
  });
  it('handles uninformative evidence, perfect specificity and impossible observations explicitly', () => {
    expect(bayesUpdate({ prior: 0.23, hit: 0.4, otherHit: 0.4 }).posterior).toBeCloseTo(0.23, 14);
    expect(bayesUpdate({ prior: 0.01, hit: 0.8, otherHit: 0 }).posterior).toBe(1);
    expect(bayesUpdate({ prior: 0, hit: 1, otherHit: 0 }).posterior).toBeNull();
    expect(bayesUpdate({ prior: 1, hit: 1, otherHit: 0 }).posterior).toBe(1);
    expect(() => bayesUpdate({ prior: -0.1, hit: 0.8, otherHit: 0.1 })).toThrow(RangeError);
    expect(() => bayesUpdate({ prior: 0.1, hit: 0.8, otherHit: 0.1, observations: 0 })).toThrow(
      RangeError,
    );
  });
});
