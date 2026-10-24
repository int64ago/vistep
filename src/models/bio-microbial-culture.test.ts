import { it, expect } from 'vitest';
import {
  streakState,
  plateGeometry,
  pureCulture,
  dilutionTransfer,
  cfuEstimate,
  colonySites,
  screeningRank,
  samplingUnits,
} from './bio-microbial-culture';
it('streaking reduces deposition only after the cooled loop picks up the preceding streak', () => {
  const a = streakState(1, 240);
  expect(a.seeds.length).toBe(103);
  expect(streakState(1, 240, false).seeds.length).toBe(320);
  expect(streakState(0.2 + 0.18 / 5, 240).hot).toBe(true);
  expect(streakState(0.2 + 0.18 / 5, 240).depositing).toBe(false);
  expect(streakState(0.2 + 0.31 / 5, 240).cooling).toBe(true);
  for (const p of [0, 0.12, 0.24, 0.63, 1]) {
    const s = streakState(p, 240),
      g = plateGeometry(240);
    expect(s.seeds.every((a) => Math.hypot(a.x - g.cx, a.y - g.cy) < g.r)).toBe(true);
  }
});
it('blank plates stay blank unless contamination is explicitly introduced', () => {
  expect(pureCulture(1, 240, true, true)).toHaveLength(0);
  expect(pureCulture(1, 240, true, true, true)).toHaveLength(1);
});
it('serial transfer conserves liquid and sample mass through1001frames', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = dilutionTransfer(i / 1000, 3);
    expect(s.sourceMl + s.pipetteMl + s.receiverMl).toBeCloseTo(19);
    expect(s.sourceG + s.pipetteG + s.receiverG).toBeCloseTo(0.01);
  }
  expect(dilutionTransfer(1, 3).finalGPerMl).toBeCloseTo(0.0001);
});
it('counts colony-forming units per gram including initial suspension and plated volume', () => {
  const a = cfuEstimate(['96', '103', '101'], 5)!;
  expect(a.mean).toBe(100);
  expect(a.cfuPerGram).toBeCloseTo(1e8);
  expect(a.acceptable).toBe(true);
  expect(cfuEstimate(['10', '11', '9'], 5)!.acceptable).toBe(false);
  expect(cfuEstimate(['', '', ''], 5)).toBeNull();
  expect(cfuEstimate(['9.5', '10', '11'], 5)).toBeNull();
});
it('colony positions remain strictly inside agar', () => {
  for (const w of [240, 320, 800])
    for (const n of [30, 100, 300]) {
      const g = plateGeometry(w);
      expect(colonySites(n, w).every((a) => Math.hypot(a.x - g.cx, a.y - g.cy) + 3 < g.r)).toBe(
        true,
      );
    }
});
it('a primary-screen artifact is not the replicated winner', () => {
  expect(screeningRank()[0].id).toBe('B3');
  expect(screeningRank(true)[0].id).toBe('A4');
  expect(screeningRank(false, true)[0].id).not.toBe(screeningRank()[0].id);
});
it('settle plates cannot supply a cubic-metre result', () => {
  expect(samplingUnits('air', 12, 100, 1, true)).toEqual({ value: 120, unit: 'CFU/m³' });
  expect(samplingUnits('air', 12, 100, 1, false)!.unit).toBe('CFU/plate/time');
  expect(samplingUnits('milk', 80, 0.1, 100)!.value).toBe(80000);
  expect(samplingUnits('soil', 100, 0.000001)!.value).toBe(1e8);
  expect(samplingUnits('water', 1, 0)).toBeNull();
});

