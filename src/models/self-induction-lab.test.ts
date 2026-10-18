import { describe, expect, it } from 'vitest';
import { switchOn, switchOff, sensorRise } from './self-induction-lab';
describe('textbook self-induction circuits', () => {
  it('satisfies the resistor network initially and reaches calibrated equal light', () => {
    expect(switchOn(0).iCoil).toBe(0);
    expect(switchOn(0).iControl).toBeCloseTo(2 / 3, 12);
    expect(switchOn(20).iCoil).toBeCloseTo(0.6, 10);
    expect(switchOn(20).pCoil).toBeCloseTo(switchOn(20).pControl, 10);
    expect(sensorRise(0, 0)).toBe(0.75);
  });
  it('keeps coil current continuous but reverses load current on opening', () => {
    const before = switchOff(-0.001),
      after = switchOff(0);
    expect(before.iCoil).toBe(after.iCoil);
    expect(after.iLoad).toBe(-after.iCoil);
    expect(before.iLoad).toBeGreaterThan(0);
  });
  it('predicts a flash only when winding resistance is below lamp resistance', () => {
    expect(switchOff(0, 2).loadPower).toBeGreaterThan(switchOff(-0.1, 2).loadPower);
    expect(switchOff(0, 10).loadPower).toBeLessThan(switchOff(-0.1, 10).loadPower);
  });
  it('converts stored magnetic energy into both resistor losses', () => {
    const t = 0.3,
      e = 1e-6,
      a = switchOff(t);
    const energyRate = (switchOff(t + e).energy - switchOff(t - e).energy) / (2 * e);
    expect(-energyRate).toBeCloseTo(a.loadPower + a.windingPower, 6);
    expect(switchOff(50).energy).toBeCloseTo(0, 10);
  });
});
