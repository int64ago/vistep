import { describe, it, expect } from 'vitest';
import {
  ironThiocyanate,
  ironRedox,
  IRON_SCN_K1,
  IRON_SCN_K2,
  ironCycleDirector,
  ironEquilibriumSamples,
} from './chem-iron-cycle';
describe('iron redox and ligand equilibrium', () => {
  it('satisfies both formation constants and both mass balances', () => {
    for (const fe of [0, 0.0001, 0.0025])
      for (const scn of [0, 0.001, 0.0075, 0.03]) {
        const m = ironThiocyanate(fe, scn);
        expect(m.freeIron + m.mono + m.bis).toBeCloseTo(fe, 12);
        expect(m.ligand + m.mono + 2 * m.bis).toBeCloseTo(scn, 12);
        if (fe && scn) {
          expect(m.mono / (m.freeIron * m.ligand)).toBeCloseTo(IRON_SCN_K1);
          expect(m.bis / (m.mono * m.ligand)).toBeCloseTo(IRON_SCN_K2);
        }
      }
  });
  it('increased ligand increases complex while iron removal reduces it', () => {
    const m = ironThiocyanate(0.0025, 0.0075);
    expect(ironThiocyanate(0.0025, 0.0275).complex).toBeGreaterThan(m.complex);
    expect(ironThiocyanate(0.0005, 0.0075).complex).toBeLessThan(m.complex);
  });
  it('uses a ligand-limited comparison with a visible model-derived increase', () => {
    const m = ironEquilibriumSamples(1, 0.02);
    expect(m.reference.ligandTotal).toBe(0.001);
    expect(m.added.complex).toBeGreaterThan(3 * m.reference.complex);
    expect(m.added.red - m.reference.red).toBeGreaterThan(0.25);
    expect(m.removed.complex).toBe(0);
  });
  it('includes iron supplied by the metal and matches redox stoichiometry', () => {
    const r = ironRedox(1, 0);
    expect(r.fe3).toBe(0);
    expect(r.fe2).toBeCloseTo(0.00375);
    expect(r.metalConsumed).toBeCloseTo(0.00125);
    for (const p of [0, 0.2, 1]) {
      const m = ironRedox(0.8, p);
      expect(m.fe2 + m.fe3).toBeCloseTo(m.totalDissolvedIron);
    }
    expect(ironRedox(1, 1).chlorineConsumed).toBeCloseTo(0.00375 / 2);
  });
  it('seeks to a clean reduced supernatant and later oxidation independently', () => {
    expect(ironCycleDirector(2, 0)).toMatchObject({ mode: 'decant', reduction: 1, oxidation: 0 });
    expect(ironCycleDirector(3, 1).oxidation).toBe(1);
    expect(ironThiocyanate(0, 0.01).red).toBe(0);
  });
});
