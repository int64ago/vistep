import { describe, it, expect } from 'vitest';
import {
  pairEvidence,
  captureRecoil,
  captureTransmission,
  invariantPair,
  parityCounts,
  resonanceBins,
  photonEvent,
  magneticTrack,
  spectrometerPair,
  antiSigmaReconstruction,
  ANTI_SIGMA_RECORD,
  ATLAS_RECORDS,
  ATLAS_BACKGROUND,
  ATLAS_TOTAL_FIT,
  TING_RECORDS,
  RICHTER_RECORDS,
  atlasFitAt,
  atlasResiduals,
  particleShot,
  particleFilmProgress,
  particleFilmPolarization,
} from './particle-evidence';
describe('particle evidence', () => {
  it('respects pair creation threshold and energy partition', () => {
    expect(pairEvidence(1, 1).pairTerm).toBe(0);
    expect(pairEvidence(2, 1).kineticEach).toBeCloseTo(0.48900105);
    expect(pairEvidence(2, 1).transmission).toBeLessThan(pairEvidence(2, 1).baseline);
  });
  it('gives the expected 7Li ground-branch recoil scale', () => {
    expect(captureRecoil()).toBeCloseTo(56.95, 1);
  });
  it('reconstructs invariant mass and collinear limits', () => {
    expect(invariantPair(62.5, 62.5, Math.PI)).toBeCloseTo(125);
    expect(invariantPair(62.5, 62.5, 0)).toBe(0);
    expect(invariantPair(1.5485, 1.5485, Math.PI, 0.000511)).toBeCloseTo(3.097);
  });
  it('normalizes parity counts and restores symmetry when unpolarized', () => {
    const x = parityCounts(0.9);
    expect(x.up + x.down).toBe(1);
    expect(x.down).toBeGreaterThan(x.up);
    expect(parityCounts(0).up).toBe(0.5);
    expect(x.angular(-1)).toBeGreaterThan(x.angular(1));
  });
  it('separates background-only and signal models', () => {
    const a = resonanceBins('higgs', 1, false);
    expect(a.every((x) => x.total === x.background)).toBe(true);
    expect(
      resonanceBins('jpsi', 1).reduce((s, x) => Math.max(s, x.total - x.background), 0),
    ).toBeGreaterThan(30);
  });
});

