import { describe, it, expect } from 'vitest';
import {
  vernierReading,
  micrometerReading,
  micrometerContact,
  accumulatedWire,
  lengthFilmState,
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
  it('keeps exact contact stable across floating-point subtraction without hiding a visible gap', () => {
    expect(micrometerContact(0.4 - 0.295, 0.105)).toEqual({
      opening: 0.105,
      contact: true,
      slipTurns: 0,
    });
    expect(micrometerContact(0.106, 0.105).contact).toBe(false);
  });
  it('reduces a fixed total-length reading bound but exposes packing-gap bias', () => {
    expect(accumulatedWire(10).span).toBe(13);
    expect(accumulatedWire(10).diameterError).toBe(0.01);
    expect(accumulatedWire(1).diameterError).toBe(0.1);
    expect(accumulatedWire(10, 1.3, 0.1).bias).toBeCloseTo(0.09, 12);
  });
});

describe('retained narration and causal shot timing', () => {
  it('settles the example before the half-millimetre and estimated-digit explanation', () => {
    for (const locale of ['zh', 'en'] as const) {
      const s = lengthFilmState(4, 2.5, locale);
      expect(micrometerContact(s.opening, s.object).opening).toBe(6.725);
      expect(lengthFilmState(3, 11, locale).opening).toBe(1.5);
    }
  });
  it('keeps zero evidence, then inserts paper, contacts it and subtracts the same zero', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(lengthFilmState(5, 6, locale).object).toBe(0);
      const s = lengthFilmState(5, 14, locale),
        contact = micrometerContact(s.opening, s.object);
      expect(contact.contact).toBe(true);
      expect(micrometerReading(contact.opening, s.zeroError).corrected).toBeCloseTo(0.105, 14);
    }
  });
  it('holds ten tight turns through the uncertainty explanation before revealing gap bias', () => {
    for (const locale of ['zh', 'en'] as const) {
      const tight = lengthFilmState(6, 18, locale),
        loose = lengthFilmState(6, 24, locale);
      expect(tight.turns).toBe(10);
      expect(tight.gap).toBe(0);
      expect(loose.turns).toBe(10);
      expect(accumulatedWire(loose.turns, 1.3, loose.gap).bias).toBeCloseTo(0.09);
      expect(lengthFilmState(6, 0, locale).turns).toBe(1);
    }
  });
});
