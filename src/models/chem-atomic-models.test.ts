import { describe, it, expect } from 'vitest';
import {
  radialProbability,
  radialCdf,
  orbitalRadius,
  orbitalSamples,
  bohrHydrogen,
  projectOrbital,
  atomicDirector,
} from './chem-atomic-models';
describe('atomic model boundaries', () => {
  it('normalizes independently integrated hydrogen radial probabilities', () => {
    for (const o of ['1s', '2s', '2p'] as const) {
      let sum = 0;
      const dx = 0.002;
      for (let x = dx / 2; x < 50; x += dx) sum += radialProbability(o, x) * dx;
      expect(sum).toBeCloseTo(1, 6);
      expect(radialCdf(o, 0)).toBe(0);
      expect(radialCdf(o, 40)).toBeCloseTo(1, 6);
    }
  });
  it('has the known 1s mean-radius and 90% boundary benchmarks', () => {
    expect(orbitalRadius('1s', 0.9)).toBeCloseTo(2.66116, 4);
    expect(radialCdf('1s', 1)).toBeCloseTo(1 - 5 * Math.exp(-2), 10);
    expect(radialProbability('2s', 2)).toBe(0);
    expect(orbitalRadius('2s')).toBeGreaterThan(orbitalRadius('1s'));
  });
  it('samples reproducibly with p angular lobes and physical projection', () => {
    const a = orbitalSamples('2p', 1000),
      b = orbitalSamples('2p', 1000);
    expect(a).toEqual(b);
    const y = a.reduce((s, p) => s + (p.y * p.y) / p.r ** 2, 0) / 1000;
    expect(y).toBeCloseTo(0.6, 2);
    expect(projectOrbital({ x: 0, y: 1, z: 0 }, 'x')).not.toEqual(
      projectOrbital({ x: 0, y: 1, z: 0 }, 'y'),
    );
  });
  it('uses quantized Bohr energy/radius and deterministic chapter state', () => {
    expect(bohrHydrogen(2).radius / bohrHydrogen(1).radius).toBe(4);
    expect(bohrHydrogen(2).energy - bohrHydrogen(1).energy).toBeCloseTo(10.20427, 4);
    expect(atomicDirector(4, 0).count).toBe(1);
    expect(atomicDirector(5, 1).probability).toBe(0.9);
  });
});

