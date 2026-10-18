import { describe, it, expect } from 'vitest';
import {
  crambin,
  hemoglobin,
  sequence,
  distance,
  rotate,
  proteinGeometry,
  structureLinks,
  proteinStructureDirector,
} from './chem-protein-structure';
describe('deposited protein coordinates', () => {
  it('preserves real residue counts and sequence identities', () => {
    expect(crambin).toHaveLength(46);
    expect(sequence).toBe('TTCCPSIVARSNFNVCRLPGTPEAICATYTGCIIIPGATCPGDYAN');
    expect(Object.values(hemoglobin).map((r) => r.length)).toEqual([141, 146, 141, 146]);
  });
  it('draws a CA trace, preserves consecutive geometry, and does not bridge the sheet gap', () => {
    for (let i = 1; i < 46; i++)
      expect(distance(crambin[i - 1].atoms.CA, crambin[i].atoms.CA)).toBeGreaterThan(3.6);
    expect(proteinGeometry('sheet').segments).toHaveLength(6);
    expect(proteinGeometry('assembly').segments).toHaveLength(570);
  });
  it('uses real O-N and S-S coordinates rather than CA approximations', () => {
    for (const l of [...structureLinks('helix'), ...structureLinks('sheet')]) {
      expect(l.length).toBeGreaterThan(2.7);
      expect(l.length).toBeLessThan(3.2);
    }
    for (const l of structureLinks('whole')) {
      expect(l.length).toBeGreaterThan(1.9);
      expect(l.length).toBeLessThan(2.1);
    }
  });
  it('rotation preserves lengths and display separation preserves each chain', () => {
    expect(distance(rotate([1, 2, 3], 1.2), rotate([4, 2, 0], 1.2))).toBeCloseTo(Math.sqrt(18));
    const a = proteinGeometry('assembly', 0, 0),
      b = proteinGeometry('assembly', 0, 1);
    expect(distance(a.nodes[0].point, a.nodes[1].point)).toBeCloseTo(
      distance(b.nodes[0].point, b.nodes[1].point),
    );
    expect(a.nodes).toHaveLength(b.nodes.length);
  });
  it('seeking reconstructs bounded presentation without changing data', () => {
    expect(proteinStructureDirector(99, 2)).toEqual(proteinStructureDirector(4, 1));
    expect(proteinStructureDirector(4, 0).separation).toBe(1);
    expect(proteinStructureDirector(4, 1).separation).toBe(0);
    expect(proteinGeometry('whole').segments).toHaveLength(45);
  });
});
