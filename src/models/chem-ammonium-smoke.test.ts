import { describe, it, expect } from 'vitest';
import { ammoniumSmoke, smokeInventory } from './chem-ammonium-smoke';
describe('ammonium chloride formation in a conservative grid', () => {
  it('balances N, Cl and H against introduced gas at all sampled times', () => {
    for (const t of [0, 0.55, 2, 6, 8, 12]) {
      const s = ammoniumSmoke(t),
        v = smokeInventory(s);
      expect(v.nitrogen).toBeCloseTo(s.injectedA, 9);
      expect(v.chlorine).toBeCloseTo(s.injectedB, 9);
      expect(v.hydrogen).toBeCloseTo(3 * s.injectedA + s.injectedB, 9);
      expect(Math.min(...s.a, ...s.b, ...s.solid)).toBeGreaterThanOrEqual(0);
    }
  });
  it('creates no product when one reactant is absent', () => {
    const s = ammoniumSmoke(12, 0.18, false),
      v = smokeInventory(s);
    expect(v.solid).toBe(0);
    expect(v.a).toBeCloseTo(s.injectedA, 9);
  });
  it('gas contact precedes substantial product and separation delays it', () => {
    expect(smokeInventory(ammoniumSmoke(0.1)).solid).toBeLessThan(1e-5);
    expect(smokeInventory(ammoniumSmoke(5)).solid).toBeGreaterThan(0.5);
    expect(smokeInventory(ammoniumSmoke(4, 0.6)).solid).toBeLessThan(
      smokeInventory(ammoniumSmoke(4, 0.08)).solid / 5,
    );
  });
  it('reconstructs deterministic seeks without shared state mutation', () => {
    const s = ammoniumSmoke(3),
      v = smokeInventory(s);
    s.a[0] = 999;
    ammoniumSmoke(9);
    expect(smokeInventory(ammoniumSmoke(3))).toEqual(v);
  });
});
