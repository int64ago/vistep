import { describe, it, expect } from 'vitest';
import {
  chickenCells,
  expressionEvidence,
  linariaState,
  agoutiState,
  vestigialEvidence,
  wingOutline,
} from './bio-gene-expression';
describe('gene expression evidence', () => {
  it('reproduces every cell of the textbook qualitative detection matrix', () => {
    for (const [i, c] of chickenCells.entries()) {
      expect(expressionEvidence(c, 'DNA').map((x) => x.detected)).toEqual([true, true, true]);
      expect(expressionEvidence(c, 'mRNA').map((x) => x.detected)).toEqual(
        [0, 1, 2].map((j) => j === i),
      );
    }
  });
  it('keeps base sequence and mouse genotype fixed across epigenetic states', () => {
    expect(linariaState('A').sequence).toBe(linariaState('B').sequence);
    expect(linariaState('A').lcycExpressed).toBe(true);
    expect(linariaState('B').lcycExpressed).toBe(false);
    expect(linariaState('B').spurs).toBe(5);
    for (const s of ['yellow', 'mottled', 'dark'] as const) {
      expect(agoutiState(s).genotype).toBe('Avy/a');
      expect(agoutiState(s).sequence).toBe('CGCGCGCG');
    }
    expect(agoutiState('dark').ectopicExpression).toBe('suppressed');
  });
  it('uses developmental cohorts rather than changing adult wings or a calibrated temperature curve', () => {
    expect(vestigialEvidence(31, 'parent').phenotype).toBe('some-near-normal');
    expect(vestigialEvidence(25, 'parent').phenotype).toBe('vestigial');
    expect(vestigialEvidence(31, 'offspring')).toEqual(vestigialEvidence(25, 'offspring'));
    expect(vestigialEvidence(31, 'offspring').developmentTemperature).toBe(25);
    expect(vestigialEvidence(31, 'parent').mechanismProven).toBe(false);
    expect(wingOutline(0.32, 1)).toContain('M142 97');
    expect(wingOutline(1, 1)).toContain('M142 97');
  });
});
