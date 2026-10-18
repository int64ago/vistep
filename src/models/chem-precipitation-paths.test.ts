import { describe, it, expect } from 'vitest';
import {
  precipitationDirector,
  PRECIPITATION_SPEECH_EVENTS,
  magnesiumAcidPerturbation,
  silverSequenceStages,
  silverIodideSaturationRatio,
  silverTransfer,
  silverTransferGeometry,
  bariumSulfate,
  magnesiumAcid,
  silverExchange,
  magnesiumIron,
} from './chem-precipitation-paths';
describe('precipitation mechanisms', () => {
  it('matches sqrt(Ksp) at equimolar barium/sulfate and preserves spectators', () => {
    const s = bariumSulfate(1);
    expect(s.barium / 0.1 / 1000).toBeCloseTo(Math.sqrt(1.1e-10), 12);
    expect(s.equilibriumQ).toBeCloseTo(1.1e-10, 18);
    expect(s.sodium).toBe(2);
    expect(s.chloride).toBe(2);
    expect(s.precipitate + s.barium).toBeCloseTo(1, 12);
    expect(bariumSulfate(0).precipitate).toBe(0);
  });
  it('solves Mg(OH)2 water solubility and acid charge balance independently', () => {
    const water = magnesiumAcid(0);
    expect(water.dissolved).toBeCloseTo(Math.cbrt(1.5e-11 / 4), 8);
    expect(magnesiumAcid(0.03).solid).toBe(0);
    expect(magnesiumAcid(0.03).pH).toBeCloseTo(2, 6);
    for (const a of [0, 0.005, 0.019, 0.02, 0.03])
      expect(Math.abs(magnesiumAcid(a).chargeResidual)).toBeLessThan(1e-12);
  });
  it('conserves silver through 1:1 iodide and 2:1 sulfide exchange', () => {
    for (const i of [0, 0.2, 1])
      for (const s of [0, 0.1, 0.5]) expect(silverExchange(i, s).silverTotal).toBeCloseTo(1, 12);
    expect(silverExchange(1, 0).agI).toBe(1);
    expect(silverExchange(1, 0.5).ag2S).toBe(0.5);
  });
  it('distinguishes residual free hydroxide from actual Mg solid conversion', () => {
    const a = magnesiumIron(0.4, 0),
      b = magnesiumIron(0.4, 1.2);
    expect(a.dissolvedMagnesium).toBeCloseTo(0.6);
    expect(b.dissolvedMagnesium).toBeCloseTo(0, 12);
    expect(a.ironHydroxide).toBe(b.ironHydroxide);
    expect(a.magnesiumHydroxide + a.dissolvedMagnesium).toBeCloseTo(1);
    for (const prepared of [0, 0.2, 0.8, 1]) {
      const partial = magnesiumIron(0.5, 0, prepared);
      expect(partial.magnesiumHydroxide).toBeGreaterThanOrEqual(0);
      expect(partial.magnesiumHydroxide + partial.dissolvedMagnesium).toBeCloseTo(prepared);
    }
  });
});

