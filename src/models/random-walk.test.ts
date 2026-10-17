import { describe, expect, it } from 'vitest';
import { walkDistribution, walkPath } from './random-walk';
describe('lattice random walk', () => {
  it('matches independent binomial endpoints, drift, variance and parity', () => {
    for (const n of [1, 8, 31, 32, 64])
      for (const p of [0, 0.3, 0.5, 0.7, 1]) {
        const q = walkDistribution(n, p);
        let choose = 1;
        for (let k = 0; k <= n; k++) {
          if (k) choose *= (n - k + 1) / k;
          expect(q.items.find((v) => v.x === 2 * k - n)?.probability).toBeCloseTo(
            choose * p ** k * (1 - p) ** (n - k),
            12,
          );
        }
        expect(q.items.reduce((v, x) => v + x.probability, 0)).toBeCloseTo(1, 12);
        expect(q.mean).toBeCloseTo(n * (2 * p - 1), 11);
        expect(q.variance).toBeCloseTo(4 * n * p * (1 - p), 10);
        expect(q.items.every((v) => (v.x - n) % 2 === 0)).toBe(true);
      }
    expect(walkDistribution(31).returnProbability).toBe(0);
    expect(walkDistribution(64).rms).toBeCloseTo(2 * walkDistribution(16).rms, 12);
  });
  it('matches absorbing probabilities against all 256 eight-step paths', () => {
    const counts = new Map<number, number>();
    for (let code = 0; code < 256; code++) {
      let x = 0;
      for (let j = 0; j < 8; j++) if (Math.abs(x) < 2) x += (code >> j) & 1 ? 1 : -1;
      counts.set(x, (counts.get(x) ?? 0) + 1);
    }
    const q = walkDistribution(8, 0.5, 2);
    q.items.forEach((v) => expect(v.probability).toBe((counts.get(v.x) ?? 0) / 256));
    expect(q.absorbed).toBe((counts.get(-2)! + counts.get(2)!) / 256);
    expect(q.variance).toBeLessThan(walkDistribution(8).variance);
  });
  it('replays the same prefix and pins a path once it reaches an absorbing edge', () => {
    const q = walkPath(64, 0.5, 7, 4);
    expect(walkPath(12, 0.5, 7, 4).positions).toEqual(q.positions.slice(0, 13));
    q.moves.forEach((move, i) => {
      expect(q.positions[i + 1] - q.positions[i]).toBe(move);
      expect(Math.abs(q.positions[i + 1])).toBeLessThanOrEqual(4);
      if (Math.abs(q.positions[i]) === 4) expect(move).toBe(0);
    });
    expect(walkPath(4, 1).positions).toEqual([0, 1, 2, 3, 4]);
    expect(walkPath(4, 0).positions).toEqual([0, -1, -2, -3, -4]);
  });
  it('handles no steps and rejects invalid input', () => {
    expect(walkDistribution(0).items).toEqual([{ x: 0, probability: 1 }]);
    expect(() => walkPath(129)).toThrow();
    expect(() => walkDistribution(10, -0.1)).toThrow();
    expect(() => walkPath(4, 0.5, NaN)).toThrow();
    expect(() => walkDistribution(4, 0.5, 0)).toThrow();
  });
});
