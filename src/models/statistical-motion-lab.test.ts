import { describe, expect, it } from 'vitest';
import {
  trialHistogram,
  binomialProbabilities,
  galtonBall,
  beansOnScale,
} from './statistical-motion-lab';
describe('statistical textbook experiments', () => {
  it('conserves counts and approaches the four-coin binomial distribution', () => {
    const n = 10000,
      h = trialHistogram(n, 4),
      p = binomialProbabilities(4);
    expect(h.reduce((a, b) => a + b, 0)).toBe(n);
    h.forEach((v, i) => expect(Math.abs(v / n - p[i])).toBeLessThan(0.015));
    expect(p).toEqual([1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16]);
  });
  it('reconstructs the same Galton path and avoids its current peg', () => {
    for (let i = 0; i < 80; i++) {
      const p = i / 80,
        s = galtonBall(0, p);
      expect(Number.isFinite(s.x)).toBe(true);
      for (let row = 0; row < 8; row++) {
        for (let j = 0; j <= row; j++) {
          const pegX = 180 + (2 * j - row) * 9;
          const pegY = 58 + row * 17;
          expect(Math.hypot(s.x - pegX, s.y - pegY)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
    expect(galtonBall(7, 0.42)).toEqual(galtonBall(7, 0.42));
  });
  it('separates impulse from accumulated bean weight', () => {
    expect(beansOnScale(0).reading).toBe(0);
    const a = beansOnScale(30);
    expect(a.reading).toBeCloseTo(100 * 0.0005 * 9.8, 10);
    expect(a.impact).toBeCloseTo(0, 10);
  });
  it('predicts larger collision momentum from a greater height', () => {
    const a = beansOnScale(1, { height: 0.2 }),
      b = beansOnScale(1, { height: 0.5 });
    expect(b.meanImpact / a.meanImpact).toBeCloseTo(Math.sqrt(2.5), 10);
  });
});
