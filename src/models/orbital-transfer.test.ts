import { describe, expect, it } from 'vitest';
import { hohmannCircle, hohmannPlan, hohmannState } from './orbital-transfer';
describe('ideal two-impulse coplanar Hohmann transfer', () => {
  it('conserves independently computed vis-viva energy and angular momentum during coasting', () => {
    for (const [from, to] of [
      [1, 1.8],
      [1.8, 1],
      [1, 1],
      [0.6, 3],
    ]) {
      const plan = hohmannPlan(from, to);
      for (let i = 0; i <= 16; i++) {
        const state = hohmannState(i / 8, plan),
          r = Math.hypot(state.x, state.y);
        expect(state.speed ** 2).toBeCloseTo(2 / r - 2 / (from + to), 11);
        expect(state.energy).toBeCloseTo(-1 / (from + to), 11);
        expect(state.x * state.vy - state.y * state.vx).toBeCloseTo(
          Math.sqrt((2 * from * to) / (from + to)),
          11,
        );
        expect(r).toBeGreaterThanOrEqual(Math.min(from, to) - 1e-12);
        expect(r).toBeLessThanOrEqual(Math.max(from, to) + 1e-12);
      }
    }
  });
  it('preserves positions at impulses and separates arrival speed from circular speed', () => {
    const q = hohmannPlan(),
      start = hohmannState(0, q),
      end = hohmannState(1, q),
      circle = hohmannCircle(q.to, Math.PI);
    expect(start.x).toBeCloseTo(q.from, 12);
    expect(end.x).toBeCloseTo(-q.to, 12);
    expect(end.y).toBeCloseTo(0, 12);
    expect(circle.x).toBeCloseTo(end.x, 12);
    expect(end.speed).toBeLessThan(circle.speed);
    expect(q.burn1).toBeGreaterThan(0);
    expect(q.burn2).toBeGreaterThan(0);
    expect(hohmannPlan(1.8, 1).burn1).toBeLessThan(0);
    expect(hohmannPlan(1.8, 1).burn2).toBeLessThan(0);
  });
  it('returns on the same ellipse without burn two and has the correct time and mass scaling', () => {
    const q = hohmannPlan(),
      again = hohmannState(2, q),
      faster = hohmannPlan(1, 1.8, 4);
    expect(again.x).toBeCloseTo(q.from, 12);
    expect(again.y).toBeCloseTo(0, 12);
    expect(q.flightTime).toBeCloseTo(Math.PI * Math.sqrt(q.a ** 3), 12);
    expect(faster.flightTime).toBe(q.flightTime / 2);
    expect(faster.burn1).toBe(q.burn1 * 2);
    expect(hohmannPlan(1, 1).burn1).toBe(0);
    expect(hohmannPlan(1, 1).burn2).toBe(0);
  });
  it('matches velocity to a central difference of the actual trajectory and rejects invalid states', () => {
    const q = hohmannPlan();
    for (const p of [0.1, 0.5, 0.9]) {
      const h = 1e-5,
        a = hohmannState(p - h, q),
        b = hohmannState(p + h, q),
        v = hohmannState(p, q);
      expect((b.x - a.x) / (2 * h * q.flightTime)).toBeCloseTo(v.vx, 8);
      expect((b.y - a.y) / (2 * h * q.flightTime)).toBeCloseTo(v.vy, 8);
    }
    expect(() => hohmannPlan(0)).toThrow();
    expect(() => hohmannPlan(1, NaN)).toThrow();
    expect(() => hohmannState(2.1)).toThrow();
  });
});
