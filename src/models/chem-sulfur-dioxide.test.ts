import { describe, it, expect } from 'vitest';
import {
  sulfurDissolution,
  sulfurDye,
  sulfurDioxideDirector,
  sulfurAcidityProbe,
} from './chem-sulfur-dioxide';
describe('sulfur dioxide observations', () => {
  it('solves both hydrostatic and ideal-gas balances independently', () => {
    for (const p of [0.01, 0.2, 0.5, 0.9, 0.999]) {
      const m = sulfurDissolution(p);
      expect((m.pressure! * m.volumeFraction) / m.initialPressure).toBeCloseTo(1 - p, 12);
      expect(m.externalPressureAtMouth - m.pressure!).toBeCloseTo(998.2 * 9.80665 * m.rise, 8);
    }
  });
  it('handles the sealed control, endpoints and total sulfur inventory', () => {
    expect(sulfurDissolution(1, true).rise).toBe(0);
    expect(sulfurDissolution(1, true).acidic).toBe(false);
    expect(sulfurDissolution(0).volumeFraction).toBe(1);
    expect(sulfurDissolution(1).volumeFraction).toBe(0);
    expect(sulfurDissolution(1).pressure).toBeNull();
    for (let i = 0; i <= 100; i++) {
      const m = sulfurDissolution(i / 100);
      expect(m.gasUnits + m.aqueousUnits).toBe(24);
      expect(m.remaining + m.dissolved).toBe(1);
    }
    expect(sulfurDissolution(NaN).extent).toBe(0);
  });
  it('retains dye identity across bleaching and heating while separating the unheated control', () => {
    expect(sulfurDye(1, 0).coloured).toBe(0);
    expect(sulfurDye(1, 1).coloured).toBe(1);
    for (const b of [0, 0.3, 1])
      for (const r of [0, 0.4, 1]) {
        const m = sulfurDye(b, r);
        expect(m.coloured + m.colourless).toBe(1);
        expect(m.units.map((u) => u.id)).toEqual(Array.from({ length: 24 }, (_, i) => i));
      }
    expect(sulfurDye(0, 1).coloured).toBe(1);
  });
  it('shows dye addition before fading and keeps watch states deterministic', () => {
    expect(sulfurDioxideDirector(2, 0.1).added).toBe(false);
    expect(sulfurDioxideDirector(2, 0.3).bleaching).toBeLessThan(0.1);
    expect(sulfurDioxideDirector(2, 1).bleaching).toBe(1);
    expect(sulfurDioxideDirector(3, 1).recovery).toBe(1);
    expect(sulfurDioxideDirector(4, 0.5).heating).toBe(false);
  });
});

it('lifts the indicator probe through the mouth and colours paper only after contact', () => {
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000,
      probe = sulfurAcidityProbe(p);
    if (probe.x > 95 && probe.x < 120) expect(probe.y).toBeLessThan(50);
    if (p < 0.7) expect(probe.contacted).toBe(false);
    if (i) {
      const before = sulfurAcidityProbe((i - 1) / 1000);
      expect(Math.hypot(probe.x - before.x, probe.y - before.y)).toBeLessThan(1);
      expect(Math.hypot(probe.endX - before.endX, probe.endY - before.endY)).toBeLessThan(3);
    }
  }
  expect(sulfurAcidityProbe(0).y).toBeGreaterThan(136);
  expect(sulfurAcidityProbe(0.75)).toMatchObject({ x: 232, y: 134, contacted: true });
});
