import { describe, it, expect } from 'vitest';
import {
  osmoticBar,
  membraneFlux,
  reverseOsmosis,
  distillSeawater,
  membraneClasses,
  membranePartition,
  seawaterDirector,
} from './chem-seawater-membranes';
describe('seawater separation accounts', () => {
  it('benchmarks ideal NaCl pressure and both flux directions', () => {
    expect(osmoticBar(35)).toBeCloseTo(29.676, 2);
    expect(membraneFlux(0, 35).signedWater).toBeLessThan(0);
    expect(membraneFlux(osmoticBar(35), 35).water).toBe(0);
    expect(membraneFlux(60, 35).water).toBeGreaterThan(36);
  });
  it('preserves volume and salt including finite salt leakage', () => {
    for (const P of [0, 20, 60, 100])
      for (const C of [0, 35, 70]) {
        const m = reverseOsmosis(P, C, 2);
        expect(m.feedVolume + m.permeateVolume).toBeCloseTo(100);
        expect(m.feedSalt + m.permeateSalt).toBeCloseTo(100 * C);
        expect(m.feedVolume).toBeGreaterThanOrEqual(10);
        expect(m.permeateSalt).toBeGreaterThanOrEqual(0);
      }
    expect(reverseOsmosis(60, 35, 1).permeateSalinity).toBeGreaterThan(0);
  });
  it('concentration rises while production slows', () => {
    const a = reverseOsmosis(60, 35, 0.2),
      b = reverseOsmosis(60, 35, 1.5);
    expect(b.concentrateSalinity).toBeGreaterThan(a.concentrateSalinity);
    expect(b.flux.water).toBeLessThan(a.flux.water);
  });
  it('separates evaporation from collection and retains nonvolatile salt', () => {
    for (const cooling of [true, false]) {
      const m = distillSeawater(0.7, cooling);
      expect(m.remainingWater + m.vapour + m.collected).toBe(100);
      expect(m.productSalt).toBe(0);
    }
    expect(distillSeawater(1, false).collected).toBe(0);
  });
  it('distinguishes membrane classes without destroying rejected species', () => {
    for (const k of membraneClasses)
      for (const v of membranePartition(k, 0.5))
        expect(v.permeate + v.retentate).toBeCloseTo(v.initial);
    expect(membranePartition('UF', 0.5)[2].permeate).toBe(0.5);
    expect(membranePartition('RO', 0.5)[2].permeate).toBeLessThan(0.01);
  });
  it('handles no salt and invalid inputs deterministically', () => {
    expect(reverseOsmosis(60, 0, 1).permeateSalinity).toBe(0);
    expect(reverseOsmosis(NaN, 35, Infinity).permeateVolume).toBe(0);
    expect(seawaterDirector(99, 2)).toEqual(seawaterDirector(7, 1));
  });
});
