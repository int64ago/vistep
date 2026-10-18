import { describe, it, expect } from 'vitest';
import {
  sugarCarbonization,
  sugarDirector,
  carbonColumnOutline,
  SUGAR_GRAINS,
} from './chem-sugar-carbonization';
describe('sugar dehydration and foaming', () => {
  it('balances all atoms for dehydration plus selected carbon oxidation pathway', () => {
    for (const d of [0, 0.1, 0.5, 1])
      for (const f of [0, 0.02, 0.5, 1]) {
        const m = sugarCarbonization(d, f, 0.8);
        for (const e of ['C', 'H', 'O', 'S'] as const)
          expect(m.finalAtoms[e]).toBeCloseTo(m.initialAtoms[e], 12);
      }
    expect(sugarCarbonization(1).amounts).toEqual({
      sucrose: 0,
      carbon: 12,
      water: 11,
      carbonDioxide: 0,
      sulfurDioxide: 0,
      acidConsumed: 0,
    });
  });
  it('separates reaction stoichiometry from pore volume', () => {
    const dense = sugarCarbonization(1, 0, 0),
      foam = sugarCarbonization(1, 0, 0.88);
    expect(foam.amounts).toEqual(dense.amounts);
    expect(foam.bulkVolume / dense.bulkVolume).toBeCloseTo(1 / 0.12, 12);
    expect(foam.voidVolume / foam.bulkVolume).toBeCloseTo(0.88, 12);
    expect(sugarCarbonization(1, 1, 0.88).bulkVolume).toBe(0);
  });
  it('keeps all state endpoints finite and grains deterministic', () => {
    for (const v of [-10, NaN, 1, 5]) {
      const m = sugarCarbonization(v, v, v);
      expect(Number.isFinite(m.bulkVolume)).toBe(true);
      expect(m.porosity).toBeLessThanOrEqual(0.88);
      expect(m.bulkVolume).toBeLessThanOrEqual(3.7500001);
      expect(m.amounts.carbon).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(SUGAR_GRAINS.map((g) => g.id)).size).toBe(91);
    expect(carbonColumnOutline(100)).not.toContain('NaN');
  });
  it('makes pore-growth control a comparison at fixed carbon amount', () => {
    const a = sugarDirector(4, 0),
      b = sugarDirector(4, 1);
    expect(a.dehydration).toBe(b.dehydration);
    expect(a.oxidizedFraction).toBe(b.oxidizedFraction);
    expect(a.porosity).toBe(0);
    expect(b.porosity).toBe(0.88);
  });
});
