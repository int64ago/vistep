import { describe, it, expect } from 'vitest';
import {
  solutionPreparation,
  flaskLevel,
  mixingLayers,
  preparationDirector,
} from './chem-solution-preparation';
describe('quantitative preparation', () => {
  it('reproduces the textbook 100 mL, 1.00 M recipe and 50 mL dilution', () => {
    const m = solutionPreparation();
    expect(m.targetMass).toBeCloseTo(5.85);
    expect(m.concentration).toBeCloseTo(1);
    expect(solutionPreparation(5.85, 1, 100, 50).concentration).toBeCloseTo(0.5);
  });
  it('conserves solute across transfer and gives correct directions of error', () => {
    const m = solutionPreparation(5.85, 0.96, 100);
    expect(m.inputMoles).toBeCloseTo(m.deliveredMoles + m.residueMoles);
    expect(m.concentration).toBeCloseTo(0.96);
    expect(solutionPreparation(5.85, 1, 101).concentration).toBeLessThan(1);
    expect(solutionPreparation(5.85, 1, 99).concentration).toBeGreaterThan(1);
  });
  it('calibrates geometry at the line and raises the level when volume increases', () => {
    expect(flaskLevel(100)).toBeCloseTo(100, 4);
    expect(flaskLevel(99)).toBeGreaterThan(flaskLevel(100));
    expect(flaskLevel(101)).toBeLessThan(100);
  });
  it('mixing changes local concentrations without changing their volume-weighted mean', () => {
    for (const mixing of [0, 0.3, 1])
      expect(mixingLayers(1, mixing).reduce((a, b) => a + b) / 10).toBeCloseTo(1);
    expect(new Set(mixingLayers(0.5, 1)).size).toBe(1);
    expect(preparationDirector(2, 1).recovery).toBe(1);
  });
});
