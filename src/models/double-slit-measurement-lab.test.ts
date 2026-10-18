import { expect, it } from 'vitest';
import {
  slitMeasurement,
  inferWavelength,
  sensorArray,
  lloydMirror,
} from './double-slit-measurement-lab';
it('uses N−1 intervals for N bright centers', () => {
  const s = slitMeasurement();
  expect(inferWavelength(-2 * s.spacing, 3 * s.spacing, 6, s.d, s.L)).toBeCloseTo(589);
  expect(inferWavelength(0, 1, 1)).toBeNull();
});
it('matches a physical millimetre fringe spacing independently of the inverse model', () => {
  // 600 nm light, 0.2 mm separation, a 1 m propagation distance: 3 mm.
  expect(slitMeasurement(600, 0.2, 1).spacing).toBeCloseTo(3, 12);
  expect(inferWavelength(-6, 9, 6, 0.2, 1)).toBeCloseTo(600, 9);
  expect(slitMeasurement().spacing).toBeCloseTo(3.9266666667, 9);
  const pixels = sensorArray(600, 0.2, 1);
  expect(Math.max(...pixels.map((p) => p.value))).toBeGreaterThan(0.9);
  expect(Math.min(...pixels.map((p) => p.value))).toBeLessThan(0.1);
});
it('moves fringes according to wavelength, separation and distance', () => {
  expect(slitMeasurement(589, 0.36).spacing * 2).toBeCloseTo(slitMeasurement().spacing);
  expect(slitMeasurement(450).spacing).toBeLessThan(slitMeasurement(650).spacing);
});
it('integrates finite sensor pixels and preserves bounds', () => {
  const a = sensorArray();
  expect(a).toHaveLength(160);
  expect(a.every((x) => x.value >= 0 && x.value <= 1)).toBe(true);
  expect(a[0].value).toBeCloseTo(a[159].value);
});
it('accounts for the Lloyd mirror reflection phase and actual reflection point', () => {
  expect(lloydMirror(0).intensity).toBe(0);
  const v = lloydMirror(1, 0.3);
  expect(v.reflectionX).toBeCloseTo((1.2 * 0.3) / 1.3);
  expect(lloydMirror(v.spacingMm / 2).intensity).toBeCloseTo(1, 5);
});
