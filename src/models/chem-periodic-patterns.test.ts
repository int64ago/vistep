import { describe, it, expect } from 'vitest';
import {
  ELEMENT_SYMBOLS,
  PERIOD_LENGTHS,
  periodicCell,
  orbitalOccupancy,
  trendData,
} from './chem-periodic-patterns';
describe('periodic classification and sourced trends', () => {
  it('accounts for all118 unique elements without overlapping either layout', () => {
    expect(ELEMENT_SYMBOLS.length).toBe(118);
    expect(PERIOD_LENGTHS.reduce((a, b) => a + b, 0)).toBe(118);
    for (const t of [0, 1]) {
      const cells = ELEMENT_SYMBOLS.map((_, i) => periodicCell(i + 1, t));
      expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(118);
    }
  });
  it('keeps helium in the s block while closing the first period', () => {
    expect(periodicCell(2).block).toBe('s');
    expect(periodicCell(2).x).toBe(17);
    expect(periodicCell(11).period).toBe(3);
    expect(periodicCell(29).block).toBe('ds');
  });
  it('has physically allowed Hund occupancies and the Cr/Cu exceptions', () => {
    expect(orbitalOccupancy(3, 3)).toEqual([1, 1, 1]);
    expect(orbitalOccupancy(4, 3)).toEqual([2, 1, 1]);
    expect(orbitalOccupancy(5, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(orbitalOccupancy(10, 5)).toEqual([2, 2, 2, 2, 2]);
  });
  it('preserves missing values, textbook rounding and non-monotone ionization energies', () => {
    const e = trendData('period', 'en'),
      i = trendData('period', 'ie');
    expect(e[7].value).toBe(null);
    expect(e[2].value).toBe(1.5);
    expect(i[0].value).toBeCloseTo(496, 0);
    expect(i[2].value!).toBeLessThan(i[1].value!);
    expect(i[5].value!).toBeLessThan(i[4].value!);
    const a = trendData('alkali', 'en');
    expect(a[2].value).toBe(a[3].value);
  });
});

import {
  ionizationEvent,
  ionizationGeometry,
  configurationComparison,
  halogenPrediction,
  periodicDirector,
  IONIZATION_RECORDS,
} from './chem-periodic-patterns';
describe('fixed evidence and a bounded energy accounting model', () => {
  it('reproduces independently converted NIST thresholds and preserves source ordering', () => {
    expect(ionizationEvent('Mg', 8, 1).thresholdKJ).toBeCloseTo(737.749, 2);
    expect(ionizationEvent('Al', 8, 1).thresholdKJ).toBeCloseTo(577.539, 2);
    expect(IONIZATION_RECORDS[2].ie - IONIZATION_RECORDS[3].ie).toBeCloseTo(0.1266693, 7);
  });
  it('uses the same external energy to make a genuine threshold counterexample', () => {
    expect(ionizationEvent('Mg', 6.5, 1).allowed).toBe(false);
    expect(ionizationEvent('Al', 6.5, 1).kineticEV).toBeCloseTo(0.514231, 6);
    expect(ionizationEvent('P', 10.42, 1).allowed).toBe(false);
    expect(ionizationEvent('S', 10.42, 1).kineticEV).toBeCloseTo(0.0599833, 7);
  });
  it('tracks one actual occupancy token without losing charge or electrons', () => {
    for (const r of IONIZATION_RECORDS)
      for (const p of [0, 0.15, 0.3, 0.5, 0.799, 1]) {
        const s = ionizationEvent(r.symbol, 12, p);
        expect(s.electrons.filter((e) => e.tracked)).toHaveLength(1);
        expect(s.boundElectrons + s.transferElectrons + s.freeElectrons).toBe(r.z);
        expect(s.residualCharge + s.emittedCharge).toBe(0);
        expect(s.kineticEV! + r.ie).toBeCloseTo(12, 12);
      }
    const s = ionizationEvent('S', 12, 1),
      remaining = s.electrons.filter((e) => !e.tracked && e.shell === '3p');
    expect(remaining.map((e) => e.slot)).toEqual([0, 1, 2]);
  });
  it('keeps fixed source values unchanged by hiding, revealing and external-energy choices', () => {
    const original = JSON.stringify(IONIZATION_RECORDS);
    for (const e of [0, 6.5, 10.42, 20]) ionizationEvent('Al', e, 1);
    expect(JSON.stringify(IONIZATION_RECORDS)).toBe(original);
    expect(halogenPrediction(false)[3]).toMatchObject({ value: null, hidden: true });
    expect(halogenPrediction(true)[3].value).toBe(2.5);
    expect(halogenPrediction(false)[3].value).toBe(null);
  });
  it('distinguishes a filling mnemonic from externally known ground configurations', () => {
    expect(configurationComparison('Cr')).toMatchObject({
      total: 24,
      mnemonic: { d: 4, s: 2 },
      observed: { d: 5, s: 1 },
    });
    expect(configurationComparison('Cu')).toMatchObject({
      total: 29,
      mnemonic: { d: 9, s: 2 },
      observed: { d: 10, s: 1 },
    });
  });
  it('bounds non-finite inputs, allocations, and all view geometry', () => {
    for (const v of [NaN, Infinity, -Infinity, -20, 0, 1, 999]) {
      expect(Number.isFinite(periodicCell(v, v).x)).toBe(true);
      expect(orbitalOccupancy(v, v).length).toBeLessThanOrEqual(7);
      const s = ionizationGeometry('S', v, v, v);
      expect(s.electrons.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))).toBe(true);
      expect(Number.isFinite(periodicDirector(v, v, v).z)).toBe(true);
    }
    for (const w of [260, 272, 320, 480, 680])
      for (const r of IONIZATION_RECORDS)
        for (let p = 0; p <= 1; p += 0.02) {
          const g = ionizationGeometry(r.symbol, 12, p, w);
          expect(g.electrons.every((e) => e.x >= 0 && e.x <= w && e.y >= 0 && e.y <= 110)).toBe(
            true,
          );
        }
  });
  it('uses exact reveal boundaries and reconstructs the same state on reverse seeks', () => {
    expect(periodicDirector(6, 0, 16.589).reveal).toBe(false);
    expect(periodicDirector(6, 0, 16.59).reveal).toBe(true);
    expect(periodicDirector(7, 0, 30.449).answerVisible).toBe(false);
    expect(periodicDirector(7, 0, 30.45).answerVisible).toBe(true);
    const a = periodicDirector(7, 0.5, 22);
    periodicDirector(7, 1, 49);
    expect(periodicDirector(7, 0.5, 22)).toEqual(a);
  });
});