describe('physical reconstruction and fixed published evidence', () => {
  it('keeps parent mass invariant under a boost while lab energy increases', () => {
    const rest = photonEvent(0),
      moving = photonEvent(0.6);
    expect(rest.e1).toBe(62.5);
    expect(rest.momentumC).toBe(0);
    expect(moving.e1).toBeCloseTo(125, 12);
    expect(moving.e2).toBeCloseTo(31.25, 12);
    expect(moving.energy).toBeCloseTo(156.25, 12);
    expect(moving.momentumC).toBeCloseTo(93.75, 12);
    expect(moving.mass).toBeCloseTo(125, 12);
    expect(invariantPair(100, 25, Math.PI)).toBeCloseTo(100, 12);
    expect(invariantPair(62.5, 62.5, 0)).toBe(0);
  });
  it('derives paths and their tangents from magnetic curvature with the correct screen sign', () => {
    const positive = magneticTrack(1, 1, 1, 1),
      negative = magneticTrack(1, 1, -1, 1);
    expect(positive.radiusM).toBeCloseTo(3.335640951981521, 12);
    expect(positive.end.y).toBeGreaterThan(0);
    expect(negative.end.y).toBeCloseTo(-positive.end.y, 12);
    expect(negative.end.x).toBeCloseTo(positive.end.x, 12);
    const r = positive.radiusM!;
    for (const point of positive.points)
      expect(Math.hypot(point.x, point.y - r)).toBeCloseTo(r, 10);
    expect(
      positive.tangent.x * positive.end.x + positive.tangent.y * (positive.end.y - r),
    ).toBeCloseTo(0, 10);
    const zero = magneticTrack(1, 0, 1, 2);
    expect(zero.radiusM).toBeNull();
    expect(zero.end).toEqual({ x: 2, y: 0 });
  });
  it('keeps a forward electron pair mass fixed while a lower field changes detector paths', () => {
    const normal = spectrometerPair(1),
      lower = spectrometerPair(0.9);
    expect(normal.mass).toBeCloseTo(3.1, 11);
    expect(lower.mass).toBe(normal.mass);
    expect(normal.electron.end.x).toBeGreaterThan(0);
    expect(normal.positron.end.x).toBeGreaterThan(0);
    expect(normal.electron.end.y).toBeLessThan(0);
    expect(normal.positron.end.y).toBeGreaterThan(0);
    expect(lower.electron.radiusM! / normal.electron.radiusM!).toBeCloseTo(1 / 0.9, 12);
    expect(Math.abs(lower.electron.end.y)).toBeLessThan(Math.abs(normal.electron.end.y));
    for (const field of [0, 0.9, 1, 2]) {
      const pair = spectrometerPair(field);
      expect(pair.electron.end.x).toBeCloseTo(8, 11);
      expect(pair.positron.end.x).toBeCloseTo(8, 11);
      expect(pair.detectorX).toBe(8);
    }
    // Independent longitudinal four-vector calculation, not invariantPair again.
    const pTotal = 2 * normal.momentumEach * Math.cos(normal.halfAngle);
    expect(Math.sqrt(20 ** 2 - pTotal ** 2)).toBeCloseTo(3.1, 11);
  });
  it('uses AB as a reconstruction input and keeps it distinct from independent broad curvature evidence', () => {
    const r = antiSigmaReconstruction();
    expect(r.neutralMomentum).toBeCloseTo(1628.7881380143517, 8);
    expect(r.parentMomentum).toBeCloseTo(1809.2495780886375, 8);
    expect(r.parentMass).toBeCloseTo(1182.5787375489138, 8);
    expect(r.pion.x + r.neutral.x).toBeCloseTo(r.parentMomentum, 10);
    expect(r.pion.y + r.neutral.y).toBeCloseTo(0, 10);
    expect(r.measuredMissingAngle).toBeCloseTo(9.64234978793172, 10);
    expect(r.measuredMissingAngle).not.toBeCloseTo(ANTI_SIGMA_RECORD.neutralAngleDegrees, 1);
    expect(ANTI_SIGMA_RECORD.parentCharge).toBe(
      ANTI_SIGMA_RECORD.pionCharge + ANTI_SIGMA_RECORD.neutralCharge,
    );
    expect(r.minimumProductEnergy).toBe(1483);
    expect(r.neutralKinetic).toBeCloseTo(940.7893273861454, 8);
    expect(r.minimumProductEnergy - 60).toBeGreaterThan(r.neutralKinetic + 100);
    expect(r.annihilationAvailable).toBeGreaterThan(r.minimumProductEnergy);
  });
  it('retains source digitization, historical calibration and units without regenerating observations', () => {
    const arrays = [
      ATLAS_RECORDS,
      ATLAS_BACKGROUND,
      ATLAS_TOTAL_FIT,
      TING_RECORDS,
      RICHTER_RECORDS,
    ];
    const before = JSON.stringify(arrays);
    expect(arrays.every((a) => Object.isFrozen(a) && a.every(Object.isFrozen))).toBe(true);
    expect(ATLAS_RECORDS).toHaveLength(30);
    expect(ATLAS_RECORDS.reduce((sum, r) => sum + r.events, 0)).toBe(59015);
    expect(ATLAS_RECORDS[0]).toEqual({ mass: 101, events: 3630 });
    expect(TING_RECORDS).toHaveLength(22);
    expect(TING_RECORDS.find((r) => r.lo === 3.1)).toEqual({
      lo: 3.1,
      hi: 3.125,
      shaded: 40,
      envelope: 81,
    });
    expect(RICHTER_RECORDS[0]).toEqual({ energy: 3.05, crossSection: 16.1 });
    expect(RICHTER_RECORDS.reduce((a, b) => (a.crossSection > b.crossSection ? a : b)).energy).toBe(
      3.0947,
    );
    for (const mass of [100, 120, 125, 160, NaN, Infinity]) {
      expect(Number.isFinite(atlasFitAt(mass))).toBe(true);
      expect(Number.isFinite(atlasFitAt(mass, true))).toBe(true);
    }
    expect(atlasResiduals()).toHaveLength(30);
    expect(JSON.stringify(arrays)).toBe(before);
  });
  it('withholds independent evidence until its reveal and restores it on rewind', () => {
    expect(particleShot(1, 0.7)).toBe('cms-predict');
    expect(particleShot(1, 0.85)).toBe('cms');
    expect(particleShot(1, 0.7)).toBe('cms-predict');
    expect(particleShot(10, 0.75)).toBe('ting-predict');
    expect(particleShot(10, 0.85)).toBe('ting');
    expect(particleShot(7, 0.5)).toBe('neutron');
    expect(particleShot(7, 0.8)).toBe('annihilation');
  });
  it('returns finite bounded mechanism states for invalid and extreme control inputs', () => {
    for (const value of [NaN, Infinity, -Infinity, -1e9, 1e9]) {
      const event = photonEvent(value),
        track = magneticTrack(value, value, value, value, value, { x: value, y: value });
      expect(Object.values(event).every(Number.isFinite)).toBe(true);
      expect(track.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      expect(track.radiusM === null || Number.isFinite(track.radiusM)).toBe(true);
      expect(Number.isFinite(invariantPair(value, value, value, value))).toBe(true);
    }
  });
});

it('filters longitudinal recoil energy in a planar retarding field', () => {
  expect(captureTransmission(0)).toBe(1);
  expect(captureTransmission(captureRecoil())).toBe(0);
  expect(captureTransmission(captureRecoil() / 4)).toBeCloseTo(0.5);
});

describe('recorded bilingual causal timing', () => {
  const at = (chapter: number, seconds: number, locale: 'zh' | 'en') =>
    particleShot(chapter, particleFilmProgress(chapter, seconds, locale));
  it('withholds independent results through the actual question and restores them on rewind', () => {
    for (const [locale, cms, ting] of [
      ['zh', 16.09, 17.49],
      ['en', 15.09, 17.07],
    ] as const) {
      expect(at(1, cms - 0.01, locale)).toBe('cms-predict');
      expect(at(1, cms + 0.01, locale)).toBe('cms');
      expect(at(1, cms - 0.01, locale)).toBe('cms-predict');
      expect(at(10, ting - 0.01, locale)).toBe('ting-predict');
      expect(at(10, ting + 0.01, locale)).toBe('ting');
      expect(at(10, ting - 0.01, locale)).toBe('ting-predict');
    }
    // Same shared chapter time can correctly show different language-local evidence.
    expect(at(1, 15.5, 'en')).toBe('cms');
    expect(at(1, 15.5, 'zh')).toBe('cms-predict');
  });
  it('keeps physical events on their spoken references and every time map finite/monotone', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(at(0, 6, locale)).toBe('mass');
      expect(at(0, 12, locale)).toBe('boost');
      expect(at(6, 3, locale)).toBe('missing');
      expect(at(7, 12, locale)).toBe('neutron');
      expect(at(7, 20, locale)).toBe('annihilation');
      expect(at(11, 11, locale)).toBe('scan');
      expect(at(11, 16, locale)).toBe('compare');
      for (const chapter of [0, 1, 6, 7, 10, 11]) {
        let last = 0;
        for (let t = 0; t <= 30; t += 0.1) {
          const p = particleFilmProgress(chapter, t, locale);
          expect(p).toBeGreaterThanOrEqual(last);
          expect(p).toBeLessThanOrEqual(1);
          last = p;
        }
        expect(particleFilmProgress(chapter, NaN, locale)).toBe(0);
      }
    }
  });
  it('removes the retained Wu polarization when the voice says so, and rewinds deterministically', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(particleFilmPolarization(8, locale)).toBe(0.9);
      expect(parityCounts(particleFilmPolarization(8, locale)).asymmetry).not.toBe(0);
      expect(particleFilmPolarization(16, locale)).toBe(0);
      expect(parityCounts(particleFilmPolarization(16, locale)).up).toBe(0.5);
      expect(particleFilmPolarization(8, locale)).toBe(0.9);
    }
  });
});
