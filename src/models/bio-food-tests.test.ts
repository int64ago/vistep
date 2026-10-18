import { expect, it } from 'vitest';
import { foodAssay } from './bio-food-tests';
it('requires both a reducing substrate and warming for the Fehling endpoint', () => {
  expect(foodAssay('fehling', 'pear', 4).positive).toBe(true);
  expect(foodAssay('fehling', 'pear', 4, false).positive).toBe(false);
  expect(foodAssay('fehling', 'sucrose', 4).positive).toBe(false);
  expect(foodAssay('fehling', 'water', 4).positive).toBe(false);
});
it('distinguishes peptide detection from sugar and enforces the protocol', () => {
  expect(foodAssay('biuret', 'albumin', 4, false).positive).toBe(true);
  expect(foodAssay('biuret', 'albumin', 4, true, false).invalidOrder).toBe(true);
  expect(foodAssay('biuret', 'pear', 4).positive).toBe(false);
});
it('washes background without erasing lipid-bound stain', () => {
  expect(foodAssay('sudan', 'peanut', 4).lipidStain).toBe(1);
  expect(foodAssay('sudan', 'peanut', 4).washed).toBe(true);
  expect(foodAssay('sudan', 'water', 4).lipidStain).toBe(0);
  expect(foodAssay('sudan', 'peanut', -3).reagent).toBe(false);
  const before = foodAssay('sudan', 'peanut', 3);
  const during = foodAssay('sudan', 'peanut', 3.5);
  expect(before.washingProgress).toBe(0);
  expect(during.washingProgress).toBe(0.5);
  expect(during.washed).toBe(false);
  expect(during.lipidStain).toBe(before.lipidStain);
});
