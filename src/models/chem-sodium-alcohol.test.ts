import { describe, it, expect } from 'vitest';
import {
  sodiumProtic,
  compareSodium,
  hydrogenProductTest,
  sodiumAlcoholDirector,
} from './chem-sodium-alcohol';
describe('sodium and protic liquids', () => {
  it('conserves atoms and charge at every limit', () => {
    for (const l of ['ethanol', 'water'] as const)
      for (const na of [0, 1, 2, 4])
        for (const donors of [0, 1, 2, 4])
          for (const p of [0, 0.3, 1]) {
            const m = sodiumProtic(l, p, na, donors);
            expect(m.atoms.H).toBeCloseTo(donors * (l === 'ethanol' ? 6 : 2));
            expect(m.sodiumRemaining + m.sodiumIon).toBeCloseTo(na);
            expect(m.donorsRemaining + m.anion).toBeCloseTo(donors);
            expect(m.sodiumIon - m.anion).toBe(0);
            expect(m.hydrogen * 2).toBe(m.extent);
          }
  });
  it('limits hydrogen by sodium and available donor groups', () => {
    expect(sodiumProtic('ethanol', 1, 4, 2).hydrogen).toBe(1);
    expect(sodiumProtic('ethanol', 1, 4, 2).sodiumRemaining).toBe(2);
    expect(sodiumProtic('ethanol', 1, 0).hydrogen).toBe(0);
  });
  it('illustrates faster water reaction while equal final amounts agree', () => {
    const mid = compareSodium(0.3);
    expect(mid.water.extent).toBeGreaterThan(mid.ethanol.extent);
    expect(compareSodium(1).water.hydrogen).toBe(compareSodium(1).ethanol.hydrogen);
    expect(mid.water.sodiumDensity).toBeLessThan(mid.water.liquidDensity);
    expect(mid.ethanol.sodiumDensity).toBeGreaterThan(mid.ethanol.liquidDensity);
  });
  it('hydrogen combustion forms water without carbon dioxide', () => {
    const m = hydrogenProductTest(1, 0.6);
    expect(m.water).toBeCloseTo(0.6);
    expect(2 * m.oxygen).toBe(m.water);
    expect(m.carbonDioxide).toBe(0);
    expect(m.calciumCarbonate).toBe(0);
  });
  it('keeps observation and comparison routes seekable', () => {
    expect(sodiumAlcoholDirector(0, 0).reactionProgress).toBe(0);
    expect(sodiumAlcoholDirector(2, 1).burnProgress).toBe(1);
    expect(sodiumAlcoholDirector(4, 1).compareTime).toBe(0.65);
  });
});

