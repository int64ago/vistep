import { describe, it, expect } from 'vitest';
import {
  HALOGEN_RECORDS,
  PERIOD_RECORDS,
  halogenDisplacement,
  halogenEvent,
  magnesiumWater,
  magnesiumNet,
  periodHydroxide,
  hydroxideNet,
  ammoniaProton,
  periodicDirector,
  PERIODIC_MEASURED_SECONDS,
  PERIODIC_PLANNED_SECONDS,
} from './chem-periodic-practical';
describe('periodic comparisons: evidence and finite accounts', () => {
  it('keeps observed comparisons fixed while predicting reversals and limited amounts', () => {
    const original = JSON.stringify(HALOGEN_RECORDS);
    expect(halogenDisplacement('Cl', 'Br', 1, 0.25)).toMatchObject({
      product: 0.25,
      halideLeft: 0.5,
      oxidantIon: 0.5,
    });
    expect(halogenDisplacement('Br', 'I')).toMatchObject({ product: 0.5, halideLeft: 0 });
    for (const [a, b] of [
      ['I', 'Br'],
      ['Br', 'Cl'],
      ['I', 'Cl'],
      ['Cl', 'Cl'],
    ] as const)
      expect(halogenDisplacement(a, b).product).toBe(0);
    expect(JSON.stringify(HALOGEN_RECORDS)).toBe(original);
    expect(Object.isFrozen(HALOGEN_RECORDS[0])).toBe(true);
  });
  it('conserves both elements and electron equivalents at finite doses', () => {
    for (const a of ['Cl', 'Br', 'I'] as const)
      for (const b of ['Cl', 'Br', 'I'] as const)
        for (const n of [0, 0.125, 0.5])
          for (const p of [0, 0.2, 0.7, 1]) {
            const r = halogenDisplacement(a, b, p, n);
            expect(2 * r.oxidantLeft + r.oxidantIon).toBeCloseTo(2 * n, 12);
            expect(2 * r.product + r.halideLeft).toBeCloseTo(1, 12);
            expect(r.electrons).toBeCloseTo(2 * r.product, 12);
          }
  });
  it('includes the in-transfer electrons in the four-atom charge account', () => {
    for (const width of [260, 288, 390, 760])
      for (const p of [0, 0.199, 0.2, 0.5, 0.799, 0.8, 1]) {
        const s = halogenEvent('Cl', 'Br', p, width);
        expect(new Set(s.atoms.map((a) => a.id)).size).toBe(4);
        expect(s.charge).toBe(-2);
        expect(s.atoms.every((a) => a.x >= 17 && a.x <= width - 17)).toBe(true);
        if (p >= 0.2 && p < 0.8) {
          expect(s.atoms.reduce((n, a) => n + a.charge, 0)).toBe(0);
          expect(s.transferCharge).toBe(-2);
        }
      }
  });
  it('does not animate a reverse electron exchange', () => {
    expect(halogenEvent('I', 'Br', 1)).toEqual(halogenEvent('I', 'Br', 0));
  });
  it('separates cold observation from a zero-rate claim', () => {
    expect(magnesiumWater(false)).toMatchObject({
      observation: 'not-obvious-in-short-observation',
      isRateModel: false,
    });
    const s = magnesiumWater(true, 0.3);
    expect(s.waterUsed).toBeCloseTo(0.6);
    expect(s.hydrogen + s.metal).toBeCloseTo(1);
  });
  it('preserves all seven magnesium/water atom identities and formal charge', () => {
    for (const p of Array.from({ length: 101 }, (_, i) => i / 100)) {
      const s = magnesiumNet(p, 288),
        counts: Record<string, number> = {};
      for (const a of s.atoms) counts[a.element] = (counts[a.element] ?? 0) + 1;
      expect(counts).toEqual({ Mg: 1, O: 2, H: 4 });
      expect(new Set(s.atoms.map((a) => a.id)).size).toBe(7);
      expect(s.charge).toBe(0);
    }
    const final = magnesiumNet(1);
    expect(final.atoms.filter((a) => a.phase === 'gas').map((a) => a.id)).toEqual([
      'H0-gas',
      'H1-gas',
    ]);
  });
  it('lands each magnesium electron credit on the hydrogen whose oxidation changes', () => {
    const s = magnesiumNet(0.75, 288);
    s.electrons.forEach((e, i) => {
      const h = s.atoms.find((a) => a.id === `H${i}-gas`)!;
      expect(e.x).toBeCloseTo(h.x, 12);
      expect(e.y).toBeCloseTo(h.y, 12);
      expect(e.phase).toBe('acceptor');
      expect(h.charge).toBe(0);
    });
  });
  it('distinguishes insufficient acid from failure to react', () => {
    expect(periodHydroxide('Mg', 'acid', 2)).toMatchObject({ solid: 0, waterFormed: 2 });
    const al = periodHydroxide('Al', 'acid', 2);
    expect(al.solid).toBeCloseTo(1 / 3);
    expect(al.waterFormed).toBe(2);
    expect(periodHydroxide('Al', 'base', 0.5)).toMatchObject({
      solid: 0.5,
      dissolved: 0.5,
      productCharge: -1,
      centralOxidation: 3,
    });
    expect(periodHydroxide('Mg', 'base', 3)).toMatchObject({ solid: 1, reagentLeft: 3 });
  });
  it('conserves total metal and reagent charge in all finite aliquots', () => {
    for (const metal of ['Mg', 'Al'] as const)
      for (const medium of ['none', 'acid', 'base'] as const)
        for (const amount of [0, 0.5, 2, 3, 6])
          for (const initial of [0, 0.3, 1]) {
            const s = periodHydroxide(metal, medium, amount, initial);
            expect(s.solid + s.dissolved).toBeCloseTo(initial);
            expect(s.reagentUsed + s.reagentLeft).toBeCloseTo(amount);
            expect(s.finalCharge).toBeCloseTo(s.initialCharge);
          }
  });
  it('preserves explicit O/H counts throughout acid and base net allocation', () => {
    for (const metal of ['Mg', 'Al'] as const)
      for (const medium of ['acid', 'base'] as const)
        for (const p of [0, 0.15, 0.5, 0.82, 1]) {
          const s = hydroxideNet(metal, medium, p, 288),
            n = metal === 'Al' ? 3 : 2;
          expect(s.atoms.filter((a) => a.element === 'O')).toHaveLength(
            n + (medium === 'base' ? 1 : 0),
          );
          expect(s.atoms.filter((a) => a.element === 'H')).toHaveLength(
            medium === 'acid' ? 2 * n : n + 1,
          );
          expect(s.charge).toBe(medium === 'acid' ? n : -1);
          expect(s.atoms.find((a) => a.id === metal)?.charge).toBe(n);
          expect(new Set(s.atoms.map((a) => a.id)).size).toBe(s.atoms.length);
        }
    expect(hydroxideNet('Mg', 'base', 1).progress).toBe(0);
  });
  it('keeps proton transfer net-neutral and explicitly retains the water hydrogen', () => {
    expect(ammoniaProton(0, 300)).toMatchObject({ transferred: false, totalCharge: 0 });
    expect(ammoniaProton(1, 300)).toMatchObject({
      transferred: true,
      waterCharge: -1,
      ammoniaCharge: 1,
      totalCharge: 0,
    });
    expect(ammoniaProton(0.5, 300).x).toBeGreaterThan(ammoniaProton(0, 300).x);
  });
  it('has finite guards and direct-seek prediction boundaries', () => {
    for (const n of [NaN, Infinity, -Infinity, -100, 100]) {
      for (const s of [
        halogenDisplacement('Cl', 'I', n, n),
        periodHydroxide('Al', 'acid', n, n),
        magnesiumWater(true, n),
        periodicDirector(n, n, n),
      ])
        for (const v of Object.values(s))
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
    expect(periodicDirector(2, 0, 19.76).shot).toBe('reverse-question');
    expect(periodicDirector(2, 0, 19.77).shot).toBe('reverse-answer');
    expect(periodicDirector(7, 0, 27.2).reveal).toBe(false);
    expect(periodicDirector(7, 0, 27.21).reveal).toBe(true);
    expect(PERIODIC_PLANNED_SECONDS.reduce((a, b) => a + b, 0)).toBeLessThan(270);
  });
  it('uses measured locale boundaries without revealing the predictions during their spoken questions', () => {
    expect(PERIODIC_MEASURED_SECONDS.reduce((a, b) => a + b, 0)).toBe(299);
    for (const [locale, reverse, acid, base, period] of [
      ['zh', 19.77, 21.85, 27.21, 29.23],
      ['en', 21.25, 25.85, 32.23, 35.35],
    ] as const) {
      for (const [chapter, answer, questionShot, answerShot] of [
        [2, reverse, 'reverse-question', 'reverse-answer'],
        [6, acid, 'acid-question', 'acid-limit'],
        [7, base, 'base-question', 'base-answer'],
      ] as const) {
        expect(periodicDirector(chapter, 1, answer - 0.001, locale).shot).toBe(questionShot);
        expect(periodicDirector(chapter, 0, answer, locale).shot).toBe(answerShot);
        expect(periodicDirector(chapter, 1, answer - 0.001, locale).reveal).toBe(false);
      }
      expect(periodicDirector(7, 0, period, locale).shot).toBe('period');
      expect(periodicDirector(7, 0, 52, locale).time).toBe(52);
    }
  });
  it('keeps each measured net event continuous and preserves the same atom and charge ledger', () => {
    for (const locale of ['zh', 'en'] as const) {
      const gasTime = locale === 'en' ? 12.6 : 10.9;
      const before = periodicDirector(4, 0, gasTime - 0.001, locale);
      const at = periodicDirector(4, 0, gasTime, locale);
      expect(magnesiumNet(before.event).hydrogenReady).toBe(false);
      expect(magnesiumNet(at.event).hydrogenReady).toBe(true);
      expect(magnesiumNet(at.event).solidReady).toBe(false);
      for (let t = 0; t <= PERIODIC_MEASURED_SECONDS[4]; t += 0.1) {
        const model = magnesiumNet(periodicDirector(4, 0, t, locale).event);
        expect(model.atoms).toHaveLength(7);
        expect(model.charge).toBe(0);
      }
      const switchTime = locale === 'en' ? 17.7 : 13.1;
      expect(periodicDirector(6, 0, switchTime - 0.001, locale).focus).toBe('Mg');
      expect(periodicDirector(6, 0, switchTime - 0.001, locale).event).toBe(1);
      expect(periodicDirector(6, 0, switchTime, locale).focus).toBe('Al');
      expect(periodicDirector(6, 0, switchTime, locale).event).toBe(0);
    }
  });
  it('keeps the solid metal label clear of its middle hydroxide at each supported width', () => {
    for (const width of [260, 288, 760])
      for (const metal of ['Mg', 'Al'] as const)
        for (const medium of ['acid', 'base'] as const) {
          const state = hydroxideNet(metal, medium, 0, width),
            atom = state.atoms[0];
          for (const oxygen of state.atoms.filter(
            (a) => a.id.startsWith('O') && a.id !== 'O-added',
          ))
            expect(Math.hypot(atom.x - oxygen.x, atom.y - oxygen.y)).toBeGreaterThan(34);
          expect(atom.x + 17).toBeLessThan(width * 0.26 + 52);
        }
  });
  it('keeps textbook period records independent of trial controls', () => {
    expect(PERIOD_RECORDS.map((r) => r.radiusPm)).toEqual([186, 160, 143]);
    expect(PERIOD_RECORDS.map((r) => r.Z)).toEqual([11, 12, 13]);
  });
});
