import { describe, it, expect } from 'vitest';
import {
  liquidPartition,
  repeatedExtraction,
  closedDrainLimit,
  drainFunnel,
  funnelLevel,
  funnelWidth,
  solidExtraction,
  extractionDirector,
} from './chem-solvent-extraction';
describe('extraction distribution and separation', () => {
  it('matches a two-phase mass/concentration benchmark', () => {
    const m = liquidPartition(4, 50);
    expect(m.organic).toBeCloseTo(2 / 3);
    expect(m.organicConcentration / m.aqueousConcentration).toBeCloseTo(4);
    expect(m.organic + m.aqueous).toBe(1);
  });
  it('holds total solvent fixed and improves recovery with fresh portions', () => {
    const a = repeatedExtraction(4, 50, 1),
      b = repeatedExtraction(4, 50, 3);
    expect(b.remaining).toBeCloseTo((100 / (100 + (4 * 50) / 3)) ** 3);
    expect(b.recovered).toBeGreaterThan(a.recovered);
    expect(b.extracts.reduce((a, b) => a + b, 0) + b.remaining).toBeCloseTo(1);
  });
  it('changes layer identity without changing partition amount', () => {
    const a = drainFunnel(4, false, 1, true),
      b = drainFunnel(4, true, 1, true);
    expect(a.drained).toBe(100);
    expect(b.drained).toBe(50);
    expect(a.collectedSolute).toBeCloseTo(1 / 3);
    expect(b.collectedSolute).toBeCloseTo(2 / 3);
  });
  it('conserves volume and solute under valve/vent cases', () => {
    for (const heavy of [false, true])
      for (const vent of [false, true])
        for (const valve of [false, true])
          for (const p of [0, 0.4, 1]) {
            const m = drainFunnel(4, heavy, p, vent, valve);
            expect(m.drained + m.remainingVolume).toBe(150);
            expect(m.lowerSolute + m.upperSolute + m.collectedSolute).toBeCloseTo(1);
            expect(m.lowerVolume).toBeGreaterThanOrEqual(0);
          }
  });
  it('predicts a small initial closed-head outflow, not a magically sealed liquid', () => {
    const limit = closedDrainLimit(150, 1000);
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThan(1);
    expect(drainFunnel(4, false, 1, false).drained).toBeCloseTo(limit);
    expect(drainFunnel(4, false, 1, false).headPressure).toBeLessThan(101325);
  });
  it('links liquid level to the same bounded bulb profile', () => {
    expect(funnelLevel(0)).toBe(190);
    expect(funnelLevel(220)).toBeCloseTo(40);
    expect(funnelLevel(100)).toBeGreaterThan(funnelLevel(150));
    for (let y = 40; y <= 190; y++) expect(funnelWidth(y)).toBeGreaterThanOrEqual(5);
  });
  it('keeps inert matrix while dissolving only accessible solute', () => {
    const m = solidExtraction(1);
    expect(m.dissolved + m.residualSolute).toBe(1);
    expect(m.inertMatrix).toBe(1);
    expect(liquidPartition(NaN, Infinity).organic).toBe(0);
    expect(extractionDirector(99, Infinity)).toMatchObject({ chapter: 6, p: 0 });
  });
});
