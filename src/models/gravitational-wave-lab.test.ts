import { expect, it } from 'vitest';
import {
  weberResponse,
  binaryPulsar,
  inspiral,
  interferometerStrain,
} from './gravitational-wave-lab';
it('resonant bar response scales with strain and peaks near resonance', () => {
  const r = weberResponse();
  expect(r.amplitude).toBeCloseTo((1.5e-18 * 1000) / 2, 25);
  expect(r.amplitude / weberResponse(1600).amplitude).toBeGreaterThan(50);
  expect(weberResponse(1660, 0).amplitude).toBe(0);
});
it('gives a physically plausible Hulse–Taylor orbital decay and quadratic advance', () => {
  const x = binaryPulsar(30);
  expect(x.pdot).toBeCloseTo(-2.4025e-12, 15);
  expect(x.advance).toBeLessThan(-30);
  expect(binaryPulsar(20).advance / binaryPulsar(10).advance).toBeCloseTo(4);
});
it('inspiral increases frequency and amplitude without pretending to compute merger', () => {
  expect(inspiral(0.29).frequency).toBeGreaterThan(inspiral(0).frequency);
  expect(inspiral(0.29).envelope).toBeGreaterThan(inspiral(0).envelope);
  expect(inspiral(1)).toEqual(inspiral(0.295));
});
it('differential arm length is Lh, with opposite half-strains', () => {
  const x = interferometerStrain(1e-21);
  expect(x.dx).toBeCloseTo(2e-18, 28);
  expect(x.dy).toBe(-x.dx);
  expect(x.difference).toBeCloseTo(4e-18, 28);
});

