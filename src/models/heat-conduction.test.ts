import { describe, it, expect } from 'vitest';
import { conduction } from './heat-conduction';
describe('solid conduction finite-volume model', () => {
  it('recovers the initial interior exactly and keeps the endpoint baths fixed', () => {
    const s = conduction({ seconds: 0 });
    expect(s.temperature[0]).toBe(90);
    expect(s.temperature.at(-1)).toBe(20);
    for (const T of s.temperature.slice(1, -1)) expect(T).toBeCloseTo(20, 10);
  });
  it('matches an independent Fourier steady slab benchmark 5.6 W', () => {
    const s = conduction({ seconds: 1e6 });
    expect(s.inputPower).toBeCloseTo((20 * 0.0004 * 70) / 0.1, 10);
    for (const q of s.flux) expect(q).toBeCloseTo(14000, 7);
    expect(s.temperature[12]).toBeCloseTo(55, 10);
  });
  it('balances stored energy against boundary power throughout the transient', () => {
    for (const seconds of [0, 1, 10, 100, 1000]) {
      const s = conduction({ seconds });
      expect(s.energyRate).toBeCloseTo(s.inputPower - s.outputPower, 9);
      for (const T of s.temperature) {
        expect(T).toBeGreaterThanOrEqual(20 - 1e-9);
        expect(T).toBeLessThanOrEqual(90 + 1e-9);
      }
    }
  });
  it('reverses flux with the gradient and distinguishes uniform equilibrium', () => {
    expect(conduction({ seconds: 1e6, hot: 20, cold: 90 }).inputPower).toBeCloseTo(-5.6, 10);
    const equal = conduction({ hot: 40, cold: 40, initial: 40 });
    expect(equal.flux.every((q) => Math.abs(q) < 1e-9)).toBe(true);
    // Equal bath temperatures alone do not imply an initially uniform rod.
    expect(conduction({ hot: 40, cold: 40, initial: 20, seconds: 10 }).inputPower).toBeGreaterThan(
      0,
    );
  });
  it('halves steady transfer with twice the length and rejects invalid inputs', () => {
    expect(conduction({ seconds: 1e6, length: 0.2 }).inputPower).toBeCloseTo(2.8, 9);
    expect(() => conduction({ conductivity: 0 })).toThrow(RangeError);
    expect(() => conduction({ seconds: -1 })).toThrow(RangeError);
  });
});
