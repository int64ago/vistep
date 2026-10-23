import { it, expect } from 'vitest';
import { fresnelSlit, fresnelCircle } from './optical-diffraction-lab';
it('approaches Fraunhofer minima and loses throughput as the slit narrows', () => {
  const a = 50,
    w = 550,
    L = 1,
    x = (w * L) / a;
  expect(fresnelSlit(x, a, w)).toBeLessThan(fresnelSlit(0, a, w) * 0.001);
  expect(fresnelSlit(0, 50)).toBeLessThan(fresnelSlit(0, 100));
});
it('has symmetric slit intensity with converged quadrature', () => {
  expect(fresnelSlit(-3, 800)).toBeCloseTo(fresnelSlit(3, 800), 8);
  expect(fresnelSlit(4, 800, 550, 1, 192)).toBeCloseTo(fresnelSlit(4, 800, 550, 1, 384), 4);
});
it('recovers the unit on-axis Poisson spot without adding an artificial dot', () => {
  for (const a of [0.3, 0.6, 1]) expect(fresnelCircle(0, a)).toBeCloseTo(1, 5);
});
it('checks circular aperture axial Fresnel zones and radial convergence', () => {
  const a = 0.4,
    K = (Math.PI * (a * 1e-3) ** 2) / 550e-9;
  expect(fresnelCircle(0, a, 550, 1, false)).toBeCloseTo(4 * Math.sin(K / 2) ** 2, 5);
  expect(fresnelCircle(0.7, 0.6, 550, 1, true, 192)).toBeCloseTo(
    fresnelCircle(0.7, 0.6, 550, 1, true, 384),
    4,
  );
});

import {
  bandPathDifference,
  slitContributions,
  fresnelSlitField,
  fresnelCircleField,
  diskAxisGeometry,
  slitPrediction,
  diffractionDirector,
  diffractionDisplayColor,
  diffractionDisplayLevel,
  SLIT_EXPOSURE,
  DIFFRACTION_CUTS,
  DIFFRACTION_SECONDS,
} from './optical-diffraction-lab';
it('sums eight extended bands to the same complete Fresnel field at several screen positions', () => {
  for (const a of [30, 100, 150, 800])
    for (const x of [0, 1, 5.5, 12]) {
      const b = slitContributions(x, a),
        f = fresnelSlitField(x, a, 550, 1, 1024);
      expect(b.bands.map((v) => v.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(b.total.re).toBeCloseTo(f.re, 7);
      expect(b.total.im).toBeCloseTo(f.im, 7);
    }
});
it('uses independent dimensional first-minimum predictions and preserves finite-z residuals', () => {
  expect(slitPrediction(100, 550).firstMm).toBeCloseTo(5.5, 10);
  expect(slitPrediction(50, 550).firstMm).toBeCloseTo(11, 10);
  expect(slitPrediction(100, 650).firstMm).toBeCloseTo(6.5, 10);
  const d = slitContributions(5.5);
  expect(d.pairPathNm).toBeCloseTo(275, 9);
  expect(d.intensity).toBeGreaterThan(0);
  expect(d.intensity / fresnelSlit(0, 100)).toBeLessThan(0.0001);
  for (let j = 0; j < 4; j++) {
    const a = d.relative[j]!,
      b = d.relative[j + 4]!;
    expect(Math.hypot(a.re + b.re, a.im + b.im)).toBeLessThan(
      (Math.PI * 100e-6 ** 2) / (4 * 550e-9) / 4,
    );
  }
});
it('keeps complementary fields, rather than incorrectly adding their intensities', () => {
  for (const r of [0, 0.1, 0.8, 2.3]) {
    const a = fresnelCircleField(r, 0.6, 550, 1, false),
      d = fresnelCircleField(r, 0.6, 550, 1, true);
    expect(a.re + d.re).toBeCloseTo(1, 12);
    expect(a.im + d.im).toBeCloseTo(0, 12);
  }
});
it('checks the analytic axial complex field and actual rim-to-target distances independently', () => {
  for (const a of [0.1, 0.6, 1])
    for (const w of [450, 650]) {
      const d = diskAxisGeometry(a, w),
        f = fresnelCircleField(0, a, w, 1, true, 512),
        phase = (Math.PI * (a * 0.001) ** 2) / (w * 1e-9);
      expect(f.re).toBeCloseTo(Math.cos(phase), 7);
      expect(f.im).toBeCloseTo(Math.sin(phase), 7);
      for (const p of d.points) {
        expect(Math.hypot(p.x, p.y)).toBeCloseTo(a * 0.001, 12);
        expect(Math.hypot(p.x, p.y, 1)).toBeCloseTo(p.path, 12);
      }
      expect(d.field.re ** 2 + d.field.im ** 2).toBeCloseTo(1, 12);
    }
});
it('guards nonfinite and quadrature inputs without creating NaN or infinite loops', () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    expect(Number.isFinite(fresnelSlit(bad, bad, bad, bad, bad))).toBe(true);
    expect(Number.isFinite(fresnelCircle(bad, bad, bad, bad, true, bad))).toBe(true);
    expect(diffractionDisplayColor([bad])).not.toMatch(/NaN|Infinity/);
    expect(JSON.stringify(diffractionDirector(bad, bad))).not.toMatch(/null/);
  }
});
it('holds questions until each locale’s actual reveal phrase and restores them on backward seeking', () => {
  for (const locale of ['zh', 'en'] as const) {
    const cuts = DIFFRACTION_CUTS[locale];
    for (const [chapter, reveal] of [
      [1, cuts.slitReveal],
      [4, cuts.pencilReveal],
      [5, cuts.caliperReveal],
      [6, cuts.diskReveal],
    ]) {
      expect(diffractionDirector(chapter!, reveal! - 0.001, locale).reveal).toBe(false);
      expect(diffractionDirector(chapter!, reveal!, locale).reveal).toBe(true);
      expect(diffractionDirector(chapter!, reveal! - 0.001, locale).reveal).toBe(false);
    }
    expect(diffractionDirector(1, 10, locale)).toMatchObject({ view: 'contributions', x: 0 });
    expect(diffractionDirector(1, cuts.pathStart + 1, locale).view).toBe('paths');
    expect(diffractionDirector(1, cuts.cancellation, locale).x).toBeCloseTo(5.5, 12);
    expect(diffractionDirector(6, cuts.rim + 0.01, locale).view).toBe('rim');
    expect(diffractionDirector(3, cuts.apertureStart - 0.01, locale).radius).toBe(0.3);
    expect(diffractionDirector(3, cuts.apertureEnd, locale).radius).toBe(0.1);
    expect(diffractionDirector(7, cuts.diskChangeStart, locale).radius).toBe(0.4);
    expect(diffractionDirector(7, cuts.diskChangeEnd, locale).radius).toBe(0.8);
  }
  expect(DIFFRACTION_SECONDS.reduce((a, b) => a + b, 0)).toBe(257);
});