import {
  michelsonReadout,
  returningFields,
  orbitalEnergyComparison,
  orbitalEnergySequence,
  barTrace,
  gravityShot,
  gravityDirector,
  gravityInitialMode,
  GW_WAVELENGTH,
} from './gravitational-wave-lab';
import {
  PULSAR_OBSERVATIONS,
  PULSAR_PUBLISHED_GR,
  LIGO_H,
  LIGO_L,
  LIGO_HALIGNED,
} from './gravitational-wave-records';
it('converts one-way differential displacement into round-trip phase, with independent SI benchmark', () => {
  const r = michelsonReadout(2e-18, -2e-18);
  expect(r.difference).toBeCloseTo(4e-18, 28);
  expect(r.phase).toBeCloseTo(4.7241994790823954e-11, 22);
  expect(r.deltaPower).toBeCloseTo(2.3620997395411977e-11, 22);
  expect(michelsonReadout(66.5e-9, -66.5e-9).power).toBeCloseTo(1, 14);
  expect(michelsonReadout(-66.5e-9, 66.5e-9).power).toBeCloseTo(0, 14);
});
it('retains common-mode cancellation and distinguishes dark-port power from signed readout', () => {
  expect(michelsonReadout(66.5e-9, 66.5e-9).deltaPower).toBe(0);
  expect(michelsonReadout(2e-18, -2e-18, 0).power).toBe(michelsonReadout(-2e-18, 2e-18, 0).power);
  expect(michelsonReadout(2e-18, -2e-18).deltaPower).toBeCloseTo(
    -michelsonReadout(-2e-18, 2e-18).deltaPower,
    22,
  );
});
it('computed field superposition yields the exact detector power, not a decorative trace', () => {
  for (const d of [-GW_WAVELENGTH / 8, 0, GW_WAVELENGTH / 8]) {
    const r = michelsonReadout(d / 2, -d / 2);
    const mean =
      Array.from(
        { length: 4096 },
        (_, i) => returningFields((i * 2 * Math.PI) / 4096, r.phase, r.bias).sum ** 2,
      ).reduce((a, b) => a + b, 0) / 4096;
    expect(2 * mean).toBeCloseTo(r.power, 12);
  }
});
it('keeps independent original observations immutable under controls and seeks', () => {
  const data = [PULSAR_OBSERVATIONS, PULSAR_PUBLISHED_GR, LIGO_H, LIGO_L, LIGO_HALIGNED];
  const before = JSON.stringify(data);
  for (const p of [0, 0.8, 0.4, 1, 0]) {
    gravityShot(3, p);
    gravityShot(5, p);
    michelsonReadout(p * 1e-7, -p * 1e-7);
  }
  expect(JSON.stringify(data)).toBe(before);
  expect(PULSAR_OBSERVATIONS).toHaveLength(29);
  expect(PULSAR_OBSERVATIONS.at(-1)).toEqual([2012.834, -62.354]);
  expect(PULSAR_PUBLISHED_GR).toHaveLength(144);
  expect(data.every((x) => Object.isFrozen(x) && x.every(Object.isFrozen))).toBe(true);
  expect(LIGO_H).toHaveLength(3441);
  expect(LIGO_L).toHaveLength(3441);
  expect(LIGO_H[0]).toEqual([0.25, 0.024547918843952264]);
  expect(LIGO_L[0]).toEqual([0.25, -0.11926091459521204]);
});
it('official H comparison uses a time shift and polarity flip but remains distinct from L', () => {
  for (let i = 0; i < 3326; i++) {
    const source = LIGO_H[i + 115]!,
      compared = LIGO_HALIGNED[i]!;
    expect(source[0] - compared[0]).toBeCloseTo(0.007, 12);
    expect(source[1]).toBe(-compared[1]);
  }
  expect(LIGO_HALIGNED[100]![1]).not.toBe(LIGO_L[100]![1]);
});
it('preserves local backgrounds when adding and removing the explicit synthetic common component', () => {
  for (const t of [0.1, 0.3, 0.7]) {
    expect(barTrace(t, 1, 'local')).toEqual(barTrace(t, 1, 'background'));
    expect(barTrace(t, 0, 'common').background).toBe(barTrace(t, 0, 'background').background);
    expect(barTrace(t, 0, 'common').signal).toBe(barTrace(t, 1, 'common').signal);
  }
});
it('energy loss tightens an orbit and shortens its period, without manufacturing historic points', () => {
  expect(orbitalEnergyComparison(0.9)).toEqual({
    aRatio: 0.9,
    bindingMagnitudeRatio: 1 / 0.9,
    periodRatio: 0.9 ** 1.5,
    frequencyRatio: 0.9 ** -1.5,
  });
  expect(orbitalEnergyComparison(0.9).bindingMagnitudeRatio).toBeGreaterThan(1);
  expect(orbitalEnergyComparison(0.9).periodRatio).toBeLessThan(1);
});
it('withholds later pulsar points and common-mode answer until their reveal, including rewind', () => {
  expect(gravityShot(3, 0.5).publishedCurve).toBe(true);
  expect(gravityShot(3, 0.5).observationsThrough).toBe(1992.5);
  expect(gravityShot(3, 0.9).observationsThrough).toBe(2013);
  expect(gravityShot(4, 0.5).prediction).toBe(true);
  expect(gravityShot(4, 0.63).common).toBe(true);
  expect(gravityShot(4, 0.5).common).toBe(false);
});
it('all four textbook entries choose their actual initial apparatus', () => {
  expect(
    [
      'required-1-weber-bar',
      'required-1-binary-pulsar',
      'required-1-ligo-appendix',
      'required-2-ligo',
    ].map(gravityInitialMode),
  ).toEqual([0, 1, 2, 2]);
});
it('all public model states remain finite for non-finite and out-of-range inputs', () => {
  const finite = (x: unknown): boolean =>
    typeof x === 'number'
      ? Number.isFinite(x)
      : x && typeof x === 'object'
        ? Object.values(x).every(finite)
        : true;
  for (const bad of [NaN, Infinity, -Infinity, -1e80, 1e80]) {
    expect(finite(weberResponse(bad, bad))).toBe(true);
    expect(finite(binaryPulsar(bad, bad))).toBe(true);
    expect(finite(interferometerStrain(bad))).toBe(true);
    expect(finite(michelsonReadout(bad, bad, bad))).toBe(true);
    expect(finite(returningFields(bad, bad, bad))).toBe(true);
    expect(finite(gravityShot(bad, bad))).toBe(true);
    expect(finite(gravityDirector(bad, bad, 'en'))).toBe(true);
    expect(finite(orbitalEnergySequence(bad))).toBe(true);
    expect(finite(orbitalEnergyComparison(bad))).toBe(true);
  }
});

