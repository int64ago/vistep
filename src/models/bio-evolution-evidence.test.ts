import { describe, it, expect } from 'vitest';
import {
  cytochromeDifferences,
  selectionYears,
  limbBones,
  diskCenters,
  concentration,
  inhibitionRadius,
  discSelection,
  isolatedPopulations,
  geneFlow,
} from './bio-evolution-evidence';
describe('evolution evidence and stated teaching models', () => {
  it('matches the textbook second-year selection benchmark without inserting Hardy-Weinberg mating', () => {
    const y = selectionYears()[1];
    expect(y.counts).toEqual([11, 22, 63]);
    expect(y.total).toBe(96);
    expect(y.frequencies[0]).toBeCloseTo(0.11458333, 7);
    expect(y.S).toBeCloseTo(0.22916667, 7);
    expect(y.s + y.S).toBeCloseTo(1);
    expect(selectionYears(0, 0).every((x) => x.S === 0.2)).toBe(true);
    expect(selectionYears(0.1, -0.1)[9].S).toBeGreaterThan(0.2);
    expect(selectionYears(-0.1, 0.1)[9].S).toBeLessThan(0.2);
  });
  it('preserves evidence counts and connected homologous bone groups', () => {
    expect(cytochromeDifferences.map((x) => x[1])).toEqual([0, 1, 11, 13, 14, 21, 27, 31, 43, 44]);
    for (const l of ['human', 'bat', 'whale', 'cat'] as const) {
      const b = limbBones(l);
      expect(new Set(b.map((x) => x.id)).size).toBe(b.length);
      expect(new Set(b.map((x) => x.group)).size).toBe(6);
      for (let d = 0; d < 5; d++) {
        const m = b.find((x) => x.id === `metacarpal-${d}`)!;
        expect(b.find((x) => x.id === `digit-${d}-0`)!.a).toEqual(m.b);
      }
    }
  });
  it('derives model inhibition boundaries from concentration and does not create resistance', () => {
    expect(diskCenters.filter((x) => x.drug)).toHaveLength(3);
    for (const mic of [0.12, 0.5, 0.7])
      expect(concentration(inhibitionRadius(mic))).toBeCloseTo(mic, 10);
    expect(discSelection(1).radius).toBeLessThan(discSelection(0).radius);
    expect(discSelection(2).radius).toBe(discSelection(1).radius);
    expect(discSelection(3, false).radius).toBe(discSelection(0, false).radius);
    expect(discSelection(0).selected).toBe(false);
    const d = discSelection(1);
    expect(d.meanDiameter).toBeCloseTo(d.diameters.reduce((a, b) => a + b, 0) / 3, 12);
  });
  it('keeps reproductive isolation independent of allele divergence', () => {
    const isolated = isolatedPopulations(15, 0).at(-1)!,
      mixed = isolatedPopulations(15, 0.25).at(-1)!;
    expect(isolated.a - isolated.b).toBeGreaterThan(mixed.a - mixed.b);
    expect(isolated.a + isolated.b).toBeCloseTo(1);
    expect(geneFlow(false, false)).toBe(true);
    expect(geneFlow(true, false)).toBe(false);
    expect(geneFlow(false, true)).toBe(false);
  });
});
