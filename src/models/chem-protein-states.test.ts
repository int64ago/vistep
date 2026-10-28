import { describe, it, expect } from 'vitest';
import {
  proteinPopulation,
  proteinNitration,
  proteinBurnAccount,
  proteinColour,
  proteinDirector,
  proteinMeasuredDirector,
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

describe('aromatic site evidence and boundaries', () => {
  it('preserves the phenolic ring and chain attachment through net nitration', () => {
    const before = proteinNitration(0.2),
      after = proteinNitration(0.68);
    expect(after.ring).toEqual(before.ring);
    expect(after.ring).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      const a = after.ring[i],
        b = after.ring[(i + 1) % 6];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(48);
    }
    expect(after.nitro.id).toBe(before.nitro.id);
    expect(after.aromaticHydrogen.id).toBe(before.aromaticHydrogen.id);
    expect(after.peptideBondsCleaved).toBe(0);
    expect(after.extent).toBe(1);
  });
  it('counts sites and mononitration products without using protein mass as colour', () => {
    for (const sample of ['many', 'few', 'none'] as const)
      for (const p of [0, 0.2, 0.35, 0.5, 0.65, 1]) {
        const m = proteinNitration(p, sample);
        expect(m.reacted + m.remaining).toBeCloseTo(m.sites);
        expect(m.nitricAcidConsumed).toBe(m.waterFormed);
        expect(m.proteinAmount).toBe(1);
        expect(m.reacted).toBeGreaterThanOrEqual(0);
        expect(m.reacted).toBeLessThanOrEqual(m.sites);
      }
    expect(proteinNitration(1, 'many').yellowFraction).toBe(1);
    expect(proteinNitration(1, 'few').yellowFraction).toBeCloseTo(1 / 3);
    expect(proteinNitration(1, 'none').yellowFraction).toBe(0);
    expect(proteinNitration(1, 'none').whitePrecipitate).toBe(1);
  });
  it('separates precipitation, heating conditions and an unactivated aromatic ring', () => {
    const white = proteinNitration(0.17);
    expect(white.whitePrecipitate).toBe(1);
    expect(white.yellowFraction).toBe(0);
    expect(proteinNitration(1, 'many', 'tyrosine', false).whitePrecipitate).toBe(0);
    expect(proteinNitration(1, 'many', 'tyrosine', false).reacted).toBe(0);
    expect(proteinNitration(1, 'many', 'tyrosine', true, false).reacted).toBe(0);
    expect(proteinNitration(1, 'many', 'phenylalanine').reacted).toBe(0);
  });
  it('has bounded deterministic extreme inputs and a conserved illustrative burn account', () => {
    for (const p of [-10, 0, 0.3, 0.6, 1, 10, NaN, Infinity]) {
      const m = proteinNitration(p),
        b = proteinBurnAccount(p);
      expect(
        [
          m.extent,
          m.reacted,
          m.whitePrecipitate,
          m.yellowFraction,
          ...m.ring.flatMap((a) => [a.x, a.y]),
        ].every(Number.isFinite),
      ).toBe(true);
      expect(b.originalMaterial + b.residue + b.volatileProducts).toBeCloseTo(1);
      expect(b.originalMaterial).toBeGreaterThanOrEqual(0);
      expect(proteinNitration(p)).toEqual(m);
    }
  });
  it('lead-salt prediction retains aggregated chains after authored dilution', () => {
    const d = proteinDirector(5, 1),
      m = proteinPopulation('lead', d.exposure, d.addedWater);
    expect(d.addedWater).toBe(3);
    expect(m.total).toBe(1);
    expect(m.precipitated).toBe(proteinPopulation('lead', 1).precipitated);
    expect(m.peptideInventory).toBe(1);
  });
});

describe('measured speech direction', () => {
  it('uses local word landmarks in both languages while retaining direct seek', () => {
    for (const en of [false, true]) {
      const d = (t: number) => proteinMeasuredDirector(6, t / 55, t, en);
      expect(proteinNitration(d(2).progress).shot).toBe('precipitate');
      expect(proteinNitration(d(en ? 3.4 : 4.3).progress).shot).toBe('site');
      expect(proteinNitration(d(en ? 11.5 : 9.6).progress).extent).toBe(0);
      expect(proteinNitration(d(17.5).progress).extent).toBe(1);
      expect(proteinNitration(d(en ? 24.3 : 23).progress).shot).toBe('compare');
      expect(proteinNitration(d(en ? 31.6 : 30.6).progress).shot).toBe('boundary');
      expect(d(12)).toEqual(d(12));
      expect(proteinMeasuredDirector(5, 0.7, 24, en).addedWater).toBe(3);
      expect(proteinMeasuredDirector(5, 0.5, 17, en).addedWater).toBe(0);
    }
  });
});
