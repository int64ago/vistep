import { it, expect } from 'vitest';
import {
  waterReading,
  crossingPosition,
  nitrogenMarkers,
  nitrogenLedger,
  habitatFit,
  nutrientCapacity,
  courtyardMarkers,
  courtyardPaths,
  carbonPlot,
  carbonStrata,
  carbonAnnual,
} from './bio-conservation-evidence';
it('preserves missing water measurements without inventing overall water classes', () => {
  expect(waterReading('')).toBeNull();
  expect(waterReading('0')).toBe(0);
  expect(waterReading('-1')).toBeNull();
  expect(waterReading('7.8')).toBe(7.8);
});
it('keeps the same bear and routes the crossing over its bridge only', () => {
  for (let i = 0; i <= 100; i++) {
    const a = crossingPosition(i / 100, 240);
    expect(a.individualId).toBe('bear-A');
    expect(a.y).toBe(160);
    expect(crossingPosition(i / 100, 240, false).x + 10).toBeLessThan(240 * 0.45);
  }
});
it('conserves24nitrogen labels, with harvested and lost pools outside the cycle', () => {
  for (let i = 0; i <= 100; i++) {
    expect(new Set(nitrogenMarkers(i / 100).map((x) => x.id)).size).toBe(24);
    expect(Object.values(nitrogenLedger(i / 100)).reduce((a, b) => a + b, 0)).toBe(24);
  }
  expect(nitrogenLedger(1)).toMatchObject({ soil: 14, product: 6, loss: 4 });
  expect(nitrogenLedger(1, false)).toMatchObject({ soil: 0, product: 6, stored: 18 });
});
it('matches traits to conditions and preserves excess over uptake capacity', () => {
  expect(habitatFit(0.25, false)).toBe(1);
  expect(habitatFit(0.8, true)).toBe(1);
  expect(habitatFit(0.25, true)).toBeLessThan(0.01);
  expect(nutrientCapacity(10, 6)).toEqual({ input: 10, used: 6, excess: 4 });
  expect(nutrientCapacity(0, 6).excess).toBe(0);
});
it('keeps nitrogen in slurry while biogas uses a separate connected line', () => {
  const a = courtyardMarkers(0.7, 240),
    g = courtyardPaths(240);
  expect(a.nitrogen).toHaveLength(12);
  expect(a.gas).toEqual(g.gas);
  expect(a.gasMarkers).toHaveLength(6);
  expect(courtyardMarkers(0, 240).gas).toEqual(courtyardMarkers(1, 240).gas);
  expect(g.slurry[2].y).toBe(222);
  expect(g.slurry[3].y).toBe(g.liquidY);
  expect(g.gas[0].y).toBeGreaterThan(g.liquidY);
  expect(g.gas[2].y).toBeLessThan(g.liquidY);
  for (let i = 0; i <= 100; i++)
    expect(courtyardMarkers(i / 100, 240).nitrogen.every((n) => n.y >= 106)).toBe(true);
});
it('independently converts vegetation and soil carbon to MgC per hectare', () => {
  const a = carbonPlot();
  expect(a.above).toBeCloseTo(23.5);
  expect(a.roots).toBeCloseTo(5.875);
  expect(a.litter).toBeCloseTo(0.9);
  expect(a.soil).toBeCloseTo(64.8);
  expect(a.total).toBeCloseTo(95.075);
  expect(carbonPlot(2000, 500, 400, 0.47, 30, 1.2, 0.02, 1).soil).toBe(0);
  expect(carbonPlot(2000, 500, 800).above).toBeCloseTo(a.above / 2);
});
it('weights by landscape area instead of number of plots sampled', () => {
  const a = carbonStrata(3),
    b = carbonStrata(9);
  expect(a.total).toBe(6200);
  expect(a.weighted).toBe(62);
  expect(a.naive).toBeCloseTo(460 / 6);
  expect(b.weighted).toBe(a.weighted);
  expect(b.naive).toBeGreaterThan(a.naive);
});
it('keeps historical carbon and carbon-dioxide units distinct', () => {
  expect(carbonAnnual().value).toBe(201.1);
  expect(carbonAnnual(true).value / carbonAnnual().value).toBeCloseTo(44 / 12);
  expect(carbonAnnual().years).toBe('2001–2010');
});
