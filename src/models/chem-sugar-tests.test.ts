import { describe, it, expect } from 'vitest';
import {
  sugarHydrolysis,
  sugarReduction,
  sugarSolubility,
  sugarDirector,
} from './chem-sugar-tests';
describe('sugar evidence', () => {
  it('conserves atoms in endpoint mixtures including polymer end groups', () => {
    for (const s of ['glucose', 'sucrose', 'maltose', 'starch', 'cellulose'] as const)
      for (const p of [0, 0.3, 1]) {
        const m = sugarHydrolysis(s, p);
        expect(m.atoms.C).toBeCloseTo(m.initial.C);
        expect(m.atoms.H).toBeCloseTo(m.initial.H + 2 * m.waterUsed);
        expect(m.atoms.O).toBeCloseTo(m.initial.O + m.waterUsed);
      }
  });
  it('distinguishes hydrolysis products and free reducing ends', () => {
    expect(sugarHydrolysis('sucrose', 0).reducing).toBe(0);
    expect(sugarHydrolysis('maltose', 0).reducing).toBe(0.5);
    expect(sugarHydrolysis('sucrose', 1).glucose).toBe(1);
    expect(sugarHydrolysis('sucrose', 1).fructose).toBe(1);
    expect(sugarHydrolysis('maltose', 1).glucose).toBe(2);
    expect(sugarHydrolysis('starch', 0).reducing).toBe(0.001);
  });
  it('conserves metal and two-electron equivalents under reagent limits', () => {
    for (const test of ['copper', 'silver'] as const)
      for (const a of [0, 0.2, 1, 3])
        for (const metal of [0, 1, 2, 4])
          for (const p of [0, 0.3, 1]) {
            const m = sugarReduction('glucose', 0, p, test, true, true, a, metal);
            expect(m.metalRemaining + m.metalReduced).toBeCloseTo(metal);
            expect(m.remainingReducing + m.extent).toBeCloseTo(a);
            expect(m.electrons).toBe(m.metalReduced);
            expect(m.extent).toBeLessThanOrEqual(a);
          }
  });
  it('rejects an acidic test rather than interpreting it as negative', () => {
    expect(sugarReduction('starch', 1, 1, 'copper', false).valid).toBe(false);
    expect(sugarReduction('starch', 1, 1, 'copper', false).extent).toBe(0);
    expect(sugarReduction('glucose', 0, 1, 'copper', true, false).extent).toBe(0);
    expect(sugarReduction('starch', 0, 1).visible).toBe(false);
    expect(sugarReduction('starch', 1, 1).visible).toBe(true);
  });
  it('allows starch and reducing sugar evidence to coexist after partial hydrolysis', () => {
    const m = sugarHydrolysis('starch', 0.5);
    expect(m.iodine).toBe(0.5);
    expect(sugarReduction('starch', 0.5, 1).visible).toBe(true);
    expect(sugarSolubility('starch', 1, false).gel).toBe(0);
    expect(sugarSolubility('starch', 1, true).gel).toBe(1);
    expect(sugarDirector(11, 0).hydrolysis).toBe(1);
  });
});
