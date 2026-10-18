import { it, expect } from 'vitest';
import {
  markRecaptureEstimate,
  captureSample,
  surveyMeadow,
  countQuadrat,
  selectQuadrats,
  quadratEstimate,
  lightTrapState,
  lightTrapPosition,
  observedIndividuals,
  matchWildlife,
  wildlifeRecords,
  animalLocations,
} from './bio-population-sampling';
it('reproduces the textbook estimator and rejects zero recaptures', () => {
  expect(markRecaptureEstimate(39, 34, 15)).toBeCloseTo(88.4, 12);
  expect(markRecaptureEstimate(16, 12, 0)).toBeNull();
  expect(markRecaptureEstimate(2, 3, 4)).toBeNull();
});
it('preserves animal identity and reduces recognition when marks are lost', () => {
  const a = captureSample(),
    b = captureSample(26, 1);
  expect(new Set(a.first).size).toBe(16);
  expect(new Set(a.second).size).toBe(12);
  expect(a.first).toEqual(b.first);
  expect(a.second).toEqual(b.second);
  expect(b.recaught).toBe(0);
  expect(a.recaught).toBeGreaterThan(0);
  for (let i = 0; i < 48; i++) {
    const p = animalLocations(i, true);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(1);
  }
});
it('uses an explicit non-double-counting quadrat boundary convention', () => {
  const q = { id: 0, x: 2, y: 2, size: 1 };
  const p = surveyMeadow().filter((p) => p.id >= 116);
  expect(countQuadrat(p, q).map((p) => p.id)).toEqual([116, 117]);
});
it('averages actual spatial counts and reproduces census density with a full partition', () => {
  const plants = surveyMeadow(),
    all = Array.from({ length: 100 }, (_, id) => ({
      id,
      x: id % 10,
      y: Math.floor(id / 10),
      size: 1,
    }));
  const s = quadratEstimate(all, plants);
  expect(s.count).toBe(80);
  expect(s.density).toBe(0.8);
  expect(s.trueDensity).toBe(0.8);
  const plots = selectQuadrats(8, 17);
  expect(new Set(plots.map((p) => p.id)).size).toBe(8);
  expect(quadratEstimate(selectQuadrats(8, 17, true)).density).toBeGreaterThan(0.8);
});
it('changes detection with weather while retaining all underlying insects', () => {
  const a = lightTrapState(1, 1),
    b = lightTrapState(1, 0.3);
  expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  expect(a.filter((x) => x.caught).length).toBeGreaterThan(b.filter((x) => x.caught).length);
  expect(lightTrapState(1, 1, false).some((x) => x.caught)).toBe(false);
});
it('distinguishes repeated records, confirmed identities and unresolved evidence', () => {
  expect(wildlifeRecords).toHaveLength(6);
  expect(observedIndividuals()).toBe(3);
  expect(matchWildlife('A', 'A')).toBe('same');
  expect(matchWildlife('A', 'B')).toBe('different');
  expect(matchWildlife('A', 'A', false)).toBe('unresolved');
});

it('folds wings and follows the actual funnel neck into the collection chamber', () => {
  for (let id = 0; id < 24; id++)
    for (let n = 450; n <= 1000; n++) {
      const p = lightTrapPosition(n / 1000, { x: 25, y: 80 }, 160, id);
      if (p.y >= 219 && p.y <= 233) {
        expect(Math.abs(p.x - 160) + p.wingHalfSpan).toBeLessThan(4);
      }
      if (n === 1000) {
        expect(p.y).toBeGreaterThan(233);
        expect(p.y).toBeLessThan(285);
      }
    }
});
