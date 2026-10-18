import { describe, it, expect } from 'vitest';
import {
  coolingMinutes,
  coolingCelsius,
  coolingReading,
  lowTemperatureTrials,
  boilingTrials,
  usefulWaterHeat,
  measuredEfficiency,
  fuelSaving,
  mixedWaterMass,
  heaterFlowPoint,
} from './gas-efficiency-lab';
describe('textbook gas-heating projects', () => {
  it('retains original measurements and derives gas use from both meter readings', () => {
    for (const a of [...lowTemperatureTrials, ...boilingTrials])
      expect(a.after - a.before).toBeCloseTo(a.volume, 9);
    coolingMinutes.forEach((m, i) => expect(coolingReading(m).temperature).toBe(coolingCelsius[i]));
    expect(coolingReading(0).temperature).toBe(101.9);
  });
  it('compares equal-time heat loss and equal-endpoint fuel use without invented heat losses', () => {
    expect(
      (coolingReading(0).temperature - coolingReading(20).temperature) /
        (coolingReading(180).temperature - coolingReading(200).temperature),
    ).toBeCloseTo(5.95);
    expect(fuelSaving(0.0883, 0.0784)).toBeCloseTo(0.11211778);
    expect(usefulWaterHeat(4, 26, 50)).toBe(401280);
  });
  it('leaves absent data uncomputed and retains meaningful out-of-range measurements', () => {
    expect(measuredEfficiency(10, 20, 38, null, 35)).toBeNull();
    expect(measuredEfficiency(10, 20, 38, 0, 35)).toBeNull();
    expect(measuredEfficiency(10, 20, 38, 0.03, 35)).toBeCloseTo(0.7165714);
    expect(measuredEfficiency(10, 20, 50, 0.001, 35)).toBeGreaterThan(1);
  });
  it('conserves mixing energy and keeps the flow on its connected pipes', () => {
    const m = mixedWaterMass(10, 50, 20, 38);
    expect(m).toBeCloseTo(16.6666667);
    expect(10 * (50 - 38)).toBeCloseTo((m - 10) * (38 - 20));
    for (let i = 0; i < 1000; i++) {
      const p = heaterFlowPoint(i / 1000);
      expect(p.x).toBeGreaterThanOrEqual(100);
      expect(p.x).toBeLessThanOrEqual(315);
      expect(p.y).toBeGreaterThanOrEqual(75);
      expect(p.y).toBeLessThanOrEqual(285);
    }
  });
});
