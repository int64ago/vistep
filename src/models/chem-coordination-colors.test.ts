import { describe, it, expect } from 'vitest';
import {
  copper,
  silver,
  Ksp,
  Kf,
  copperLigands,
  silverLigands,
  length,
  sub,
  ironComparison,
} from './chem-coordination-colors';
describe('coordination observations and conditional solubility', () => {
  it('preserves normalized copper across distinct observed phases and reagent controls', () => {
    for (const stage of ['precipitate', 'ammine', 'crystallize'] as const)
      for (let i = 0; i <= 100; i++) {
        const s = copper(stage, i / 100);
        expect(s.total).toBeCloseTo(1);
        for (const x of [s.aqua, s.hydroxide, s.complex, s.crystal])
          expect(x).toBeGreaterThanOrEqual(0);
      }
    expect(copper('precipitate', 1)).toEqual({
      aqua: 0,
      hydroxide: 1,
      complex: 0,
      crystal: 0,
      total: 1,
    });
    expect(copper('ammine', 1).complex).toBe(1);
    expect(copper('ammine', 1, false).hydroxide).toBe(1);
    expect(copper('crystallize', 1, false).crystal).toBe(0);
  });
  it('matches the known AgCl ammonia overall equilibrium and conserves silver', () => {
    expect(Ksp * Kf).toBeCloseTo(0.00306, 9);
    for (let i = 0; i <= 100; i++) {
      const s = silver(i / 200);
      expect(s.freeAg + s.complex + s.solid).toBeCloseTo(0.003, 12);
      expect(s.complex / (s.freeAg || 1)).toBeCloseTo(Kf * s.freeNH3 ** 2, 5);
      if (s.solid > 0) expect(s.freeAg * s.chloride).toBeCloseTo(Ksp, 15);
      else expect(s.freeAg * s.chloride).toBeLessThanOrEqual(Ksp + 1e-15);
    }
    expect(silver(0).fraction).toBeLessThan(2e-6);
    expect(silver(0.3).solid).toBe(0);
  });
  it('retains the common-ion boundary: extra chloride makes dissolution harder', () => {
    expect(silver(0.15, 0.003, 0.1).fraction).toBeLessThan(silver(0.15, 0.003, 0.01).fraction);
    expect(silver(0.3, 0.003, 1).solid).toBeGreaterThan(0);
  });
  it('preserves ligand identity, OH/NH geometry and continuous independent paths', () => {
    for (let k = 0; k <= 100; k++) {
      const lig = copperLigands(k / 100);
      expect(new Set(lig.map((l) => l.id)).size).toBe(10);
      for (const l of lig)
        for (const h of l.hydrogens)
          expect(length(sub(h, l.center))).toBeCloseTo(l.element === 'O' ? 0.96 : 1.01, 10);
      if (k)
        for (const l of lig)
          expect(
            length(sub(l.center, copperLigands((k - 1) / 100).find((v) => v.id === l.id)!.center)),
          ).toBeLessThan(0.4);
    }
    const end = copperLigands(1);
    expect(end.filter((l) => l.element === 'N' && l.bound === 1)).toHaveLength(4);
    expect(end.filter((l) => l.axial)).toHaveLength(2);
    for (const l of end.filter((l) => l.element === 'N'))
      expect(length(l.center)).toBeCloseTo(2.03, 10);
  });
  it('gives linear diamminesilver and a cyanide-bound iron counterexample', () => {
    const lig = silverLigands();
    expect(lig[0].center.x).toBe(-lig[1].center.x);
    expect(lig.every((l) => l.center.y === 0 && l.center.z === 0)).toBe(true);
    expect(ironComparison(1).freeIronRed).toBe(1);
    expect(ironComparison(1).ferricyanideRed).toBe(0);
    expect(ironComparison(1, false).freeIronRed).toBe(0);
  });
});
