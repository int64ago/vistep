import { describe, expect, it } from 'vitest';
import {
  DOUBLE_SLIT_DEFAULT,
  doubleSlitAt,
  doubleSlitDetection,
  doubleSlitDetections,
  doubleSlitDistribution,
  doubleSlitExactPathDifference,
  doubleSlitFringeSpacing,
  doubleSlitPhasePosition,
  doubleSlitProfile,
  doubleSlitQuantile,
  doubleSlitSinc,
  doubleSlitUnitRandom,
  doubleSlitValidity,
  type DoubleSlitParameters,
} from './double-slit';

const p = DOUBLE_SLIT_DEFAULT;
const integral = (parameters: DoubleSlitParameters, low: number, high: number, n = 8192) => {
  const step = (high - low) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++)
    sum +=
      doubleSlitAt(parameters, low + step * i).intensity *
      (i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4);
  return (sum * step) / 3;
};

describe('finite-width double-slit Fraunhofer field', () => {
  it('uses one current single-slit central intensity as the common reference', () => {
    expect(doubleSlitSinc(0)).toBe(1);
    expect(doubleSlitSinc(1e-10)).toBe(1);
    expect(doubleSlitAt(p, 0).intensity).toBe(4);
    expect(doubleSlitAt({ ...p, slit: 'one' }, 0).intensity).toBe(1);
    expect(doubleSlitAt({ ...p, coherence: 0 }, 0).intensity).toBe(2);
    // Altering a changes the normalization reference as well as the envelope.
    expect(doubleSlitAt({ ...p, slitWidthM: 70e-6 }, 0).intensity).toBe(4);
    expect(doubleSlitAt({ ...p, slitWidthM: 70e-6 }, 0.005).envelope).toBeLessThan(
      doubleSlitAt(p, 0.005).envelope,
    );
  });

  it('agrees with an independent complex aperture quadrature', () => {
    for (const slit of ['one', 'both'] as const)
      for (const yM of [0, 0.0015, 0.003, 0.007, -0.009]) {
        const parameters = { ...p, slit },
          waveNumber = (2 * Math.PI) / p.wavelengthM,
          direction = yM / Math.hypot(p.distanceM, yM),
          n = 8192;
        let re = 0,
          im = 0;
        for (const center of slit === 'both' ? [-p.separationM / 2, p.separationM / 2] : [0])
          for (let i = 0; i < n; i++) {
            const x = center + p.slitWidthM * ((i + 0.5) / n - 0.5),
              phase = -waveNumber * direction * x;
            re += Math.cos(phase) / n;
            im += Math.sin(phase) / n;
          }
        expect(doubleSlitAt(parameters, yM).intensity).toBeCloseTo(re * re + im * im, 7);
      }
  });

  it('locates coherent dark fringes, envelope zeros and a missing order separately', () => {
    for (const cycles of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
      const yM = doubleSlitPhasePosition(p, cycles)!;
      expect(doubleSlitAt(p, yM).intensity).toBeLessThan(1e-27);
      expect(doubleSlitAt({ ...p, coherence: 0 }, yM).intensity).toBeGreaterThan(0);
    }
    const a = 60e-6,
      parameters = { ...p, slitWidthM: a },
      sine = p.wavelengthM / a,
      envelopeZero = (p.distanceM * sine) / Math.sqrt(1 - sine * sine),
      missingOrder = doubleSlitPhasePosition(parameters, 3)!;
    expect(missingOrder).toBeCloseTo(envelopeZero, 14);
    expect(doubleSlitAt(parameters, missingOrder).interferenceFactor).toBeCloseTo(4, 14);
    expect(doubleSlitAt(parameters, missingOrder).envelope).toBe(0);
    expect(doubleSlitAt(parameters, missingOrder).intensity).toBe(0);
    // A constructive phase condition does not assert a composite local maximum.
    const phaseBright = doubleSlitPhasePosition(p, 1)!;
    expect(doubleSlitAt(p, phaseBright - 1e-5).intensity).toBeGreaterThan(
      doubleSlitAt(p, phaseBright).intensity,
    );
  });

  it('reduces the ensemble cross term without dimming either individual slit', () => {
    for (const gamma of [0, 0.2, 0.7, 1])
      for (let i = -100; i <= 100; i++) {
        const yM = i * 0.0001,
          one = doubleSlitAt({ ...p, slit: 'one', coherence: gamma }, yM),
          both = doubleSlitAt({ ...p, coherence: gamma }, yM),
          coherent = doubleSlitAt(p, yM);
        expect(one.intensity).toBe(one.envelope);
        expect(both.intensity).toBeCloseTo(
          gamma * coherent.intensity + (1 - gamma) * 2 * one.intensity,
          14,
        );
      }
  });

  it('keeps exact centre distances distinct from the far-field path difference', () => {
    expect(doubleSlitExactPathDifference(p, 0)).toBe(0);
    for (const separationM of [120e-6, 180e-6, 300e-6])
      for (const yM of [-0.01, -0.008, 0.008, 0.01]) {
        const parameters = { ...p, separationM },
          exact = doubleSlitExactPathDifference(parameters, yM),
          far = doubleSlitAt(parameters, yM).pathDifferenceM;
        expect(Math.abs(exact)).toBeLessThan(Math.abs(far));
        expect(Math.abs(exact / far - 1)).toBeLessThan(2e-8);
        expect(doubleSlitExactPathDifference(parameters, -yM)).toBe(-exact);
        expect(far).toBeCloseTo((separationM * yM) / Math.hypot(1, yM), 15);
      }
    const near = { ...p, distanceM: 0.0002 };
    const exact = doubleSlitExactPathDifference(near, 0.0002);
    const direct =
      Math.hypot(near.distanceM, 0.0002 + near.separationM / 2) -
      Math.hypot(near.distanceM, 0.0002 - near.separationM / 2);
    expect(exact).toBeCloseTo(direct, 16);
    expect(Math.abs(exact / doubleSlitAt(near, 0.0002).pathDifferenceM - 1)).toBeGreaterThan(0.01);
  });

  it('scales paraxial spacing with wavelength, distance and inverse slit separation', () => {
    expect(doubleSlitFringeSpacing(p)).toBeCloseTo(0.003055555555555556, 15);
    expect(doubleSlitFringeSpacing({ ...p, wavelengthM: 650e-9 })).toBeCloseTo(
      (doubleSlitFringeSpacing(p) * 650) / 550,
      15,
    );
    expect(doubleSlitFringeSpacing({ ...p, separationM: 2 * p.separationM })).toBe(
      doubleSlitFringeSpacing(p) / 2,
    );
    expect(doubleSlitPhasePosition({ ...p, distanceM: 2 }, 1)).toBe(
      2 * doubleSlitPhasePosition(p, 1)!,
    );
    expect(doubleSlitPhasePosition(p, p.separationM / p.wavelengthM)).toBeNull();
    expect(doubleSlitPhasePosition(p, 1e9)).toBeNull();
  });

  it('remains symmetric, finite and nonnegative throughout the offered controls', () => {
    for (const wavelengthM of [450e-9, 550e-9, 650e-9])
      for (const separationM of [120e-6, 180e-6, 300e-6])
        for (const slitWidthM of [20e-6, 35e-6, 70e-6])
          for (const slit of ['one', 'both'] as const) {
            const parameters = { ...p, wavelengthM, separationM, slitWidthM, slit },
              profile = doubleSlitProfile(parameters, 401);
            expect(profile[0].yM).toBe(-0.01);
            expect(profile[400].yM).toBe(0.01);
            for (let i = 0; i <= 400; i++) {
              expect(Object.values(profile[i]).every(Number.isFinite)).toBe(true);
              expect(profile[i].intensity).toBeGreaterThanOrEqual(0);
              expect(profile[i].intensity).toBeLessThanOrEqual(slit === 'one' ? 1 : 4);
              expect(profile[i].intensity).toBeCloseTo(profile[400 - i].intensity, 12);
            }
          }
    expect(doubleSlitProfile(p)).toHaveLength(801);
    const validity = doubleSlitValidity({
      ...p,
      wavelengthM: 450e-9,
      separationM: 300e-6,
      slitWidthM: 70e-6,
    });
    expect(validity.omittedEdgePhase).toBeLessThan(0.24);
    expect(validity.screenSlope).toBe(0.01);
  });
});

