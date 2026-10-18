import { expect, it } from 'vitest';
import {
  mendelCross,
  mendelGametes,
  segregationCounts,
  segregationDraws,
  drawBallPoint,
  bucketPoint,
  pollinationState,
  mendelObservations,
} from './bio-mendel-crosses';
it('derives classic ratios from gamete multiplication rather than drawing fixed ratios', () => {
  expect(mendelCross('DD', 'dd').phenotype).toEqual({ tall: 1 });
  expect(mendelCross('Dd', 'Dd').phenotype).toEqual({ tall: 0.75, short: 0.25 });
  expect(mendelCross('Dd', 'dd').phenotype).toEqual({ tall: 0.5, short: 0.5 });
  expect(mendelCross('YyRr', 'YyRr').phenotype).toEqual({
    'yellow-round': 9 / 16,
    'yellow-wrinkled': 3 / 16,
    'green-round': 3 / 16,
    'green-wrinkled': 1 / 16,
  });
  expect(Object.values(mendelCross('YyRr', 'yyrr').phenotype)).toEqual([0.25, 0.25, 0.25, 0.25]);
  expect(mendelGametes('YYRR')).toEqual([{ alleles: 'YR', probability: 1 }]);
});
it('preserves parent-origin alleles and exposes the recessive homozygote boundary', () => {
  for (const cross of [
    ['DD', 'dd'],
    ['Dd', 'Dd'],
    ['YyRr', 'YyRr'],
  ]) {
    const m = mendelCross(...(cross as [string, string]));
    expect(m.cells.reduce((s, c) => s + c.probability, 0)).toBeCloseTo(1);
    expect(m.cells.every((c) => c.genotype.length === cross[0].length)).toBe(true);
  }
  expect(mendelCross('dd', 'dd').phenotype).toEqual({ short: 1 });
  expect(mendelObservations.diSelf.values.reduce((a, b) => a + b, 0)).toBe(556);
});
it('samples with replacement reproducibly and returns the identical ball to its own bucket', () => {
  expect(segregationDraws(17, 35).slice(0, 30)).toEqual(segregationDraws(17, 30));
  const counts = segregationCounts(17, 30);
  expect(counts.DD + counts.Dd + counts.dd).toBe(30);
  expect(segregationDraws(18, 30)).not.toEqual(segregationDraws(17, 30));
  for (let i = 0; i < 20; i++)
    for (let side = 0; side < 2; side++) {
      expect(drawBallPoint(i, side, 0)).toEqual(bucketPoint(i, side));
      expect(drawBallPoint(i, side, 1)).toEqual(bucketPoint(i, side));
    }
  expect(pollinationState(1, false, true).controlledCross).toBe(false);
  expect(pollinationState(1, true, false).controlledCross).toBe(false);
});
