import { describe, expect, it } from 'vitest';
import { logisticRate, logisticSwitched, logisticTrace, logisticValue } from './growth-logistic';
describe('continuous logistic growth', () => {
  it('matches an independent fine-step RK4 solver above and below capacity', () => {
    for (const initial of [2, 10, 50, 140])
      for (const rate of [0.1, 0.6, 1.2]) {
        let y = initial;
        const dt = 0.001,
          f = (x: number) => rate * x * (1 - x / 100);
        for (let i = 0; i < 10000; i++) {
          const a = f(y),
            b = f(y + (dt * a) / 2),
            c = f(y + (dt * b) / 2),
            d = f(y + dt * c);
          y += (dt * (a + 2 * b + 2 * c + d)) / 6;
        }
        expect(logisticValue(10, initial, rate, 100)).toBeCloseTo(y, 9);
      }
  });
  it('has the claimed derivative, maximum total rate and equilibrium bounds', () => {
    for (const initial of [2, 10, 140])
      for (const time of [0.1, 3, 10]) {
        const dt = 1e-5,
          v = logisticValue(time, initial);
        expect(
          (logisticValue(time + dt, initial) - logisticValue(time - dt, initial)) / (2 * dt),
        ).toBeCloseTo(logisticRate(v), 7);
        expect(v).toBeGreaterThanOrEqual(Math.min(initial, 100));
        expect(v).toBeLessThanOrEqual(Math.max(initial, 100));
      }
    expect(logisticRate(50)).toBe(15);
    for (let n = 0; n <= 100; n++) expect(logisticRate(n)).toBeLessThanOrEqual(15);
    expect(logisticRate(140)).toBeLessThan(0);
    expect(logisticValue(10, 100)).toBe(100);
    expect(logisticValue(10, 0)).toBe(0);
    expect(logisticValue(10, 10, 0)).toBe(10);
  });
  it('keeps population continuous when capacity changes while allowing slope to jump', () => {
    const at = logisticValue(6),
      dt = 1e-7;
    expect(logisticSwitched(6)).toBe(at);
    expect(logisticSwitched(6 + dt)).toBeCloseTo(at, 5);
    expect(logisticRate(at, 0.6, 100)).toBeGreaterThan(0);
    expect(logisticRate(at, 0.6, 60)).toBeLessThan(0);
    const trace = logisticTrace(10, 0.6, 100, 14, 60, 6);
    expect(trace.at(-1)!.value).toBeGreaterThan(60);
    expect(trace.at(-1)!.value).toBeLessThan(at);
    expect(logisticValue(3, 2)).toBeLessThan(2 * Math.exp(0.6 * 3));
  });
  it('rejects invalid values and avoids zero-initial singularities', () => {
    expect(logisticTrace(0).every((p) => p.value === 0)).toBe(true);
    expect(() => logisticValue(-1)).toThrow();
    expect(() => logisticValue(2, 10, 0.6, 0)).toThrow();
    expect(() => logisticValue(2, NaN)).toThrow();
    expect(() => logisticSwitched(1, 10, 0.6, 100, -1)).toThrow();
  });
});