import {
  cathodeRayAt,
  cathodeRay,
  cathodeView,
  scatteringAccount,
  pointHeadOn,
  diffuseHeadOn,
  hydrogenLine,
  spectralEnergyTransfer,
  THOMSON_RECORDS,
  HYDROGEN_LINE_RECORDS,
  atomicHistoryShot,
  scatteringSequence,
} from './chem-atomic-models';
describe('independent evidence and controlled model comparisons', () => {
  it('keeps plates and detector contact inside the apparatus at phone and desktop widths', () => {
    for (const width of [278, 320, 520, 780, NaN, Infinity]) {
      const view = cathodeView(width);
      expect(view.y(0.0075)).toBeGreaterThan(view.tubeTop);
      expect(view.y(-0.0075)).toBeLessThan(view.tubeBottom);
      for (const polarity of [-1, 0, 1])
        for (const charge of [-1, 0, 1])
          for (const speed of [12e6, 15e6, 20e6]) {
            const ray = cathodeRay(polarity, charge, speed);
            expect(view.y(ray.spot.y)).toBeGreaterThan(view.screenTop);
            expect(view.y(ray.spot.y)).toBeLessThan(view.screenBottom);
            expect(view.x(ray.spot.x)).toBe(view.width - 34);
          }
    }
  });
  it('uses field direction, physical force sign and a continuous exit tangent', () => {
    const q = 1.602176634e-19,
      m = 9.1093837139e-31,
      v = 15e6,
      L = 0.05,
      D = 0.09;
    const expected = ((q * 1000) / m / v ** 2) * (L ** 2 / 2 + L * D);
    expect(cathodeRayAt(0.14, 1, -1).y).toBeCloseTo(expected, 13);
    expect(cathodeRayAt(0.14, -1, -1).y).toBeCloseTo(-expected, 13);
    expect(cathodeRayAt(0.14, 1, 1).y).toBeCloseTo(-expected, 13);
    expect(cathodeRayAt(0.14, 1, 0).y).toBeCloseTo(0, 15);
    const eps = 1e-7,
      before = cathodeRayAt(L - eps),
      after = cathodeRayAt(L + eps),
      at = cathodeRayAt(L);
    expect((after.y - before.y) / (2 * eps)).toBeCloseTo(at.vy / at.vx, 6);
    expect(Math.abs(cathodeRayAt(L, 1, -1, 12e6).y)).toBeLessThan(0.015 / 2);
  });
  it('keeps actual records unchanged across candidate models', () => {
    const before = JSON.stringify([THOMSON_RECORDS, HYDROGEN_LINE_RECORDS]);
    for (const e of [1, 3, 5, 10]) {
      scatteringAccount(e);
      cathodeRay(-1, 1, e * 1e6);
      hydrogenLine(e);
    }
    expect(JSON.stringify([THOMSON_RECORDS, HYDROGEN_LINE_RECORDS])).toBe(before);
    expect(THOMSON_RECORDS.map((r) => r.massCharge)).toEqual([1.3, 1.1, 1.2, 1.5, 1.5, 1.3, 1.1]);
    expect(Object.isFrozen(THOMSON_RECORDS[0])).toBe(true);
    expect(HYDROGEN_LINE_RECORDS[0].airNm).toBe(656.28518);
  });
  it('matches independently calculated SI potential and turning scales', () => {
    const ke = 8.9875517862e9,
      e = 1.602176634e-19,
      R = 100e-12,
      U = (1.5 * ke * (2 * e) * (79 * e)) / R / e,
      r = ((ke * (2 * e) * (79 * e)) / (5e6 * e)) * 1e15;
    expect(scatteringAccount(5).barrierMeV * 1e6).toBeCloseTo(U, 4);
    expect(scatteringAccount(5).turningFm).toBeCloseTo(r, 7);
    expect(scatteringAccount(5).barrierFraction).toBeLessThan(0.001);
    expect(scatteringAccount(10).turningFm).toBe(scatteringAccount(5).turningFm / 2);
  });
  it('keeps energy constant and reverses only the concentrated trajectory', () => {
    for (const energy of [1, 5, 10])
      for (let i = 0; i <= 100; i++) {
        const p = i / 100,
          d = diffuseHeadOn(p, energy),
          n = pointHeadOn(p, energy);
        for (const s of [d, n]) expect(s.kineticMeV + s.potentialMeV).toBeCloseTo(energy, 12);
        expect(d.velocityFraction).toBeGreaterThan(0);
        expect(n.xFm).toBeLessThanOrEqual(-n.turningFm);
        if (p < 0.5) expect(n.velocityFraction).toBeGreaterThan(0);
        if (p > 0.5) expect(n.velocityFraction).toBeLessThan(0);
      }
    expect(diffuseHeadOn(0.5).xRadius).toBeCloseTo(0, 10);
    expect(pointHeadOn(0.5).kineticMeV).toBe(0);
    expect(pointHeadOn(0.5).velocityFraction).toBe(0);
    const d = 1e-5;
    expect(Math.abs(pointHeadOn(0.5 - d).xFm - pointHeadOn(0.5 + d).xFm)).toBeLessThan(1e-9);
    expect(Math.abs(pointHeadOn(0.5 - d).xFm - pointHeadOn(0.5).xFm)).toBeLessThan(1e-5);
  });
  it('uses photon energy equal to a reduced-mass gap, not moving observed lines', () => {
    const red = hydrogenLine(3),
      blue = hydrogenLine(4);
    expect(red.vacuumNm).toBeCloseTo(656.4696, 3);
    expect(blue.vacuumNm).toBeCloseTo(486.2738, 3);
    expect(blue.photonEV).toBeGreaterThan(red.photonEV);
    expect(blue.vacuumNm).toBeLessThan(red.vacuumNm);
    for (const upper of [3, 4, 5])
      for (const p of [0, 0.49, 0.5, 0.75, 1]) {
        const s = spectralEnergyTransfer(p, upper);
        expect(s.atomEV + s.photonEV).toBeCloseTo(s.initialEV, 12);
        expect(s.released).toBe(p >= 0.5);
      }
  });
  it('separates slow views and holds the physical zero-speed turning state', () => {
    expect(scatteringSequence(20.4, 'zh').diffuseProgress).toBe(1);
    expect(scatteringSequence(20.4, 'zh').pointProgress).toBe(0);
    for (const [locale, start, end, returned] of [
      ['zh', 24, 24.8, 26],
      ['en', 24.65, 25.8, 27.5],
    ] as const) {
      expect(scatteringSequence(start, locale).pointProgress).toBe(0.5);
      expect(scatteringSequence(end - 0.001, locale).pointProgress).toBe(0.5);
      expect(scatteringSequence(returned, locale).pointProgress).toBe(1);
    }
  });
  it('keeps prediction answers hidden until the declared director boundary', () => {
    for (const [locale, answer, blue, recordsStart, recordsEnd] of [
      ['zh', 29.9, 21.3, 6.8, 11.9],
      ['en', 30.97, 21, 4.8, 9],
    ] as const) {
      expect(atomicHistoryShot(2, answer - 0.001, locale).reveal).toBe(false);
      expect(atomicHistoryShot(2, answer, locale).reveal).toBe(true);
      expect(atomicHistoryShot(3, blue - 0.001, locale).reveal).toBe(false);
      expect(atomicHistoryShot(3, blue, locale).reveal).toBe(true);
      expect(atomicHistoryShot(1, recordsStart - 0.001, locale).records).toBe(0);
      expect(atomicHistoryShot(1, recordsEnd, locale).records).toBe(7);
    }
  });
  it('bounds nonfinite and extreme inputs without changing analytic cloud limits', () => {
    for (const x of [NaN, Infinity, -Infinity, -1e9, 1e9]) {
      for (const o of ['1s', '2s', '2p'] as const) {
        expect(Number.isFinite(radialProbability(o, x))).toBe(true);
        expect(Number.isFinite(radialCdf(o, x))).toBe(true);
        expect(Number.isFinite(orbitalRadius(o, x))).toBe(true);
      }
      for (const s of [
        pointHeadOn(x, x),
        diffuseHeadOn(x, x),
        cathodeRayAt(x, x, x, x),
        hydrogenLine(x, x),
      ])
        for (const v of Object.values(s))
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
    expect(radialCdf('1s', Infinity)).toBe(1);
    expect(orbitalSamples('1s', NaN)).toHaveLength(900);
    expect(atomicDirector(NaN, NaN).chapter).toBe(0);
  });
});
