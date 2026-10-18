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

import {
  ironQuotient,
  ironEquilibriumPath,
  ironElectronFrame,
  ironAliquot,
  ironCoordination,
  ironCycleFilm,
  ironOxidantComparison,
} from './chem-iron-cycle';

describe('causal iron accounts', () => {
  it('matches the independently solved ligand-limited benchmark', () => {
    const m = ironThiocyanate(0.0025, 0.001);
    expect(m.freeIron).toBeCloseTo(0.0019244697307038512, 14);
    expect(m.ligand).toBeCloseTo(0.00041681044496536565, 14);
    expect(m.mono).toBeCloseTo(0.000567870983557663, 14);
    expect(m.bis).toBeCloseTo(0.00000765928573848573, 14);
  });
  it('changes free FeIII first, then releases ligand without losing metal-derived iron', () => {
    const immediate = ironEquilibriumPath('remove', 1, 0);
    expect(immediate.state.mono).toBe(immediate.reference.mono);
    expect(immediate.state.ligand).toBe(immediate.reference.ligand);
    expect(immediate.quotient.first).toBeCloseTo(2, 12);
    expect(immediate.quotient.second).toBeCloseTo(1, 12);
    const end = ironEquilibriumPath('remove', 1, 1);
    expect(end.state.freeIron).toBeCloseTo(0.0010991809420678714, 14);
    expect(end.state.ligand).toBeGreaterThan(immediate.state.ligand);
    expect(end.state.complex).toBeLessThan(immediate.state.complex);
    // Counterexample: total colour falls although the bis species increases slightly.
    expect(end.state.bis).toBeGreaterThan(immediate.state.bis);
    expect(end.totalIron).toBeCloseTo(0.0025 + end.metalConsumed, 13);
  });
  it('adds K+ with SCN− and changes Q before complexes grow', () => {
    const immediate = ironEquilibriumPath('add', 1, 0);
    expect(immediate.state.mono).toBe(immediate.reference.mono);
    expect(immediate.quotient.first).toBeCloseTo(0.29418928018670465, 12);
    expect(immediate.potassium).toBe(0.001);
    const end = ironEquilibriumPath('add', 1, 1);
    expect(end.state.complex).toBeCloseTo(0.0010219687841820754, 14);
    expect(end.state.ironTotal).toBe(0.0025);
  });
  it('conserves iron, ligand and charge at every displayed compositional intermediate', () => {
    for (const kind of ['add', 'remove'] as const)
      for (let i = 0; i <= 20; i++)
        for (let j = 0; j <= 20; j++) {
          const r = ironEquilibriumPath(kind, i / 20, j / 20),
            m = r.state;
          expect(m.freeIron + m.mono + m.bis).toBeCloseTo(m.ironTotal, 13);
          expect(m.ligand + m.mono + 2 * m.bis).toBeCloseTo(m.ligandTotal, 13);
          expect(m.ironTotal + r.feII - r.metalConsumed).toBeCloseTo(0.0025, 13);
          expect(r.charge).toBeCloseTo(3 * 0.0025 - 0.001, 13);
        }
  });
  it('keeps electron credits and atom charge in the same persistent transfer state', () => {
    for (const width of [260, 280, 390, 680])
      for (const direction of ['reduce', 'oxidize'] as const)
        for (let i = 0; i <= 100; i++) {
          const m = ironElectronFrame(direction, i / 100, width);
          expect(m.charge).toBe(direction === 'reduce' ? 6 : 4);
          expect(new Set(m.atoms.map((a) => a.id)).size).toBe(m.atoms.length);
          expect(
            m.electrons.filter((e) => e.phase === 'donor').length + m.inTransit + m.deposited,
          ).toBe(2);
          expect(m.electrons.filter((e) => e.phase === 'transfer').length).toBe(m.inTransit);
          expect(m.atoms.filter((a) => a.element === 'Fe').length).toBe(m.totalIron);
          for (const a of [...m.atoms, ...m.electrons]) {
            expect(a.x).toBeGreaterThanOrEqual(0);
            expect(a.x).toBeLessThanOrEqual(width);
            expect(Number.isFinite(a.y)).toBe(true);
          }
        }
    expect(ironElectronFrame('reduce', 1).aqueousIron).toBe(3);
    expect(ironElectronFrame('reduce', 0).aqueousIron).toBe(2);
    expect(ironElectronFrame('oxidize', 1).atoms.map((a) => a.charge)).toEqual([3, 3, -1, -1]);
  });
  it('retains tagged aliquot identity and unchanged charge through transfer and backward seeking', () => {
    const ids = ironAliquot(0).map((a) => a.id);
    for (const p of [0, 0.25, 0.9, 1, 0.4, 0]) {
      const a = ironAliquot(p);
      expect(a.map((v) => v.id)).toEqual(ids);
      expect(a.every((v) => v.charge === 2)).toBe(true);
    }
    expect(ironAliquot(1).every((a) => a.phase === 'receiver')).toBe(true);
  });
  it('distinguishes coordination charge from oxidation state, retaining both SCN and waters', () => {
    for (const w of [260, 280, 680])
      for (let i = 0; i <= 20; i++) {
        const m = ironCoordination(i / 20, i / 20, w);
        expect(m.center.oxidationState).toBe(3);
        expect(m.complexCharge + m.ligandChargeOutside).toBe(1);
        expect(m.ligands.map((l) => l.id)).toEqual(['SCN-0', 'SCN-1']);
        expect(m.ligands.map((l) => l.water.id)).toEqual(['water-0', 'water-1']);
        for (const l of m.ligands)
          expect(Math.abs(l.nitrogen.x - m.center.x)).toBeLessThan(
            Math.abs(l.sulfur.x - m.center.x),
          );
      }
    expect(ironCoordination(1, 0).complexCharge).toBe(2);
    expect(ironCoordination(1, 1).complexCharge).toBe(1);
  });
  it('limited oxidant has two different conserved net accounts when metal is retained', () => {
    for (const metal of [true, false]) {
      const m = ironOxidantComparison(metal);
      expect(m.feII + m.feIII + m.metal).toBe(m.initialFeII + m.initialMetal);
      expect(m.chloride).toBe(2 * m.chlorine);
      expect(2 * m.feII + 3 * m.feIII - m.chloride).toBe(m.charge);
    }
  });
  it('prediction gates do not reveal endpoints early and replay is pure', () => {
    for (const [locale, times] of [
      ['zh', [19.95, 24.43, 20.57, 17.03]],
      ['en', [17.47, 24.15, 16.43, 13.63]],
    ] as const)
      [0, 3, 6, 7].forEach((c, i) => {
        const t = times[i];
        expect(ironCycleFilm(c, t - 0.001, locale).reveal).toBe(false);
        expect(ironCycleFilm(c, t, locale).reveal).toBe(true);
        expect(ironCycleFilm(c, 0, locale)).toEqual(ironCycleFilm(c, 0, locale));
      });
  });
  it('aligns model actions with measured speech without skipping the unchanged intermediate', () => {
    for (const locale of ['zh', 'en']) {
      const en = locale === 'en',
        film = (c: number, t: number) => ironCycleFilm(c, t, locale);
      expect(film(2, en ? 5.1 : 5.9).action).toBe(1);
      const qOnly = film(5, en ? 8 : 10);
      expect(qOnly.perturb).toBe(1);
      expect(qOnly.relax).toBe(0);
      const released = film(5, en ? 19.8 : 22.2);
      expect(released.relax).toBe(1);
      expect(film(6, en ? 8.4 : 9.8).relax).toBe(0);
      expect(film(6, en ? 13.1 : 15.8).relax).toBe(1);
      expect(film(7, en ? 11.6 : 10.8).action).toBe(1);
      expect(film(7, en ? 25.7 : 28.5).second).toBe(0);
      expect(film(7, en ? 28.45 : 32.6).second).toBe(1);
    }
  });
  it('finite guards and missing reactants produce finite or explicitly undefined quotients', () => {
    for (const x of [NaN, Infinity, -Infinity, -100, 0, 1e9]) {
      expect(Object.values(ironThiocyanate(x, x)).every(Number.isFinite)).toBe(true);
      expect(Object.values(ironRedox(x, x)).every(Number.isFinite)).toBe(true);
      expect(ironElectronFrame('reduce', x, x).charge).toBe(6);
      expect(Number.isFinite(ironCycleFilm(x, x).time)).toBe(true);
    }
    expect(ironQuotient(ironThiocyanate(0, 0))).toEqual({ first: null, second: null });
  });
});

