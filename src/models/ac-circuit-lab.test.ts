import { describe, expect, it } from 'vitest';
import {
  sinusoidalCircuit,
  capacitorCharging,
  generatorLeds,
  lcOscillation,
  inductorCharging,
  reactiveCircuitState,
  acFilmState,
  lcExchangeCycle,
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
  it('RL turn-on opposes the change, then leaves steady current limited by resistance', () => {
    const start = inductorCharging(0),
      atTau = inductorCharging(0.04 / 8),
      settled = inductorCharging(0.1);
    expect(start.current).toBe(0);
    expect(start.backEmf).toBe(-3);
    expect(atTau.current).toBeCloseTo((3 / 8) * (1 - Math.exp(-1)), 12);
    expect(settled.current).toBeCloseTo(3 / 8, 8);
    expect(settled.backEmf).toBeCloseTo(0, 7);
  });
  it('the plate charge and field use the same passive-sign phasor current and Kirchhoff loop', () => {
    const h = 1e-7;
    for (const kind of ['inductor', 'capacitor'] as const)
      for (const f of [10, 50, 200])
        for (const phase of [0.2, 1.4, 3.7, 5.2]) {
          const value = kind === 'inductor' ? 0.04 : 0.0001,
            s = reactiveCircuitState(kind, f, value, phase),
            next = reactiveCircuitState(kind, f, value, phase + 2 * Math.PI * f * h),
            previous = reactiveCircuitState(kind, f, value, phase - 2 * Math.PI * f * h);
          expect(s.voltage).toBeCloseTo(s.resistance * s.current + s.componentVoltage, 10);
          if (kind === 'capacitor')
            expect((next.charge - previous.charge) / (2 * h)).toBeCloseTo(s.current, 7);
          else
            expect(s.backEmf).toBeCloseTo(
              (-value * (next.current - previous.current)) / (2 * h),
              6,
            );
        }
  });
  it('LC arrows use positive discharge current: I=-dq/dt even with damping', () => {
    for (const R of [0, 1, 4, 2 * Math.sqrt(0.2 / 0.001), 100])
      for (const time of [0.001, 0.02, 0.071]) {
        const h = 1e-7,
          a = lcOscillation(time, 0.2, 0.001, R),
          b = lcOscillation(time + h, 0.2, 0.001, R),
          c = lcOscillation(time - h, 0.2, 0.001, R);
        expect(-(b.q - c.q) / (2 * h)).toBeCloseTo(a.current, 8);
        expect(a.electric + a.magnetic + a.heat).toBeCloseTo(a.initial, 12);
      }
  });
  it('holds the ideal zero-voltage bridge and reverse charge without changing the physics', () => {
    expect(lcExchangeCycle(0.35)).toBe(0.25);
    expect(lcExchangeCycle(0.45)).toBe(0.25);
    expect(lcExchangeCycle(17.1 / 28)).toBe(0.5);
    const s = acFilmState(10, 0.35),
      period = 2 * Math.PI * Math.sqrt(0.2 * 0.001),
      q = lcOscillation(s.cycles * period, 0.2, 0.001, s.resistance);
    expect(s.resistance).toBe(0);
    expect(q.voltage).toBeCloseTo(0, 10);
    expect(q.current).toBeGreaterThan(0);
    expect(q.magnetic).toBeCloseTo(q.initial, 12);
    expect(acFilmState(11, 0.5).resistance).toBe(1);
  });
  it('holds measured bilingual zero-voltage claims and changes frequency with the spoken comparison', () => {
    for (const [locale, times] of [
      ['zh', [9.2, 12.9, 18.6, 23.3]],
      ['en', [9.9, 14.2, 22.3, 24.6]],
    ] as const) {
      for (const time of times) {
        const state = acFilmState(10, time / 28, locale),
          sample = lcOscillation(
            state.cycles * 2 * Math.PI * Math.sqrt(0.2 * 0.001),
            0.2,
            0.001,
            0,
          );
        expect(sample.voltage).toBeCloseTo(0, 9);
        expect(sample.magnetic).toBeCloseTo(sample.initial, 12);
      }
    }
    expect(acFilmState(5, 13 / 23).frequency).toBe(50);
    expect(acFilmState(5, 17.5 / 23).frequency).toBe(100);
    expect(acFilmState(8, 3 / 25.5).frequency).toBe(50);
    expect(acFilmState(8, 7.5 / 25.5).frequency).toBe(100);
  });
});
