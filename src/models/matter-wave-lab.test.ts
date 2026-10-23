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

import {
  braggPaths,
  planeSum,
  crystalPoint,
  SELECTED_LAUE,
  matterDirector,
} from './matter-wave-lab';
it('derives each extra path from true endpoints and compares equal incoming and outgoing wavefronts', () => {
  for (const theta of [5, 16.7, 24.0948425521, 35, 65])
    for (const d of [100, 163.2993161855, 300]) {
      const g = braggPaths(theta, d, 133.3333333333),
        dot = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.x + a.y * b.y;
      expect(dot(g.A, g.u)).toBeCloseTo(0, 10);
      expect(dot(g.C, g.v)).toBeCloseTo(0, 10);
      expect(g.incoming).toBeCloseTo(d * Math.sin((theta * Math.PI) / 180), 10);
      expect(g.outgoing).toBeCloseTo(g.incoming, 10);
      expect(g.delta).toBeCloseTo(2 * d * Math.sin((theta * Math.PI) / 180), 10);
      expect(Math.hypot(g.lower[2]!.x - g.lower[1]!.x, g.lower[2]!.y - g.lower[1]!.y)).toBeCloseTo(
        g.incoming,
        10,
      );
    }
});
it('one real reciprocal-lattice family closes both the 2D Bragg phase and full 3D elastic condition', () => {
  const q = SELECTED_LAUE,
    p = laueSpots(0).find((p) => p.h === q.h && p.k === q.k && p.l === q.l)!;
  expect(p).toBeDefined();
  expect(p.wavelengthPM).toBeCloseTo(q.lambda, 10);
  const g = braggPaths(q.theta, q.d, q.lambda);
  expect(g.cycles).toBeCloseTo(1, 12);
  expect(g.pairIntensity).toBeCloseTo(1, 12);
  const G = crystalPoint(q.h / q.a, q.k / q.a, q.l / q.a, 0),
    out = { x: q.lambda * G.x, y: q.lambda * G.y, z: 1 + q.lambda * G.z };
  expect(out.x * out.x + out.y * out.y + out.z * out.z).toBeCloseTo(1, 12);
  expect(out.x / out.z).toBeCloseTo(p.x, 12);
  expect((Math.asin(-G.z / Math.hypot(G.x, G.y, G.z)) * 180) / Math.PI).toBeCloseTo(q.theta, 12);
});
it('sums eight same-clock contributions and independently integrates their squared amplitude', () => {
  for (const degrees of [8, 12, 16.7, 25, 35]) {
    const l = electronWavelengthPM(100),
      a = planeSum(degrees, l),
      phase = (2 * Math.PI * 2 * 213 * Math.sin((degrees * Math.PI) / 180)) / l;
    let energy = 0;
    for (let j = 0; j < 1024; j++) {
      let wave = 0;
      for (let k = 0; k < 8; k++) wave += Math.cos((j * 2 * Math.PI) / 1024 - k * phase);
      energy += (wave * wave) / 1024;
    }
    expect((2 * energy) / 64).toBeCloseTo(a.intensity, 12);
    expect(a.intensity).toBeCloseTo(planeIntensity((degrees * Math.PI) / 180, l), 12);
    a.vectors.slice(1).forEach((v, i) => expect(v.start).toEqual(a.vectors[i]!.end));
  }
});
it('keeps Laue lattice rotation rigid and each allowed spot on the same fixed-band detector', () => {
  for (const r of [-0.6, 0, 0.6]) {
    const p = crystalPoint(1, 2, 3, r);
    expect(p.x * p.x + p.y * p.y + p.z * p.z).toBeCloseTo(14, 12);
    for (const s of laueSpots(r)) {
      const g = crystalPoint(s.h / 400, s.k / 400, s.l / 400, r),
        lambda = (-2 * g.z) / (g.x * g.x + g.y * g.y + g.z * g.z);
      expect(lambda).toBeCloseTo(s.wavelengthPM, 10);
      expect((lambda * g.x) / (1 + lambda * g.z)).toBeCloseTo(s.x, 10);
    }
  }
});
it('reconstructs retained deterministic event identities and keeps prefixes fixed on backward seeks', () => {
  expect(interferenceHits(2000, 30)).toEqual(interferenceHits(2000, 350).slice(0, 30));
  expect(interferenceHits(2000, 0)).toEqual([]);
  const a = matterDirector(3, 7),
    b = matterDirector(3, 18);
  expect(a.count).toBeLessThan(b.count);
  expect(matterDirector(3, 7)).toEqual(a);
});
it('holds the voltage prediction at its original state, then computes a smaller ring at the new voltage', () => {
  const a = matterDirector(2, 10),
    b = matterDirector(2, 22);
  expect(a.question).toBe(true);
  expect(a.voltage).toBe(2000);
  expect(b.question).toBe(false);
  expect(b.voltage).toBe(5000);
  expect(powderRadii(b.voltage)[0]).toBeLessThan(powderRadii(a.voltage)[0]);
  expect(matterDirector(6, 1)).toMatchObject({ question: true, rotation: 0 });
  expect(matterDirector(6, 20).rotation).toBe(0.22);
});
it('guards invalid numbers without inventing nonfinite rays, loops or event arrays', () => {
  for (const bad of [NaN, Infinity, -Infinity, -1e6, 1e6]) {
    for (const a of [
      braggPaths(bad, bad, bad),
      planeSum(bad, bad, bad, bad),
      matterDirector(bad, bad),
      powderRadii(bad, bad),
      interferenceHits(bad, bad),
      laueSpots(bad, bad),
    ])
      expect(JSON.stringify(a)).not.toMatch(/null|NaN|Infinity/);
    expect(planeIntensity(bad, bad, bad, bad)).toBeGreaterThanOrEqual(0);
    expect(planeIntensity(bad, bad, bad, bad)).toBeLessThanOrEqual(1.0000000000001);
  }
});

