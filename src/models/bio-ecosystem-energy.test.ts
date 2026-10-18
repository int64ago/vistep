import { it, expect } from 'vitest';
import {
  energyBudget,
  lakeTotals,
  cornBudget,
  carbonMarkers,
  carbonLedger,
  contaminantUptake,
  trophicContaminant,
  supportedFoodLinks,
} from './bio-ecosystem-energy';
it('preserves the printed energy budgets and explicit tiny unassigned remainder', () => {
  expect(energyBudget(0).remainder).toBe(0);
  expect(energyBudget(1).remainder).toBe(0);
  expect(energyBudget(2).remainder).toBeCloseTo(0.1);
  expect(energyBudget(2).decomposer).toBe(0);
  const t = lakeTotals();
  expect(t.respiration + t.decomposer + t.unused + t.remainder).toBeCloseTo(t.input);
  expect(energyBudget(0).efficiency * 100).toBeCloseTo(13.5165734);
  expect(energyBudget(1).efficiency * 100).toBeGreaterThan(20);
});
it('independently reproduces textbook carbon-to-glucose and energy accounting', () => {
  const c = cornBudget();
  expect(c.glucoseKg).toBe(6687.5);
  expect(c.respiredKj).toBe(32720000);
  expect(c.fixedKj).toBe(139720000);
  expect(c.efficiency).toBeCloseTo(0.01643764705882353);
});
it('conserves all12 carbon identities including material currently in transit', () => {
  for (const long of [false, true])
    for (let i = 0; i <= 100; i++) {
      const m = carbonMarkers(i / 100, long),
        l = carbonLedger(m);
      expect(new Set(m.map((c) => c.id)).size).toBe(12);
      expect(Object.values(l).reduce((a, b) => a + b, 0)).toBe(12);
    }
  expect(carbonLedger(carbonMarkers(0))).toMatchObject({ air: 6, plant: 3, animal: 1, soil: 2 });
  expect(carbonLedger(carbonMarkers(1))).toMatchObject({ air: 7, plant: 2, animal: 1, soil: 2 });
});
it('balances ocean exchange and transfers fossil carbon rather than creating it', () => {
  const a = carbonLedger(carbonMarkers(1, true, true, false)),
    b = carbonLedger(carbonMarkers(1, true, true, true));
  expect(a).toMatchObject({ air: 6, ocean: 4, fossil: 2 });
  expect(b).toMatchObject({ air: 8, ocean: 4, fossil: 0 });
});
it('conserves pollutant mass and tests zero uptake and elimination limits', () => {
  expect(contaminantUptake(0).body).toBe(0);
  expect(contaminantUptake(10, 0.1, 0).body).toBe(0);
  for (let i = 0; i <= 100; i++) {
    const c = contaminantUptake(i / 5);
    expect(c.body + c.water).toBeCloseTo(24);
    expect(c.body).toBeGreaterThanOrEqual(0);
  }
  const t = 5,
    c = contaminantUptake(t, 0.1, 0.3);
  expect(c.body).toBeCloseTo(18 * (1 - Math.exp(-0.4 * t)));
  expect(contaminantUptake(30, 1).bodyConcentration).toBeLessThan(
    contaminantUptake(30, 0.02).bodyConcentration,
  );
});
it('separates total ingestion, retained load, concentration and counterexample', () => {
  const c = trophicContaminant(1);
  expect(c.ingested).toBe(20);
  expect(c.retained).toBe(16);
  expect(c.rejected).toBe(4);
  expect(c.concentration).toBe(16);
  expect(c.magnification).toBe(8);
  expect(trophicContaminant(1, 0.05).magnification).toBeLessThan(1);
  expect(trophicContaminant(1, 0.8, 2).concentration).toBe(8);
});
it('never promotes a hypothetical food-web edge to observed evidence', () => {
  expect(
    supportedFoodLinks(['observed', 'inferred', 'interview', 'unknown']).map((e) => e.supported),
  ).toEqual([true, false, true, false]);
});
import { feedingStage } from './bio-ecosystem-energy';
it('transfers ingested contaminant only after each portion reaches the mouth', () => {
  expect(feedingStage(0.05).consumedFraction).toBe(0);
  expect(feedingStage(0.07).travel).toBeCloseTo(1);
  expect(feedingStage(0.085).consumedFraction).toBeCloseTo(0.05);
  expect(feedingStage(1).consumedFraction).toBe(1);
});
