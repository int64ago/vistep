import { describe, it, expect } from 'vitest';
import { dewSaturation, dewTemperature, dewState, dewShot } from './dew-point';
describe('dewpoint and constant-pressure water balance', () => {
  it('matches published NIST saturation values and independent inverse targets', () => {
    for (const [t, p] of [
      [20, 2339],
      [40, 7384],
      [50, 12351],
      [100, 101418],
    ])
      expect(Math.abs(dewSaturation(t) - p)).toBeLessThan(0.51);
    expect(dewTemperature(2339)).toBeCloseTo(20, 2);
    expect(dewTemperature(7384)).toBeCloseTo(40, 2);
  });
  it('changes condensation condition continuously at the dewpoint, not a preset visible threshold', () => {
    const p = dewState().point;
    expect(dewState({ temperature: p + 0.01 }).condenses).toBe(false);
    expect(dewState({ temperature: p - 0.01 }).condenses).toBe(true);
    expect(dewState({ temperature: p }).liquid).toBeCloseTo(0, 12);
    expect(dewState({ humidity: 1 }).point).toBeCloseTo(30, 12);
  });
  it('warming at fixed water ratio and pressure changes RH without changing dewpoint', () => {
    const a = dewShot(3, 0),
      b = dewShot(3, 1),
      x = dewState(a),
      y = dewState(b);
    expect(x.vapor).toBeCloseTo(y.vapor, 10);
    expect(x.total).toBeCloseTo(y.total, 12);
    expect(x.point).toBeCloseTo(y.point, 12);
    expect(y.humidity).toBeLessThan(x.humidity);
  });
  it('conserves water exactly and remains saturated after cooling below dewpoint', () => {
    const warm = dewState({ temperature: 25 }),
      cold = dewState({ temperature: 5 });
    expect(warm.liquid).toBe(0);
    expect(warm.parcelVapor).toBeCloseTo(warm.vapor, 10);
    expect(cold.parcelHumidity).toBeCloseTo(1, 12);
    expect(cold.gas + cold.liquid).toBeCloseTo(cold.total, 14);
    expect(cold.gas).toBeCloseTo((0.62198 * 872.5) / (101325 - 872.5), 5);
    expect(cold.liquid).toBeGreaterThan(0);
  });
  it('reheating retained condensate reverses phase allocation without inventing water', () => {
    const states = [0, 5, 10, 20, 30].map((temperature) => dewState({ temperature }));
    for (let i = 1; i < states.length; i++) {
      expect(states[i].liquid).toBeLessThanOrEqual(states[i - 1].liquid);
      expect(states[i].total).toBe(states[0].total);
    }
    expect(states.at(-1)!.liquid).toBe(0);
    expect(states.at(-1)!.humidity).toBe(0.5);
  });
  it('rejects unsupported subfreezing/supersaturated initial states and responds to pressure', () => {
    expect(() => dewState({ temperature: -1 })).toThrow();
    expect(() => dewState({ humidity: 1.1 })).toThrow();
    expect(() => dewTemperature(100)).toThrow();
    expect(dewState({ pressure: 80000 }).point).toBe(dewState({ pressure: 101325 }).point);
    expect(dewState({ pressure: 80000 }).total).toBeGreaterThan(
      dewState({ pressure: 101325 }).total,
    );
  });
});
