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

import {
  glucoseRingOpening,
  glucoseTestSequence,
  glucoseOxidationAccount,
} from './chem-sugar-tests';
describe('traceable glucose principle', () => {
  it('preserves every carbon/oxygen identity and keeps the six-carbon chain intact', () => {
    for (let k = 0; k <= 200; k++) {
      const m = glucoseRingOpening(k / 200);
      expect(m.atoms.map((a) => a.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'O5', 'O1']);
      expect(m.formula).toBe('C6H12O6');
      expect(m.ringBond + m.carbonyl).toBeCloseTo(1);
      for (let i = 0; i < m.atoms.length; i++)
        for (let j = 0; j < i; j++) {
          const a = m.atoms[i],
            b = m.atoms[j];
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(35);
        }
    }
    expect(glucoseRingOpening(0).ringBond).toBe(1);
    expect(glucoseRingOpening(1).ringBond).toBe(0);
    expect(glucoseRingOpening(1).carbonyl).toBe(1);
  });
  it('balances the alkaline half reaction, independently of either metal reagent', () => {
    for (const x of [0, 0.125, 1, 4]) {
      const a = glucoseOxidationAccount(x);
      // RCHO + 3 OH− -> RCOO− + 2 H2O + 2 e−, excluding unchanged R.
      expect(x + a.hydroxideUsed).toBeCloseTo(2 * a.carboxylate + a.waterProduced); // O
      expect(x + a.hydroxideUsed).toBeCloseTo(2 * a.waterProduced); // H
      expect(-a.hydroxideUsed).toBeCloseTo(-a.carboxylate - a.electrons); // charge
      expect(a.electrons).toBe((a.carbonOxidationAfter - a.carbonOxidationBefore) * x);
    }
  });
  it('predicts reagent limitation and invalid/no-sample counterexamples', () => {
    const m = sugarReduction('glucose', 0, 1, 'silver', true, true, 2, 1);
    expect(m.silver).toBe(1);
    expect(m.remainingReducing).toBe(1.5);
    expect(sugarReduction('glucose', 0, 1, 'copper', true, true, 0, 2).copperOxide).toBe(0);
    expect(sugarReduction('glucose', 0, 1, 'copper', true, true, 2, 0).copperOxide).toBe(0);
    expect(sugarReduction('sucrose', 0, 1, 'copper').extent).toBe(0);
    expect(sugarReduction('maltose', 0, 1, 'copper').extent).toBe(0.5);
    expect(sugarReduction('sucrose', 1, 1, 'copper').extent).toBe(1);
  });
  it('reconstructs the same storyboard at arbitrary forward/backward seeks', () => {
    for (const p of [0, 0.24, 0.62, 0.94, 1, 0.62, 0.24, 0]) {
      const a = glucoseTestSequence(p);
      expect(a.opening).toBeGreaterThanOrEqual(0);
      expect(a.opening).toBeLessThanOrEqual(1);
      if (a.oxidation > 0) expect(a.opening).toBe(1);
      expect(JSON.stringify(a)).toBe(JSON.stringify(glucoseTestSequence(p)));
    }
  });
});
