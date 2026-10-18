import { it, expect } from 'vitest';
import { symmetricFilm, wedgeSpacing, wedgeThickness, soapThickness } from './thin-film-lab';
it('cancels at zero thickness and peaks at a quarter optical wavelength', () => {
  expect(symmetricFilm(0)).toBe(0);
  expect(symmetricFilm(589 / (4 * 1.333))).toBeGreaterThan(0.07);
  expect(symmetricFilm(589 / (2 * 1.333))).toBeLessThan(1e-20);
});
it('doubles wedge fringe spacing after removing one of two identical sheets', () => {
  expect(wedgeSpacing(589, 1)).toBeCloseTo(2 * wedgeSpacing(589, 2));
  expect(wedgeThickness(80, 2)).toBe(80000);
  expect(symmetricFilm(wedgeThickness(wedgeSpacing(589, 2), 2), 589, 1, 1.5)).toBeLessThan(1e-20);
});
it('thinner drainage shifts the same optical contours, with bounded passive reflectance', () => {
  expect(soapThickness(0.5, 0.5)).toBe(0.5 * soapThickness(0.5, 1));
  for (let d = 0; d < 2000; d += 17) expect(symmetricFilm(d)).toBeGreaterThanOrEqual(0);
  for (let d = 0; d < 2000; d += 17) expect(symmetricFilm(d)).toBeLessThanOrEqual(1);
});
