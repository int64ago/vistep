import { describe, expect, it } from 'vitest';
import { electrolysis, electrolysisConstants as k } from './electrolysis';
const base = { current: 2, seconds: 60, voltage: 1.8, waterMMol: 10 };
describe('ideal PEM water electrolysis', () => {
  it('matches the independent four-electron reaction and charge benchmark', () => {
    const q = electrolysis({ ...base, current: 4, seconds: k.faraday / 1000, waterMMol: 10 });
    expect(q.charge).toBeCloseTo((4 * k.faraday) / 1000, 10);
    expect(q.hydrogen).toBeCloseTo(0.002, 12);
    expect(q.oxygen).toBeCloseTo(0.001, 12);
    expect(q.electrons).toBeCloseTo(0.004, 12);
    // H and O atoms, and charge consumed at the cathode, independently balance.
    expect(2 * q.waterUsed).toBeCloseTo(2 * q.hydrogen, 12);
    expect(q.waterUsed).toBeCloseTo(2 * q.oxygen, 12);
    expect(q.protons).toBeCloseTo(2 * q.hydrogen, 12);
  });
  it('depends on integrated current, while equal charge at higher voltage costs more energy', () => {
    for (const current of [0.5, 1, 2, 4, 10]) {
      const a = electrolysis({ ...base, current, seconds: 120 / current });
      expect(a.hydrogen).toBeCloseTo(120 / (2 * k.faraday), 12);
    }
    const low = electrolysis({ ...base, voltage: 1.3 }),
      high = electrolysis({ ...base, voltage: 2 });
    expect(high.hydrogen).toBe(low.hydrogen);
    expect(high.electricalEnergy - low.electricalEnergy).toBeCloseTo(120 * 0.7, 10);
    expect(low.heatOut).toBeLessThan(0); // Heat must enter below thermoneutral voltage.
    expect(high.heatOut).toBeGreaterThan(0);
    expect(high.electricalPower).toBeCloseTo(high.enthalpyRate + high.heatOut, 12);
    expect(low.electricalEnergy).toBeCloseTo(low.enthalpyStored + low.heatEnergyOut, 12);
  });
  it('stops exactly at the finite-water boundary and blocks sustained charge with either path open', () => {
    const input = { ...base, waterMMol: 0.3 },
      stop = (0.0003 * 2 * k.faraday) / 2;
    const before = electrolysis({ ...input, seconds: stop - 0.01 });
    const after = electrolysis({ ...input, seconds: stop + 0.01 });
    expect(before.runningCurrent).toBe(2);
    expect(after.runningCurrent).toBe(0);
    expect(after.hydrogen).toBeCloseTo(0.0003, 12);
    expect(after.oxygen).toBeCloseTo(0.00015, 12);
    expect(after.waterRemaining).toBe(0);
    expect(electrolysis({ ...input, seconds: 600 }).charge).toBe(after.charge);
    for (const disabled of [{ circuitClosed: false }, { membraneConducting: false }]) {
      const q = electrolysis({ ...base, ...disabled });
      expect(q.charge).toBe(0);
      expect(q.electricalPower).toBe(0);
    }
  });
  it('handles zero current and rejects nonfinite or unsupported states', () => {
    expect(electrolysis({ ...base, current: 0 }).hydrogen).toBe(0);
    expect(electrolysis({ ...base, current: 0 }).exhaustionSeconds).toBeNull();
    for (const invalid of [{ current: -1 }, { seconds: NaN }, { voltage: 1 }, { waterMMol: 0 }])
      expect(() => electrolysis({ ...base, ...invalid })).toThrow();
  });
});
