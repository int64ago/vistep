import { describe, it, expect } from 'vitest';
import { waxMotion, waxRise } from './wax-motion-composition';
describe('wax motion composition', () => {
  it('uniform components form a straight path with vector speed', () => {
    for (const t of [0.5, 1, 3, 5]) {
      const s = waxMotion(t);
      expect(s.y / s.x).toBeCloseTo(0.1 / 0.12);
      expect(s.speed).toBeCloseTo(Math.hypot(0.12, 0.1));
    }
  });
  it('horizontal acceleration does not change the prescribed vertical rise', () => {
    for (const t of [0.5, 2, 4]) {
      expect(waxMotion(t, 'accelerated').y).toBe(waxMotion(t, 'uniform').y);
      expect(waxMotion(t, 'accelerated').vy).toBe(0.1);
    }
  });
  it('reproduces textbook 1second horizontal increments4,12,20,28cm', () => {
    const p = Array.from({ length: 5 }, (_, i) => waxMotion(i, 'accelerated'));
    expect(p.slice(1).map((q, i) => Math.round((q.x - p[i].x) * 100))).toEqual([4, 12, 20, 28]);
    expect(p[4].y).toBeCloseTo(0.4);
  });
  it('horizontal position derivative equals displayed velocity', () => {
    const t = 2.3,
      h = 0.00001;
    for (const mode of ['uniform', 'accelerated'] as const) {
      const s = waxMotion(t, mode);
      expect((waxMotion(t + h, mode).x - waxMotion(t - h, mode).x) / (2 * h)).toBeCloseTo(s.vx, 8);
    }
  });
  it('initial buoyant rise accelerates toward terminal rather than starting instantly at terminal speed', () => {
    expect(waxRise(0).v).toBe(0);
    expect(waxRise(0).y).toBe(0);
    expect(waxRise(0.3).v).toBeLessThan(waxRise(1).v);
    expect(waxRise(3).v).toBeCloseTo(0.1, 5);
  });
  it('terminal teaching segment never reaches the cap over supported rise speeds', () => {
    for (const vy of [0.06, 0.1, 0.16])
      expect(waxMotion(100, 'uniform', 0.12, vy).y + 0.12).toBeLessThan(1);
  });
});
