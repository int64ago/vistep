import { expect, it } from 'vitest';
import {
  peroxideReaction,
  enzymeActivity,
  enzymeConversion,
  amylaseSpecificity,
  cellFreeFermentation,
  cagedMeat,
} from './bio-enzyme-investigations';
it('respects peroxide stoichiometry and identical eventual yields', () => {
  for (const mode of ['blank', 'heated', 'iron', 'catalase'] as const) {
    const s = peroxideReaction(10, mode);
    expect(s.substrate + 2 * s.oxygen).toBeCloseTo(1);
    expect(peroxideReaction(10000, mode).oxygen).toBeCloseTo(0.5);
  }
  expect(peroxideReaction(3, 'catalase').oxygen).toBeGreaterThan(
    peroxideReaction(3, 'iron').oxygen,
  );
});
it('separates cold slowing from persistent heat damage', () => {
  expect(enzymeActivity(5, 7).activity).toBeLessThan(enzymeActivity(25, 7).activity);
  expect(enzymeActivity(25, 7, 5).survival).toBe(1);
  expect(enzymeActivity(25, 7, 85).survival).toBeLessThan(0.01);
  expect(enzymeActivity(25, 2).activity).toBeLessThan(enzymeActivity(25, 7).activity);
  expect(enzymeConversion(0, 25, 7).converted).toBe(0);
});
it('does not give amylase a sucrose-hydrolysis activity', () => {
  expect(amylaseSpecificity('starch', 5).positive).toBe(true);
  expect(amylaseSpecificity('sucrose', 100).positive).toBe(false);
});
it('allows cell-free extract fermentation but requires active material and substrate', () => {
  const s = cellFreeFermentation(10);
  expect(s.ethanol).toBeGreaterThan(0);
  expect(s.carbonDioxide).toBe(s.ethanol);
  expect(s.glucose + s.ethanol / 2).toBeCloseTo(1);
  expect(cellFreeFermentation(10, false).ethanol).toBe(0);
  expect(cellFreeFermentation(10, true, false).ethanol).toBe(0);
  expect(cagedMeat(1).mechanicalAccess).toBe(false);
  expect(cagedMeat(1).fraction).toBeLessThan(cagedMeat(1, false).fraction);
});
