import { describe, it, expect } from 'vitest';
import {
  phoneMotion,
  phoneSamples,
  phoneShot,
  phoneForceMeter,
  PHONE_G,
} from './phone-accelerometer-lab';
describe('phone specific force and coordinate acceleration', () => {
  it('distinguishes supported rest and free fall', () => {
    expect(phoneMotion('drop', 0.2).raw).toBe(PHONE_G);
    expect(phoneMotion('drop', 0.2).corrected).toBe(0);
    expect(phoneMotion('drop', 0.55).raw).toBe(0);
    expect(phoneMotion('drop', 0.55).corrected).toBe(-PHONE_G);
  });
  it('preserves position and velocity across release, catch, and rest', () => {
    for (const t of [0.4, 0.7, 0.86]) {
      const a = phoneMotion('drop', t - 1e-8),
        b = phoneMotion('drop', t + 1e-8);
      expect(Math.abs(a.z - b.z)).toBeLessThan(1e-6);
      expect(Math.abs(a.v - b.v)).toBeLessThan(1e-6);
    }
  });
  it('the catch impulse removes exactly the downward momentum', () => {
    expect(phoneMotion('drop', 0.78).a * 0.16).toBeCloseTo(9.8 * 0.3, 12);
    expect(phoneMotion('drop', 0.9).v).toBe(0);
  });
  it('a rising lift can have positive, zero, or negative coordinate acceleration', () => {
    expect(phoneMotion('lift', 2).a).toBe(1);
    expect(phoneMotion('lift', 4).a).toBe(0);
    expect(phoneMotion('lift', 6).a).toBe(-1);
    expect(phoneMotion('lift', 6).v).toBeGreaterThan(0);
    expect(phoneMotion('lift', 8).z).toBe(8);
  });
  it('spring force measurements recover lift acceleration at all stages', () => {
    for (const time of [0, 2, 4, 6, 8]) {
      const s = phoneMotion('lift', time),
        m = phoneForceMeter(s.a);
      expect(m.force / m.mass - 9.8).toBeCloseTo(s.a, 12);
      expect(m.extension).toBeCloseTo(m.force / 20, 12);
    }
  });
  it('reconstructs samples and obeys raw-corrected=g throughout', () => {
    for (const s of phoneSamples('drop')) expect(s.raw - s.corrected).toBeCloseTo(PHONE_G, 10);
    expect(phoneShot(4, 0.5)).toEqual(phoneShot(4, 0.5));
    expect(() => phoneSamples('drop', 0)).toThrow();
  });
});
