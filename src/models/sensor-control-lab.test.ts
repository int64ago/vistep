import { describe, expect, it } from 'vitest';
import {
  photoResistance,
  ntcResistance,
  reedSensor,
  lightControl,
  bimetalState,
  pressureResistance,
  PRESSURE_DATA,
} from './sensor-control-lab';
describe('textbook sensor mechanisms', () => {
  it('separates an LDR from ordinary resistor and matches NTC reference', () => {
    expect(photoResistance(100)).toBeLessThan(photoResistance(10));
    expect(photoResistance(1, true)).toBe(photoResistance(1000, true));
    expect(ntcResistance(25)).toBe(10000);
    expect(ntcResistance(50)).toBeLessThan(ntcResistance(25));
  });
  it('closes the reed near the magnet and opens it far away', () => {
    expect(reedSensor(0.005).closed).toBe(true);
    expect(reedSensor(0.05).closed).toBe(false);
  });
  it('models base loading and turns on only in darkness, with a different relay threshold', () => {
    expect(lightControl(1000).on).toBe(false);
    expect(lightControl(1).on).toBe(true);
    expect(lightControl(1, 10000, true).on).toBe(true);
    expect(lightControl(1000, 10000, true).on).toBe(false);
    expect(lightControl(1).collectorCurrent).toBeLessThanOrEqual(4 / 330);
  });
  it('opens heating at sixty degrees and preserves original pressure data', () => {
    expect(bimetalState(20).deflection).toBe(0);
    expect(bimetalState(59).heater).toBe(true);
    expect(bimetalState(60).heater).toBe(false);
    for (const p of PRESSURE_DATA)
      expect(pressureResistance(p.force).resistance).toBeCloseTo(p.resistance, 9);
    expect(Math.abs(pressureResistance(0.75).slope)).toBeGreaterThan(
      Math.abs(pressureResistance(5.25).slope),
    );
  });
});
