import { describe, expect, it } from 'vitest';
import { thinFilm, filmShot } from './thin-film-interference';
describe('normal-incidence thin film', () => {
  it('matches the quarter-wave soap-film maximum and half-wave zero', () => {
    const n = 1.333,
      wavelength = 650;
    expect(thinFilm(wavelength / (4 * n), wavelength, n).contrast).toBeCloseTo(1, 12);
    expect(thinFilm(wavelength / (2 * n), wavelength, n).reflectance).toBeCloseTo(0, 12);
    expect(thinFilm(0).reflectance).toBeCloseTo(0, 12);
  });
  it('flips the bright/dark condition when both reflected rays invert', () => {
    const d = 550 / (4 * 1.33);
    expect(thinFilm(d).contrast).toBeCloseTo(1, 12);
    expect(thinFilm(d, 550, 1.33, 1.5).contrast).toBeCloseTo(0, 12);
    // Exact Fresnel zero-thickness limit must reduce to the bare substrate.
    expect(thinFilm(0, 550, 1.33, 1.5).reflectance).toBeCloseTo(((1 - 1.5) / (1 + 1.5)) ** 2, 12);
  });
  it('is periodic, bounded and not monotonically brighter with thickness', () => {
    for (let d = 0; d < 1500; d += 13) {
      const a = thinFilm(d);
      expect(a.reflectance).toBeGreaterThanOrEqual(-1e-12);
      expect(a.reflectance).toBeLessThanOrEqual(1);
      expect(thinFilm(d + 550 / 2.66).reflectance).toBeCloseTo(a.reflectance, 10);
    }
    expect(thinFilm(207).reflectance).toBeLessThan(thinFilm(103).reflectance);
  });
  it('rejects invalid units and reconstructs a direct chapter seek', () => {
    expect(() => thinFilm(-1)).toThrow(RangeError);
    expect(() => thinFilm(1, 0)).toThrow(RangeError);
    expect(filmShot(4, 0.5).substrate).toBe(1.5);
    expect(filmShot(5, 0.5)).toEqual(filmShot(5, 0.5));
  });
});

it('draws coherent fields matching an independent sum of successive internal returns', () => {
  for (const substrate of [1, 1.5])
    for (const thickness of [0, 53, 103.3834586466, 206.7669172932, 700]) {
      const n = 1.33,
        phi = (4 * Math.PI * n * thickness) / 550;
      const first = (1 - n) / (1 + n),
        back = (n - substrate) / (n + substrate);
      const transmitted = (2 / (1 + n)) * ((2 * n) / (1 + n));
      const ratio = -first * back;
      let re = 0,
        im = 0;
      for (let turn = 0; turn < 40; turn++) {
        re += transmitted * back * ratio ** turn * Math.cos((turn + 1) * phi);
        im += transmitted * back * ratio ** turn * Math.sin((turn + 1) * phi);
      }
      const model = thinFilm(thickness, 550, n, substrate);
      expect(model.fields[1].real).toBeCloseTo(re, 12);
      expect(model.fields[1].imaginary).toBeCloseTo(im, 12);
      expect(model.fields[2].real).toBeCloseTo(first + re, 12);
      expect(model.fields[2].real ** 2 + model.fields[2].imaginary ** 2).toBeCloseTo(
        model.reflectance,
        12,
      );
    }
  expect(Math.abs(thinFilm(550 / (4 * 1.33), 550, 1.33, 1.5).fields[2].real)).toBeGreaterThan(0.08);
});
