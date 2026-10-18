import { describe, it, expect } from 'vitest';
import {
  sodiumProtic,
  compareSodium,
  hydrogenProductTest,
  sodiumAlcoholDirector,
} from './chem-sodium-alcohol';
describe('sodium and protic liquids', () => {
  it('conserves atoms and charge at every limit', () => {
    for (const l of ['ethanol', 'water'] as const)
      for (const na of [0, 1, 2, 4])
        for (const donors of [0, 1, 2, 4])
          for (const p of [0, 0.3, 1]) {
            const m = sodiumProtic(l, p, na, donors);
            expect(m.atoms.H).toBeCloseTo(donors * (l === 'ethanol' ? 6 : 2));
            expect(m.sodiumRemaining + m.sodiumIon).toBeCloseTo(na);
            expect(m.donorsRemaining + m.anion).toBeCloseTo(donors);
            expect(m.sodiumIon - m.anion).toBe(0);
            expect(m.hydrogen * 2).toBe(m.extent);
          }
  });
  it('limits hydrogen by sodium and available donor groups', () => {
    expect(sodiumProtic('ethanol', 1, 4, 2).hydrogen).toBe(1);
    expect(sodiumProtic('ethanol', 1, 4, 2).sodiumRemaining).toBe(2);
    expect(sodiumProtic('ethanol', 1, 0).hydrogen).toBe(0);
  });
  it('illustrates faster water reaction while equal final amounts agree', () => {
    const mid = compareSodium(0.3);
    expect(mid.water.extent).toBeGreaterThan(mid.ethanol.extent);
    expect(compareSodium(1).water.hydrogen).toBe(compareSodium(1).ethanol.hydrogen);
    expect(mid.water.sodiumDensity).toBeLessThan(mid.water.liquidDensity);
    expect(mid.ethanol.sodiumDensity).toBeGreaterThan(mid.ethanol.liquidDensity);
  });
  it('hydrogen combustion forms water without carbon dioxide', () => {
    const m = hydrogenProductTest(1, 0.6);
    expect(m.water).toBeCloseTo(0.6);
    expect(2 * m.oxygen).toBe(m.water);
    expect(m.carbonDioxide).toBe(0);
    expect(m.calciumCarbonate).toBe(0);
  });
  it('keeps observation and comparison routes seekable', () => {
    expect(sodiumAlcoholDirector(0, 0).reactionProgress).toBe(0);
    expect(sodiumAlcoholDirector(2, 1).burnProgress).toBe(1);
    expect(sodiumAlcoholDirector(4, 1).compareTime).toBe(0.65);
  });
});
