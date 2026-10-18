import { describe, it, expect } from 'vitest';
import {
  extracellularTracer,
  temperatureSummary,
  thermalRegulation,
  waterRegulation,
  sodiumRegulation,
} from './bio-body-fluid-balance';
describe('body-fluid and survey models', () => {
  it('closes sodium balance and retains more sodium with its response', () => {
    const f = sodiumRegulation(10);
    expect(f.sodium - 1).toBeCloseTo(f.intake - f.externalLoss - f.urineTotal, 10);
    expect(f.sodium).toBeGreaterThan(sodiumRegulation(10, 1, false).sodium);
    expect(sodiumRegulation(10, 0).sodium).toBe(1);
  });
  it('conserves tracer amount through blood, tissue and lymph', () => {
    for (const t of [0, 1, 10, 40]) {
      const f = extracellularTracer(t);
      expect(f.total).toBeCloseTo(1, 12);
      expect(f.amount.every((m) => m >= 0)).toBe(true);
    }
    expect(extracellularTracer(40, false).amount[2]).toBe(0);
  });
  it('summarizes actual records without filling absent observations', () => {
    expect(temperatureSummary([36, 37, 38])).toEqual({ count: 3, mean: 37, range: 2 });
    expect(temperatureSummary([null, 36, null])).toEqual({ count: 1, mean: 36, range: 0 });
    expect(temperatureSummary([null])).toEqual({ count: 0, mean: null, range: null });
  });
  it('closes the thermal balance and exposes loss of feedback', () => {
    const f = thermalRegulation(12);
    expect(f.deviation).toBeCloseTo(f.input - f.removed, 10);
    expect(f.deviation).toBeLessThan(thermalRegulation(12, 1, false).deviation);
    expect(thermalRegulation(8, 0).deviation).toBe(0);
    expect(thermalRegulation(3).drive).toBeGreaterThan(0);
    expect(thermalRegulation(4).drive).toBe(0);
  });
  it('accounts for every water input and output without inventing water via ADH', () => {
    const f = waterRegulation(10);
    expect(f.water - 1).toBeCloseTo(f.intakeTotal - f.lossTotal - f.urineTotal, 10);
    expect(f.water).toBeGreaterThan(waterRegulation(10, 1, false).water);
    expect(waterRegulation(10, 0).water).toBe(1);
  });
});