it('derives band-center path difference from one geometry while keeping the paraxial approximation explicit', () => {
  for (const x of [-12, 0, 5.5, 12])
    for (const a of [30, 100, 150]) {
      const d = bandPathDifference(x, a, 550, 1);
      const u1 = (-7 * a * 1e-6) / 16,
        u5 = (a * 1e-6) / 16;
      const exact = Math.hypot(1, x * 1e-3 - u1) - Math.hypot(1, x * 1e-3 - u5);
      expect(d.exactDelta).toBeCloseTo(exact, 14);
      expect(d.delta).toBeCloseTo(((x * 1e-3 - u1) ** 2 - (x * 1e-3 - u5) ** 2) / 2, 15);
      expect(d.cycles).toBeCloseTo(d.delta / 550e-9, 12);
      expect(Math.abs(d.delta - d.exactDelta)).toBeLessThan(1e-9);
    }
  expect(bandPathDifference(0).delta).toBeGreaterThan(0);
  expect(bandPathDifference(5.5).cycles).toBeGreaterThan(0.5);
});

it('uses a fixed visible exposure without equalizing narrow and broad slit brightness', () => {
  const narrow = fresnelSlit(0, 50),
    broad = fresnelSlit(0, 100);
  expect(diffractionDisplayLevel(narrow, SLIT_EXPOSURE)).toBeGreaterThan(0.5);
  expect(diffractionDisplayLevel(narrow, SLIT_EXPOSURE)).toBeLessThan(
    diffractionDisplayLevel(broad, SLIT_EXPOSURE),
  );
  expect(diffractionDisplayLevel(0, SLIT_EXPOSURE)).toBe(0);
  expect(diffractionDisplayLevel(NaN, Infinity)).toBe(0);
});

it('encodes monochromatic wavelength hue without changing fixed exposure or the three-channel white-light model', () => {
  const rgb = (s: string) => s.match(/\d+/g)!.map(Number);
  const green = rgb(diffractionDisplayColor([0.02], SLIT_EXPOSURE, 550)),
    red = rgb(diffractionDisplayColor([0.02], SLIT_EXPOSURE, 650));
  expect(green[1]).toBeGreaterThan(green[0]!);
  expect(green[1]).toBeGreaterThan(green[2]!);
  expect(red[0]).toBeGreaterThan(red[1]! * 2);
  expect(red[0]).toBeGreaterThan(red[2]! * 2);
  for (const intensity of [0, 0.0001, 0.02, 1])
    for (const wavelength of [450, 500, 550, 600, 650, NaN, Infinity]) {
      const channels = rgb(diffractionDisplayColor([intensity], SLIT_EXPOSURE, wavelength));
      expect(Math.max(...channels)).toBe(
        Math.round(255 * diffractionDisplayLevel(intensity, SLIT_EXPOSURE)),
      );
      expect(channels.every((v) => Number.isFinite(v) && v >= 0 && v <= 255)).toBe(true);
    }
  expect(diffractionDisplayColor([0.03, 0.02, 0.01], SLIT_EXPOSURE, 450)).toBe(
    diffractionDisplayColor([0.03, 0.02, 0.01], SLIT_EXPOSURE, 650),
  );
  expect(diffractionDisplayColor([0.02], SLIT_EXPOSURE)).toBe(
    diffractionDisplayColor([0.02], SLIT_EXPOSURE, 550),
  );
});
