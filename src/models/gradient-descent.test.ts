import { describe, expect, it } from 'vitest';
import { descentGradient, descentLoss, descentTrace } from './gradient-descent';
describe('quadratic gradient descent', () => {
  it('matches independent central differences and the exact first update', () => {
    const eps = 1e-6;
    for (const [x, y] of [
      [2.5, 1.5],
      [-2, 3],
      [0, 0],
      [1, -1],
    ]) {
      const g = descentGradient(x, y);
      expect((descentLoss(x + eps, y) - descentLoss(x - eps, y)) / (2 * eps)).toBeCloseTo(g.x, 6);
      expect((descentLoss(x, y + eps) - descentLoss(x, y - eps)) / (2 * eps)).toBeCloseTo(g.y, 6);
    }
    expect(descentTrace().points[1]).toMatchObject({ x: 2.3, y: 0.54 });
    expect(descentTrace().points[1].loss).toBeCloseTo(3.8114, 10);
  });
  it('matches the closed-form eigen-direction recurrence over all six regimes', () => {
    for (const rate of [0, 0.02, 0.08, 0.22, 0.25, 0.3])
      for (const start of [
        [2.5, 1.5],
        [-1, 2],
        [0, 0],
      ] as const) {
        for (const point of descentTrace(rate, 20, start).points) {
          expect(point.x).toBeCloseTo(start[0] * (1 - rate) ** point.step, 8);
          expect(point.y).toBeCloseTo(start[1] * (1 - 8 * rate) ** point.step, 8);
        }
      }
  });
  it('separates monotone convergence, convergent zigzags, critical oscillation and divergence', () => {
    for (const rate of [0.02, 0.08, 0.15, 0.22, 0.24]) {
      const q = descentTrace(rate, 32);
      expect(q.stable).toBe(true);
      for (let i = 1; i < q.points.length; i++)
        expect(q.points[i].loss).toBeLessThan(q.points[i - 1].loss);
    }
    const zig = descentTrace(0.22, 8);
    expect(zig.points[1].y).toBeLessThan(0);
    expect(zig.points[2].y).toBeGreaterThan(0);
    const critical = descentTrace(0.25, 32);
    expect(Math.abs(critical.points[32].y)).toBe(1.5);
    expect(critical.points[32].loss).toBeCloseTo(9, 6);
    expect(descentTrace(0.3, 4).points[4].loss).toBeGreaterThan(
      descentTrace(0.3, 4).points[0].loss,
    );
  });
  it('rejects nonfinite input, invalid step counts and out-of-scope starts', () => {
    expect(() => descentTrace(NaN)).toThrow();
    expect(() => descentTrace(0.1, 65)).toThrow();
    expect(() => descentTrace(0.1, 2, [6, 0])).toThrow();
    expect(descentTrace(0, 2).points.every((p) => p.loss === 12.125)).toBe(true);
  });
});
