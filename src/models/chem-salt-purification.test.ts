import { describe, it, expect } from 'vitest';
import { saltPurification, sulfateCompletionProbe, type SaltRoute } from './chem-salt-purification';
describe('salt purification inventory', () => {
  it('conserves charge and each tracked element across doses, separation and neutralisation', () => {
    for (const route of [
      'textbook',
      'acid-first',
      'no-carbonate',
      'too-little-barium',
    ] as SaltRoute[])
      for (let step = 0; step < 8; step++)
        for (const p of [0, 0.25, 0.65, 1]) {
          const s = saltPurification(step, p, route);
          expect(s.charge).toBeCloseTo(0, 10);
          expect(s.balances.Ca).toBeCloseTo(1);
          expect(s.balances.Mg).toBeCloseTo(1);
          expect(s.balances.Ba).toBeCloseTo(s.bariumAdded);
          expect(s.balances.S).toBeCloseTo(0.8);
          expect(s.balances.C).toBeCloseTo(s.carbonateAdded);
          expect(s.balances.Na).toBeCloseTo(21.6 + s.baseAdded + 2 * s.carbonateAdded);
          expect(s.balances.Cl).toBeCloseTo(24 + 2 * s.bariumAdded + s.acidAdded);
          for (const n of [
            ...Object.values(s.ions),
            ...Object.values(s.solids),
            ...Object.values(s.removed),
          ])
            expect(n).toBeGreaterThanOrEqual(-1e-12);
        }
  });
  it('matches independent textbook-route arithmetic', () => {
    const s = saltPurification(7, 1);
    expect(s.removed).toEqual({ BaSO4: 0.8, MgOH2: 1, CaCO3: 1, BaCO3: 1 - 0.8, sand: 0.3 });
    expect(s.acidAdded).toBeCloseTo(1.2);
    expect(s.CO2).toBeCloseTo(0.4);
    expect(s.ions.Na).toBeCloseTo(27.2);
    expect(s.ions.Cl).toBeCloseTo(27.2);
    expect(s.pureSaltEligible).toBe(true);
  });
  it('acid before filtration returns precipitated ions to solution', () => {
    const s = saltPurification(7, 1, 'acid-first');
    expect(s.ions.Ca).toBeCloseTo(1);
    expect(s.ions.Mg).toBeCloseTo(1);
    expect(s.ions.Ba).toBeCloseTo(0.2);
    expect(s.removed.BaSO4).toBeCloseTo(0.8);
    expect(s.pureSaltEligible).toBe(false);
    expect(s.acidAdded).toBeCloseTo(5.6);
  });
  it('evaporation cannot fix missed precipitation and probe detects sulfate left', () => {
    const deficient = saltPurification(2, 1, 'too-little-barium');
    expect(sulfateCompletionProbe(deficient.ions.SO4)).toBeCloseTo(0.08);
    expect(sulfateCompletionProbe(saltPurification(2, 1).ions.SO4)).toBe(0);
    expect(saltPurification(7, 1, 'no-carbonate').ions.Ca).toBe(1);
    expect(saltPurification(7, 1, 'too-little-barium').ions.SO4).toBeCloseTo(0.25);
  });
  it('clamps chapter and fraction and deterministically reconstructs seeks', () => {
    expect(saltPurification(99, 3)).toEqual(saltPurification(7, 1));
    expect(saltPurification(4, 0.5)).toEqual(saltPurification(4, 0.5));
    expect(saltPurification(7, -1).waterRemaining).toBe(1);
  });
});
