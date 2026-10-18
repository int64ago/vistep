import { describe, it, expect } from 'vitest';
import {
  structure,
  formula,
  carbonDegrees,
  wohler,
  alkene,
  hasCisTrans,
  piOverlap,
} from './chem-wohler-isomers';
describe('same formula, different structure', () => {
  it('derives valid valence and conserved formulas from connectivity', () => {
    const three = ['pentane', 'isopentane', 'neopentane'] as const;
    for (const k of three) expect(formula(structure(k))).toEqual({ C: 5, H: 12, N: 0, O: 0 });
    expect(three.map((k) => carbonDegrees(structure(k)))).toEqual([
      [1, 1, 2, 2, 2],
      [1, 1, 1, 2, 3],
      [1, 1, 1, 1, 4],
    ]);
    for (const k of ['but1', 'but2'] as const)
      expect(formula(structure(k))).toEqual({ C: 4, H: 8, N: 0, O: 0 });
    for (const k of ['ethanol', 'ether'] as const)
      expect(formula(structure(k))).toEqual({ C: 2, H: 6, N: 0, O: 1 });
    expect(structure('ethanol').atoms.find((a) => a.element === 'O')?.implicitH).toBe(1);
    expect(structure('ether').atoms.find((a) => a.element === 'O')?.implicitH).toBe(0);
  });
  it('preserves all eight named atoms while distinguishing ionic salt from molecular urea', () => {
    expect(formula(wohler(false))).toEqual({ C: 1, H: 4, N: 2, O: 1 });
    expect(formula(wohler(true))).toEqual(formula(wohler(false)));
    expect(wohler(false).atoms.map((a) => a.id)).toEqual(wohler(true).atoms.map((a) => a.id));
    expect(wohler(false).atoms.reduce((q, a) => q + (a.charge || 0), 0)).toBe(0);
    expect(
      wohler(true)
        .bonds.filter((b) => b.a === 'C')
        .map((b) => b.order),
    ).toEqual([2, 1, 1]);
  });
  it('changes view without turning cis into trans, and rejects a terminal-alkene counterexample', () => {
    const base = alkene(true, 0);
    for (const angle of [-60, 0, 60]) {
      const a = alkene(true, angle);
      for (let i = 1; i < a.length; i++) {
        const dist = (u: (typeof a)[0], v: (typeof a)[0]) =>
          Math.hypot(u.x - v.x, u.y - v.y, u.z - v.z);
        expect(dist(a[i], a[0])).toBeCloseTo(dist(base[i], base[0]), 10);
      }
      expect(a[2].y * a[4].y).toBeGreaterThan(0);
    }
    expect(alkene(false, 50)[2].y * alkene(false, 50)[4].y).toBeLessThan(0);
    expect(hasCisTrans(['H', 'CH3'], ['H', 'CH3'])).toBe(true);
    expect(hasCisTrans(['H', 'H'], ['H', 'C2H5'])).toBe(false);
    expect(piOverlap(0)).toBe(1);
    expect(piOverlap(90)).toBeCloseTo(0);
    expect(piOverlap(180)).toBe(1);
  });
});