import { ironLigandRoute } from './chem-iron-cycle';
it('keeps absent perturbations from moving a ligand or its potassium spectator into a complex', () => {
  const noAddition = ironLigandRoute('add', 0, 1, 258),
    noReduction = ironLigandRoute('remove', 0, 1, 258);
  expect(noAddition.phase).toBe('supply');
  expect(noAddition.bond).toBe(0);
  expect(noReduction.phase).toBe('bound');
  expect(noReduction.bond).toBe(1);
  const end = ironLigandRoute('add', 1, 1, 258),
    initialFree = ironLigandRoute('add', 1, 0, 258);
  expect(end.phase).toBe('bound');
  expect(end.potassium).toEqual(initialFree.potassium);
  expect(Math.hypot(end.x - end.potassium.x, end.y - end.potassium.y)).toBeGreaterThan(30);
  for (const width of [240, 258, 390, 680])
    for (let i = 0; i <= 20; i++) {
      const p = i / 20,
        compact = ironElectronFrame('reduce', p, width, true);
      expect(compact.charge).toBe(6);
      expect(compact.atoms.map((a) => a.id)).toEqual([
        'solution-Fe-0',
        'solution-Fe-1',
        'metal-Fe',
      ]);
      for (const kind of ['add', 'remove'] as const) {
        const route = ironLigandRoute(kind, p, p, width);
        expect(route.x - 28).toBeGreaterThanOrEqual(0);
        expect(route.x + 28).toBeLessThanOrEqual(width);
      }
    }
});