it('keeps physical mirror motion continuous into and out of common-mode cancellation', () => {
  for (const edge of [0.18, 0.38, 0.55, 0.58, 0.61, 0.65, 0.77]) {
    const before = gravityShot(4, edge - 1e-7),
      after = gravityShot(4, edge + 1e-7);
    expect(Math.abs(before.motionXNm - after.motionXNm)).toBeLessThan(1e-5);
    expect(Math.abs(before.motionYNm - after.motionYNm)).toBeLessThan(1e-5);
  }
  const common = gravityShot(4, 0.63),
    reversed = gravityShot(4, 0.79);
  expect(michelsonReadout(common.motionXNm * 1e-9, common.motionYNm * 1e-9).deltaPower).toBe(0);
  expect(
    michelsonReadout(reversed.motionXNm * 1e-9, reversed.motionYNm * 1e-9).deltaPower,
  ).toBeCloseTo(-0.5);
});

it('integrates the visible orbital angle with the changing Kepler frequency', () => {
  for (const p of [0.1, 0.4, 0.8]) {
    const eps = 1e-5;
    const speed =
      (orbitalEnergySequence(p + eps).turns - orbitalEnergySequence(p - eps).turns) / (2 * eps);
    expect(speed).toBeCloseTo(2 * orbitalEnergySequence(p).frequencyRatio, 4);
  }
  expect(orbitalEnergySequence(0).turns).toBe(0);
  expect(orbitalEnergySequence(1).turns).toBeGreaterThan(2);
});

it('keeps both arms moving together and differential output zero throughout the common trial', () => {
  for (const p of [0.58, 0.585, 0.59, 0.6, 0.61, 0.64]) {
    const d = gravityShot(4, p);
    expect(d.motionXNm).toBe(d.motionYNm);
    expect(michelsonReadout(d.motionXNm * 1e-9, d.motionYNm * 1e-9).deltaPower).toBe(0);
  }
  expect(gravityShot(4, 0.6).motionXNm).toBeGreaterThan(gravityShot(4, 0.59).motionXNm);
});
it('times prediction and its answer against actual Chinese and English speech, including rewind', () => {
  for (const [locale, predict, common, reverse, scale] of [
    ['zh', 24, 27.3, 33.5, 35],
    ['en', 23, 26.4, 34, 36],
  ] as const) {
    const q = gravityDirector(4, predict, locale);
    expect(q.prediction).toBe(true);
    expect(q.common).toBe(false);
    const a = gravityDirector(4, common, locale);
    expect(a.common).toBe(true);
    expect(a.motionXNm).toBe(a.motionYNm);
    const r = gravityDirector(4, reverse, locale);
    expect(michelsonReadout(r.motionXNm * 1e-9, r.motionYNm * 1e-9).deltaPower).toBeLessThan(0);
    expect(gravityDirector(4, scale, locale).shot).toBe('scale');
    expect(gravityDirector(4, predict, locale)).toEqual(q);
  }
});
it('reveals fixed late pulsar observations and site transforms at their measured narration events', () => {
  expect(gravityDirector(3, 25, 'zh').observationsThrough).toBe(1992.5);
  expect(gravityDirector(3, 28.7, 'zh').observationsThrough).toBe(2013);
  expect(gravityDirector(3, 22.7, 'en').observationsThrough).toBe(1992.5);
  expect(gravityDirector(3, 25.7, 'en').observationsThrough).toBe(2013);
  for (const [locale, aligned, model, back] of [
    ['zh', 18, 25, 34.5],
    ['en', 19, 26, 37],
  ] as const) {
    expect(gravityDirector(5, aligned, locale).alignmentProgress).toBe(1);
    expect(gravityDirector(5, model, locale).shot).toBe('chirp');
    expect(gravityDirector(5, back, locale).shot).toBe('sites');
  }
});
