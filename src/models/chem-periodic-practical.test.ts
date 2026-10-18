import { describe, it, expect } from 'vitest';
import {
  halogenDisplacement,
  magnesiumWater,
  periodHydroxide,
  periodicDirector,
} from './chem-periodic-practical';
describe('periodic practical mechanisms', () => {
  it('preserves halogen atoms/electrons and limits reverse reactions', () => {
    for (const a of ['Cl', 'Br', 'I'] as const)
      for (const b of ['Cl', 'Br', 'I'] as const)
        for (const p of [0, 0.5, 1]) {
          const m = halogenDisplacement(a, b, p);
          expect(2 * m.oxidantLeft + m.oxidantIon).toBeCloseTo(1);
          expect(m.halideLeft + 2 * m.product).toBeCloseTo(1);
          expect(m.electrons).toBeCloseTo(2 * m.product);
        }
    expect(halogenDisplacement('Br', 'Cl').product).toBe(0);
    expect(halogenDisplacement('Cl', 'Br', 1, 0.2).product).toBe(0.2);
  });
  it('tracks magnesium/water atoms with no fake cold kinetic rate', () => {
    const m = magnesiumWater(true, 0.7);
    expect(m.metal + m.hydroxide).toBe(1);
    expect(m.hydrogen).toBe(0.7);
    expect(m.waterUsed).toBe(1.4);
    expect(magnesiumWater(false, 1).hydrogen).toBe(0);
  });
  it('has independent acid stoichiometry and amphoteric base boundary', () => {
    expect(periodHydroxide('Al', 'acid', 1.5).solid).toBe(0.5);
    expect(periodHydroxide('Mg', 'acid', 1).solid).toBe(0.5);
    expect(periodHydroxide('Al', 'base', 1).solid).toBe(0);
    expect(periodHydroxide('Mg', 'base', 10).solid).toBe(1);
    for (const m of ['Mg', 'Al'] as const)
      for (const k of ['none', 'acid', 'base'] as const)
        for (const a of [0, 0.2, 1, 4]) {
          const x = periodHydroxide(m, k, a);
          expect(x.solid + x.dissolved).toBe(1);
          expect(x.reagentUsed + x.reagentLeft).toBe(a);
        }
  });
  it('restores all apparatus steps when seeking', () => {
    expect(periodicDirector(2, 0.4).oxidant).toBe('Br');
    expect(periodicDirector(3, 1).hot).toBe(false);
    expect(periodicDirector(4, 0).hot).toBe(true);
    expect(periodicDirector(6, 0.5).amount).toBe(1.5);
    expect(periodicDirector(7, 1).medium).toBe('base');
  });
});
