import { describe, it, expect } from 'vitest';
import {
  carbonateHeating,
  carbonateDissolving,
  carbonateDirector,
} from './chem-carbonate-comparison';
describe('carbonate comparison', () => {
  it('conserves mass throughout balanced bicarbonate decomposition', () => {
    for (const x of [0, 0.2, 0.8, 1]) {
      const s = carbonateHeating('bicarbonate', 1, x);
      expect(s.residueGrams + s.waterGrams + s.carbonDioxideGrams).toBeCloseTo(1, 10);
    }
  });
  it('independently matches the 168 g to 106 g school stoichiometric benchmark', () => {
    const s = carbonateHeating('bicarbonate', 1, 1);
    expect(s.residueGrams).toBeCloseTo(106 / 168, 3);
    expect(s.gasMoles).toBeCloseTo(1 / (2 * 84.0066), 12);
    expect(s.waterGrams / s.carbonDioxideGrams).toBeCloseTo(18.0153 / 44.0091, 12);
  });
  it('retains carbonate under lesson heating and handles no material', () => {
    expect(carbonateHeating('carbonate', 1, 1).residueGrams).toBe(1);
    expect(carbonateHeating('carbonate', 1, 1).gasMoles).toBe(0);
    expect(carbonateHeating('bicarbonate', 0, 1).gasMoles).toBe(0);
  });
  it('does not dissolve unlimited bicarbonate in the supplied small water amount', () => {
    expect(carbonateDissolving('bicarbonate', 1).residualGrams).toBeGreaterThan(0.5);
    expect(carbonateDissolving('carbonate', 1).residualGrams).toBe(0);
    expect(carbonateDirector(2, 1).extent).toBe(0);
  });
});