describe('measured retained narration gates', () => {
  it('switches Cr to Cu during the spoken Cu configuration, independently by language', () => {
    expect(periodicDirector(3, 0, 4.94, 'zh').exception).toBe('Cr');
    expect(periodicDirector(3, 0, 4.95, 'zh').exception).toBe('Cu');
    expect(periodicDirector(3, 0, 6.78, 'en').exception).toBe('Cr');
    expect(periodicDirector(3, 0, 6.79, 'en').exception).toBe('Cu');
  });
  it('holds argon while the retained speech describes its filled shell, not until film end', () => {
    expect(periodicDirector(2, 0, 4.3, 'zh').z).toBe(12);
    expect(periodicDirector(2, 0, 6.8, 'en').z).toBe(13);
    expect(periodicDirector(2, 0, 13.3, 'zh').z).toBe(18);
    expect(periodicDirector(2, 0, 13.6, 'en').z).toBe(18);
    expect(periodicDirector(2, 1, 13.6, 'en').z).toBe(periodicDirector(2, 0, 13.6, 'en').z);
  });
  it('reveals the H exception at its own words and completes unfolding before thirty-two columns', () => {
    expect(periodicDirector(0, 0, 13.2, 'en').z).toBe(19);
    expect(periodicDirector(0, 0, 13.21, 'en').z).toBe(1);
    expect(periodicDirector(0, 0, 16.75, 'zh').z).toBe(1);
    for (const locale of ['zh', 'en'] as const) {
      expect(periodicDirector(1, 0, 0, locale).expanded).toBe(0);
      expect(periodicDirector(1, 0, 6.3, locale).expanded).toBe(1);
    }
  });
  it('changes attention without changing any recorded values', () => {
    const before = trendData('period', 'en');
    expect(periodicDirector(4, 0, 16.23, 'en').recordFocus).toEqual(['Ar']);
    expect(periodicDirector(5, 0, 7.07, 'zh').recordFocus).toEqual(['K', 'Rb']);
    expect(trendData('period', 'en')).toEqual(before);
    expect(periodicDirector(3, 0, 4.95, 'zh').exception).toBe('Cu');
    expect(periodicDirector(3, 0, 4, 'zh').exception).toBe('Cr');
  });
});