it('shows mismatched phase vectors before the measured in-phase explanation in both recordings', () => {
  for (const [locale, peakWord, phaseStart, aligned] of [
    ['zh', 3.23, 3.6, 7.25],
    ['en', 1.71, 2.25, 4.27],
  ] as const) {
    const peak = matterDirector(1, peakWord, locale),
      first = matterDirector(1, phaseStart, locale),
      last = matterDirector(1, aligned, locale);
    expect(peak.view).toBe('reflection');
    expect(planeSum(peak.theta, peak.lambda, peak.d).intensity).toBeCloseTo(1, 12);
    expect(first.view).toBe('phasors');
    expect(planeSum(first.theta, first.lambda, first.d).intensity).toBeLessThan(0.1);
    expect(planeSum(first.theta, first.lambda, first.d).cycles).toBeLessThan(0.8);
    const states = Array.from({ length: 41 }, (_, i) =>
      matterDirector(1, phaseStart + ((aligned - phaseStart) * i) / 40, locale),
    );
    expect(states.every((s) => s.view === 'phasors')).toBe(true);
    expect(new Set(states.map((s) => s.theta.toFixed(5))).size).toBeGreaterThan(20);
    for (let i = 1; i < states.length; i++)
      expect(states[i]!.theta).toBeGreaterThanOrEqual(states[i - 1]!.theta);
    const sum = planeSum(last.theta, last.lambda, last.d);
    expect(sum.cycles).toBeCloseTo(1, 12);
    expect(sum.intensity).toBeCloseTo(1, 12);
    expect(sum.vectors.every((v) => Math.abs(v.y) < 1e-12 && Math.abs(v.x - 1) < 1e-12)).toBe(true);
    for (const time of [9.45, 16, 28])
      expect(matterDirector(1, time, locale).theta).toBe(last.theta);
    // Backward seeking must restore the unaligned mechanism, not a latched answer.
    expect(matterDirector(1, phaseStart, locale)).toEqual(first);
  }
});
