import { describe, expect, it } from 'vitest';
import { markovPath, markovStationary, markovStep, markovTrace } from './markov-chain';
describe('two-state homogeneous Markov chain', () => {
  it('matches independent closed-form recurrence across75 probability/start regimes', () => {
    for (const a of [0, 0.1, 0.3, 0.8, 1])
      for (const b of [0, 0.1, 0.3, 0.8, 1])
        for (const initial of [
          [1, 0],
          [0.2, 0.8],
          [0.5, 0.5],
        ] as const) {
          const q = markovTrace(a, b, 20, initial);
          q.forEach((p, n) => {
            const expected =
              a + b === 0
                ? initial[0]
                : b / (a + b) + (initial[0] - b / (a + b)) * (1 - a - b) ** n;
            expect(p[0]).toBeCloseTo(expected, 12);
            expect(p[0] + p[1]).toBeCloseTo(1, 12);
            expect(p.every((v) => v >= -1e-12 && v <= 1 + 1e-12)).toBe(true);
          });
        }
  });
  it('has an invariant distribution while an individual can keep switching', () => {
    const stationary = markovStationary().distribution!;
    expect(stationary).toEqual([0.6, 0.4]);
    markovStep(stationary).forEach((v, i) => expect(v).toBeCloseTo(stationary[i], 12));
    const path = markovPath(0.2, 0.3, 40);
    expect(path.states).toContain(0);
    expect(path.states).toContain(1);
    path.transitions.forEach((t) =>
      expect(t.to).toBe(t.u < t.threshold ? (t.from === 0 ? 1 : 0) : t.from),
    );
    expect(markovPath(0.2, 0.3, 40)).toEqual(path);
    expect(markovPath(0.2, 0.3, 10).states).toEqual(path.states.slice(0, 11));
  });
  it('distinguishes unique stationary distribution from convergence and uniqueness', () => {
    const periodic = markovTrace(1, 1, 5);
    expect(periodic).toEqual([
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 1],
    ]);
    expect(markovStationary(1, 1).distribution).toEqual([0.5, 0.5]);
    expect(markovStationary(0, 0).unique).toBe(false);
    expect(markovStep([0.25, 0.75], 0, 0)).toEqual([0.25, 0.75]);
    expect(markovStep([1, 0], 0, 0)).toEqual([1, 0]);
    expect(markovStationary(0.5, 0.1).distribution![0]).toBeCloseTo(1 / 6, 12);
  });
  it('rejects invalid probabilities, distributions, bounds and seeds', () => {
    expect(() => markovStep([1, 0], -1, 0.2)).toThrow();
    expect(() => markovStep([0.5, 0.6])).toThrow();
    expect(() => markovTrace(0.2, 0.3, 129)).toThrow();
    expect(() => markovPath(0.2, 0.3, 1, 0, NaN)).toThrow();
  });
});
