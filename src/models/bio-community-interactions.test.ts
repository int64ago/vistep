import { expect, it } from 'vitest';
import {
  competitionModel,
  gauseRecords,
  normalizedHareLynx,
  hareLynxCorrelation,
  hareFactorial,
  shoreOccupancy,
  shoreSites,
  shoreTransition,
} from './bio-community-interactions';
it('keeps digitized evidence separate from ideal competition trajectories', () => {
  expect(gauseRecords).toHaveLength(63);
  const end = gauseRecords.find((r) => r.treatment === 'Mixture' && r.day === 24)!;
  expect(end.caudatum).toBeCloseTo(34.58013663);
  expect(end.aurelia).toBeCloseTo(139.6226415);
  expect(end.caudatum).toBeGreaterThan(0);
});
it('recovers the independent logistic solution when resource overlap is zero', () => {
  const a = competitionModel(5, 0),
    b = competitionModel(5, 1, false);
  expect(a).toEqual(b);
  expect(a.caudatum).toBeCloseTo(160 / (1 + 79 * Math.exp(-0.65 * 5)), 6);
  expect(a.aurelia).toBeCloseTo(220 / (1 + 109 * Math.exp(-0.65 * 5)), 6);
  const end = competitionModel(40, 1);
  expect(end.caudatum).toBeLessThan(0.1);
  expect(end.aurelia).toBeGreaterThan(210);
});
it('normalizes each historical series without changing its time stamps', () => {
  const r = normalizedHareLynx();
  expect(r).toHaveLength(91);
  expect(r[0].year).toBe(1845);
  expect(r.at(-1)!.year).toBe(1935);
  expect(Math.max(...r.map((x) => x.hareIndex))).toBe(1);
  expect(Math.max(...r.map((x) => x.lynxIndex))).toBe(1);
  expect(hareLynxCorrelation(2).pairs).toBe(89);
  expect(Math.abs(hareLynxCorrelation(2).value)).toBeLessThan(1);
});
it('preserves the factorial evidence rather than adding independent effects', () => {
  expect(hareFactorial(false, false)).toBe(1);
  expect(hareFactorial(false, true)).toBe(2);
  expect(hareFactorial(true, false)).toBe(3);
  expect(hareFactorial(true, true)).toBe(11);
  expect(1 + (2 - 1) + (3 - 1)).toBe(4);
});
it('conserves fixed rock area and shows recruitment before displacement', () => {
  for (let i = 0; i <= 100; i++) {
    const f = shoreOccupancy(i / 10);
    expect(Object.values(f).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    for (const n of Object.values(f)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
    expect(shoreSites(i / 10)).toHaveLength(96);
  }
  expect(shoreOccupancy(1).barnacle).toBeGreaterThan(0.6);
  expect(shoreOccupancy(9).mussel).toBeGreaterThan(0.9);
  expect(shoreOccupancy(9, false)).toEqual(shoreOccupancy(0));
});
it('retains substrate identity when one occupant is replaced by another', () => {
  for (let i = 0; i <= 80; i++) {
    const cells = shoreTransition(i / 8);
    expect(new Set(cells.map((c) => c.id)).size).toBe(96);
    expect(cells.map((c) => [c.id, c.x, c.y])).toEqual(shoreSites(0).map((c) => [c.id, c.x, c.y]));
  }
});
