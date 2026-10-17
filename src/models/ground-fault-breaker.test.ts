import { describe, expect, it } from 'vitest';
import { groundFaultBreaker } from './ground-fault-breaker';
const base = { loadA: 5, earthMA: 40, testMA: 0, seconds: 0.05 };
describe('single-phase residual-current detection and trip latch', () => {
  it('cancels balanced currents of any load while an external return leaves its signed residual', () => {
    for (const loadA of [0, 2, 12, 60])
      for (const phase of [0, 0.3, Math.PI / 2, 4]) {
        const balanced = groundFaultBreaker({ ...base, loadA, earthMA: 0, phase });
        expect(balanced.ampereTurns).toBeCloseTo(0, 12);
        expect(balanced.closed).toBe(true);
        const leaking = groundFaultBreaker({ ...base, loadA, phase });
        expect(leaking.lineA - leaking.neutralA).toBeCloseTo(0.04, 12);
        expect(leaking.ampereTurns).toBeCloseTo(0.04 * Math.SQRT2 * Math.sin(phase), 12);
      }
  });
  it('detects the internal test return without any earth path and gives opposite flux sign', () => {
    const earth = groundFaultBreaker(base),
      test = groundFaultBreaker({ ...base, earthMA: 0, testMA: 40 });
    expect(test.earthA).toBe(0);
    expect(test.residualMA).toBeCloseTo(40, 12);
    expect(test.signedResidualA).toBe(-earth.signedResidualA);
    expect(test.ampereTurns).toBeCloseTo(-earth.ampereTurns, 12);
    const h = 1e-5,
      phase = 0.7;
    const plus = groundFaultBreaker({ ...base, phase: phase + 2 * Math.PI * 50 * h });
    const minus = groundFaultBreaker({ ...base, phase: phase - 2 * Math.PI * 50 * h });
    const numeric = (plus.ampereTurns - minus.ampereTurns) / (2 * h);
    expect(numeric / groundFaultBreaker({ ...base, phase }).residualDerivative).toBeCloseTo(1, 5);
  });
  it('uses continuous threshold duration, then stays open after a cleared fault until reset', () => {
    expect(groundFaultBreaker({ ...base, seconds: 0.059 }).closed).toBe(true);
    const tripped = groundFaultBreaker({ ...base, seconds: 0.061 });
    expect(tripped.closed).toBe(false);
    expect(tripped.trips[0]).toBeCloseTo(0.06, 12);
    expect(tripped.lineA).toBe(0);
    expect(tripped.residualMA).toBe(0);
    expect(tripped.detectedResidualMA).toBe(40);
    expect(groundFaultBreaker({ ...base, seconds: 0.2, clearAt: 0.05 }).closed).toBe(true);
    expect(groundFaultBreaker({ ...base, earthMA: 29, seconds: 1 }).closed).toBe(true);
    expect(groundFaultBreaker({ ...base, clearAt: 0.1, seconds: 0.18 }).closed).toBe(false);
    expect(groundFaultBreaker({ ...base, clearAt: 0.1, resetAt: 0.16, seconds: 0.18 }).closed).toBe(
      true,
    );
    const repeated = groundFaultBreaker({ ...base, resetAt: 0.16, seconds: 0.2 });
    expect(repeated.closed).toBe(false);
    expect(repeated.trips).toHaveLength(2);
    expect(repeated.trips[1]).toBeCloseTo(0.18, 12);
  });
  it('reconstructs direct seeks and rejects unsupported current histories', () => {
    const direct = groundFaultBreaker({ ...base, clearAt: 0.1, resetAt: 0.16, seconds: 0.19 });
    for (let n = 0; n < 19; n++)
      groundFaultBreaker({ ...base, clearAt: 0.1, resetAt: 0.16, seconds: n * 0.01 });
    expect(groundFaultBreaker({ ...base, clearAt: 0.1, resetAt: 0.16, seconds: 0.19 })).toEqual(
      direct,
    );
    for (const invalid of [
      { earthMA: -1 },
      { seconds: NaN },
      { delaySeconds: 0 },
      { clearAt: 0.01 },
      { resetAt: -1 },
    ])
      expect(() => groundFaultBreaker({ ...base, ...invalid })).toThrow();
  });
});