describe('causal intermediate states', () => {
  it('acid lowers Q before dissolution and restores saturation only when solid remains', () => {
    const start = magnesiumAcidPerturbation(0, 0.012, 0);
    expect(start.dissolved).toBeCloseTo(magnesiumAcid(0).dissolved, 12);
    expect(start.saturation).toBeLessThan(1e-12);
    for (const A of [0.005, 0.012, 0.024, 0.04])
      for (const p of [0, 0.1, 0.5, 0.9, 1]) {
        const s = magnesiumAcidPerturbation(0, A, p);
        expect(s.dissolved + s.solid).toBeCloseTo(0.01, 14);
        expect(s.hydrogen * s.hydroxide).toBeCloseTo(1e-14, 24);
        expect(s.chargeResidual).toBeCloseTo(0, 12);
        expect(s.saturation).toBeLessThanOrEqual(1 + 1e-8);
        if (p === 1 && s.solid > 0) expect(s.saturation).toBeCloseTo(1, 9);
      }
    expect(magnesiumAcidPerturbation(0, 0.024, 1).solid).toBe(0);
    expect(magnesiumAcidPerturbation(0, 0.024, 1).saturation).toBeLessThan(1);
  });
  it('re-forms iodide after the supersaturated mixed-silver intermediate', () => {
    const stages = silverSequenceStages(0.3, 0.2);
    expect(stages.intermediate.agCl).toBeCloseTo(0.6);
    expect(stages.intermediate.aqueousI).toBeCloseTo(0.3);
    // Independent textbook Ksp ratio at residual AgCl saturation.
    expect(silverIodideSaturationRatio(0.3, 0.4)).toBeCloseTo(1588235.294117647, 6);
    expect(stages.endpoint.agCl).toBeCloseTo(0.3);
    expect(stages.endpoint.agI).toBeCloseTo(0.3);
    expect(stages.endpoint.ag2S).toBeCloseTo(0.2);
    expect(stages.reformed).toBeCloseTo(0.3);
    expect(stages.endpoint.aqueousCl).toBeCloseTo(0.7);
  });
  it('counts every silver once while water carries it between solids', () => {
    for (const I of [0, 0.3, 1])
      for (const S of [0, 0.2, 0.5])
        for (const route of ['iodide', 'sulfide', 'reform'] as const)
          for (const p of [0, 0.1, 0.35, 0.5, 0.65, 0.9, 1]) {
            const { state: s } = silverTransfer(I, S, route, p);
            expect(s.agCl + s.agI + 2 * s.ag2S + s.aqueousAg).toBeCloseTo(1, 12);
            expect(s.agCl + s.aqueousCl).toBeCloseTo(1, 12);
            expect(s.agI + s.aqueousI).toBeCloseTo(s.iodideAdded, 12);
            expect(s.ag2S + s.aqueousS).toBeCloseTo(s.sulfideAdded, 12);
            for (const n of Object.values(s)) expect(n).toBeGreaterThanOrEqual(-1e-12);
          }
    const mid = silverTransfer(1, 0, 'iodide', 0.5).state;
    expect(mid.aqueousAg).toBeCloseTo(0.1);
    expect(mid.agCl + mid.agI + 2 * mid.ag2S).toBeCloseTo(0.9);
  });
  it('keeps marker identities and phase membership across reallocation', () => {
    for (const w of [248, 390, 640, 900])
      for (const route of ['iodide', 'sulfide', 'reform'] as const)
        for (const p of [0, 0.2, 0.5, 0.8, 1]) {
          const s = silverTransferGeometry(w, 0.3, 0.2, route, p);
          expect(new Set(s.tokens.map((t) => t.id)).size).toBe(10);
          for (const t of s.tokens) {
            expect(t.x).toBeGreaterThan(10);
            expect(t.x).toBeLessThan(w - 10);
            expect(t.y).toBeGreaterThan(10);
            expect(t.y).toBeLessThan(s.height);
          }
        }
    const end = silverTransferGeometry(248, 0.3, 0.2, 'reform', 1);
    expect(end.tokens.filter((t) => t.phase === 0)).toHaveLength(3);
    expect(end.tokens.filter((t) => t.phase === 1)).toHaveLength(3);
    expect(end.tokens.filter((t) => t.phase === 2)).toHaveLength(4);
  });
  it('preserves supplied amounts and handles finite-input boundaries', () => {
    for (const T of [0, 0.2, 1])
      for (const I of [0, 0.3, 1])
        for (const S of [0, 0.2, 0.5]) {
          const s = silverExchange(I, S, T);
          expect(s.silverTotal).toBeCloseTo(T, 12);
          expect(s.agI + s.aqueousI).toBeCloseTo(I, 12);
          expect(s.ag2S + s.aqueousS).toBeCloseTo(S, 12);
        }
    for (const n of [NaN, Infinity, -Infinity, -1]) {
      for (const s of [
        bariumSulfate(n),
        magnesiumAcid(n),
        magnesiumAcidPerturbation(n, n, n),
        silverExchange(n, n, n),
        magnesiumIron(n, n, n),
      ])
        for (const v of Object.values(s))
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe('shared visible silver transport', () => {
  it('derives all visible phase counts from the same parcels as the inventory', () => {
    for (const I of [0, 0.3, 0.6, 1])
      for (const S of [0, 0.1, 0.2, 0.5])
        for (const route of ['iodide', 'sulfide', 'reform'] as const)
          for (const p of [0, 0.0001, 0.1, 0.39, 0.49, 0.65, 0.83, 0.97, 1]) {
            const { state } = silverTransfer(I, S, route, p),
              g = silverTransferGeometry(248, I, S, route, p);
            const count = (phase: number | string) =>
              g.tokens.filter((t) => t.phase === phase).length;
            expect(count(0) * 0.1).toBeCloseTo(state.agCl, 10);
            expect(count(1) * 0.1).toBeCloseTo(state.agI, 10);
            expect(count(2) * 0.1).toBeCloseTo(2 * state.ag2S, 10);
            expect(count('water') * 0.1).toBeCloseTo(state.aqueousAg, 10);
            expect(count(2) % 2).toBe(0);
          }
  });
});

describe('measured bilingual causal event timing', () => {
  it('finishes acid proton transfer before Q drops, then holds Q before net Mg transfer', () => {
    for (const locale of ['zh', 'en'] as const) {
      const e = PRECIPITATION_SPEECH_EVENTS[locale];
      const neutral = precipitationDirector(3, e.neutral[1], locale);
      expect(neutral.acidShot).toBe('neutralize');
      expect(neutral.neutralProgress).toBe(1);
      const q = precipitationDirector(3, e.acidQ + 0.05, locale);
      expect(q.acidShot).toBe('dissolve');
      expect(q.acidRelax).toBe(0);
      const s = magnesiumAcidPerturbation(0, 0.012, q.acidRelax);
      expect(s.saturation).toBeLessThan(1);
      expect(s.dissolved).toBeCloseTo(magnesiumAcid(0).dissolved);
      expect(precipitationDirector(3, e.acidDissolve[1], locale).acidRelax).toBe(1);
      expect(precipitationDirector(3, e.acidComplete[1], locale).acidFinal).toBe(1);
    }
  });
  it('shows a real limited-iodide endpoint and preserves its four silver IDs when more reagent is added', () => {
    for (const locale of ['zh', 'en'] as const) {
      const e = PRECIPITATION_SPEECH_EVENTS[locale],
        before = precipitationDirector(5, e.iodideExpand[0] - 0.0001, locale),
        after = precipitationDirector(5, e.iodideExpand[0], locale);
      const a = silverTransfer(before.silverIodide, 0, 'iodide', before.silverProgress).state,
        b = silverTransfer(after.silverIodide, 0, 'iodide', after.silverProgress).state;
      expect(a.agI).toBeCloseTo(0.4);
      expect(a.agCl).toBeCloseTo(0.6);
      expect(a.aqueousAg).toBeCloseTo(0);
      expect(b.agI).toBeCloseTo(a.agI);
      expect(b.agCl).toBeCloseTo(a.agCl);
      expect(b.aqueousAg).toBeCloseTo(0);
      const g = silverTransferGeometry(256, after.silverIodide, 0, 'iodide', after.silverProgress);
      expect(g.tokens.filter((t) => t.phase === 1).map((t) => t.id)).toEqual([
        'Ag-0',
        'Ag-1',
        'Ag-2',
        'Ag-3',
      ]);
      const end = precipitationDirector(5, e.iodideExpand[1], locale);
      expect(
        silverTransfer(end.silverIodide, 0, 'iodide', end.silverProgress).state.agI,
      ).toBeCloseTo(1, 12);
    }
  });
  it('leaves time to follow the first silver pair through water and inspect the two-to-one endpoint', () => {
    for (const locale of ['zh', 'en'] as const) {
      const e = PRECIPITATION_SPEECH_EVENTS[locale],
        mid = precipitationDirector(6, (e.sulfideFirst[0] + e.sulfideFirst[1]) / 2, locale),
        hold = precipitationDirector(6, e.sulfideFirst[1] + 0.1, locale);
      const s = silverTransfer(1, 0.5, 'sulfide', mid.silverProgress).state;
      expect(s.aqueousAg).toBeCloseTo(0.2);
      expect(s.agI).toBeCloseTo(0.8);
      const h = silverTransfer(1, 0.5, 'sulfide', hold.silverProgress).state;
      expect(h.ag2S).toBeCloseTo(0.1);
      expect(h.agI).toBeCloseTo(0.8);
      expect(h.aqueousAg).toBeCloseTo(0);
    }
  });
});
