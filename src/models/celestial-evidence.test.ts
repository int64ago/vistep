import { describe, expect, it } from 'vitest';
import {
  JUPITER_RECORDS,
  jupiterObservation,
  jupiterRecordProgress,
  HALLEY_RECORD_YEARS,
  cometEvidenceStage,
  MARS_RECORDS,
  MARS_FITS,
  marsComparison,
  marsDirection,
  URANUS_RECORDS,
  URANUS_CANDIDATES,
  URANUS_BEST,
  uranusTrajectory,
  differentialGravity,
  NEPTUNE_RECORDS,
  NEPTUNE_LONGITUDE,
  localSky,
  neptuneLinearPrediction,
  wrapAngle,
  celestialEvidenceShot,
} from './celestial-evidence';

describe('fixed astronomical evidence and independent predictions', () => {
  it('withholds the later comet record until the actual language-specific rediscovery sentence', () => {
    const before = JSON.stringify(HALLEY_RECORD_YEARS);
    expect(HALLEY_RECORD_YEARS).toEqual([1531, 1607, 1682, 1758]);
    expect(Object.isFrozen(HALLEY_RECORD_YEARS)).toBe(true);
    for (const locale of ['zh', 'en'] as const) {
      const revealAt = locale === 'zh' ? 7.17 : 8.61;
      for (const t of [0, 6, 12, 27.9]) expect(cometEvidenceStage(6, t, locale)).toBe('past');
      for (const t of [0, revealAt - 0.001, revealAt, 27, 0]) {
        expect(cometEvidenceStage(7, t, locale)).toBe(t < revealAt ? 'prediction' : 'observed');
      }
      expect(cometEvidenceStage(7, NaN, locale)).toBe('prediction');
      expect(cometEvidenceStage(7, Infinity, locale)).toBe('prediction');
      expect(cometEvidenceStage(6, 0, locale, false)).toBe('observed');
    }
    expect(JSON.stringify(HALLEY_RECORD_YEARS)).toBe(before);
  });
  it('keeps five adjacent-day moon snapshots fixed while revealing and rewinding', () => {
    const before = JSON.stringify(JUPITER_RECORDS);
    expect(JUPITER_RECORDS.map((r) => r.day)).toEqual([0, 1, 2, 3, 4]);
    expect(Object.isFrozen(JUPITER_RECORDS)).toBe(true);
    expect(
      JUPITER_RECORDS.every(
        (r) => Object.isFrozen(r) && Object.isFrozen(r.moons) && r.moons.every(Object.isFrozen),
      ),
    ).toBe(true);
    for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.25, 1, 0]) {
      const state = jupiterObservation(progress);
      expect(state.records).toHaveLength(Math.floor(progress * 4) + 1);
      expect(state.moons).toEqual(state.records.at(-1)?.moons);
    }
    expect(JSON.stringify(JUPITER_RECORDS)).toBe(before);
    // Independent analytic reference for Io at day 1, in Jupiter-radius units.
    expect(JUPITER_RECORDS[1].moons[0].x).toBeCloseTo(5.9 * Math.sin((2 * Math.PI) / 1.769), 12);
    expect(JUPITER_RECORDS[1].moons[0].z).toBeCloseTo(5.9 * Math.cos((2 * Math.PI) / 1.769), 12);
    const between = jupiterObservation(0.375);
    expect(between.day).toBe(1.5);
    expect(between.records).toEqual(JUPITER_RECORDS.slice(0, 2));
    expect(between.moons).not.toEqual(between.records[1].moons);
  });
  it('finishes the moon record sequence during the recorded sentence and handles boundaries', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(jupiterRecordProgress(0, locale)).toBe(0);
      expect(jupiterObservation(jupiterRecordProgress(14, locale)).records).toHaveLength(5);
      expect(jupiterRecordProgress(27.9, locale)).toBe(1);
      expect(jupiterRecordProgress(0, locale)).toBe(0);
    }
    for (const value of [NaN, Infinity, -Infinity, -1e5, 1e5]) {
      const state = jupiterObservation(value);
      expect(Number.isFinite(state.day)).toBe(true);
      expect(state.records.length).toBeGreaterThanOrEqual(1);
      expect(state.records.length).toBeLessThanOrEqual(5);
      expect(state.moons.every((m) => Number.isFinite(m.x) && Number.isFinite(m.z))).toBe(true);
    }
  });
  it('matches the independent bisection benchmark without fitting held-out Mars rows', () => {
    expect(MARS_FITS.circle.phase).toBeCloseTo(0.182, 12);
    expect(MARS_FITS.ellipse.phase).toBeCloseTo(0.12, 12);
    expect(MARS_FITS.circle.trainingRMSE).toBeCloseTo(252.71521917312174, 7);
    expect(MARS_FITS.circle.heldOutRMSE).toBeCloseTo(387.72579568110064, 7);
    expect(MARS_FITS.ellipse.trainingRMSE).toBeCloseTo(0.23237900077240384, 8);
    expect(MARS_FITS.ellipse.heldOutRMSE).toBeCloseTo(0.29154759474137415, 8);
    expect(MARS_RECORDS.filter((r) => r.training).map((r) => r.day)).toEqual([-80, -40, 0, 40, 80]);
    expect(MARS_RECORDS.filter((r) => !r.training).map((r) => r.day)).toEqual([120, 160]);
  });
  it('keeps fixed observations immutable when candidates and phases change', () => {
    const before = JSON.stringify([MARS_RECORDS, URANUS_RECORDS, NEPTUNE_RECORDS]);
    for (const c of ['circle', 'ellipse'] as const)
      for (const phase of [-0.08, 0.12, 0.32]) marsComparison(c, phase);
    expect(Object.isFrozen(MARS_RECORDS)).toBe(true);
    expect(MARS_RECORDS.every(Object.isFrozen)).toBe(true);
    expect(JSON.stringify([MARS_RECORDS, URANUS_RECORDS, NEPTUNE_RECORDS])).toBe(before);
  });
  it('computes Earth-relative sight directions rather than treating heliocentric angle as observation', () => {
    const p = marsDirection(0, 'ellipse', 0.12);
    expect(p.longitude).toBe(Math.atan2(p.mars.y - p.earth.y, p.mars.x - p.earth.x));
    expect(Math.abs(p.longitude - Math.atan2(p.mars.y, p.mars.x))).toBeGreaterThan(0.2);
    expect((wrapAngle(((1 - 359) * Math.PI) / 180) * 180) / Math.PI).toBeCloseTo(2, 12);
  });
  it('matches independently frozen Uranus references and selects on early records only', () => {
    expect(URANUS_BEST.massScale).toBe(1);
    expect(URANUS_BEST.phase).toBe(0.6);
    expect(URANUS_BEST.trainingRMSE).toBeCloseTo(0.16733200530680983, 5);
    expect(URANUS_BEST.heldOutRMSE).toBeCloseTo(0.14142135623730817, 5);
    expect(URANUS_BEST.history[50].residualArcsec).toBeCloseTo(-222.1232061645006, 5);
    expect(URANUS_RECORDS.filter((r) => !r.training).map((r) => r.year)).toEqual([60, 70, 80]);
  });
  it('subtracts the Sun acceleration and removes phase dependence at zero perturber mass', () => {
    const g = differentialGravity({ x: 19.2, y: 0 }, 0, 1, 0.6);
    expect(g.relative.x).toBe(g.direct.x - g.solar.x);
    expect(g.relative.y).toBe(g.direct.y - g.solar.y);
    expect(Math.hypot(g.solar.x, g.solar.y)).toBeGreaterThan(0);
    const zero = URANUS_CANDIDATES.filter((c) => c.massScale === 0);
    expect(zero[0].history).toEqual(zero[1].history);
    expect(zero[1].history).toEqual(zero[2].history);
    expect(Math.max(...zero[0].history.map((p) => Math.abs(p.residualArcsec)))).toBeLessThan(0.001);
  });
  it('keeps annual outputs at exact epochs for arbitrary valid steps and converges', () => {
    for (const step of [0.03, 0.025, 0.0125])
      expect(uranusTrajectory(1, 0.6, step).map((p) => p.year)).toEqual(
        Array.from({ length: 81 }, (_, i) => i),
      );
    const fine = uranusTrajectory(1, 0.6, 0.0125),
      coarse = URANUS_BEST.history;
    expect(
      Math.max(...fine.map((p, i) => Math.abs(p.residualArcsec - coarse[i].residualArcsec))),
    ).toBeLessThan(0.001);
  });
  it('reproduces the historical primary-table arithmetic and keeps coordinate types separate', () => {
    const [a, b, c] = NEPTUNE_RECORDS;
    expect((b.ra - a.ra) * 3600).toBeCloseTo(-61.7, 7);
    expect((b.dec - a.dec) * 3600).toBeCloseTo(-21.5, 7);
    expect(
      (NEPTUNE_LONGITUDE.observationDegrees - NEPTUNE_LONGITUDE.predictionDegrees) * 60,
    ).toBeCloseTo(54.75, 9);
    const p = neptuneLinearPrediction();
    expect(p.ra).toBeCloseTo(328.2836140149487, 10);
    expect(p.dec).toBeCloseTo(-13.415344026845718, 10);
    expect(p.error.raArcsec).toBeCloseTo(-1.2104538153380417, 7);
    expect(p.error.decArcsec).toBeCloseTo(-0.16150335541880168, 7);
    expect(Math.abs(localSky(c.ra, c.dec).x)).toBeLessThan(Math.abs((c.ra - a.ra) * 3600));
    expect(localSky(a.ra, a.dec)).toEqual({ x: 0, y: 0 });
  });
  it('holds new records hidden after locking and reveals the existing immutable records later', () => {
    expect(celestialEvidenceShot(1, 21)).toMatchObject({ locked: true, revealed: false });
    expect(celestialEvidenceShot(1, 28)).toMatchObject({ locked: true, revealed: true });
    expect(celestialEvidenceShot(4, 29)).toMatchObject({ locked: true, revealed: false });
    expect(celestialEvidenceShot(4, 39)).toMatchObject({ locked: true, revealed: true });
    expect(celestialEvidenceShot(5, 30)).toMatchObject({ locked: true, revealed: false, count: 2 });
    expect(celestialEvidenceShot(5, 38)).toMatchObject({ locked: true, revealed: true, count: 3 });
  });
  it('keeps the spoken question visible and uses locale-specific measured reveal moments', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(celestialEvidenceShot(0, 15, lang)).toMatchObject({ overlay: false, count: 5 });
      expect(celestialEvidenceShot(0, 17, lang)).toMatchObject({ overlay: true });
      expect(celestialEvidenceShot(1, 10, lang)).toMatchObject({ candidate: 'circle' });
      expect(celestialEvidenceShot(1, 20, lang)).toMatchObject({ locked: true, revealed: false });
      expect(celestialEvidenceShot(4, 29, lang)).toMatchObject({ locked: true, revealed: false });
      expect(celestialEvidenceShot(4, 32, lang)).toMatchObject({ locked: true, revealed: true });
      expect(celestialEvidenceShot(5, 30, lang)).toMatchObject({
        locked: true,
        count: 2,
        revealed: false,
      });
      expect(celestialEvidenceShot(5, 33, lang)).toMatchObject({ count: 3, revealed: true });
    }
    expect(celestialEvidenceShot(1, 23, 'zh').revealed).toBe(false);
    expect(celestialEvidenceShot(1, 23, 'en').revealed).toBe(true);
    expect(celestialEvidenceShot(4, 11, 'zh').view).toBe('force');
    expect(celestialEvidenceShot(4, 11, 'en').view).toBe('uranus');
    // Seeking backwards reconstructs the unknown state, including the withheld identity.
    expect(celestialEvidenceShot(5, 33, 'en').count).toBe(3);
    expect(celestialEvidenceShot(5, 30, 'en').count).toBe(2);
  });
  it('keeps invalid numeric and zero boundaries finite', () => {
    for (const bad of [NaN, Infinity, -Infinity, -1e10, 1e10]) {
      const p = marsDirection(bad, 'ellipse', bad);
      expect(Number.isFinite(p.longitude)).toBe(true);
      expect(Number.isFinite(localSky(bad, bad).x)).toBe(true);
      const g = differentialGravity({ x: bad, y: bad }, bad, bad, bad);
      for (const v of Object.values(g))
        expect(Number.isFinite(v.x) && Number.isFinite(v.y)).toBe(true);
      expect(Number.isFinite(wrapAngle(bad))).toBe(true);
    }
  });
});
