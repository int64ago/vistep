import { describe, it, expect } from 'vitest';
import {
  proteinPopulation,
  proteinColour,
  proteinDirector,
  proteinSymbol,
} from './chem-protein-states';
describe('protein observations', () => {
  it('conserves protein inventory independently of appearance or water', () => {
    for (const t of ['salt', 'heat', 'silver', 'ethanol', 'lead'] as const)
      for (const p of [0, 0.3, 1])
        for (const w of [0, 1, 3]) {
          const m = proteinPopulation(t, p, w);
          expect(m.native + m.denatured).toBeCloseTo(m.total);
          expect(m.precipitated + m.dissolved).toBeCloseTo(m.total);
          expect(m.peptideInventory).toBe(m.total);
          expect(m.precipitated).toBeGreaterThanOrEqual(0);
        }
  });
  it('redissolves the chosen salted population without changing its fold state', () => {
    const a = proteinPopulation('salt', 1),
      b = proteinPopulation('salt', 1, 3);
    expect(a.precipitated).toBeGreaterThan(0.8);
    expect(b.precipitated).toBe(0);
    expect(a.saltAmount).toBe(b.saltAmount);
    expect(b.saltConcentration).toBe(a.saltConcentration / 4);
    expect(a.native).toBe(b.native);
  });
  it('dilutes but does not reverse the chosen denatured aggregates', () => {
    for (const t of ['heat', 'silver', 'ethanol', 'lead'] as const) {
      const a = proteinPopulation(t, 1),
        b = proteinPopulation(t, 1, 3);
      expect(a.precipitated).toBe(b.precipitated);
      expect(b.native).toBe(0);
      expect(b.concentration).toBe(a.concentration / 4);
    }
  });
  it('keeps colour site accounting distinct from protein amount', () => {
    for (const f of [0, 0.3, 1])
      for (const p of [0, 0.2, 0.6, 1]) {
        const m = proteinColour(p, f);
        expect(m.reacted + m.sitesRemaining).toBeCloseTo(m.sites);
        expect(m.waterFormed).toBe(m.nitricAcidConsumed);
      }
    expect(proteinColour(0.2).yellowFraction).toBe(0);
    expect(proteinColour(1, 0).whitePrecipitate).toBe(1);
    expect(proteinColour(1, 0).yellowFraction).toBe(0);
  });
  it('tracks the same eight objects and supports independent chapter seeking', () => {
    for (const a of [0, 0.3, 1]) {
      const items = Array.from({ length: 8 }, (_, i) => proteinSymbol(i, a, 0.5));
      expect(items.reduce((s, x) => s + x.aggregated, 0)).toBeCloseTo(8 * a);
      expect(
        items.every((x) => x.points.length === 18 && x.points.flat().every(Number.isFinite)),
      ).toBe(true);
    }
    expect(proteinDirector(1, 0).exposure).toBe(1);
    expect(proteinDirector(4, 1).addedWater).toBe(3);
  });
});
