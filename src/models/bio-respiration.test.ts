import { it, expect } from 'vitest';
import { respirationBalance, carbonDestinations, yeastAssay, atpCoupling } from './bio-respiration';
it('conserves carbon and distinguishes respiratory products', () => {
  for (const r of ['aerobic', 'ethanol', 'lactate'] as const) {
    const s = respirationBalance(r);
    expect(s.carbonDioxide + 2 * s.ethanol + 3 * s.lactate).toBe(6);
    expect(s.netGlycolyticATP).toBe(2);
    expect(new Set(carbonDestinations(r).map((x) => x.id)).size).toBe(6);
  }
  expect(respirationBalance('lactate').carbonDioxide).toBe(0);
});
it('reports assay confounders instead of labeling every color ethanol', () => {
  expect(yeastAssay(0.2, false).ethanolColorValid).toBe(false);
  expect(yeastAssay(1, false).ethanolColorValid).toBe(true);
  expect(yeastAssay(1, true, false).detectedCO2).toBeGreaterThan(
    yeastAssay(1, true, true).detectedCO2,
  );
  expect(yeastAssay(0.5, false, true, false).anaerobicConditionValid).toBe(false);
});
it('conserves phosphate through ATP hydrolysis', () => {
  for (const p of [0, 0.2, 0.5, 1]) {
    const s = atpCoupling(p);
    expect(s.boundPhosphates + s.freePhosphate).toBe(3);
    expect(s.atp + s.adp).toBe(1);
  }
});
