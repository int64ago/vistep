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
