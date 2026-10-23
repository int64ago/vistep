import { describe, it, expect } from 'vitest';
import {
  bromineAddition,
  ethynePreparation,
  permanganateEvidence,
  completeCombustion,
  hydrocarbonDirector,
} from './chem-unsaturated-hydrocarbons';
describe('unsaturated hydrocarbon evidence', () => {
  it('limits bromine addition by one or two available pi bonds', () => {
    for (const gas of ['ethene', 'ethyne'] as const)
      for (const br of [0, 0.4, 1, 1.5, 2, 3])
        for (const p of [0, 0.25, 0.6, 1]) {
          const m = bromineAddition(gas, br, p);
          expect(m.used + m.remaining).toBeCloseTo(br);
          expect(m.products.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
          expect(m.organicAtoms.Br + 2 * m.remaining).toBeCloseTo(m.totalBromineAtoms);
          expect(m.bondOrder).toBeGreaterThanOrEqual(1);
        }
    expect(bromineAddition('ethene', 2).remaining).toBe(1);
    expect(bromineAddition('ethyne', 2).remaining).toBe(0);
  });
  it('tracks carbide water calcium and carbon in preparation', () => {
    for (const p of [0, 0.4, 1]) {
      const m = ethynePreparation(p);
      expect(m.carbide + m.calciumHydroxide).toBeCloseTo(1);
      expect(2 * m.carbide + 2 * m.ethyne).toBeCloseTo(2);
      expect(2 * m.water + 2 * m.calciumHydroxide + 2 * m.ethyne).toBeCloseTo(4.4);
      expect(m.water + 2 * m.calciumHydroxide).toBeCloseTo(2.2);
    }
  });
  it('captures sulfur only until the copper capacity is exhausted', () => {
    for (const c of [0, 0.02, 0.08, 0.12]) {
      const m = ethynePreparation(1, c);
      expect(m.captured + m.outletImpurity).toBeCloseTo(0.08);
      expect(m.precipitate + m.copperRemaining).toBeCloseTo(c);
      expect(m.outletImpurity).toBeGreaterThanOrEqual(0);
    }
    expect(ethynePreparation(1, 0.12).outletImpurity).toBe(0);
    expect(ethynePreparation(1, 0).outletImpurity).toBe(0.08);
  });
  it('models five-electron acidic permanganate and interference without specifying organic oxidation products', () => {
    expect(permanganateEvidence(0).remaining).toBe(1);
    expect(permanganateEvidence(1).electronsUsed).toBe(5);
    expect(permanganateEvidence(0, 2).remaining).toBeCloseTo(0.6);
    expect(permanganateEvidence(10).remaining).toBe(0);
  });
  it('conserves complete combustion atoms and keeps learning routes distinct', () => {
    for (const gas of ['ethene', 'ethyne'] as const) {
      const m = completeCombustion(gas);
      expect(2 * m.oxygen).toBe(2 * m.carbonDioxide + m.water);
      expect(2 * m.water).toBe(gas === 'ethene' ? 4 : 2);
    }
    expect(hydrocarbonDirector(3, 0.5).gas).toBe('ethene');
    expect(hydrocarbonDirector(4, 0.5).gas).toBe('ethyne');
  });
});

import {
  acidicManganeseBudget,
  permanganateNetGeometry,
  brominationOxidationAccount,
  hydrocarbonFilmState,
} from './chem-unsaturated-hydrocarbons';
describe('acidic permanganate net evidence', () => {
  it('independently closes 1 Mn /4 O /8 H and charge for the four-electron counterexample', () => {
    const m = acidicManganeseBudget(4, 1);
    expect(m.manganeseII).toBeCloseTo(0.8);
    expect(m.permanganate).toBeCloseTo(0.2);
    expect(m.water).toBeCloseTo(3.2);
    expect(m.protonRemaining).toBeCloseTo(1.6);
    expect(-m.permanganate + 2 * m.manganeseII + m.protonRemaining - m.unusedElectrons).toBeCloseTo(
      -1 + 8 - 4,
    );
  });
  it('keeps every amount finite and conserves atoms for supply and progress boundaries', () => {
    for (const e of [NaN, -Infinity, -1, 0, 0.1, 4, 5, 7, 10, Infinity])
      for (const p of [NaN, -Infinity, -1, 0, 0.1, 0.7, 1, 2, Infinity]) {
        const m = acidicManganeseBudget(e, p);
        expect(
          Object.values(m)
            .filter((x) => typeof x === 'number')
            .every(Number.isFinite),
        ).toBe(true);
        expect(m.atoms).toEqual({ Mn: 1, O: 4, H: 8 });
        expect(m.finalHalfCharge).toBeCloseTo(m.initialHalfCharge);
        expect(m.received + m.unusedElectrons).toBeCloseTo(m.supply);
      }
  });
  it('preserves atom and credit identities along net paths at five widths', () => {
    for (const w of [260, 280, 320, 480, 620])
      for (const p of [0, 0.05, 0.1, 0.35, 0.5, 0.55, 0.7, 0.92, 1]) {
        const m = permanganateNetGeometry(p, w);
        expect(m.atoms.map((a) => a.id)).toEqual([
          'Mn-1',
          'O-1',
          'H-1',
          'H-2',
          'O-2',
          'H-3',
          'H-4',
          'O-3',
          'H-5',
          'H-6',
          'O-4',
          'H-7',
          'H-8',
        ]);
        expect(m.credits.map((e) => e.id)).toEqual(['e-1', 'e-2', 'e-3', 'e-4', 'e-5']);
        expect(m.relativeLedger.total).toBe(7);
        for (const a of m.atoms) {
          expect(a.x).toBeGreaterThan(0);
          expect(a.x).toBeLessThan(w);
          expect(a.y).toBeGreaterThan(0);
          expect(a.y).toBeLessThan(m.height);
        }
      }
  });
  it('does not call bromine addition non-redox', () => {
    const a = brominationOxidationAccount();
    expect(a.carbonLoss).toBe(2);
    expect(a.bromineGain).toBe(2);
    expect(
      a.carbonAfter.reduce((x, y) => x + y, 0) + a.bromineAfter.reduce((x, y) => x + y, 0) + 4,
    ).toBe(0);
  });
  it('holds the question before exposing a numerical result', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(hydrocarbonFilmState(1, 26, locale)).toMatchObject({
        shot: 'question',
        reveal: false,
        electrons: 4,
      });
      expect(hydrocarbonFilmState(1, 32, locale)).toMatchObject({
        shot: 'budget',
        reveal: true,
        budgetProgress: 1,
      });
      expect(hydrocarbonFilmState(1, 50, locale).shot).toBe('contrast');
    }
  });
  it('guards existing preparation/addition and colour APIs against non-finite input', () => {
    for (const p of [NaN, Infinity, -Infinity]) {
      expect(bromineAddition('ethyne', p, p).remaining).toBe(0);
      expect(ethynePreparation(p, p).outletImpurity).toBe(0);
      expect(permanganateEvidence(p, p).remaining).toBe(1);
    }
  });
});