import {
  protonExchange,
  protonExchangeGeometry,
  PROTON_EXCHANGE_K,
  DMSO_ACIDITY,
  alcoholFilmState,
} from './chem-sodium-alcohol';
describe('independent common-medium proton exchange', () => {
  it('uses the matched 1980 records without fitting them to the controls', () => {
    expect(DMSO_ACIDITY.water).toBe(31.4);
    expect(DMSO_ACIDITY.ethanol).toBe(29.8);
    expect(PROTON_EXCHANGE_K).toBeCloseTo(39.81071705535, 9);
    const expected = Math.sqrt(PROTON_EXCHANGE_K) / (1 + Math.sqrt(PROTON_EXCHANGE_K));
    expect(protonExchange(0).extent).toBeCloseTo(expected, 12);
    expect(Object.isFrozen(DMSO_ACIDITY)).toBe(true);
  });
  it('added water changes equilibrium while atoms and charge close independently', () => {
    let last = 1;
    for (const water of [0, 0.1, 1, 2, 4, 8]) {
      const m = protonExchange(water);
      expect(m.ethoxide).toBeLessThan(last);
      last = m.ethoxide;
      expect((m.ethoxide * m.water) / (m.ethanol * m.hydroxide)).toBeCloseTo(PROTON_EXCHANGE_K, 10);
      expect(6 * m.ethanol + 5 * m.ethoxide + m.hydroxide + 2 * m.water).toBeCloseTo(
        7 + 2 * water,
        12,
      );
      expect(m.ethanol + m.ethoxide + m.hydroxide + m.water).toBeCloseTo(2 + water, 12);
      expect(-m.ethoxide - m.hydroxide).toBeCloseTo(-1, 12);
    }
  });
  it('keeps one proton and two owned pairs, no redox or hydrogen gas', () => {
    for (const width of [280, 320, 600, 720])
      for (let i = 0; i <= 100; i++) {
        const g = protonExchangeGeometry(i / 100, width);
        expect(g.atoms.map((a) => a.id)).toEqual([
          'O-ethanol',
          'O-hydroxide',
          'H-proton',
          'H-acceptor',
        ]);
        expect(g.pairs.map((p) => p.owner)).toEqual(['O-ethanol', 'O-hydroxide']);
        expect(g.charge).toBe(-1);
        expect(g.hydrogenOxidation).toBe(1);
        expect(g.hydrogenGas).toBe(0);
        for (const a of g.atoms) expect(Number.isFinite(a.x + a.y)).toBe(true);
      }
  });
  it('guards nonfinite inputs without rewriting source data', () => {
    for (const v of [NaN, Infinity, -Infinity, -99, 999]) {
      expect(Number.isFinite(protonExchange(v).extent)).toBe(true);
      expect(Number.isFinite(protonExchangeGeometry(v, v).atoms[0].x)).toBe(true);
      expect(Number.isFinite(sodiumProtic('ethanol', v, v, v).extent)).toBe(true);
    }
  });
  it('holds the new question before revealing a shifted amount', () => {
    expect(alcoholFilmState(5, 39).question).toBe(true);
    expect(alcoholFilmState(5, 39).reveal).toBe(false);
    expect(alcoholFilmState(5, 39).addedWater).toBe(0);
    expect(alcoholFilmState(5, 58).reveal).toBe(true);
    expect(alcoholFilmState(5, 58).addedWater).toBe(8);
  });
  it('finishes both equal-sodium samples before leaving the comparison', () => {
    const state = alcoholFilmState(4, 26);
    const comparison = compareSodium(state.compareTime);
    expect(comparison.water.hydrogen).toBe(1);
    expect(comparison.ethanol.hydrogen).toBe(1);
    expect(alcoholFilmState(4, 12).compareTime).toBeLessThan(1);
  });
});

describe('measured candidate c5 words', () => {
  for (const [locale, start, arrive, newBond, complete, records, question, reveal, reverseEnd] of [
    ['zh', 7.05, 9.37, 13.45, 16.17, 22.43, 35.37, 40.1, 44.0],
    ['en', 9.81, 12.17, 15.55, 18.67, 24.91, 36.07, 41.61, 45.29],
  ] as const) {
    it(`${locale}: proton arrives at named receiver, with new bond formed during the later bond phrase`, () => {
      expect(alcoholFilmState(5, start, locale).exchangeProgress).toBe(0);
      const arrived = protonExchangeGeometry(alcoholFilmState(5, arrive, locale).exchangeProgress);
      expect(arrived.transfer).toBe('acceptor');
      expect(arrived.acceptorBond).toBe(0);
      expect(
        protonExchangeGeometry(alcoholFilmState(5, newBond, locale).exchangeProgress).acceptorBond,
      ).toBe(0);
      expect(
        protonExchangeGeometry(alcoholFilmState(5, complete, locale).exchangeProgress).acceptorBond,
      ).toBe(1);
    });
    it(`${locale}: records wait for the study, and prediction withholds water/result until after prediction words`, () => {
      expect(alcoholFilmState(5, records - 0.01, locale).showRecords).toBe(false);
      expect(alcoholFilmState(5, records, locale).showRecords).toBe(true);
      for (const t of [question, question + 0.5, reveal - 0.01]) {
        const d = alcoholFilmState(5, t, locale);
        expect(d.question).toBe(true);
        expect(d.reveal).toBe(false);
        expect(d.addedWater).toBe(0);
      }
    });
    it(`${locale}: reversal is continuous and atom/pair identities and charge persist`, () => {
      let last = 1;
      for (let i = 0; i <= 100; i++) {
        const t = reveal + ((reverseEnd - reveal) * i) / 100,
          d = alcoholFilmState(5, t, locale),
          g = protonExchangeGeometry(d.reverseProgress!);
        expect(g.progress).toBeLessThanOrEqual(last + 1e-12);
        last = g.progress;
        expect(g.charge).toBe(-1);
        expect(g.pairs.map((x) => x.owner)).toEqual(['O-ethanol', 'O-hydroxide']);
        expect(g.hydrogenGas).toBe(0);
      }
      expect(last).toBe(0);
      expect(alcoholFilmState(5, reverseEnd, locale).reverse).toBe(false);
      expect(alcoholFilmState(5, reverseEnd, locale).addedWater).toBe(8);
    });
  }
});
