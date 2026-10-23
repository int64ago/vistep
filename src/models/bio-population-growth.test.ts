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

import {
  densityRates,
  changedCapacity,
  renewalCohort,
  observation,
  concentrationRecord,
  practiceObservations,
  nutrientPrediction,
  populationDirector,
} from './bio-population-growth';
it('derives logistic net growth from two nonzero rates, and slows per-capita growth with density', () => {
  for (const k of [200, 375, 650])
    for (const z of [0, 0.1, 0.5, 1, 1.8, 2]) {
      const r = densityRates(k * z, k);
      expect(r.net).toBeCloseTo(1.8 * k * z * (1 - z));
      expect(r.birthRate).toBeGreaterThan(0);
      expect(r.deathRate).toBeGreaterThan(0);
    }
  expect(densityRates(375).births).toBeCloseTo(densityRates(375).deaths);
  expect(densityRates(375).births).toBeGreaterThan(0);
  expect(densityRates(37.5).birthRate).toBeGreaterThan(densityRates(375).birthRate);
  expect(densityRates(37.5).deathRate).toBeLessThan(densityRates(375).deathRate);
  expect(densityRates(NaN, NaN).net).toBe(0);
});
it('an environmental change preserves the count at the instant of change and alters later rates', () => {
  expect(changedCapacity(5, 600).value).toBe(changedCapacity(5, 200).value);
  expect(changedCapacity(5 + 1e-7, 600).value).toBeCloseTo(changedCapacity(5, 600).value, 3);
  expect(changedCapacity(8, 600).value).toBeGreaterThan(changedCapacity(8, 200).value);
  expect(changedCapacity(8, 600, 5, 0).value).toBe(0);
});
it('one possible renewal interval keeps parent/daughter identities and a birth-death ledger', () => {
  for (const z of [0.1, 1, 1.8])
    for (let i = 0; i <= 100; i++) {
      const r = renewalCohort(i / 100, z);
      expect(r.count).toBe(4 + r.births - r.deaths);
      expect(r.events.map((e) => e.parent)).toEqual(['P1', 'P2', 'P3', 'P4']);
      expect(new Set(r.events.flatMap((e) => e.daughters)).size).toBe(8);
    }
  expect(renewalCohort(1, 0.1).count).toBe(6);
  expect(renewalCohort(1, 1).count).toBe(4);
  expect(renewalCohort(1, 1).births).toBe(1);
  expect(renewalCohort(1, 1).deaths).toBe(1);
});
it('preserves sample dilution independently and converts before averaging', () => {
  const a = observation(20, 10),
    b = observation(40, 5),
    missing = observation(null, 10);
  expect(Object.isFrozen(a)).toBe(true);
  expect(concentrationRecord([[a, b, missing]])[0]).toEqual({
    n: 2,
    mean: 50_000_000,
    cultureCells: 500_000_000,
  });
  expect(concentrationRecord([[null, null, null], [observation(0, 10)]])).toEqual([
    { n: 0, mean: null, cultureCells: null },
    { n: 1, mean: 0, cultureCells: 0 },
  ]);
  expect(observation(20, 0)).toBeNull();
  expect(observation(Infinity, 10)).toBeNull();
  expect(Object.isFrozen(practiceObservations)).toBe(true);
});
it('nutrient supplementation makes a conditional prediction, not a forced universal recovery', () => {
  expect(nutrientPrediction(true, 'nutrient', 1).count).toBe(8);
  expect(nutrientPrediction(false, 'nutrient', 1).count).toBe(4);
  expect(nutrientPrediction(true, 'other', 1).count).toBe(4);
  expect(nutrientPrediction(true, 'nutrient', 0).count).toBe(4);
  expect(nutrientPrediction(true, 'nutrient', 1).events.map((e) => e.id)).toEqual(
    nutrientPrediction(false, 'other', 0).events.map((e) => e.id),
  );
});
it('reveals the proposed mechanism before its environmental prediction', () => {
  expect(populationDirector(3, 2, 43).shot).toBe('curve');
  expect(populationDirector(3, 14, 43).shot).toBe('rates');
  expect(populationDirector(3, 25, 44).shot).toBe('renewal');
  expect(populationDirector(3, 26, 39).prediction).toBe(0);
  expect(populationDirector(7, 18, 37).prediction).toBe(0);
});

import { foodShareFrame } from './bio-population-growth';
it('shares one immutable-size finite supply without losing food or changing a recipient identity during transit', () => {
  for (const n of [1, 3, 7, 12, 24])
    for (const w of [240, 272, 800]) {
      const start = foodShareFrame(0, n, w),
        end = foodShareFrame(1, n, w);
      expect(start.foods.map((f) => f.id)).toEqual(end.foods.map((f) => f.id));
      expect(new Set(start.foods.map((f) => f.id)).size).toBe(24);
      expect(end.averageShare * n).toBe(24);
      expect(end.arrived).toBe(24);
      for (let i = 0; i <= 100; i++) {
        const m = foodShareFrame(i / 100, n, w);
        expect(m.foods).toHaveLength(24);
        expect(m.foods.every((f) => m.cells.some((c) => c.id === f.consumer))).toBe(true);
        expect(m.foods.every((f) => f.x >= 0 && f.x <= w && f.y >= 0 && f.y <= 210)).toBe(true);
      }
    }
  expect(foodShareFrame(1, 3).averageShare).toBe(8);
  expect(foodShareFrame(1, 12).averageShare).toBe(2);
});