describe('measured bilingual hydrocarbon cues', () => {
  it.each([
    {
      locale: 'zh' as const,
      manganese: 9.15,
      oxygen: 11.1,
      water: 15.15,
      prediction: 27.63,
      result: 30.47,
      bromine: 34.99,
    },
    {
      locale: 'en' as const,
      manganese: 10.03,
      oxygen: 12.1,
      water: 15.63,
      prediction: 29.09,
      result: 31.63,
      bromine: 36.01,
    },
  ])(
    'shows each named object at its recorded $locale cue without revealing the prediction early',
    (cue) => {
      const state = (time: number) => hydrocarbonFilmState(1, time, cue.locale);
      const mn = state(cue.manganese);
      const mnGeometry = permanganateNetGeometry(mn.net, 280, mn.netElectrons);
      expect(mn.shot).toBe('net');
      expect(mnGeometry.manganeseReduced).toBe(true);
      expect(
        mnGeometry.atoms.filter((a) => a.element === 'O').every((a) => a.group === 'oxygen'),
      ).toBe(true);
      const oxygen = state(cue.oxygen);
      const moving = permanganateNetGeometry(oxygen.net, 280, oxygen.netElectrons);
      expect(moving.atomMove).toBeGreaterThan(0);
      expect(moving.atomMove).toBeLessThan(1);
      for (const width of [280, 620]) {
        const water = state(cue.water);
        const endpoint = permanganateNetGeometry(water.net, width, water.netElectrons);
        expect(endpoint.atoms.filter((a) => a.group === 'water')).toHaveLength(12);
      }
      expect(state(cue.prediction)).toMatchObject({
        shot: 'question',
        reveal: false,
        electrons: 4,
      });
      const answer = state(cue.result);
      expect(answer.shot).toBe('budget');
      expect(
        acidicManganeseBudget(answer.electrons, answer.budgetProgress).permanganate,
      ).toBeCloseTo(0.2);
      expect(state(cue.bromine).shot).toBe('contrast');
    },
  );
  it('keeps electron and atom accounting independent while retaining all paths and conservation', () => {
    for (const p of [0, 0.1, 0.34, 0.55, 0.7, 0.92, 1])
      for (const ep of [0, 0.1, 0.55, 1]) {
        const originalClock = permanganateNetGeometry(p, 280);
        const splitClock = permanganateNetGeometry(p, 280, ep);
        expect(splitClock.atoms).toEqual(originalClock.atoms);
        expect(splitClock.waters).toEqual(originalClock.waters);
        expect(splitClock.mn).toEqual(originalClock.mn);
        expect(splitClock.relativeLedger.total).toBe(7);
        expect(splitClock.counts).toEqual({ Mn: 1, O: 4, H: 8, equivalents: 5 });
      }
  });
  it('holds completed retained addition while speech explains the preserved hydrogens', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(hydrocarbonFilmState(2, 9.25, locale).exposure).toBe(1);
      for (const time of [13, 15, 19, 24, 29]) {
        const state = hydrocarbonFilmState(3, time, locale);
        const addition = bromineAddition(state.gas, 1, state.exposure);
        expect(addition.first).toBe(1);
        expect(addition.organicAtoms).toEqual({ C: 2, H: 4, Br: 2 });
        expect(addition.bondOrder).toBe(1);
      }
    }
  });
  it('preserves the other five chapter clocks and deterministic backward seeking', () => {
    for (const chapter of [0, 4, 5, 6, 7])
      for (const time of [0, 4, 15, 22]) {
        const seconds = [23, 48, 26, 29, 31, 31, 32, 26.5][chapter];
        const state = hydrocarbonFilmState(chapter, time);
        expect(state.exposure).toBe(hydrocarbonDirector(chapter, time / seconds).exposure);
      }
    const first = hydrocarbonFilmState(1, 12, 'en');
    hydrocarbonFilmState(1, 47, 'en');
    expect(hydrocarbonFilmState(1, 12, 'en')).toEqual(first);
  });
});
