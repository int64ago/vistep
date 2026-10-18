import { describe, expect, it } from 'vitest';
import {
  sinusoidalCircuit,
  capacitorCharging,
  generatorLeds,
  lcOscillation,
} from './ac-circuit-lab';
describe('AC and LC textbook circuits', () => {
  it('compares equal RMS supply, increases inductive impedance and reduces capacitive impedance with frequency', () => {
    expect(sinusoidalCircuit('inductor', 50, 0.04, 0, true).currentRms).toBe(0.375);
    expect(sinusoidalCircuit('inductor', 100).currentRms).toBeLessThan(
      sinusoidalCircuit('inductor', 50).currentRms,
    );
    expect(sinusoidalCircuit('capacitor', 100).currentRms).toBeGreaterThan(
      sinusoidalCircuit('capacitor', 50).currentRms,
    );
    expect(sinusoidalCircuit('capacitor', 50, 0.0001, 0, true).currentRms).toBe(0);
    expect(capacitorCharging(1).current).toBeCloseTo(0, 12);
  });
  it('illuminates only one antiparallel LED at each polarity', () => {
    expect(generatorLeds(Math.PI / 2).forward).toBeCloseTo(0.022, 12);
    expect(generatorLeds(Math.PI / 2).reverse).toBe(0);
    expect(generatorLeds(-Math.PI / 2).reverse).toBeCloseTo(0.022, 12);
  });
  it('matches ideal LC period and energy exchange independently', () => {
    const start = lcOscillation(0, 0.2, 0.001, 0),
      quarter = lcOscillation(start.period / 4, 0.2, 0.001, 0);
    expect(start.period).toBeCloseTo(0.08885765876, 10);
    expect(quarter.voltage).toBeCloseTo(0, 10);
    expect(quarter.magnetic).toBeCloseTo(start.initial, 12);
  });
  it('loses energy at RI² and handles overdamped circuits', () => {
    const t = 0.03,
      e = 1e-7,
      a = lcOscillation(t),
      b = lcOscillation(t + e),
      c = lcOscillation(t - e);
    expect(-(b.electric + b.magnetic - (c.electric + c.magnetic)) / (2 * e)).toBeCloseTo(
      a.powerLoss,
      7,
    );
    expect(lcOscillation(2, 0.01, 0.01, 100).voltage).toBeGreaterThan(0);
    expect(lcOscillation(0).current).toBe(0);
  });
});
