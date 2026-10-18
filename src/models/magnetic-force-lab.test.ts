import { describe, expect, it } from 'vitest';
import {
  axialSolenoidField,
  conductorForce,
  currentSpring,
  nailForce,
  parallelForcePerLength,
  suspendedWire,
} from './magnetic-force-lab';
describe('textbook magnetic-force apparatuses', () => {
  it('obeys the vector-product sign and zero-current limit', () => {
    expect(conductorForce(2, 0.18)).toBeCloseTo(-0.0432);
    expect(conductorForce(-2, 0.18)).toBeCloseTo(0.0432);
    expect(conductorForce(-2, -0.18)).toBeCloseTo(-0.0432);
    expect(suspendedWire(0, 0.18, 2).displacement).toBe(0);
  });
  it('matches the independent parallel-current benchmark and reverses repulsion', () => {
    expect(parallelForcePerLength(1, 1, 1)).toBeCloseTo(2e-7, 14);
    expect(parallelForcePerLength(2, -2, 0.03)).toBeLessThan(0);
    expect(() => parallelForcePerLength(1, 1, 0)).toThrow();
  });
  it('reverses coil field but keeps a soft-iron attraction on either current polarity', () => {
    expect(axialSolenoidField(0.05, -2)).toBeCloseTo(-axialSolenoidField(0.05, 2), 12);
    expect(nailForce(0.05, 2)).toBeLessThan(0);
    expect(nailForce(0.05, -2)).toBeCloseTo(nailForce(0.05, 2), 12);
    expect(nailForce(0.05, 0)).toBe(0);
  });
  it('opens and recloses the spring contact reproducibly, while zero current leaves it still', () => {
    const samples = Array.from({ length: 80 }, (_, i) => currentSpring(i / 10));
    expect(samples.some((s) => !s.closed)).toBe(true);
    expect(samples.slice(20).some((s) => s.closed)).toBe(true);
    expect(currentSpring(3)).toEqual(currentSpring(3));
    expect(currentSpring(8, 0).displacement).toBe(0);
    expect(samples.every((s) => Math.abs(s.displacement) < 0.05)).toBe(true);
  });
});
