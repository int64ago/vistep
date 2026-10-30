import { describe, it, expect } from 'vitest';
import {
  metalRoutes,
  metalExtraction,
  metalAtomMap,
  metalDirector,
  metalReductionEnergy,
  metalPrincipleDirector,
  extractionTemperatures,
} from './chem-metal-extraction';
describe('metallurgy accounting', () => {
  it('conserves every element in all six textbook routes', () => {
    for (const route of metalRoutes) {
      const m = metalExtraction(route, 1);
      expect(m.outputAtoms).toEqual(m.inputAtoms);
      expect(m.electronsAccepted).toBe(m.electronsReleased);
    }
  });
  it('pins electron and product stoichiometry independently', () => {
    expect(metalExtraction('carbon-monoxide', 1)).toMatchObject({
      electronsAccepted: 6,
      metalProduced: 2,
    });
    expect(metalExtraction('aluminium-electrolysis', 1)).toMatchObject({
      electronsAccepted: 12,
      metalProduced: 4,
    });
    expect(metalExtraction('magnesium', 1)).toMatchObject({
      electronsAccepted: 2,
      metalProduced: 1,
    });
  });
  it('requires electrical and molten conditions for the selected ionic route', () => {
    expect(metalExtraction('sodium', 1, { power: false }).extent).toBe(0);
    expect(metalExtraction('sodium', 1, { molten: false }).extent).toBe(0);
    expect(metalExtraction('mercury', 1, { heat: false }).extent).toBe(0);
  });
  it('tracks each atom identity through illustrative rearrangement', () => {
    for (const r of metalRoutes) {
      const a = metalAtomMap(r, 0),
        b = metalAtomMap(r, 1);
      expect(a.map((n) => [n.id, n.element])).toEqual(b.map((n) => [n.id, n.element]));
      expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
      for (const atom of [...a, ...b]) {
        expect(atom.x).toBeGreaterThanOrEqual(20);
        expect(atom.x).toBeLessThanOrEqual(300);
        expect(atom.y).toBeLessThanOrEqual(260);
      }
    }
  });
  it('keeps atom labels distinct during the pedagogical rearrangement', () => {
    for (const r of metalRoutes)
      for (const p of [0.2, 0.4, 0.6, 0.8]) {
        const a = metalAtomMap(r, p);
        for (let i = 0; i < a.length; i++)
          for (let j = i + 1; j < a.length; j++)
            expect(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y)).toBeGreaterThan(32);
      }
  });
  it('bounds progress and reconstructs the overview', () => {
    expect(metalExtraction('sodium', Infinity).extent).toBe(0);
    expect(metalDirector(0, 0.9).progress).toBe(0);
    expect(metalDirector(99, 2)).toEqual(metalDirector(6, 1));
  });
});

