import { describe, it, expect } from 'vitest';
import {
  carbonMolecule,
  bondCounts,
  TETRAHEDRON,
  dot,
  pairAlignment,
  rotatePoint,
  CHLORINE_PAIRS,
  FOUR_CARBON_GRAPHS,
  graphHydrogens,
} from './chem-carbon-frameworks';
describe('carbon geometry and connectivity', () => {
  it('derives methane tetrahedral angles and preserves allC/H valences', () => {
    expect((Math.acos(dot(TETRAHEDRON[0], TETRAHEDRON[1])) * 180) / Math.PI).toBeCloseTo(
      109.4712,
      3,
    );
    for (const key of [
      'methane',
      'ethane',
      'ethene',
      'ethyne',
      'butane',
      'isobutane',
      'dichloromethane',
    ]) {
      const m = carbonMolecule(key);
      m.atoms.forEach((a, i) =>
        expect(m.bonds.reduce((s, b) => s + (b.a === i || b.b === i ? b.order : 0), 0)).toBe(
          a.element === 'C' ? 4 : 1,
        ),
      );
    }
  });
  it('has independent sigma/pi benchmarks and planar/linear boundaries', () => {
    expect(bondCounts(carbonMolecule('ethane'))).toEqual({ sigma: 7, pi: 0 });
    expect(bondCounts(carbonMolecule('ethene'))).toEqual({ sigma: 5, pi: 1 });
    expect(bondCounts(carbonMolecule('ethyne'))).toEqual({ sigma: 3, pi: 2 });
    expect(carbonMolecule('ethene').atoms.every((a) => a.z === 0)).toBe(true);
    expect(carbonMolecule('ethyne').atoms.every((a) => a.y === 0 && a.z === 0)).toBe(true);
  });
  it('superposes allsix dichloromethane choices by proper rotations', () => {
    CHLORINE_PAIRS.forEach((pair, k) => {
      const r = pairAlignment(k);
      expect(r).toBeDefined();
      const a = pair.map((i) => rotatePoint(TETRAHEDRON[i], r.axis, r.angle));
      expect(a.every((p) => [0, 1].some((i) => dot(p, TETRAHEDRON[i]) > 0.999999))).toBe(true);
    });
  });
  it('distinguishes C4 connectivity while deriving every hydrogen count', () => {
    expect(carbonMolecule('butane').formula).toBe('C4H10');
    expect(carbonMolecule('isobutane').formula).toBe('C4H10');
    for (const g of FOUR_CARBON_GRAPHS)
      expect(`C4H${graphHydrogens(g.edges).reduce((a, b) => a + b, 0)}`).toBe(g.formula);
  });
});
