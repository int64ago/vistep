import { describe, it, expect } from 'vitest';
import {
  electronWavelengthPM,
  planeIntensity,
  powderRadii,
  laueSpots,
  electronInterference,
  interferenceHits,
} from './matter-wave-lab';
describe('matter-wave evidence', () => {
  it('matches the 54 V de Broglie wavelength and Bragg phase closure', () => {
    expect(electronWavelengthPM(54)).toBeCloseTo(166.9, 0);
    const l = electronWavelengthPM(100);
    expect(planeIntensity(Math.asin(l / 426), l)).toBeCloseTo(1, 12);
    expect(planeIntensity(0.2, l)).toBeLessThan(0.1);
  });
  it('contracts powder rings when accelerating voltage rises', () => {
    expect(powderRadii(5000)[0]).toBeLessThan(powderRadii(2000)[0]);
    expect(powderRadii(2000)[1]).toBeGreaterThan(powderRadii(2000)[0]);
  });
  it('every Laue spot satisfies elastic scattering at an available wavelength', () => {
    for (const a of [-0.6, 0, 0.6]) {
      const ps = laueSpots(a);
      expect(ps.length).toBeGreaterThan(5);
      for (const p of ps) {
        expect(p.residual).toBeLessThan(1e-12);
        expect(p.wavelengthPM).toBeGreaterThanOrEqual(40);
        expect(p.wavelengthPM).toBeLessThanOrEqual(220);
      }
    }
  });
  it('places interference minima and reproduces deterministic arrivals', () => {
    expect(electronInterference(0.5, 2000)).toBeLessThan(1e-20);
    expect(interferenceHits(2000, 8)).toEqual(interferenceHits(2000, 8));
    expect(interferenceHits(2000, 8)).not.toEqual(interferenceHits(5000, 8));
  });
});