describe('conditional single-detection statistics', () => {
  it('normalizes a monotone symmetric CDF using the actual screen measure dy', () => {
    for (const parameters of [p, { ...p, slit: 'one' as const }, { ...p, coherence: 0 }]) {
      const d = doubleSlitDistribution(parameters);
      expect(d.cdf[0]).toBe(0);
      expect(d.cdf.at(-1)).toBe(1);
      expect(d.cdf[1024]).toBeCloseTo(0.5, 13);
      expect(Math.abs(d.integralM / integral(parameters, -0.01, 0.01) - 1)).toBeLessThan(1e-6);
      for (let i = 0; i < d.cdf.length - 1; i++) {
        expect(d.cdf[i + 1]).toBeGreaterThanOrEqual(d.cdf[i]);
        expect(d.densityPerM[i]).toBeGreaterThanOrEqual(0);
      }
      for (const u of [0, 1e-10, 0.1, 0.25, 0.5, 0.9, 1 - 1e-10, 1]) {
        const yM = doubleSlitQuantile(d, u);
        expect(yM).toBeGreaterThanOrEqual(-0.01);
        expect(yM).toBeLessThanOrEqual(0.01);
        expect(yM).toBeCloseTo(-doubleSlitQuantile(d, 1 - u), 11);
        expect(integral(parameters, -0.01, yM) / d.integralM).toBeCloseTo(u, 5);
      }
    }
  });

  it('reconstructs indexed marks exactly after backward seeks and preserves prefixes', () => {
    const d = doubleSlitDistribution(p),
      first = doubleSlitDetections(d, 800, 12345),
      shorter = doubleSlitDetections(d, 64, 12345);
    expect(first.slice(0, 64)).toEqual(shorter);
    for (let i = 799; i >= 0; i -= 7) expect(doubleSlitDetection(d, i, 12345)).toEqual(first[i]);
    expect(doubleSlitDetections(d, 800, 54321)).not.toEqual(first);
    expect(doubleSlitDetections(d, 0)).toEqual([]);
    expect(doubleSlitUnitRandom(0xffffffff, 0xffffffff)).toBeGreaterThan(0);
    expect(doubleSlitUnitRandom(0xffffffff, 0xffffffff)).toBeLessThan(1);
  });

  it('builds counts toward the conditional distribution, not uniformly across dark fringes', () => {
    const d = doubleSlitDistribution(p),
      marks = doubleSlitDetections(d, 20000, 112358);
    for (const yM of [-0.007, -0.004, -0.001, 0, 0.001, 0.004, 0.007]) {
      const observed = marks.filter((point) => point.yM <= yM).length / marks.length,
        expected = integral(p, -0.01, yM) / d.integralM;
      expect(Math.abs(observed - expected)).toBeLessThan(0.012);
    }
    const coherent = doubleSlitDistribution(p),
      incoherent = doubleSlitDistribution({ ...p, coherence: 0 });
    expect(coherent.cdf).not.toEqual(incoherent.cdf);
    // Same requested count is explicitly conditional, regardless of slit mode.
    expect(doubleSlitDetections(doubleSlitDistribution({ ...p, slit: 'one' }), 800)).toHaveLength(
      800,
    );
  });

  it('rejects invalid dimensions, counters and sampling requests instead of producing NaNs', () => {
    for (const key of ['wavelengthM', 'slitWidthM', 'separationM', 'distanceM'] as const)
      for (const value of [0, -1, NaN, Infinity])
        expect(() => doubleSlitAt({ ...p, [key]: value }, 0)).toThrow(RangeError);
    for (const coherence of [-0.01, 1.01, NaN])
      expect(() => doubleSlitAt({ ...p, coherence }, 0)).toThrow(RangeError);
    expect(() => doubleSlitAt({ ...p, slitWidthM: p.separationM }, 0)).toThrow(RangeError);
    expect(() => doubleSlitAt(p, NaN)).toThrow(RangeError);
    expect(() => doubleSlitProfile(p, 2)).toThrow(RangeError);
    expect(() => doubleSlitProfile(p, 1000000)).toThrow(RangeError);
    expect(() => doubleSlitDistribution(p, -0.01)).toThrow(RangeError);
    expect(() => doubleSlitDistribution(p, 0.01, 129.5)).toThrow(RangeError);
    expect(() => doubleSlitDistribution({ ...p, wavelengthM: 1e-12 })).toThrow(RangeError);
    const d = doubleSlitDistribution(p);
    for (const u of [-0.1, 1.1, NaN]) expect(() => doubleSlitQuantile(d, u)).toThrow(RangeError);
    for (const counter of [-1, 1.5, 0x100000000, NaN]) {
      expect(() => doubleSlitDetection(d, counter)).toThrow(RangeError);
      expect(() => doubleSlitDetection(d, 0, counter)).toThrow(RangeError);
    }
  });
});
