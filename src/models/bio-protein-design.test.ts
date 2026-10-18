import { it, expect } from 'vitest';
import {
  insulinEvidence,
  backTranslation,
  enzymeEvidence,
  association,
  projectedInsulin,
  matureComparison,
  globalAlignment,
  segmentEvidence,
  parseProteinFasta,
} from './bio-protein-design';
it('the five-amino-acid exercise has32different coding sequences', () => {
  expect(new Set(Array.from({ length: 32 }, (_, i) => backTranslation(i).dna)).size).toBe(32);
  for (let i = 0; i < 32; i++) {
    const a = backTranslation(i);
    expect(a.peptide).toBe('AWKEF');
    expect(a.dna).toHaveLength(15);
  }
});
it('performance depends on the selected assay conditions', () => {
  const cold = enzymeEvidence(10, 20),
    hot = enzymeEvidence(10, 70);
  expect(cold[0].activity).toBeGreaterThan(cold[1].activity);
  expect(hot[0].activity).toBeLessThan(hot[1].activity);
});
it('association conserves monomer units and lowerKa does not prohibit association', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = association(i / 100, 4);
    expect(a.monomer + 2 * a.dimer).toBeCloseTo(a.total, 10);
  }
  expect(association(1, 0.4).monomerFraction).toBeGreaterThan(association(1, 4).monomerFraction!);
  expect(association(10, 0.4).dimer).toBeGreaterThan(0);
  expect(association(0, 4).monomerFraction).toBeNull();
});
it('actualPDB chains retain51CAresidues and correctedB28/B29 identities', () => {
  for (const pdb of ['1TRZ', '1LPH'] as const) {
    const a = insulinEvidence.structures[pdb].atoms;
    expect(a.filter((a) => a.atom === 'CA')).toHaveLength(51);
    expect(a.find((a) => a.chain === 'B' && a.residue === 28 && a.atom === 'CA')!.aa).toBe(
      pdb === '1TRZ' ? 'P' : 'K',
    );
    expect(a.find((a) => a.chain === 'B' && a.residue === 29 && a.atom === 'CA')!.aa).toBe(
      pdb === '1TRZ' ? 'K' : 'P',
    );
    for (const pair of [
      ['A6', 'A11'],
      ['A7', 'B7'],
      ['A20', 'B19'],
    ]) {
      const atoms = pair.map((id) =>
        a.find((a) => `${a.chain}${a.residue}` === id && a.atom === 'SG')!,
      );
      expect(
        Math.hypot(atoms[0].x - atoms[1].x, atoms[0].y - atoms[1].y, atoms[0].z - atoms[1].z),
      ).toBeGreaterThan(1.9);
      expect(
        Math.hypot(atoms[0].x - atoms[1].x, atoms[0].y - atoms[1].y, atoms[0].z - atoms[1].z),
      ).toBeLessThan(2.2);
    }
  }
});
it('model projection contains every atom at narrow widths and all angles', () => {
  for (const w of [240, 320, 800])
    for (let n = 0; n < 40; n++)
      for (const a of projectedInsulin(w, (n * Math.PI) / 20)) {
        expect(a.x).toBeGreaterThanOrEqual(24);
        expect(a.x).toBeLessThanOrEqual(w - 24);
        expect(a.y).toBeGreaterThanOrEqual(62);
        expect(a.y).toBeLessThanOrEqual(254);
      }
});
it('retrieved mature-chain comparisons distinguish precursor and fragment coverage', () => {
  expect(insulinEvidence.sequences.map((a) => a.precursor.length)).toEqual([110, 108, 105]);
  expect(matureComparison(1).matches).toBe(50);
  expect(matureComparison(2).matches).toBe(48);
  expect(matureComparison(2).length).toBe(51);
  const [h, , b] = insulinEvidence.sequences;
  expect(segmentEvidence(h.b, b.b, 20).identity).toBe(1);
  expect(segmentEvidence(h.b, b.b, 20).coverage).toBeCloseTo(2 / 3);
  expect(globalAlignment('AWKEF', 'AWKAEF').a).toBe('AWK-EF');
  expect(parseProteinFasta('>test\nAWKEF')).toBe('AWKEF');
  expect(parseProteinFasta('DNA123')).toBeNull();
  expect(parseProteinFasta('>one\nAWK\n>two\nEF')).toBeNull();
});
