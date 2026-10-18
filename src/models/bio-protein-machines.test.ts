import { expect, it } from 'vitest';
import {
  insulinResidues,
  insulinGeometry,
  insulinDisulfides,
  peptideAccounting,
} from './bio-protein-machines';
it('uses the 21 and 30 residue bovine insulin chains from PDB 2A3G', () => {
  expect(insulinResidues.filter((a) => a.chain === 'A')).toHaveLength(21);
  expect(insulinResidues.filter((a) => a.chain === 'B')).toHaveLength(30);
  expect(peptideAccounting(51, 2)).toMatchObject({ peptideBonds: 49, water: 49 });
  expect(peptideAccounting(1, 1).water).toBe(0);
});
it('links the six cysteine endpoints in three known disulfides', () => {
  for (const pair of insulinDisulfides)
    for (const id of pair)
      expect(insulinResidues.find((a) => a.chain + a.residue === id)?.name).toBe('CYS');
});
it('rotates without changing native distances and preserves all identities on seek', () => {
  const a = insulinGeometry(1, 0),
    b = insulinGeometry(1, 79);
  for (let i = 1; i < a.length; i++) {
    const distance = (p: typeof a) =>
      Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z);
    expect(distance(a)).toBeCloseTo(distance(b), 10);
  }
  expect(new Set(insulinGeometry(0.5, 30).map((x) => x.id)).size).toBe(51);
});
