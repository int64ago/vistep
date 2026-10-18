import { it, expect, describe } from 'vitest';
import { floatParameters, floatForce, floatState, floatPotential } from './floating-oscillator';
describe('floating uniform chopstick', () => {
  it('balances rod and submerged iron buoyancy at equilibrium', () => {
    const p = floatParameters();
    expect(floatForce(0).net).toBeCloseTo(0, 12);
    expect(p.immersion).toBeGreaterThan(0);
    expect(p.immersion).toBeLessThan(p.length);
  });
  it('recovers linear restoring force only while partially submerged', () => {
    const p = floatParameters();
    for (const x of [-0.03, 0.02, 0.06]) expect(floatForce(x).net).toBeCloseTo(-p.k * x, 12);
    const a = floatForce(-0.11),
      b = floatForce(-0.12);
    expect(a.partial).toBe(false);
    expect(a.net).toBeCloseTo(b.net, 12);
  });
  it('matches the analytic small-amplitude period and conserves undamped energy across saturation', () => {
    const p = floatParameters();
    expect(floatState(p.period, 0.02, 0).x).toBeCloseTo(0.02, 9);
    for (const t of [0.1, 0.4, 0.8, 1.5]) {
      const s = floatState(t, 0.12, 0);
      expect(0.5 * s.mass * s.v * s.v + floatPotential(s.x)).toBeCloseTo(floatPotential(0.12), 8);
    }
  });
  it('damping removes energy and validates the physical input domain', () => {
    const s = floatState(2, 0.04, 0.005);
    expect(0.5 * s.mass * s.v * s.v + floatPotential(s.x)).toBeLessThan(floatPotential(0.04));
    expect(() => floatState(1, 0.2)).toThrow();
    expect(() => floatState(NaN)).toThrow();
  });
});
