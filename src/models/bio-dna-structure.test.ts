import { expect, it } from 'vitest';
import {
  dnaResidues,
  dnaSequence,
  complement,
  pairedSequence,
  basePair,
  dnaCounts,
  verifyDuplex,
  backboneSegments,
  pairHydrogenBonds,
  scatteringIntensity,
  projectDna,
} from './bio-dna-structure';
import diffraction from './bio-dna-diffraction.json';
it('retains the real 12-bp duplex, opposite chemical directions and valid phosphodiester links', () => {
  expect(dnaResidues).toHaveLength(24);
  expect(dnaSequence).toBe('CGCGAATTCGCG');
  for (let i = 0; i < 12; i++)
    expect(dnaResidues[23 - i].base).toBe(complement(dnaResidues[i].base));
  const bridges = backboneSegments().filter((b) => b.id.endsWith('bridge'));
  expect(bridges).toHaveLength(22);
  expect(bridges.filter((b) => b.chain === 'A')).toHaveLength(11);
  expect(bridges.filter((b) => b.chain === 'B')).toHaveLength(11);
  for (const b of bridges) {
    const origin = dnaResidues.find((r) => b.id === r.id + '-bridge')!;
    const next = dnaResidues.find((r) => r.chain === origin.chain && r.index === origin.index + 1)!;
    expect(b.b).toEqual(next.atoms.P);
    const distance = Math.hypot(...b.a.map((v, i) => v - b.b[i]));
    expect(distance).toBeGreaterThan(1.3);
    expect(distance).toBeLessThan(1.9);
  }
  for (let i = 0; i < 12; i++)
    for (const b of pairHydrogenBonds(i)) {
      expect(b.distance).toBeGreaterThan(2.4);
      expect(b.distance).toBeLessThan(3.5);
    }
  const a = projectDna(dnaResidues[0].atoms["C1'"], 0),
    aEnd = projectDna(dnaResidues[11].atoms["C1'"], 0),
    b = projectDna(dnaResidues[12].atoms["C1'"], 0),
    bEnd = projectDna(dnaResidues[23].atoms["C1'"], 0);
  expect((aEnd.y - a.y) * (bEnd.y - b.y)).toBeLessThan(0);
});
it('distinguishes matching composition from correct complementarity and orientation', () => {
  expect(pairedSequence('GATACC')).toBe('CTATGG');
  expect(pairedSequence('GATACC').split('').reverse().join('')).toBe('GGTATC');
  expect(basePair('A', 'T').hydrogenBonds).toBe(2);
  expect(basePair('G', 'C').hydrogenBonds).toBe(3);
  expect(basePair('A', 'G').valid).toBe(false);
  expect(dnaCounts('ATGC')).toEqual(dnaCounts('TAGC'));
  expect(verifyDuplex('ATGC', 'TAGC', true).valid).toBe(false);
  expect(verifyDuplex('ATGC', 'TACG', false).valid).toBe(false);
  expect(verifyDuplex('ATGC', 'TACG', true).valid).toBe(true);
});
it('reproduces cached diffraction from the same finite-scatterer model and preserves inversion symmetry', () => {
  expect(scatteringIntensity(0, 0)).toBeCloseTo(1);
  const n = diffraction.size;
  for (const pattern of diffraction.patterns)
    for (const [x, y] of [
      [12, 25],
      [55, 61],
      [36, 36],
    ]) {
      const qx = (x / (n - 1) - 0.5) * 0.66,
        qz = (y / (n - 1) - 0.5) * 0.66;
      const exact = scatteringIntensity(qx, qz, pattern.twist);
      expect(pattern.intensity[y * n + x]).toBeCloseTo(exact, 7);
      expect(scatteringIntensity(-qx, -qz, pattern.twist)).toBeCloseTo(exact, 10);
    }
  expect(scatteringIntensity(0.06, 0.03, 0)).not.toBeCloseTo(
    scatteringIntensity(0.06, 0.03, 36),
    5,
  );
});
