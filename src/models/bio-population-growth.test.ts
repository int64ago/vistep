import { it, expect } from 'vitest';
import {
  binaryPopulation,
  logisticPopulation,
  chamberConcentration,
  yeastCells,
  yeastCount,
  inCountingSquare,
  flaskCells,
  chamberFill,
  canopyEvidence,
  recordedMeans,
} from './bio-population-growth';
it('reproduces discrete binary divisions without fractional organisms', () => {
  expect(binaryPopulation(19).population).toBe(1);
  expect(binaryPopulation(60).population).toBe(8);
  expect(binaryPopulation(72 * 60).generations).toBe(216);
  expect(binaryPopulation(0, 0).population).toBe(0);
});
it('has independently known logistic initial value, half-capacity inflection and fixed point', () => {
  expect(logisticPopulation(0).value).toBe(5);
  const t = Math.log(375 / 5 - 1) / 1.8;
  expect(logisticPopulation(t).value).toBeCloseTo(187.5);
  expect(logisticPopulation(t).slope).toBeCloseTo((1.8 * 375) / 4);
  expect(logisticPopulation(100, 375).value).toBe(375);
  expect(logisticPopulation(4, 5, 375, 0).value).toBe(5);
  expect(logisticPopulation(4, 0).value).toBe(0);
});
it('derives concentration from the actual counted volume rather than a universal multiplier', () => {
  expect(chamberConcentration(20, 10)?.volumeMl).toBeCloseTo(0.000004);
  expect(chamberConcentration(20, 10)?.cellsPerMl).toBeCloseTo(50_000_000);
  expect(chamberConcentration(20, 1, 1)?.cellsPerMl).toBeCloseTo(200_000);
  expect(chamberConcentration(null)).toBeNull();
  expect(chamberConcentration(3, 1, 0)).toBeNull();
});
it('counts visible cell centers with a single consistent boundary rule', () => {
  for (let d = 0; d < 8; d++)
    for (let r = 0; r < 3; r++) {
      const cells = yeastCells(d, r);
      expect(cells.filter(inCountingSquare)).toHaveLength(yeastCount(d, r));
      expect(new Set(cells.map((c) => c.id)).size).toBe(cells.length);
      expect(cells.filter(inCountingSquare).some((c) => c.id === 103)).toBe(false);
    }
});
it('keeps the same flask cells inside the actual convex liquid compartment throughout mixing', () => {
  for (let i = 0; i <= 100; i++)
    for (const c of flaskCells(i / 100)) {
      const half = 16 + ((c.y - 105) * 40) / 130;
      expect(Math.abs(c.x) + 6).toBeLessThan(half);
      expect(c.y).toBeGreaterThan(155.5);
      expect(c.y + 6).toBeLessThan(240);
    }
  expect(flaskCells(0).map((c) => c.id)).toEqual(flaskCells(1).map((c) => c.id));
  expect(chamberFill(0)).toBe(0);
  expect(chamberFill(1)).toBe(1);
});
it('preserves observed canopy values and handles missing counts as missing', () => {
  expect(canopyEvidence[2].values.indexOf(Math.max(...canopyEvidence[2].values))).toBe(2);
  expect(
    recordedMeans([
      [null, null, null],
      [0, null, null],
      [2, 4, 6],
    ]),
  ).toEqual([
    { n: 0, mean: null },
    { n: 1, mean: 0 },
    { n: 3, mean: 4 },
  ]);
});
