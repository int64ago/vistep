import { it, expect } from 'vitest';
import {
  hubbleSpectrum,
  antennaTemperature,
  mollweide,
  skyFluctuation,
} from './cosmology-observations';
it('applies one low-redshift factor to all spectral lines', () => {
  const s = hubbleSpectrum(100, 70);
  expect(s.velocity).toBe(7000);
  for (const l of s.lines) expect(l.observed / l.rest).toBeCloseTo(1 + s.z);
  expect(hubbleSpectrum(200).z).toBeCloseTo(2 * s.z);
});
it('separates illustrative antenna backgrounds from sky brightness', () => {
  const a = antennaTemperature(30),
    b = antennaTemperature(90);
  expect(a.total).toBeGreaterThan(b.total);
  expect(a.total - a.receiver - a.atmosphere).toBeCloseTo(2.725);
});
it('maps finite poles and ellipse edges without invented measured maps', () => {
  expect(mollweide(Math.PI, 0).x).toBe(320);
  expect(mollweide(0, Math.PI / 2).y).toBe(103);
  expect(mollweide(0, -Math.PI / 2).y).toBe(253);
  for (let i = 0; i < 100; i++) expect(Math.abs(skyFluctuation(i, 0.5))).toBeLessThan(100);
});
