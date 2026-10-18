import { describe, it, expect } from 'vitest';
import {
  decaySample,
  remainingAtoms,
  tracerCompartments,
  carbonDate,
  C14_HALF_YEARS,
} from './decay-measurement';
describe('decay measurements', () => {
  it('samples exponential lifetimes deterministically without per-frame resampling', () => {
    const a = decaySample(100000, 23);
    expect(remainingAtoms(a, 0)).toBe(a.length);
    expect(remainingAtoms(a, 1) / a.length).toBeCloseTo(0.5, 2);
    expect(remainingAtoms(a, 2) / a.length).toBeCloseTo(0.25, 2);
    expect(decaySample(5, 3)).toEqual(decaySample(5, 3));
  });
  it('conserves tracer population apart from radioactive decay', () => {
    for (let t = 0; t < 50; t++) {
      const x = tracerCompartments(t);
      expect(x.soil + x.root + x.leaf).toBeCloseTo(x.total, 12);
      expect(x.leaf).toBeGreaterThanOrEqual(0);
      expect(x.uptakeFraction).toBeGreaterThanOrEqual(0);
    }
  });
  it('inverts ideal carbon decay and exposes modern contamination bias', () => {
    expect(carbonDate(C14_HALF_YEARS, 0).measured).toBe(0.5);
    expect(carbonDate(12345, 0).apparentYears).toBeCloseTo(12345);
    expect(carbonDate(20000, 0.1).apparentYears).toBeLessThan(20000);
  });
});