import {
  nitrogenPathway,
  nitrogenDisplay,
  nitrogenTracers,
  cultureDirector,
} from './bio-microbial-culture';
it('keeps jointly rounded nitrogen labels within one tenth and conserves their displayed sum', () => {
  for (const medium of [0, 1, 2])
    for (const hydrolysis of [false, true])
      for (const assimilation of [false, true])
        for (let i = 0; i <= 1000; i++) {
          const exact = nitrogenPathway(i / 1000, medium, hydrolysis, assimilation);
          const display = nitrogenDisplay(exact);
          expect(Math.round(10 * (display.urea + display.available + display.biomass))).toBe(
            10 * exact.total,
          );
          for (const key of ['urea', 'available', 'biomass'] as const) {
            expect(display[key]).toBeGreaterThanOrEqual(0);
            expect(Math.abs(display[key] - exact[key])).toBeLessThan(0.1 + 1e-12);
          }
        }
});
it('conserves nitrogen across source, available pool and assimilation for every intervention', () => {
  for (const medium of [0, 1, 2])
    for (const hydrolysis of [false, true])
      for (const assimilation of [false, true]) {
        let previous = 0;
        for (let i = 0; i <= 100; i++) {
          const n = nitrogenPathway(i / 100, medium, hydrolysis, assimilation);
          expect(n.urea + n.available + n.biomass).toBeCloseTo(medium === 2 ? 0 : 2, 12);
          expect(Math.min(n.urea, n.available, n.biomass)).toBeGreaterThanOrEqual(-1e-12);
          expect(n.biomass).toBeGreaterThanOrEqual(previous - 1e-12);
          previous = n.biomass;
        }
      }
});
it('separates urea hydrolysis, assimilation, and alternative nitrogen rescue', () => {
  const blocked = nitrogenPathway(1, 0, false, true);
  expect(blocked).toMatchObject({ urea: 2, available: 0, biomass: 0 });
  const noAssimilation = nitrogenPathway(1, 0, true, false);
  expect(noAssimilation.available).toBeGreaterThan(1.99);
  expect(noAssimilation.biomass).toBe(0);
  expect(nitrogenPathway(1, 1, false, true).biomass).toBeGreaterThan(1.9);
  expect(nitrogenPathway(1, 2, true, true).growth).toBe(0);
  expect(nitrogenTracers(0).map((a) => a.id)).toEqual(nitrogenTracers(1).map((a) => a.id));
  expect(nitrogenTracers(1, 0, false).every((a) => a.stage === 'urea')).toBe(true);
  expect(nitrogenTracers(1, 0, true, false).every((a) => a.stage === 'available')).toBe(true);
  expect(nitrogenTracers(1).every((a) => a.stage === 'biomass')).toBe(true);
  expect(nitrogenTracers(1, 2).every((a) => !a.visible)).toBe(true);
});
it('directs a matched blank failure and real denominator counterfactuals', () => {
  expect(cultureDirector(2, 0.3)).toMatchObject({ blank: false, contaminated: false });
  expect(cultureDirector(2, 0.55)).toMatchObject({ blank: true, contaminated: false });
  expect(cultureDirector(2, 0.9)).toMatchObject({ blank: true, contaminated: true });
  expect(cultureDirector(9, 0.9).active).toBe(false);
  expect(cultureDirector(10, 0.9).kind).toBe('milk');
  expect(cultureDirector(3, 0.9).perBiomass).toBe(true);
});
it('rejects nonfinite count units and clamps only illustrative process time', () => {
  for (const n of [NaN, Infinity, -Infinity]) {
    expect(cfuEstimate(['96', '103', '101'], n)).toBeNull();
    expect(samplingUnits('milk', 80, 0.1, n)).toBeNull();
    expect(nitrogenPathway(n).biomass).toBe(0);
  }
});

import { cultureSpeechAnchors, cultureSpeechProgress } from './bio-microbial-culture';
it('uses locale word times for blank failure, nitrogen prediction, and matched reveal', () => {
  for (const lang of ['zh', 'en']) {
    const a = cultureSpeechAnchors(lang);
    expect(cultureDirector(2, 0, lang, a.blank + 0.01)).toMatchObject({
      blank: true,
      contaminated: false,
    });
    expect(cultureDirector(2, 0, lang, a.anomaly - 0.01).contaminated).toBe(false);
    expect(cultureDirector(2, 0, lang, a.anomaly + 0.01).contaminated).toBe(true);
    expect(cultureDirector(5, 0, lang, a.prediction + 0.01)).toMatchObject({
      prediction: true,
      compare: false,
    });
    expect(cultureDirector(5, 0, lang, a.compare - 0.01)).toMatchObject({
      prediction: true,
      compare: false,
    });
    expect(cultureDirector(5, 0, lang, a.compare + 0.01)).toMatchObject({
      prediction: false,
      compare: true,
    });
    let last = 0;
    for (let t = 0; t < 34; t += 0.1) {
      const p = cultureSpeechProgress(5, t, lang)!;
      expect(p).toBeGreaterThanOrEqual(last - 1e-12);
      last = p;
    }
  }
});