it('retained-word timing reveals examples when the existing recordings name them', () => {
  for (const lang of ['zh', 'en'] as const) {
    expect(populationDirector(0, 5, 23.5, lang).lineageGeneration).toBe(0);
    expect(populationDirector(0, 8.5, 23.5, lang).lineageGeneration).toBe(2);
    expect(populationDirector(1, 8.4, 25, lang).exponentGeneration).toBe(3);
    expect(populationDirector(1, 10, 25, lang).extrapolationReveal).toBe(false);
    expect(populationDirector(1, 12.2, 25, lang).extrapolationReveal).toBe(true);
    expect(populationDirector(2, 6, 25.5, lang).lateObservation).toBe(0);
    expect(populationDirector(2, 9.1, 25.5, lang).lateObservation).toBe(1);
    expect(populationDirector(4, 3, 23.5, lang).mixing).toBe(0);
    expect(populationDirector(4, 10, 23.5, lang).mixing).toBe(1);
    expect(populationDirector(5, 3.5, 24, lang).fill).toBe(0);
    expect(populationDirector(5, 6.5, 24, lang).fill).toBe(1);
    expect(populationDirector(6, 8, 25, lang).countConversion).toBe(false);
    expect(populationDirector(6, 19, 25, lang).countResult).toBe(true);
    expect(populationDirector(8, 9, 23.5, lang).species).toBe(2);
  }
});

it('all shares assigned to one consumer have unique, separated endpoints including the eighth share', () => {
  for (const n of [1, 3, 7, 12, 24])
    for (const w of [240, 272, 800]) {
      const start = foodShareFrame(0, n, w),
        end = foodShareFrame(1, n, w);
      expect(end.foods.map((f) => [f.id, f.consumer])).toEqual(
        start.foods.map((f) => [f.id, f.consumer]),
      );
      expect(new Set(end.foods.map((f) => `${f.x},${f.y}`)).size).toBe(24);
      for (const c of end.cells) {
        const shares = end.foods.filter((f) => f.consumer === c.id);
        expect(shares).toHaveLength(c.portions);
        for (let i = 0; i < shares.length; i++)
          for (let j = i + 1; j < shares.length; j++)
            expect(
              Math.hypot(shares[i].x - shares[j].x, shares[i].y - shares[j].y),
            ).toBeGreaterThanOrEqual(5.999999);
      }
    }
  const eight = foodShareFrame(1, 3).foods.filter((f) => f.consumer === 'C1');
  expect(eight).toHaveLength(8);
  expect(eight[6].x === eight[0].x && eight[6].y === eight[0].y).toBe(false);
  expect(eight[7].x === eight[1].x && eight[7].y === eight[1].y).toBe(false);
});

it('aligns measured new speech with density, turnover, and prediction without changing rates or data', () => {
  for (const lang of ['zh', 'en'] as const) {
    const en = lang === 'en',
      at = (c: number, t: number) => populationDirector(c, t, c === 3 ? 44 : 38, lang);
    expect(at(3, 3.8).shot).toBe('food');
    expect(at(3, 3.8).foodCrowded).toBe(false);
    expect(at(3, 6.8).foodCrowded).toBe(true);
    expect(at(3, en ? 18.8 : 21.1).rateDensity).toBe(1);
    expect(at(3, en ? 22.2 : 24.9).renewal).toBeLessThan(0.02);
    expect(renewalCohort(at(3, en ? 25.22 : 27.37).renewal).births).toBe(1);
    expect(renewalCohort(at(3, en ? 26.47 : 28.62).renewal).deaths).toBe(1);
    expect(renewalCohort(at(3, en ? 27.9 : 30.3).renewal).count).toBe(4);
    expect(at(3, en ? 32.2 : 34.3).reveal).toBe(false);
    expect(at(3, en ? 32.4 : 34.5).reveal).toBe(true);
    expect(at(3, en ? 33.7 : 36.1).prediction).toBe(0);
    expect(at(3, en ? 36.7 : 39.4).prediction).toBe(1);
    expect(at(7, 5.5).recordDay).toBe(7);
    expect(at(7, 22).prediction).toBe(0);
    expect(at(7, 24.8).prediction).toBe(0);
    expect(nutrientPrediction(true, 'nutrient', at(7, 24.8).prediction).count).toBe(4);
    expect(nutrientPrediction(true, 'nutrient', at(7, 30).prediction).count).toBe(8);
  }
});
