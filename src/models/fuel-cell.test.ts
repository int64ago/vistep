import { describe, expect, it } from 'vitest';
import { fuelCell, fuelCellConstants as k } from './fuel-cell';
const base = {
  resistance: 0.5,
  internalResistance: 0.2,
  seconds: 60,
  hydrogenMMol: 2,
  oxygenMMol: 1,
};
describe('PEM charge routes, feed limits and load', () => {
  it('balances the four-electron reaction against an independently chosen charge duration', () => {
    const E = 237100 / (2 * k.faraday),
      I = E / 0.7;
    const q = fuelCell({ ...base, seconds: (4 * k.faraday) / 10000 / I });
    expect(q.usedHydrogen).toBeCloseTo(0.0002, 12);
    expect(q.usedOxygen).toBeCloseTo(0.0001, 12);
    expect(q.water).toBeCloseTo(0.0002, 12);
    expect(q.electrons).toBeCloseTo(0.0004, 12);
    expect(q.water).toBeCloseTo(q.usedHydrogen, 12);
    expect(q.water).toBeCloseTo(2 * q.usedOxygen, 12);
  });
  it('satisfies external and internal electrical balances and the enthalpy ledger', () => {
    for (const R of [0.05, 0.2, 0.5, 2, 10]) {
      const q = fuelCell({ ...base, resistance: R });
      expect(q.voltage).toBeCloseTo(q.current * R, 12);
      expect(q.reversibleVoltage).toBeCloseTo(q.voltage! + q.current * base.internalResistance, 12);
      expect(q.enthalpyRate).toBeCloseTo(q.electricalPower + q.heatOut, 12);
      expect(q.enthalpyUsed).toBeCloseTo(q.electricalEnergy + q.heatEnergy, 12);
      expect(q.efficiency!).toBeLessThan(k.deltaG / k.deltaH);
    }
  });
  it('has an independent maximum-power bound at matched resistance, not at a near short', () => {
    const matched = fuelCell({ ...base, resistance: 0.2 });
    const bound = matched.reversibleVoltage ** 2 / (4 * 0.2);
    expect(matched.electricalPower).toBeCloseTo(bound, 12);
    for (const R of [0.01, 0.05, 0.1, 0.4, 1, 10]) {
      const q = fuelCell({ ...base, resistance: R });
      expect(q.electricalPower).toBeLessThan(matched.electricalPower);
    }
    const nearShort = fuelCell({ ...base, resistance: 0.05 });
    expect(nearShort.current).toBeGreaterThan(matched.current);
    expect(nearShort.efficiency!).toBeLessThan(matched.efficiency!);
  });
  it('stops at either feed boundary, leaves excess reactant and handles missing conduction', () => {
    for (const [hydrogenMMol, oxygenMMol, expectedWater] of [
      [2, 0.1, 0.2],
      [0.1, 1, 0.1],
      [0.2, 0.1, 0.2],
    ]) {
      const q = fuelCell({ ...base, hydrogenMMol, oxygenMMol, seconds: 600 });
      expect(q.water * 1000).toBeCloseTo(expectedWater, 10);
      expect(q.current).toBe(0);
      expect(q.voltage).toBeNull();
      expect(q.hydrogenRemaining * q.oxygenRemaining).toBeCloseTo(0, 12);
    }
    const oxygenLimited = fuelCell({ ...base, oxygenMMol: 0.1, seconds: 600 });
    expect(oxygenLimited.hydrogenRemaining * 1000).toBeCloseTo(1.8, 10);
    for (const off of [
      { circuitClosed: false },
      { membraneConducting: false },
      { oxygenMMol: 0 },
    ]) {
      const q = fuelCell({ ...base, ...off });
      expect(q.current).toBe(0);
      expect(q.water).toBe(0);
    }
    expect(fuelCell({ ...base, circuitClosed: false }).voltage).toBeCloseTo(
      237100 / (2 * k.faraday),
      12,
    );
    for (const invalid of [
      { resistance: 0 },
      { internalResistance: NaN },
      { seconds: -1 },
      { hydrogenMMol: -1 },
    ])
      expect(() => fuelCell({ ...base, ...invalid })).toThrow();
  });
});
