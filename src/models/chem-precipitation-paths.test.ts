import { describe, it, expect } from 'vitest';
import {
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
