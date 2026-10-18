import { describe, expect, it } from 'vitest';
import { bufferMaterials, bufferShot, bufferState } from './bio-buffer-comparison';
describe('textbook pH buffer comparison', () => {
  it('starts every fresh aliquot at pH 7, conserving the buffer pair', () => {
    for (const material of bufferMaterials) {
      const s = bufferState(material, 0, 'acid');
      expect(s.pH).toBeCloseTo(7, 8);
      expect(s.acidMmol + s.baseMmol).toBeCloseTo(s.totalMmol, 12);
    }
  });
  it('matches the independent strong-acid dilution benchmark', () => {
    // 30 × 50 μL × 0.1 mol/L in 26.5 mL gives 5.660377 mM HCl.
    expect(bufferState('water', 30, 'acid').pH).toBeCloseTo(-Math.log10(0.00015 / 0.0265), 7);
    expect(bufferState('water', 30, 'base').pH).toBeCloseTo(14 + Math.log10(0.00015 / 0.0265), 7);
  });
  it('has finite capacity rather than clamping pH to neutrality', () => {
    expect(bufferState('phosphate', 10, 'acid').pH).toBeGreaterThan(6.7);
    expect(bufferState('phosphate', 120, 'acid').pH).toBeLessThan(3);
    expect(bufferState('biological', 30, 'acid').pH).toBeLessThan(
      bufferState('phosphate', 30, 'acid').pH,
    );
    for (const material of bufferMaterials)
      for (const reagent of ['acid', 'base'] as const)
        for (const n of [0, 1, 10, 30, 120])
          expect(Math.abs(bufferState(material, n, reagent).chargeResidual)).toBeLessThan(1e-12);
  });
  it('reconstructs watch state without any previous experimental history', () => {
    expect(bufferShot(3, 1)).toEqual({ reagent: 'base', drops: 30 });
    expect(bufferShot(0, 1).drops).toBe(0);
    expect(bufferState('water', -4, 'acid').drops).toBe(0);
  });
});