describe('final bilingual causal reveal gates', () => {
  it('keeps iodine unknown through the question and reveals only with the spoken record', () => {
    for (const [locale, reveal] of [
      ['zh', 16.59],
      ['en', 15.89],
    ] as const) {
      expect(periodicDirector(6, 1, reveal - 0.001, locale).reveal).toBe(false);
      expect(periodicDirector(6, 0, reveal, locale).reveal).toBe(true);
      expect(halogenPrediction(false).at(-1)?.value).toBe(null);
    }
  });
  it('moves Mg before Al, and holds neutral P while the paired S electron leaves', () => {
    for (const locale of ['zh', 'en'] as const) {
      const early = periodicDirector(7, 0, locale === 'zh' ? 5.2 : 6, locale);
      expect(early.ionProgressByElement.Mg).toBeGreaterThan(0.15);
      expect(early.ionProgressByElement.Al).toBe(0);
      const later = periodicDirector(7, 0, locale === 'zh' ? 8 : 9, locale);
      expect(later.ionProgressByElement.Mg).toBe(1);
      expect(later.ionProgressByElement.Al).toBeGreaterThan(0.15);
      for (let t = 13; t <= 24; t += 0.1) {
        const state = periodicDirector(7, 0, t, locale);
        expect(state.ionPair).toBe('PS');
        expect(ionizationEvent('P', 11, state.ionProgressByElement.P).phase).toBe('bound');
      }
      const sulfur = periodicDirector(7, 0, 22, locale);
      expect(ionizationEvent('S', 11, sulfur.ionProgressByElement.S).phase).toBe('free');
    }
  });
  it('separates an answer from subsequent motion, keeping charge and identity at every point', () => {
    for (const [locale, answer, moveStart, moveEnd] of [
      ['zh', 30.45, 32.5, 36.3],
      ['en', 34.63, 37.79, 41.1],
    ] as const) {
      expect(periodicDirector(7, 1, answer - 0.001, locale).answerVisible).toBe(false);
      expect(periodicDirector(7, 0, answer, locale).answerVisible).toBe(true);
      expect(periodicDirector(7, 0, moveStart, locale).ionProgressByElement.Al).toBe(0);
      for (let t = answer; t < 49; t += 0.05) {
        const d = periodicDirector(7, 0, t, locale);
        const al = ionizationEvent('Al', d.energy!, d.ionProgressByElement.Al);
        const mg = ionizationEvent('Mg', d.energy!, d.ionProgressByElement.Mg);
        expect(al.boundElectrons + al.transferElectrons + al.freeElectrons).toBe(13);
        expect(al.residualCharge + al.emittedCharge).toBe(0);
        expect(mg.phase).toBe('bound');
        expect(al.electrons.filter((e) => e.tracked).map((e) => e.id)).toEqual(['Al-3p-0-0']);
      }
      expect(
        ionizationEvent('Al', 6.5, periodicDirector(7, 0, moveEnd, locale).ionProgressByElement.Al)
          .phase,
      ).toBe('free');
    }
  });
});