describe('conditioned free-energy comparison', () => {
  it('reproduces independent 1000 K JANAF log K combinations, not only implementation arithmetic', () => {
    // JANAF log10(Kf): Fe2O3 29.349, Al2O3 71.114, CO 10.461, CO2 20.679.
    // Independently tabulated equilibrium constants rounded to 0.001.
    const m = metalReductionEnergy(1000, 1),
      factor = (-8.31446261815324 * 1000 * Math.LN10) / 1000;
    expect(m.iron).toBeCloseTo(-24.967, 3);
    expect(m.aluminium).toBeCloseTo(774.604, 3);
    expect(Math.abs(m.iron - factor * (3 * 20.679 - 29.349 - 3 * 10.461))).toBeLessThan(0.06);
    expect(Math.abs(m.aluminium - factor * (3 * 20.679 - 71.114 - 3 * 10.461))).toBeLessThan(0.06);
    expect(Math.abs(m.aluminothermic - factor * (71.114 - 29.349))).toBeLessThan(0.06);
  });
  it('makes the gas-rich counterexample without changing metal identities or temperature', () => {
    const fresh = metalReductionEnergy(1000, 1),
      rich = metalReductionEnergy(1000, 10);
    expect(fresh.iron).toBeLessThan(0);
    expect(rich.iron).toBeGreaterThan(32);
    expect(rich.aluminium).toBeGreaterThan(800);
    expect(rich.iron - fresh.iron).toBeCloseTo(3 * 0.00831446261815324 * 1000 * Math.log(10), 8);
    expect(metalReductionEnergy(1000, fresh.ironEquilibriumRatio).iron).toBeCloseTo(0, 10);
    expect(rich.ironRemoval).toBe(fresh.ironRemoval);
  });
  it('preserves the oxygen-transfer energy cycle and its reverse at every exposed temperature', () => {
    for (const t of extractionTemperatures)
      for (const q of [0.1, 1, 10]) {
        const m = metalReductionEnergy(t, q);
        expect(m.iron - m.aluminium).toBeCloseTo(m.aluminothermic, 8);
        expect(m.aluminothermic + m.reverseAluminothermic).toBe(0);
        expect(m.aluminothermic).toBeLessThan(0);
        expect(m.aluminium).toBeGreaterThan(0);
      }
  });
  it('bounds finite gas conditions and uses tabulated reference phases without extrapolation', () => {
    for (const t of [NaN, Infinity, -1, 0, 900])
      expect(metalReductionEnergy(t, NaN)).toEqual(metalReductionEnergy(1000, 1));
    expect(metalReductionEnergy(800, -10).ratio).toBe(0.1);
    expect(metalReductionEnergy(1200, 100).ratio).toBe(10);
    for (const t of extractionTemperatures)
      for (const q of [0.1, 10])
        for (const v of Object.values(metalReductionEnergy(t, q)))
          expect(Number.isFinite(v)).toBe(true);
  });
  it('retains full chemical accounting independent of the tendency graph', () => {
    const carbon = metalExtraction('aluminium-electrolysis', 1);
    expect(carbon.inputAtoms).toEqual({ Al: 4, O: 6, C: 3 });
    expect(carbon.outputAtoms).toEqual({ Al: 4, O: 6, C: 3 });
    expect(carbon.products.filter((s) => s.name === 'CO₂')).toHaveLength(3);
    expect(carbon.electronsAccepted).toBe(12);
  });
  it('reconstructs comparison, counterexample and carbon-anode shots on direct seek', () => {
    expect(metalPrincipleDirector(2, 0.1)).toMatchObject({ view: 'atoms', gasRatio: 1 });
    expect(metalPrincipleDirector(2, 0.5)).toMatchObject({ view: 'co-comparison', gasRatio: 1 });
    expect(metalPrincipleDirector(2, 0.95)).toMatchObject({ view: 'co-comparison', gasRatio: 10 });
    expect(metalPrincipleDirector(3, 0.9).view).toBe('aluminium-energy');
    expect(metalPrincipleDirector(6, 0.1).view).toBe('co-comparison');
    expect(metalPrincipleDirector(6, 0.95)).toMatchObject({ view: 'electrolysis', progress: 1 });
  });
});

it('uses measured local time for oxygen, energy, reverse prediction and carbon-anode turns', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(metalPrincipleDirector(2, 0.99, 3, locale)).toMatchObject({ view: 'atoms' });
    expect(metalPrincipleDirector(2, 0, 9, locale)).toMatchObject({
      view: 'co-comparison',
      gasRatio: 1,
    });
    expect(metalPrincipleDirector(2, 0, 31, locale).gasRatio).toBe(10);
    const before = metalPrincipleDirector(3, 0, 13, locale),
      after = metalPrincipleDirector(3, 0, 20, locale);
    expect(before).toMatchObject({ view: 'aluminium-energy', reverse: false, progress: 1 });
    expect(after).toMatchObject({ view: 'aluminium-energy', reverse: true, progress: 1 });
    expect(metalPrincipleDirector(6, 0, 7, locale).view).toBe('co-comparison');
    expect(metalPrincipleDirector(6, 0, 10, locale)).toMatchObject({
      view: 'electrolysis',
      progress: 0,
    });
    expect(metalPrincipleDirector(6, 0, 28, locale)).toMatchObject({
      view: 'electrolysis',
      progress: 1,
    });
  }
});
