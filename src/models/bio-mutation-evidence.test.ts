import { describe, it, expect } from 'vitest';
import {
  smokingStudy,
  smokingAssociation,
  recessiveLethalTest,
  restitutionMitosis,
  chromosomeSets,
  structureSegments,
  countedChromosomes,
} from './bio-mutation-evidence';
describe('mutation and variation evidence', () => {
  it('keeps case-control denominators and refuses population incidence', () => {
    expect(smokingStudy.cases.smoking + smokingStudy.cases.notSmoking).toBe(1303);
    expect(smokingStudy.controls.smoking + smokingStudy.controls.notSmoking).toBe(1303);
    const s = smokingAssociation();
    expect(s.caseExposure * 100).toBeCloseTo(63.16, 2);
    expect(s.controlExposure * 100).toBeCloseTo(39.06, 2);
    expect(s.oddsRatio).toBeCloseTo(2.67459, 4);
    expect(s.populationRisk).toBeNull();
  });
  it('traces a recessive-lethal X without interpreting treatment as certain mutation', () => {
    expect(recessiveLethalTest(false).filter((x) => x.viable)).toHaveLength(4);
    expect(recessiveLethalTest(true).filter((x) => x.viable)).toHaveLength(3);
    expect(
      recessiveLethalTest(true)
        .filter((x) => !x.viable)
        .map((x) => x.genotype),
    ).toEqual(['X* / Y']);
  });
  it('separates DNA replication from ploidy and retains every sister in restitution', () => {
    for (const blocked of [false, true]) {
      const a = restitutionMitosis(0, blocked),
        b = restitutionMitosis(1, blocked);
      expect(a.chromatids.map((x) => x.id)).toEqual(b.chromatids.map((x) => x.id));
      expect(new Set(b.chromatids.map((x) => x.id)).size).toBe(8);
      expect(b.cellCount * b.chromosomesPerFinalNucleus).toBe(8);
    }
    expect(chromosomeSets('gain')).toHaveLength(7);
    expect(chromosomeSets('triploid')).toHaveLength(9);
    expect(chromosomeSets('tetraploid')).toHaveLength(12);
    expect(countedChromosomes(false)).toHaveLength(16);
    expect(countedChromosomes(true)).toHaveLength(32);
  });
  it('preserves fragment identities and distinguishes count from order changes', () => {
    const ordered = (k: 'deletion' | 'duplication' | 'inversion') =>
      structureSegments(k, 1)
        .filter((x) => x.retained)
        .sort((a, b) => a.x - b.x)
        .map((x) => x.letter)
        .join('');
    expect(ordered('deletion')).toBe('acdef');
    expect(ordered('duplication')).toBe('abbcdef');
    expect(ordered('inversion')).toBe('aedcbf');
    const exchange = structureSegments('translocation', 1);
    expect(
      exchange
        .filter((x) => x.y === 75)
        .sort((a, b) => a.x - b.x)
        .map((x) => x.letter)
        .join(''),
    ).toBe('abcjkl');
    expect(
      exchange
        .filter((x) => x.y === 175)
        .sort((a, b) => a.x - b.x)
        .map((x) => x.letter)
        .join(''),
    ).toBe('ghidef');
    for (const kind of ['inversion', 'translocation'] as const)
      for (let p = 0.001; p <= 1; p += 0.001) {
        const a = structureSegments(kind, p - 0.001),
          b = structureSegments(kind, p);
        a.forEach((x, i) => expect(Math.hypot(x.x - b[i].x, x.y - b[i].y)).toBeLessThan(1));
      }
  });
});
