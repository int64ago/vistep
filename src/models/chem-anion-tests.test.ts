import { describe, it, expect } from 'vitest';
import { anionEvidence, anionDirector } from './chem-anion-tests';
describe('anion evidence is sequential and conserved', () => {
  it('distinguishes initial precipitation from acid persistence', () => {
    for (const test of ['chloride', 'sulfate'] as const) {
      const start = anionEvidence(test, 2, 0),
        end = anionEvidence(test, 2, 2);
      expect(start.targetSolid).toBe(1);
      expect(start.carbonateSolid).toBe(1);
      expect(end.targetSolid).toBe(1);
      expect(end.carbonateSolid).toBe(0);
      expect(end.carbonDioxide).toBe(1);
    }
  });
  it('uses two silver ions per carbonate but one barium', () => {
    expect(anionEvidence('chloride', 1, 0).carbonateSolid).toBe(0.5);
    expect(anionEvidence('sulfate', 1, 0).carbonateSolid).toBe(1);
  });
  it('conserves carbon and precipitant at all input boundaries', () => {
    for (const test of ['chloride', 'sulfate'] as const)
      for (const metal of [0, 0.3, 1, 2])
        for (const acid of [0, 0.4, 1.8, 2]) {
          const m = anionEvidence(test, metal, acid);
          expect(m.carbonTotal).toBeCloseTo(1);
          expect(m.carbonateDissolvedMetal + m.carbonateMetalInSolid).toBeCloseTo(metal);
          expect(m.carbonateSolid).toBeGreaterThanOrEqual(0);
        }
  });
  it('seeking the conclusion reconstructs both reagent steps', () => {
    expect(anionDirector(2, 0.1)).toMatchObject({
      test: 'chloride',
      metal: 2,
      acid: 2,
      ledger: true,
    });
    expect(anionDirector(3, 0)).toMatchObject({ test: 'sulfate', metal: 0, acid: 0 });
  });
});

import { anionCarbonRoute } from './chem-anion-tests';
describe('retained finite evidence model', () => {
  it('zero precipitant never creates a solid, while dissolved carbonate can still consume acid', () => {
    const s = anionEvidence('chloride', 0, 2);
    expect(s.targetSolid).toBe(0);
    expect(s.carbonateSolid).toBe(0);
    expect(s.carbonDioxide).toBe(1);
  });
  it('uses bounded net budgets rather than claiming equilibrium species', () => {
    for (const m of [NaN, Infinity, -1, 0, 0.5, 2, 4])
      for (const a of [NaN, Infinity, -1, 0, 0.5, 2, 4])
        for (const test of ['chloride', 'sulfate'] as const) {
          const s = anionEvidence(test, m, a);
          expect(s.carbonTotal).toBeCloseTo(1);
          expect(s.targetDissolvedMetal + s.targetMetalInSolid).toBeCloseTo(s.metal);
          expect(s.carbonateDissolvedMetal + s.carbonateMetalInSolid).toBeCloseTo(s.metal);
          expect(2 * s.carbonDioxide).toBeCloseTo(s.acidBudget);
          expect(
            Object.values(s)
              .filter((x) => typeof x === 'number')
              .every(Number.isFinite),
          ).toBe(true);
        }
  });
  it('retains eight carbon marker identities and finishes each route outside once', () => {
    for (let i = 0; i < 8; i++) {
      let y = 225;
      for (let n = 0; n <= 1000; n++) {
        const r = anionCarbonRoute(i, n / 1000);
        expect(r.id).toBe(`carbon-${i}`);
        expect(r.y).toBeLessThanOrEqual(y + 1e-9);
        expect(Math.abs(r.y - y)).toBeLessThan(1);
        y = r.y;
      }
      expect(anionCarbonRoute(i, 1)).toMatchObject({ phase: 'outside', y: 22 });
      expect(anionCarbonRoute(i, 100)).toEqual(anionCarbonRoute(i, 1));
    }
  });
  it('reaches observed endpoints before the ensuing inference in both recordings', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(anionDirector(0, 0, 10, lang).metal).toBe(2);
      expect(anionDirector(1, 0, 9, lang).acid).toBe(2);
      expect(anionDirector(4, 0, 8, lang).acid).toBe(2);
    }
  });
});
