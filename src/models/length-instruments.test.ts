import { describe, it, expect } from 'vitest';
import {
  vernierReading,
  micrometerReading,
  micrometerContact,
  accumulatedWire,
} from './length-instruments';
describe('measurement geometry and readings', () => {
  it('reproduces the textbook 23.7mm vernier example with the seventh alignment', () => {
    const s = vernierReading(23.7);
    expect(s.main).toBe(23);
    expect(s.aligned).toBe(7);
    expect(s.fraction).toBe(0.7);
    expect(s.main + s.fraction).toBe(23.7);
    expect(s.indicated + s.aligned * s.vernierPitch).toBeCloseTo(30, 12);
  });
  it('derives least counts from actual pitch differences and carries boundaries', () => {
    for (const n of [10, 20, 50] as const) {
      const s = vernierReading(9.999, n);
      expect(1 - s.vernierPitch).toBeCloseTo(1 / n, 14);
      expect(s.main).toBe(10);
      expect(s.aligned).toBe(0);
    }
  });
  it('reproduces 6.5 + 22.5 × 0.01 = 6.725mm including the estimated half division', () => {
    const s = micrometerReading(6.725);
    expect(s.sleeve).toBe(6.5);
    expect(s.thimble).toBeCloseTo(22.5, 12);
    expect(s.corrected).toBe(6.725);
    expect(micrometerReading(0.5).angle).toBeCloseTo(2 * Math.PI, 12);
  });
  it('subtracts zero error and blocks specimen penetration', () => {
    expect(micrometerReading(0.105, 0.03).corrected).toBeCloseTo(0.105, 14);
    expect(micrometerContact(0.02, 0.075).opening).toBe(0.075);
    expect(micrometerContact(0.02, 0.075).contact).toBe(true);
    expect(micrometerContact(0.02, 0.075).slipTurns).toBeGreaterThan(0);
  });
  it('reduces a fixed total-length reading bound but exposes packing-gap bias', () => {
    expect(accumulatedWire(10).span).toBe(13);
    expect(accumulatedWire(10).diameterError).toBe(0.01);
    expect(accumulatedWire(1).diameterError).toBe(0.1);
    expect(accumulatedWire(10, 1.3, 0.1).bias).toBeCloseTo(0.09, 12);
  });
});
