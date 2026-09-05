import { describe, expect, it } from 'vitest';
import {
  DIFFRACTION_DEFAULT,
  DIFFRACTION_DURATION,
  DIFFRACTION_SIDE_PEAK_BETA,
  diffractionAt,
  diffractionContribution,
  diffractionContributions,
  diffractionMinimum,
  diffractionPartial,
  diffractionPositionForBeta,
  diffractionProfile,
  diffractionShot,
  diffractionSinc,
  diffractionState,
  diffractionUnits,
  diffractionValidity,
} from './diffraction';

describe('single-slit scalar Fraunhofer physics', () => {
  it('handles the removable sinc singularity, even symmetry and negative field lobes', () => {
    expect(diffractionSinc(0)).toBe(1);
    for (const x of [1e-12, 1e-8, 1e-5])
      expect(diffractionSinc(x)).toBeCloseTo(1 - (x * x) / 6, 14);
    for (let x = 0; x < 30; x += 0.017) {
      expect(diffractionSinc(-x)).toBeCloseTo(diffractionSinc(x), 14);
      expect(Math.abs(diffractionSinc(x))).toBeLessThanOrEqual(1);
    }
    expect(diffractionSinc(Math.PI)).toBe(0);
    expect(diffractionSinc(DIFFRACTION_SIDE_PEAK_BETA)).toBeLessThan(0);
  });
  it('keeps units explicit and reproduces the measured first minimum', () => {
    const p = DIFFRACTION_DEFAULT,
      u = diffractionUnits(p),
      minimum = diffractionMinimum(p)!;
    expect(u.a).toBeCloseTo(80e-6, 15);
    expect(u.lambda).toBeCloseTo(550e-9, 15);
    expect(u.L).toBe(1);
    expect(minimum.yMm).toBeCloseTo(6.875162, 5);
    expect(Math.sin(minimum.theta)).toBeCloseTo(550e-9 / 80e-6, 14);
    expect(diffractionAt(p, minimum.yMm).intensity).toBe(0);
    expect(diffractionAt(p, 0).intensity).toBe(1);
  });
  it('puts every finite zero at a sin(theta) = m lambda, including negative screen positions', () => {
    for (const slitUm of [20, 40, 80, 160])
      for (const wavelengthNm of [450, 550, 650]) {
        const p = { slitUm, wavelengthNm, distanceM: 1.5 };
        for (const order of [-3, -2, -1, 1, 2, 3]) {
          const min = diffractionMinimum(p, order)!;
          expect(diffractionAt(p, min.yMm).amplitude).toBe(0);
          expect(diffractionMinimum(p, -order)!.yMm).toBeCloseTo(-min.yMm, 12);
        }
      }
  });
  it('scales minima with lambda/a and exactly with planar screen distance', () => {
    const p = DIFFRACTION_DEFAULT,
      initial = diffractionMinimum(p)!;
    const narrow = diffractionMinimum({ ...p, slitUm: 40 })!,
      red = diffractionMinimum({ ...p, wavelengthNm: 650 })!;
    expect(narrow.yMm / initial.yMm).toBeCloseTo(2, 3);
    expect(Math.sin(red.theta) / Math.sin(initial.theta)).toBeCloseTo(650 / 550, 13);
    expect(diffractionMinimum({ ...p, distanceM: 2 })!.yMm).toBeCloseTo(2 * initial.yMm, 13);
    expect(diffractionMinimum({ ...p, slitUm: 160, wavelengthNm: 1100 })!.theta).toBeCloseTo(
      initial.theta,
      14,
    );
  });
  it('finds the side maximum accurately rather than assuming beta = 1.5 pi', () => {
    const beta = DIFFRACTION_SIDE_PEAK_BETA,
      y = diffractionPositionForBeta(DIFFRACTION_DEFAULT, beta)!;
    const s = diffractionAt(DIFFRACTION_DEFAULT, y);
    expect(Math.tan(beta)).toBeCloseTo(beta, 12);
    expect(s.amplitude).toBeCloseTo(-0.2172336282, 9);
    expect(s.intensity).toBeCloseTo(0.0471904492, 9);
    expect(s.intensity).toBeGreaterThan(diffractionSinc(1.5 * Math.PI) ** 2);
    expect(s.intensity).toBeGreaterThan(diffractionAt(DIFFRACTION_DEFAULT, y - 0.01).intensity);
    expect(s.intensity).toBeGreaterThan(diffractionAt(DIFFRACTION_DEFAULT, y + 0.01).intensity);
  });
  it('sums exact aperture-strip integrals to sinc for many beta values and resolutions', () => {
    for (const count of [2, 8, 17, 64, 128])
      for (let beta = -20; beta <= 20; beta += 0.19) {
        const parts = diffractionContributions(beta, count),
          total = parts.at(-1)!.end;
        expect(total.re).toBeCloseTo(diffractionSinc(beta), 12);
        expect(total.im).toBeCloseTo(0, 12);
      }
  });
  it('independently checks complex strip integration against midpoint quadrature', () => {
    for (const beta of [0, 0.001, Math.PI, 4.493409, 10]) {
      for (const [lo, hi] of [
        [-0.5, 0.5],
        [-0.4, 0.15],
        [0, 0.5],
      ]) {
        const n = 8192,
          du = (hi - lo) / n;
        let re = 0,
          im = 0;
        for (let i = 0; i < n; i++) {
          const phase = -2 * beta * (lo + (i + 0.5) * du);
          re += du * Math.cos(phase);
          im += du * Math.sin(phase);
        }
        const exact = diffractionContribution(beta, lo, hi);
        expect(exact.re).toBeCloseTo(re, 6);
        expect(exact.im).toBeCloseTo(im, 6);
      }
    }
  });
  it('cancels matching upper/lower strips at the first minimum but not at the central peak', () => {
    const dark = diffractionContributions(Math.PI),
      bright = diffractionContributions(0);
    for (let i = 0; i < 4; i++) {
      expect(dark[i].vector.re + dark[i + 4].vector.re).toBeCloseTo(0, 14);
      expect(dark[i].vector.im + dark[i + 4].vector.im).toBeCloseTo(0, 14);
      expect(bright[i].vector.re + bright[i + 4].vector.re).toBeCloseTo(0.25, 14);
    }
    expect(diffractionPartial(Math.PI, 0.5).im).toBeCloseTo(1 / Math.PI, 12);
  });
  it('quantifies the omitted quadratic phase and withholds invalid screen predictions', () => {
    const p = DIFFRACTION_DEFAULT,
      good = diffractionValidity(p),
      bad = diffractionState({ ...p, distanceM: 0.005 });
    expect(good.fullWidthFresnel).toBeCloseTo(0.0116363636, 9);
    expect(good.edgePhaseError).toBeCloseTo((Math.PI * good.fullWidthFresnel) / 4, 10);
    expect(good.usable).toBe(true);
    expect(bad.validity.usable).toBe(false);
    expect(diffractionProfile(bad)).toEqual([]);
    const small = diffractionState({ ...p, slitUm: 0.6 });
    expect(small.validity.scalar).toBe(false);
    expect(diffractionProfile(small)).toEqual([]);
  });
  it('separates a mathematical zero from scalar-model validity and handles grazing limits', () => {
    expect(diffractionMinimum({ slitUm: 0.55, wavelengthNm: 550, distanceM: 1 })).toBeNull();
    expect(diffractionMinimum({ slitUm: 0.5, wavelengthNm: 550, distanceM: 1 })).toBeNull();
    const p = { slitUm: 0.56, wavelengthNm: 550, distanceM: 1 };
    expect(diffractionMinimum(p)!.theta).toBeLessThan(Math.PI / 2);
    expect(diffractionValidity(p).scalar).toBe(false);
    expect(
      diffractionPositionForBeta({ slitUm: 0.5, wavelengthNm: 550, distanceM: 1 }, Math.PI),
    ).toBeNull();
  });
  it('bounds the profile, probe, physical inputs and render sampling budget', () => {
    const s = diffractionState(DIFFRACTION_DEFAULT, 1e9),
      profile = diffractionProfile(s);
    expect(s.sample.yMm).toBe(25);
    expect(profile).toHaveLength(401);
    expect(profile[200].intensity).toBe(1);
    for (const p of profile) {
      expect(p.intensity).toBeGreaterThanOrEqual(0);
      expect(p.intensity).toBeLessThanOrEqual(1);
    }
    expect(() => diffractionAt({ ...DIFFRACTION_DEFAULT, slitUm: 0 }, 0)).toThrow();
    expect(() => diffractionSinc(NaN)).toThrow();
    expect(() => diffractionProfile(s, 100000)).toThrow();
    expect(() => diffractionContribution(1, -0.6, 0.5)).toThrow();
    expect(() => diffractionMinimum(DIFFRACTION_DEFAULT, 0)).toThrow();
  });
});
describe('diffraction film director', () => {
  it('reconstructs eight authored 22-second chapters and its visible partial sums', () => {
    expect(DIFFRACTION_DURATION).toBe(176);
    const sequence = Array.from({ length: 808 }, (_, i) =>
      diffractionShot(Math.floor(i / 101), (i % 101) / 100),
    );
    for (let i = 807; i >= 0; i--)
      expect(diffractionShot(Math.floor(i / 101), (i % 101) / 100)).toEqual(sequence[i]);
    expect(new Set(sequence.map((s) => s.view)).size).toBe(8);
    expect(diffractionShot(1, 0).reveal).toBe(0);
    expect(diffractionShot(1, 1).reveal).toBe(1);
    expect(diffractionShot(2, 1).state.sample.intensity).toBe(0);
    expect(diffractionShot(3, 1).state.sample.intensity).toBeCloseTo(0.0471904492, 9);
    expect(diffractionShot(4, 1).state.parameters.slitUm).toBe(40);
    expect(diffractionShot(5, 1).state.parameters.wavelengthNm).toBe(650);
    expect(diffractionShot(6, 0.55).state.validity.farField).toBe(false);
    expect(diffractionShot(6, 1).state.validity.farField).toBe(true);
    expect(diffractionShot(7, 1).mathematicalAngle).toBeNull();
    expect(diffractionShot(7, 1).state.validity.usable).toBe(true);
  });
});
