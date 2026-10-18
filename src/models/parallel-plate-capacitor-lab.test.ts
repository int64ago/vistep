import { describe, it, expect } from 'vitest';
import { plateCapacitor, PLATE_REFERENCE_CHARGE } from './parallel-plate-capacitor-lab';
describe('isolated parallel-plate capacitor', () => {
  it('matches the independent 196cm², 1cm vacuum benchmark', () => {
    const s = plateCapacitor();
    expect(s.capacitance).toBeCloseTo(17.354208113088e-12, 23);
    expect(s.voltage).toBeCloseTo(100, 12);
    expect(s.charge).toBe(PLATE_REFERENCE_CHARGE);
  });
  it('keeps charge fixed while gap and overlap change voltage', () => {
    expect(plateCapacitor(0.02).voltage).toBeCloseTo(200, 12);
    expect(plateCapacitor(0.01, 0.5).voltage).toBeCloseTo(200, 12);
    expect(plateCapacitor(0.01, 0.5).charge).toBe(PLATE_REFERENCE_CHARGE);
  });
  it('treats partially inserted dielectric as parallel area contributions', () => {
    const a = plateCapacitor(0.01, 1, 4, 0.5);
    expect(a.capacitance / plateCapacitor().capacitance).toBeCloseTo(2.5, 12);
    expect(a.voltage).toBeCloseTo(40, 12);
  });
  it('exposes the fixed-voltage counterexample', () => {
    const s = plateCapacitor(0.005, 1, 1, 1, true);
    expect(s.voltage).toBe(100);
    expect(s.charge / PLATE_REFERENCE_CHARGE).toBeCloseTo(2, 12);
    expect(s.energy / plateCapacitor().energy).toBeCloseTo(2, 12);
  });
  it('preserves the actual charge captured from a connected state', () => {
    const connected = plateCapacitor(0.005, 1, 3, 1, true),
      isolated = plateCapacitor(0.005, 1, 3, 1, false, connected.charge);
    expect(isolated.voltage).toBe(100);
    expect(isolated.charge).toBe(connected.charge);
    expect(plateCapacitor(0.01, 1, 3, 1, false, connected.charge).voltage).toBe(200);
  });
  it('rejects invalid geometry instead of producing infinite readings', () => {
    expect(() => plateCapacitor(0)).toThrow();
    expect(() => plateCapacitor(0.01, 0)).toThrow();
    expect(() => plateCapacitor(NaN)).toThrow();
  });
});
