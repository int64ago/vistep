import { describe, expect, it } from 'vitest';
import { slabPins, apparentPlate, cylinderRay } from './geometric-optics-lab';
import { interfacePower, corkIndex } from './total-reflection-lab';
import { symmetricFilm, wedgeSpacing } from './thin-film-lab';
import {
  slitMeasurement,
  inferWavelength,
  sensorArray,
  lloydMirror,
} from './double-slit-measurement-lab';
import { fresnelSlit, fresnelCircle } from './optical-diffraction-lab';
import { dielectricReflection, observedPolarization } from './polarization-evidence-lab';

// Independent midpoint propagation, with SI inputs, instead of the model's Simpson rule.
function referenceSlit(x: number, width: number, wavelength: number, distance: number) {
  const count = 32768;
  let real = 0,
    imaginary = 0;
  for (let j = 0; j < count; j++) {
    const aperturePosition = width * ((j + 0.5) / count - 0.5);
    const phase = (Math.PI * (x - aperturePosition) ** 2) / (wavelength * distance);
    real += Math.cos(phase);
    imaginary += Math.sin(phase);
  }
  return ((real ** 2 + imaginary ** 2) * (width / count) ** 2) / (wavelength * distance);
}

// Direct angular integration defines J0 here; it does not call the production Bessel approximation.
function referenceDisk(r: number, a: number, wavelength: number, distance: number) {
  const radialCount = 4096,
    angularCount = 64,
    K = Math.PI / (wavelength * distance);
  let real = 0,
    imaginary = 0;
  for (let j = 0; j < radialCount; j++) {
    const rho = (a * (j + 0.5)) / radialCount;
    let angular = 0;
    for (let k = 0; k < angularCount; k++)
      angular += Math.cos(2 * K * r * rho * Math.cos((2 * Math.PI * k) / angularCount));
    angular /= angularCount;
    real += rho * angular * Math.cos(K * rho * rho);
    imaginary += rho * angular * Math.sin(K * rho * rho);
  }
  const scale = (2 * K * a) / radialCount,
    phase = K * r * r;
  const apertureReal = scale * (real * Math.sin(phase) + imaginary * Math.cos(phase));
  const apertureImaginary = scale * (imaginary * Math.sin(phase) - real * Math.cos(phase));
  return (1 - apertureReal) ** 2 + apertureImaginary ** 2;
}

describe('independent textbook optics benchmarks', () => {
  it('matches numerical Snell and apparent-depth standards', () => {
    expect((slabPins(45, 1.5).r * 180) / Math.PI).toBeCloseTo(28.1255057020557, 10);
    expect(apparentPlate(80, 1.5, 45).apparent).toBeCloseTo(42.7617987059879, 10);
    const ray = cylinderRay({ x: -0.35, y: 0.3 }, 0.025)!;
    const sine = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      normal: { x: number; y: number },
    ) =>
      Math.abs((to.x - from.x) * normal.y - (to.y - from.y) * normal.x) /
      Math.hypot(to.x - from.x, to.y - from.y);
    expect(1.333 * sine(ray.source, ray.water, ray.water)).toBeCloseTo(
      1.5 * sine(ray.water, ray.glass, ray.water),
      10,
    );
    const glassNormal = { x: ray.glass.x / 1.06, y: ray.glass.y / 1.06 };
    expect(1.5 * sine(ray.water, ray.glass, glassNormal)).toBeCloseTo(
      sine(ray.glass, ray.eye, glassNormal),
      10,
    );
  });

  it('matches Fresnel normal reflection, critical angle and cork geometry', () => {
    expect(interfacePower(0, 1.5, 1).R).toBeCloseTo(0.04, 12);
    expect(interfacePower((41 * Math.PI) / 180).T).toBeGreaterThan(0);
    expect(interfacePower((42 * Math.PI) / 180).T).toBe(0);
    expect(corkIndex().boundaryDepth).toBeCloseTo(17.6282614003764, 10);
    expect(corkIndex(17.628261400376385).hidden).toBe(true);
  });

  it('preserves nm-to-mm conversion and half-wave conditions in thin films', () => {
    expect(wedgeSpacing(589, 2)).toBeCloseTo(0.2945, 12);
    expect(wedgeSpacing(589, 1)).toBeCloseTo(0.589, 12);
    expect(symmetricFilm(589 / (2 * 1.333), 589)).toBeLessThan(1e-25);
    expect(symmetricFilm(589 / (4 * 1.333), 589)).toBeCloseTo(0.07827100394229713, 12);
  });

  it('matches absolute double-slit millimetres, not only an inverse-function identity', () => {
    expect(slitMeasurement(589, 0.18, 1.2).spacing).toBeCloseTo(3.92666666666667, 10);
    expect(inferWavelength(-7.85333333333333, 11.78, 6, 0.18, 1.2)).toBeCloseTo(589, 10);
    const pixel = sensorArray()[48];
    let expected = 0;
    for (let j = 0; j < 4000; j++) {
      const xMetres = (pixel.x - 0.125 + ((j + 0.5) * 0.25) / 4000) * 1e-3;
      expected += Math.cos((Math.PI * xMetres * 0.18e-3) / (589e-9 * 1.2)) ** 2 / 4000;
    }
    expect(pixel.value).toBeCloseTo(expected, 9);
    expect(lloydMirror(0).intensity).toBe(0);
    expect(lloydMirror(0.589).intensity).toBeCloseTo(1, 10);
    expect(lloydMirror(0).spacingMm).toBeCloseTo(1.178, 12);
  });

  it('matches independently integrated slit and opaque-disk fields', () => {
    for (const xMm of [0, 3, 11]) {
      const expected = referenceSlit(xMm * 1e-3, 50e-6, 550e-9, 1);
      expect(fresnelSlit(xMm, 50, 550)).toBeCloseTo(expected, 9);
    }
    expect(fresnelCircle(0.7, 0.6, 550, 1, true)).toBeCloseTo(
      referenceDisk(0.7e-3, 0.6e-3, 550e-9, 1),
      6,
    );
    expect(fresnelCircle(0, 1, 550, 1, true)).toBeCloseTo(1, 6);
  });

  it('matches Brewster extinction and the disclosed LCD mixture', () => {
    const brewsterDegrees = 56.309932474020215;
    expect(dielectricReflection(brewsterDegrees).Rp).toBeLessThan(1e-25);
    expect(dielectricReflection(brewsterDegrees).Rs).toBeCloseTo(0.14792899408284024, 12);
    expect(observedPolarization('glass', 90, brewsterDegrees).intensity).toBeLessThan(1e-25);
    expect(observedPolarization('window', 37).intensity).toBe(0.5);
    expect(observedPolarization('lcd', 25).intensity).toBeCloseTo(0.99, 12);
    expect(observedPolarization('lcd', 115).intensity).toBeCloseTo(0.01, 12);
  });
});
