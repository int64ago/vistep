import { it, expect } from 'vitest';
import {
  blackbodySpectrum,
  blackbodyPeakUM,
  blackbodyShot,
  blackbodyTrial,
  textbookSpectrum,
} from './blackbody-lab';
import { planckRadiance } from './modern-labs';
it('matches an independent SI substitution and the established wavelength model', () => {
  const s = blackbodySpectrum(0.5, 5800);
  expect(s.planck).toBeCloseTo(26882199.625929307, 5);
  expect(s.planck).toBeCloseTo(planckRadiance(500, 5800) * 1e-6, 5);
  expect(blackbodyPeakUM(5800)).toBeCloseTo(0.4996158543, 9);
});
it('recovers equipartition at long wavelength but suppresses short-wave radiation', () => {
  const long = blackbodySpectrum(10000, 6000);
  expect(long.suppression).toBeGreaterThan(0.9998);
  const short = blackbodySpectrum(0.1, 1600),
    lessShort = blackbodySpectrum(0.2, 1600);
  expect(short.classical / lessShort.classical).toBeCloseTo(16, 12);
  expect(short.planck).toBeLessThan(lessShort.planck);
  expect(blackbodySpectrum(2, 1600).planck).toBeLessThan(blackbodySpectrum(2, 3200).planck);
});
it('derives the mean excitation energy independently by summing discrete Boltzmann states', () => {
  for (const um of [0.5, 1, 2, 8, 30]) {
    const s = blackbodySpectrum(um, 1600);
    let z = 0,
      e = 0;
    for (let n = 0; n < 2000; n++) {
      const p = Math.exp(-n * s.x);
      z += p;
      e += n * s.quantum * p;
    }
    expect(e / z / s.thermal).toBeCloseTo(s.suppression, 12);
    expect(s.excitationProbability).toBeCloseTo(Math.exp(-s.x), 12);
  }
});
it('integrates Planck independently to Stefan–Boltzmann over a convergent log wavelength grid', () => {
  for (const t of [1600, 3000, 8000]) {
    let sum = 0;
    const n = 12000,
      dx = Math.log(1e7) / n;
    for (let i = 0; i < n; i++) {
      const um = 0.001 * Math.exp((i + 0.5) * dx);
      if (um >= 0.05) sum += blackbodySpectrum(um, t).planck * um * dx;
    }
    expect((Math.PI * sum) / (5.670374419e-8 * t ** 4)).toBeCloseTo(1, 7);
  }
});
it('keeps independent textbook readings fixed and never presents them at a different temperature', () => {
  expect(textbookSpectrum).toHaveLength(21);
  expect(textbookSpectrum[0].relative).toBeLessThan(textbookSpectrum[8].relative);
  expect(textbookSpectrum.at(-1)!.relative).toBeLessThan(textbookSpectrum[8].relative);
  const a = blackbodyShot(3, 0.8),
    b = blackbodyTrial(a, { temperature: 3000 });
  expect(a.history).toBe(true);
  expect(b.history).toBe(false);
  expect(blackbodyTrial(b, { temperature: 1600, history: true }).history).toBe(true);
});
it('all controls and direct seeks remain finite including malformed and extreme inputs', () => {
  for (const t of [NaN, Infinity, -1, 100, 1600, 8000, 20000, 1e9])
    for (const um of [NaN, Infinity, -1, 0.05, 0.2, 8, 10000, 1e9]) {
      for (const x of Object.values(blackbodySpectrum(um, t)))
        expect(Number.isFinite(x)).toBe(true);
      expect(blackbodySpectrum(um, t).planck).toBeGreaterThanOrEqual(0);
    }
  expect(blackbodyShot(0, 0.5).temperature).toBe(1600);
  expect(blackbodyShot(1, 0).temperature).toBe(3000);
  expect(blackbodyShot(1, 1).temperature).toBe(6000);
  expect(blackbodyShot(2, 0.5).temperature).toBe(6000);
  expect(blackbodyShot(3, 0.3)).toMatchObject({ classical: true, quantum: false, history: true });
  expect(blackbodyShot(3, 0.9)).toMatchObject({ classical: true, quantum: true, probeUM: 1 });
  expect(blackbodyPeakUM(3000) / blackbodyPeakUM(6000)).toBe(2);
});

it('aligns the measured observation scan and bilingual quantum explanation after arbitrary seeks', () => {
  for (const locale of ['zh', 'en'] as const) {
    const intro = locale === 'en' ? 18.3 : 20.3,
      move = locale === 'en' ? 28.8 : 32.7,
      end = locale === 'en' ? 33 : 36.1;
    expect(blackbodyShot(3, 0.9, intro - 0.01, locale).quantum).toBe(false);
    expect(blackbodyShot(3, 0.1, intro, locale).quantum).toBe(true);
    expect(blackbodyShot(3, 0, move, locale).probeUM).toBe(6);
    expect(blackbodyShot(3, 0, (move + end) / 2, locale).probeUM).toBe(3.5);
    expect(blackbodyShot(3, 0, end, locale).probeUM).toBe(1);
    expect(blackbodyShot(3, 1, 58, locale)).toEqual(blackbodyShot(3, 0, end, locale));
  }
  expect(blackbodyShot(0, 1, 20.5).probeUM).toBe(6);
  expect(blackbodyShot(0, 0, 23.15).probeUM).toBeCloseTo(3.325, 8);
  expect(blackbodyShot(0, 0, 25.8).probeUM).toBeCloseTo(0.65, 8);
});
