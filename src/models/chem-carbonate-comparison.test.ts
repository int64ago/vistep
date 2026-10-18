import { describe, it, expect } from 'vitest';
import {
  aqueousCarbonateState,
  CARBONATE_EQUILIBRIUM,
  carbonateHeating,
  carbonateDissolving,
  carbonateDirector,
  protonTransferGeometry,
  carbonateThermalAtoms,
  CARBONATE_CHAPTER_IDS,
} from './chem-carbonate-comparison';
describe('aqueous carbon and charge balance', () => {
  it('matches independent weak-base and amphiprotic benchmarks', () => {
    const c = aqueousCarbonateState('carbonate', 0.001, 0.1),
      b = aqueousCarbonateState('bicarbonate', 0.001, 0.1);
    const kb = CARBONATE_EQUILIBRIUM.Kw / CARBONATE_EQUILIBRIUM.K2;
    const oh = (-kb + Math.sqrt(kb * kb + 4 * kb * 0.01)) / 2;
    expect(c.pH).toBeCloseTo(14 + Math.log10(oh), 4);
    expect(c.pH).toBeCloseTo(11.133284596739301, 10);
    expect(b.pH).toBeCloseTo((6.35 + 10.33) / 2, 2);
    expect(b.pH).toBeCloseTo(8.335323293817012, 10);
  });
  it('conserves carbon and electric charge through dilution', () => {
    for (const salt of ['carbonate', 'bicarbonate'] as const)
      for (const moles of [0, 1e-7, 1e-5, 0.0001, 0.001])
        for (const volume of [0.1, 1, 10, 100]) {
          const s = aqueousCarbonateState(salt, moles, volume);
          expect(s.carbonResidual).toBeCloseTo(0, 14);
          expect(s.chargeResidual).toBeCloseTo(0, 14);
          expect(Object.values(s.carbonAmounts).reduce((a, b) => a + b, 0)).toBeCloseTo(moles, 14);
          expect(s.sodium * volume).toBeCloseTo((salt === 'carbonate' ? 2 : 1) * moles, 14);
        }
    const before = aqueousCarbonateState('bicarbonate', 0.0001, 0.01),
      after = aqueousCarbonateState('bicarbonate', 0.0001, 1);
    expect(after.pH).toBeLessThan(before.pH);
    expect(after.pH).toBeGreaterThan(7);
    expect(after.indicator).toBe(0);
    expect(after.totalCarbonMoles).toBe(before.totalCarbonMoles);
  });
  it('handles zero carbon, finite boundaries, and very dilute water', () => {
    expect(aqueousCarbonateState('carbonate', 0, 0.1).pH).toBeCloseTo(7, 12);
    for (const n of [NaN, Infinity, -Infinity, -1, 1e20]) {
      const s = aqueousCarbonateState('bicarbonate', n, n);
      for (const v of [s.H, s.OH, s.pH, s.concentration, s.sodium, s.indicator])
        expect(Number.isFinite(v)).toBe(true);
    }
    expect(aqueousCarbonateState('carbonate', 0.02, 0.001).withinDiluteRange).toBe(false);
  });
});
describe('net particle and material maps', () => {
  it('retains every proton-transfer atom and balances endpoint charges', () => {
    for (const route of [
      'carbonate-accepts',
      'bicarbonate-accepts',
      'bicarbonate-donates',
    ] as const)
      for (const width of [248, 390, 640, 900]) {
        const start = protonTransferGeometry(width, route, 0),
          end = protonTransferGeometry(width, route, 1);
        expect(start.atoms.map((a) => [a.id, a.element])).toEqual(
          end.atoms.map((a) => [a.id, a.element]),
        );
        expect(new Set(start.atoms.map((a) => a.id)).size).toBe(start.atoms.length);
        expect(start.charges.before.reduce((a, b) => a + b, 0) + start.spectatorSodium).toBe(0);
        expect(end.charges.after.reduce((a, b) => a + b, 0) + end.spectatorSodium).toBe(0);
        for (const a of end.atoms)
          expect(a.x > 10 && a.x < width - 10 && a.y > 10 && a.y < end.height - 10).toBe(true);
        expect(start.atoms.filter((a) => a.tracked)).toHaveLength(1);
      }
  });
  it('keeps exactly 2Na, 2C, 2H and 6O through thermal redistribution', () => {
    for (const width of [248, 390, 640, 900])
      for (const p of [0, 0.2, 0.5, 0.8, 1]) {
        const s = carbonateThermalAtoms(width, p),
          count = (e: string) => s.atoms.filter((a) => a.element === e).length;
        expect([count('Na'), count('C'), count('H'), count('O')]).toEqual([2, 2, 2, 6]);
        expect(new Set(s.atoms.map((a) => a.id)).size).toBe(12);
        for (const a of s.atoms)
          expect(a.x > 10 && a.x < width - 10 && a.y > 10 && a.y < s.height - 10).toBe(true);
      }
  });
  it('matches independently calculated residue and further-heating limits', () => {
    for (const x of [0, 0.2, 0.5, 0.8, 1]) {
      const s = carbonateHeating('bicarbonate', 1, x);
      expect(s.residueGrams + s.waterGrams + s.carbonDioxideGrams).toBeCloseTo(1, 10);
      expect(s.residueGrams - s.furtherLossGrams).toBeCloseTo(105.9888 / (2 * 84.0066), 10);
    }
    expect(carbonateHeating('bicarbonate', 1, 0.5).residueGrams).toBeCloseTo(
      0.8154180742941626,
      10,
    );
    expect(carbonateHeating('bicarbonate', 1, 1).residueGrams).toBeCloseTo(0.6308361485883252, 10);
    expect(carbonateHeating('carbonate', 1, 1).gasMoles).toBe(0);
    expect(carbonateHeating('carbonate', 1, 1).residueGrams).toBe(1);
    expect(carbonateHeating('bicarbonate', 0, 1).residueGrams).toBe(0);
    for (const n of [NaN, Infinity, -Infinity])
      for (const v of Object.values(carbonateHeating('bicarbonate', n, n)))
        expect(Number.isFinite(v)).toBe(true);
  });
  it('keeps the two lesson windows self-contained and reproducible', () => {
    expect(CARBONATE_CHAPTER_IDS.slice(0, 5)).toEqual([
      'water',
      'solvation-energy',
      'indicator',
      'proton-balance',
      'dilution-prediction',
    ]);
    expect(CARBONATE_CHAPTER_IDS.slice(5)).toEqual(['carbonate-heat', 'bicarbonate-heat', 'mass']);
    expect(carbonateDirector(5, 1).extent).toBe(0);
    expect(carbonateDirector(6, 0.5).thermalAtoms).toBe(true);
    expect(carbonateDirector(3, 0.4)).toEqual(carbonateDirector(3, 0.4));
    expect(carbonateDirector(NaN, Infinity).id).toBe('water');
    expect(carbonateDissolving('bicarbonate', 1).residualGrams).toBeGreaterThan(0.5);
    expect(carbonateDissolving('carbonate', 1).residualGrams).toBe(0);
  });
});

