import { describe, it, expect } from 'vitest';
import {
  reactionHeat,
  phaseState,
  magnesiumInventory,
  crystalInventory,
  waterLatentHeat,
  heatDirector,
} from './chem-reaction-heat';
describe('reaction heat and interface freezing', () => {
  it('tracks heat exchanged with the environment and conserves the complete energy balance', () => {
    for (const kind of ['magnesium', 'crystals'] as const)
      for (const t of [0, 5, 19, 30, 60, 90])
        for (const k of [0, 0.06, 0.5])
          expect(reactionHeat(kind, t, { coupling: k }).energyResidual).toBeCloseTo(0, 8);
  });
  it('matches independent adiabatic warm and frozen endpoints', () => {
    expect(reactionHeat('magnesium', 30, { coupling: 0 }).temperature).toBeCloseTo(26, 9);
    const initial = (20 + 0.0005 * 4180) * 20 + 0.0005 * waterLatentHeat;
    expect(reactionHeat('crystals', 30, { coupling: 0 }).temperature).toBeCloseTo(
      (initial - 800) / (20 + 0.0005 * 2100),
      8,
    );
    expect(reactionHeat('crystals', 30, { coupling: 0 }).iceFraction).toBe(1);
  });
  it('holds phase change at zero and distinguishes dry and insufficient cooling boundaries', () => {
    expect(phaseState((0.0005 * waterLatentHeat) / 2).temperature).toBe(0);
    expect(phaseState((0.0005 * waterLatentHeat) / 2).iceFraction).toBeCloseTo(0.5);
    expect(reactionHeat('crystals', 40, { waterMass: 0 }).attached).toBe(false);
    expect(reactionHeat('crystals', 40, { amount: 0.2 }).iceFraction).toBe(0);
    expect(reactionHeat('crystals', 40).attached).toBe(true);
  });
  it('retains products while a warm vessel cools', () => {
    const a = reactionHeat('magnesium', 30),
      b = reactionHeat('magnesium', 90);
    expect(b.temperature).toBeLessThan(a.temperature);
    expect(a.inventory).toEqual(b.inventory);
    expect(b.heatFlowIntoMixture).toBeLessThan(0);
  });
  it('conserves atoms and charge in the stoichiometric inventories', () => {
    for (const x of [0, 0.2, 0.7, 1]) {
      const m = magnesiumInventory(x);
      expect(m.magnesium + m.magnesiumIon).toBeCloseTo(1);
      expect(m.hydrogenIon + 2 * m.hydrogenGas).toBeCloseTo(2.4);
      expect(m.hydrogenIon + 2 * m.magnesiumIon - m.chloride).toBeCloseTo(0);
      const c = crystalInventory(x);
      expect(c.hydrate + c.bariumChloride).toBeCloseTo(1);
      expect(c.ammoniumChloride + c.ammonia).toBeCloseTo(2.2);
      expect(18 * c.hydrate + 4 * c.ammoniumChloride + 3 * c.ammonia + 2 * c.water).toBeCloseTo(
        26.8,
      );
      expect(10 * c.hydrate + c.water).toBeCloseTo(10);
    }
  });
  it('seek reconstructs heating, cooling and lift without an independent clock', () => {
    expect(heatDirector(2, 1).seconds).toBe(90);
    expect(heatDirector(5, 1).lift).toBe(30);
    expect(reactionHeat('crystals', 21)).toEqual(reactionHeat('crystals', 21));
  });
});
