import { describe, expect, it } from 'vitest';
import {
  geneticCode,
  codeRna,
  codeTemplate,
  rnaComplement,
  peptide,
  shiftedSequence,
  polyUControls,
  textbookPolyU,
  transcription,
  translation,
} from './bio-genetic-code';
describe('genetic information and experimental evidence', () => {
  it('implements all 64 standard codons, complementary antiparallel transcription and stop release', () => {
    expect(Object.keys(geneticCode)).toHaveLength(64);
    expect(Object.values(geneticCode).filter((x) => x === 'Stop')).toHaveLength(3);
    expect(new Set(Object.values(geneticCode)).size).toBe(21);
    expect(rnaComplement(codeTemplate)).toBe(codeRna);
    expect(peptide(codeRna)).toEqual(['Met', 'Phe', 'Gly', 'Lys']);
    expect(geneticCode.UGG).toBe('Trp');
    expect(geneticCode.GUG).toBe('Val');
    expect(transcription(1, false).rna.every((x) => x.visible === 0)).toBe(true);
    expect(transcription(1).rna.every((x) => x.visible === 1)).toBe(true);
    expect(translation(5).chain).toEqual(peptide(codeRna));
    for (let t = 0; t <= 5; t += 0.01)
      expect(translation(t).trnas.every((x) => x.aa !== 'Stop')).toBe(true);
    expect(translation(3, false).chain).toEqual([]);
  });
  it('preserves base identities and distinguishes frame restoration from sequence or function', () => {
    for (const d of [-3, -2, -1, 0, 1, 2, 3]) {
      const s = shiftedSequence(d);
      expect(s.modified.length).toBe(s.original.length + d);
      expect(s.frameRestored).toBe(d % 3 === 0);
      expect(new Set(s.modified.map((x) => x.id)).size).toBe(s.modified.length);
    }
    expect(shiftedSequence(3).protein).not.toEqual(shiftedSequence(0).protein);
    expect(shiftedSequence(-3).protein).not.toEqual(shiftedSequence(0).protein);
  });
  it('keeps original counting units, qualitative textbook controls, and continuous tracked motion', () => {
    expect(polyUControls.map((x) => x.counts)).toEqual([44, 39800, 50, 38]);
    expect(textbookPolyU('Phe', true, true).polymer).toHaveLength(6);
    expect(textbookPolyU('Tyr', true, true).polymer).toHaveLength(0);
    expect(textbookPolyU('Phe', false, true).polymer).toHaveLength(0);
    expect(textbookPolyU('Phe', true, false).polymer).toHaveLength(0);
    for (let t = 0.001; t <= 4.999; t += 0.001) {
      const a = translation(t - 0.001),
        b = translation(t);
      expect(Math.abs(a.shift - b.shift)).toBeLessThan(0.01);
      expect(
        Math.abs(a.chainX - 20 * (a.chain.length - 1) - (b.chainX - 20 * (b.chain.length - 1))),
      ).toBeLessThan(2);
      for (const tr of a.trnas) {
        const next = b.trnas.find((x) => x.id === tr.id);
        if (next && tr.opacity > 0.01 && next.opacity > 0.01)
          expect(Math.abs(tr.x - next.x)).toBeLessThan(2);
      }
    }
  });
});