describe('measured bilingual narration events', () => {
  it('uses chapter seconds for causal events, including the different proton sentence timings', () => {
    const at = (c: number, t: number, locale: 'zh' | 'en' = 'zh') =>
      carbonateDirector(c, 0, t, locale);
    expect(at(1, 3).energyPhase).toBe('separate');
    expect(at(1, 5).energyPhase).toBe('hydrate');
    expect(at(1, 14).energySalt).toBe('carbonate');
    expect(at(1, 17).energySalt).toBe('bicarbonate');
    expect(at(2, 14).modelComparison).toBe(false);
    expect(at(2, 16).modelComparison).toBe(true);
    expect(at(3, 7).protonProgress).toBe(1);
    expect(at(3, 13.5, 'en').protonRoute).toBe('bicarbonate-accepts');
    expect(at(3, 13.5, 'zh').protonRoute).toBe('carbonate-accepts');
    expect(at(3, 17, 'en').protonRoute).toBe('bicarbonate-donates');
    expect(at(3, 17, 'zh').protonRoute).toBe('bicarbonate-accepts');
    for (const [locale, acceptStart, donateStart, poolStart] of [
      ['en', 13, 17.05, 21],
      ['zh', 14.8, 18.75, 22.4],
    ] as const) {
      // Each marked hydrogen remains trackable for three seconds, with an endpoint
      // hold before changing routes. The first route is a fresh bicarbonate sample.
      for (const start of [acceptStart, donateStart]) {
        expect(at(3, start, locale).protonProgress).toBeCloseTo(0, 10);
        expect(at(3, start + 1.5, locale).protonProgress).toBeCloseTo(0.5, 10);
        expect(at(3, start + 3.1, locale).protonProgress).toBe(1);
        expect(at(3, start + 3.1, locale).equilibrium).toBe(false);
      }
      expect(at(3, poolStart, locale).equilibrium).toBe(true);
    }
    expect(at(4, 12).dilutionFactor).toBe(100);
    expect(at(6, 6.6).thermalAtoms).toBe(false);
    expect(at(6, 7.2).thermalAtoms).toBe(true);
    expect(at(6, 23).thermalAtoms).toBe(true);
    expect(at(6, 16).atomProgress).toBe(1);
    expect(at(7, 2.7).extent).toBe(1);
    expect(at(7, 11).massComparison).toBe(true);
    expect(at(7, 17).reheating).toBe(false);
    expect(at(7, 19).reheating).toBe(true);
  });
});
