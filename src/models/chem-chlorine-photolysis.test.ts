import { describe, it, expect } from 'vitest';
import {
  chlorinePhotolysis,
  photolysisTrace,
  photolysisDirector,
} from './chem-chlorine-photolysis';
describe('coupled photolysis evidence', () => {
  it('conserves chlorine and the 2:1 chloride-to-oxygen increment', () => {
    const start = chlorinePhotolysis(0);
    for (const p of [0, 0.1, 0.5, 1]) {
      const m = chlorinePhotolysis(p);
      expect(m.chlorineTotal).toBeCloseTo(start.chlorineTotal);
      expect(m.decomposed).toBeCloseTo(2 * m.oxygen);
      expect(m.remainingHOCl + m.decomposed).toBeCloseTo(0.0018);
    }
  });
  it('predicts the three observed directions from one extent', () => {
    const a = chlorinePhotolysis(0),
      b = chlorinePhotolysis(1);
    expect(a.pH).toBeCloseTo(2.09691, 5);
    expect(b.pH).toBeLessThan(a.pH);
    expect(b.chlorideMgL).toBeGreaterThan(a.chlorideMgL);
    expect(b.oxygenPercent).toBeGreaterThan(a.oxygenPercent);
  });
  it('headspace volume changes gas fraction without changing chemical yield', () => {
    const a = chlorinePhotolysis(1, 100),
      b = chlorinePhotolysis(1, 1000);
    expect(a.oxygen).toBe(b.oxygen);
    expect(a.oxygenPercent).toBeGreaterThan(b.oxygenPercent);
    expect(a.pH).toBe(b.pH);
  });
  it('keeps the ideal dark control flat and seeking deterministic', () => {
    const t = photolysisTrace(1, 500, false);
    expect(new Set(t.map((m) => m.pH)).size).toBe(1);
    expect(chlorinePhotolysis(1, 500, false).decomposed).toBe(0);
    expect(photolysisDirector(2, 0).extent).toBe(1);
  });
});
