import { describe, it, expect } from 'vitest';
import {
  hydrolysis,
  silverTest,
  gasEvidence,
  apparatus,
  gasMarker,
  netChange,
} from './chem-elimination-substitution';
describe('substitution and elimination evidence', () => {
  it('conserves carbon skeleton and bromine; acidification removes the oxide ambiguity', () => {
    for (const x of [0, 0.2, 1]) {
      const r = hydrolysis(x);
      expect(r.halide + r.alcohol).toBeCloseTo(1);
      expect(r.halide + r.bromide).toBeCloseTo(1);
      const a = silverTest(x, true);
      expect(a.ag2O).toBe(0);
      expect(a.agBr).toBeCloseTo(x);
    }
    expect(silverTest(0, false).ag2O).toBeGreaterThan(0);
    expect(silverTest(1, true, false).agBr).toBe(0);
    expect(hydrolysis(1, false).alcohol).toBe(0);
  });
  it('distinguishes impurity-only false positives and matching effective washes', () => {
    expect(gasEvidence('bromobutane', 'none', false, true).positive).toBe(true);
    expect(gasEvidence('bromobutane', 'water', false, true).positive).toBe(false);
    expect(gasEvidence('bromobutane', 'none', false, true, 'br').positive).toBe(false);
    expect(gasEvidence('ethanol', 'none', false, true, 'br').positive).toBe(true);
    expect(gasEvidence('ethanol', 'base', false, true, 'br').positive).toBe(false);
    expect(gasEvidence('ethanol', 'base', true, true).validAlkeneEvidence).toBe(true);
  });
  it('routes retained and passing markers continuously through the same glass geometry', () => {
    for (const mobile of [false, true])
      for (const gas of ['alkene', 'ethanol', 'sulfurDioxide'] as const)
        for (const wash of ['water', 'base', 'none'] as const) {
          let last = gasMarker(mobile, 0, gas, wash);
          for (let i = 1; i <= 2000; i++) {
            const a = gasMarker(mobile, i / 2000, gas, wash);
            expect(Math.hypot(a.x - last.x, a.y - last.y)).toBeLessThan(2);
            last = a;
          }
          const expected = last.captured
            ? apparatus(mobile).feed.at(-1)!
            : apparatus(mobile).outlet.at(-1)!;
          expect(last.x).toBeCloseTo(expected.x);
          expect(last.y).toBeCloseTo(expected.y);
        }
  });
  it('keeps the carbon backbone fixed when net bonds are compared', () => {
    for (const type of ['substitution', 'elimination'] as const) {
      const a = netChange(type, 0),
        b = netChange(type, 1);
      expect(a.C1).toEqual(b.C1);
      expect(a.C2).toEqual(b.C2);
      expect(b.cBr).toBe(0);
      expect(b.pi).toBe(type === 'elimination' ? 1 : 0);
    }
  });
});
