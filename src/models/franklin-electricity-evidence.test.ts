import { describe, it, expect } from 'vitest';
import { evidenceCharge } from './franklin-electricity-evidence';
describe('historical-evidence teaching model', () => {
  it('conserves charge on the two capacitor conductors', () => {
    const s = evidenceCharge(800, 2);
    expect(s.charge + s.outerCharge).toBe(0);
    expect(s.charge).toBeCloseTo(8e-7 * (1 - Math.exp(-2)), 16);
  });
  it('does not infer charge sign from leaf opening', () => {
    const p = evidenceCharge(800, 3),
      n = evidenceCharge(-800, 3);
    expect(p.angle).toBe(n.angle);
    expect(p.energy).toBe(n.energy);
    expect(p.charge).toBe(-n.charge);
  });
  it('has no opening or stored energy without charging', () => {
    const s = evidenceCharge(0, 4);
    expect(s.angle).toBeLessThan(1e-10);
    expect(s.energy).toBe(0);
  });
  it('discharges continuously through the same capacitance', () => {
    const s = evidenceCharge(800, 0.8, true);
    expect(s.charge).toBeCloseTo(8e-7 / Math.E, 16);
    expect(evidenceCharge(800, 4, true).angle).toBeLessThan(s.angle);
    expect(() => evidenceCharge(1, -1)).toThrow();
  });
});
