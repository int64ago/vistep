import { describe, expect, it } from 'vitest';
import {
  phaseBalance,
  residenceTrace,
  pigmentBands,
  extractPigmentSections,
  chromatographyDirector,
} from './chem-pigment-chromatography';
describe('historical column chromatography teaching model', () => {
  it('derives retardation from the same two-phase inventory', () => {
    expect(phaseBalance(4)).toMatchObject({ mobile: 0.2, bound: 0.8, relativeVelocity: 0.2 });
    expect(phaseBalance(0).relativeVelocity).toBe(1);
    expect(phaseBalance(4).bound / phaseBalance(4).mobile).toBe(4);
  });
  it('pauses a representative particle during residence and matches cycle-mean speed', () => {
    expect(residenceTrace(4, 0.3).distance).toBe(residenceTrace(4, 0.8).distance);
    expect(residenceTrace(4, 0.3).moving).toBe(false);
    expect(residenceTrace(4, 6).distance).toBeCloseTo(0.2);
    expect(residenceTrace(0.4, 6).distance).toBeCloseTo(1 / 1.4);
  });
  it('makes equal retention co-migrate and strong retention lag behind', () => {
    const equal = pigmentBands(1, 0),
      distinct = pigmentBands(1, 1);
    expect(equal.bands[0].cells).toEqual(equal.bands[2].cells);
    expect(equal.overlap).toBeCloseTo(1);
    expect(distinct.bands[0].center).toBeLessThan(distinct.bands[1].center);
    expect(distinct.bands[1].center).toBeLessThan(distinct.bands[2].center);
  });
  it('conserves every component through all sampled states and actual cut boundaries', () => {
    for (const t of [0, 0.3, 1])
      for (const c of [0, 0.25, 1])
        for (const s of [0, 0.4, 1]) {
          const m = pigmentBands(t, c, s);
          for (let i = 0; i < 3; i++) {
            expect(m.bands[i].cells.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
            expect(m.sections.reduce((sum, cut) => sum + cut.amounts[i], 0)).toBeCloseTo(1, 12);
            expect(m.bands[i].center - m.bands[i].halfWidth).toBeGreaterThanOrEqual(0);
            expect(m.bands[i].center + m.bands[i].halfWidth).toBeLessThan(1);
          }
        }
  });
  it('predicts greater overlap and less pure color slices when broadening grows', () => {
    const narrow = pigmentBands(1, 1, 0),
      broad = pigmentBands(1, 1, 1);
    expect(broad.overlap).toBeGreaterThan(narrow.overlap);
    expect(broad.sections[0].dominantFraction).toBeLessThan(narrow.sections[0].dominantFraction);
  });
  it('conserves all pigments while transferring them from removed solid into solvent', () => {
    for (const p of [0, 0.5, 1]) {
      const m = extractPigmentSections(1, 1, 1, p);
      for (let i = 0; i < 3; i++)
        expect(m.samples.reduce((s, cut) => s + cut.dissolved[i] + cut.adsorbed[i], 0)).toBeCloseTo(
          1,
        );
      expect(m.samples.flatMap((s) => s.dissolved).reduce((a, b) => a + b, 0)).toBeCloseTo(
        3 * 0.92 * p,
      );
    }
  });
  it('bounds nonfinite and out-of-range controls without invalid inventories', () => {
    const m = extractPigmentSections(NaN, Infinity, -2, NaN);
    expect(m.fraction).toBe(0);
    expect(m.bands.every((b) => b.cells.every(Number.isFinite))).toBe(true);
    expect(chromatographyDirector(99, Infinity)).toMatchObject({ chapter: 6, p: 0, extract: 0 });
  });
});
