import { describe, it, expect } from 'vitest';
import {
  BANK_DATA,
  CHARGE_DATA,
  ORANGE_DATA,
  drySamples,
  fitSource,
  fruitSamples,
  loadedSource,
  parallelLamps,
  regulatedBank,
} from './battery-emf-lab';
describe('source measurement and bounded output models', () => {
  it('balances source energy with terminal and internal dissipation', () => {
    const s = loadedSource(3, 1, 5, 10000, 0.1);
    expect(s.voltage + s.internalDrop).toBeCloseTo(3, 13);
    expect(s.sourcePower).toBeCloseTo(s.internalPower + s.voltage * s.totalCurrent, 13);
  });
  it('reduces each parallel lamp power only when internal resistance matters', () => {
    expect(parallelLamps(4).lampPower).toBeLessThan(parallelLamps(1).lampPower);
    expect(parallelLamps(4, 0).lampPower).toBe(parallelLamps(1, 0).lampPower);
  });
  it('matches the analytic apparent intercept and slope including voltmeter load', () => {
    const fit = fitSource(drySamples(1, 10000));
    expect(fit.emf).toBeCloseTo(1.5 / (1 + 1 / 10000), 12);
    expect(fit.internal).toBeCloseTo(1 / (1 + 1 / 10000), 12);
  });
  it('infers fruit current from known resistance but retains voltmeter loading', () => {
    const f = fitSource(fruitSamples(1800, 1e7));
    expect(f.emf).toBeCloseTo(0.95 / (1 + 1800 / 1e7), 12);
    expect(f.internal).toBeCloseTo(1800 / (1 + 1800 / 1e7), 8);
  });
  it('subtracts the series ammeter resistance from the orange-cell fit', () => {
    const f = fitSource(ORANGE_DATA);
    expect(f.emf).toBeGreaterThan(0.94);
    expect(f.emf).toBeLessThan(0.96);
    expect(f.internal - 100).toBeGreaterThan(1150);
    expect(f.internal - 100).toBeLessThan(1250);
  });
  it('reproduces textbook bank data fit without treating it as a bare cell', () => {
    const f = fitSource(BANK_DATA);
    expect(f.emf).toBeCloseTo(5.067, 2);
    expect(f.internal).toBeCloseTo(0.1056, 2);
    expect(CHARGE_DATA[5].bankE).toBeGreaterThan(5);
    expect(CHARGE_DATA[5].cellE).toBeLessThan(CHARGE_DATA[0].cellE);
  });
  it('makes current-limited operation a counterexample to global E-r extrapolation', () => {
    const s = regulatedBank(0.8);
    expect(s.limited).toBe(true);
    expect(s.current).toBe(2);
    expect(s.voltage).toBe(1.6);
    expect(s.voltage).not.toBeCloseTo(s.extrapolatedVoltage, 1);
    expect(() =>
      fitSource([
        { current: 1, voltage: 1 },
        { current: 1, voltage: 2 },
      ]),
    ).toThrow();
  });
});
