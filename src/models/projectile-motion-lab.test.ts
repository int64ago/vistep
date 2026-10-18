import { describe, it, expect } from 'vitest';
import {
  horizontalProjectile,
  rollingLaunch,
  rampFlight,
  wallIntercept,
  reconstructLaunchSpeed,
  projectileRanges,
  rollingSupport,
  horizontalContact,
  verticalContact,
  projectileVelocity,
  PROJECTILE_RECORDS,
  projectileShot,
  projectileSpeechProgress,
  PROJECTILE_SPEECH_CUTS,
  projectileCandidate,
  rulerPrediction,
  recoverFromRanges,
  coordinateTime,
  quadraticRatio,
  projectileInitialMode,
} from './projectile-motion-lab';
describe('horizontal projectile measurement apparatus', () => {
  it('simultaneous horizontal launch and vertical drop share every vertical state', () => {
    for (const h of [0.3, 0.8, 1.2])
      for (const t of [0, 0.1, 0.25, 0.6]) {
        const a = horizontalProjectile(t, 2, h),
          b = horizontalProjectile(t, 0, h);
        expect(a.y).toBe(b.y);
        expect(a.duration).toBe(b.duration);
      }
  });
  it('equal time samples have equal horizontal increments and odd vertical increments', () => {
    const p = Array.from({ length: 5 }, (_, i) => horizontalProjectile(i * 0.05));
    const ys = p.slice(1).map((q, i) => q.y - p[i].y);
    for (let i = 0; i < ys.length; i++) {
      expect(p[i + 1].x - p[i].x).toBeCloseTo(0.0675);
      expect(ys[i] / ys[0]).toBeCloseTo(2 * i + 1);
    }
  });
  it('rolling ramp includes rotational energy and joins a horizontal exit continuously', () => {
    const r = rollingLaunch();
    expect(r.speed * r.speed).toBeCloseTo((10 * 9.8 * 0.13) / 7, 10);
    const a = rampFlight(r.duration - 1e-7),
      b = rampFlight(r.duration + 1e-7);
    expect(a.y).toBeCloseTo(b.y, 7);
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(r.trace.at(-1)!.x).toBe(0);
  });
  it('screen-height and wall-distance methods locate the same parabola', () => {
    const a = horizontalProjectile(100, 1.35, 0.5),
      b = wallIntercept(a.x);
    expect(b.y).toBeCloseTo(a.y, 12);
  });
  it('height and horizontal range recover launch speed independently of ramp height', () => {
    for (const v of [0.5, 1.3, 2]) {
      const s = horizontalProjectile(100, v, 0.8);
      expect(reconstructLaunchSpeed(s.x, 0.8)).toBeCloseTo(v, 12);
    }
  });
  it('two receiver ranges recover the right-side point with correct one-way delays', () => {
    for (const p of [
      [0, 0],
      [0.3, 0.2],
      [0.7, 0.8],
    ]) {
      const q = projectileRanges(p[0], p[1]);
      expect(q.recoveredX).toBeCloseTo(p[0], 12);
      expect(q.recoveredY).toBeCloseTo(p[1], 12);
      expect(q.delay1 * 343).toBeCloseTo(q.r1);
    }
  });
  it('y/x² is constant after launch, but origin must be excluded from the ratio', () => {
    for (const t of [0.1, 0.2, 0.3]) {
      const s = horizontalProjectile(t);
      expect(s.y / s.x ** 2).toBeCloseTo(9.8 / (2 * 1.35 ** 2), 12);
    }
  });
});

describe('principle-first projectile evidence', () => {
  it('normal-offset rail contact agrees with the same integrated centre path', () => {
    for (const x of [-0.35, -0.2, -0.05, 0]) {
      const q = rollingSupport(x, 0.14, 0.35, 0.012, 0.008),
        dx = q.surface.x - q.center.x,
        dy = q.surface.y - q.center.y;
      expect(Math.hypot(dx, dy)).toBeCloseTo(0.012, 12);
      const slope = (-2 * 0.14 * x) / 0.35 ** 2;
      expect(dx + dy * slope).toBeCloseTo(0, 12);
      expect(Math.hypot(q.stroke.x - q.center.x, q.stroke.y - q.center.y) - 0.004).toBeCloseTo(
        0.012,
        12,
      );
    }
  });
  it('first contact uses radius for a wall and a horizontal surface', () => {
    const wall = verticalContact(0.3, 1.4, 0.012),
      board = horizontalContact(wall.y + 0.012, 0.012);
    expect(wall.x).toBeCloseTo(0.288, 12);
    expect(wall.x + 0.012).toBeCloseTo(0.3, 12);
    expect(board.centerY).toBeCloseTo(wall.y, 12);
    expect(wall.y).toBeLessThan(wallIntercept(0.3, 1.4).y);
  });
  it('force and both velocity arrows have one clock; mass changes force but not acceleration', () => {
    const a = projectileVelocity(0.2, 1.4, 0.02),
      b = projectileVelocity(0.3, 1.4, 0.04);
    expect(a.vx).toBe(b.vx);
    expect(b.vy - a.vy).toBeCloseTo(0.98, 12);
    expect(a.fx).toBe(0);
    expect(b.fy / a.fy).toBeCloseTo(2);
    expect(a.ay).toBe(b.ay);
    expect(a.speed ** 2).toBeCloseTo(a.vx ** 2 + a.vy ** 2, 12);
  });
  it('fixed coordinate rows survive candidate calculations and seeking', () => {
    const before = JSON.stringify(PROJECTILE_RECORDS);
    for (const p of [0, 0.6, 0.9, 0.2, 1, 0]) {
      projectileShot(6, p);
      projectileCandidate(0.56, 'linear');
      projectileCandidate(0.56, 'quadratic');
    }
    expect(JSON.stringify(PROJECTILE_RECORDS)).toBe(before);
    expect(Object.isFrozen(PROJECTILE_RECORDS)).toBe(true);
    expect(PROJECTILE_RECORDS.every(Object.isFrozen)).toBe(true);
    expect(projectileCandidate(0.56, 'linear')).toBeCloseTo(0.196, 12);
    expect(projectileCandidate(0.56, 'quadratic')).toBeCloseTo(0.784, 12);
  });
  it('ruler inference predicts a new catcher independently of ramp release height', () => {
    const q = rulerPrediction(0.8, 0.56, 0.2);
    expect(q.speed).toBeCloseTo(1.385929291125633, 12);
    expect(q.newRange).toBeCloseTo(0.28, 12);
    expect(q.newTime / q.time).toBeCloseTo(0.5, 12);
  });
  it('prediction holds hide the actual endpoint until a later flight reaches contact', () => {
    for (const c of [4, 5]) {
      for (const p of [0.3, 0.4, 0.5, 0.6]) {
        const q = projectileShot(c, p);
        expect(q.time).toBe(0);
        expect(q.showResult).toBe(false);
      }
      expect(projectileShot(c, 0.4).showPrediction).toBe(false);
      expect(projectileShot(c, 0.5).showPrediction).toBe(true);
      const q = projectileShot(c, 0.95);
      expect(horizontalProjectile(q.time, q.speed, q.drop).arrived).toBe(true);
      expect(q.showResult).toBe(true);
      expect(projectileShot(c, 0.3).showResult).toBe(false);
    }
    expect(projectileShot(6, 0.8).revealed).toBe(3);
    expect(projectileShot(6, 0.84).revealed).toBe(4);
    expect(projectileShot(6, 0.3).revealed).toBe(3);
    expect(projectileShot(7, 0.6).showPrediction).toBe(false);
    expect(projectileShot(7, 0.7).showPrediction).toBe(true);
    expect(projectileShot(7, 0.7).time).toBe(0);
  });
  it('keeps the earlier measured position fixed when the catcher changes, including on rewind', () => {
    for (const chapter of [4, 5]) {
      const old = chapter === 4 ? { x: 0.28, y: 0.196 } : { x: 0.14, y: 0.049 };
      expect(projectileShot(chapter, 0.2).previousContact).toBeUndefined();
      for (const p of [0.3, 0.6, 0.96, 0.4]) {
        const q = projectileShot(chapter, p);
        expect(q.previousContact).toMatchObject(old);
        expect(Object.isFrozen(q.previousContact)).toBe(true);
      }
      expect(projectileShot(chapter, 0.2).previousContact).toBeUndefined();
    }
  });
  it('two ranges return mirrored candidates and reject impossible circles', () => {
    const r = projectileRanges(0.3, 0.2),
      q = recoverFromRanges(r.r1, r.r2)!;
    expect(q.right.x).toBeCloseTo(0.3, 12);
    expect(q.left.x).toBeCloseTo(-0.54, 12);
    expect(q.left.y).toBeCloseTo(0.2, 12);
    expect(recoverFromRanges(0.1, 0.1)).toBeNull();
    expect(recoverFromRanges(2, 0.1)).toBeNull();
    expect(recoverFromRanges(NaN, 1)).toBeNull();
  });
  it('finite inputs, zero speed and zero-drop boundaries do not create invalid geometry', () => {
    expect(() => rampFlight(0, 0.13, -1)).toThrow(RangeError);
    expect(() => rampFlight(NaN)).toThrow(RangeError);
    expect(() => projectileRanges(NaN, 0)).toThrow(RangeError);
    expect(() => verticalContact(0.001, 1.4, 0.012)).toThrow(RangeError);
    expect(coordinateTime(0)).toBe(0);
    expect(horizontalProjectile(1, 0, 0).arrived).toBe(true);
    expect(quadraticRatio(0, 0)).toBeNull();
    expect(quadraticRatio(NaN, 1)).toBeNull();
    expect(projectileShot(NaN, NaN).time).toBe(0);
  });
  it('measured bilingual prediction and reveal events retain a genuine hidden-answer interval', () => {
    const at = (c: number, t: number, locale: 'zh' | 'en') =>
      projectileShot(c, projectileSpeechProgress(c, t, locale));
    for (const [locale, boardOutline, boardRelease, wallOutline, reveal] of [
      ['zh', 20.1, 22.15, 15.8, 43.15],
      ['en', 17.6, 19.9, 13.15, 41.1],
    ] as const) {
      expect(at(4, boardOutline - 0.05, locale).showPrediction).toBe(false);
      expect(at(4, boardOutline + 0.05, locale).showPrediction).toBe(true);
      expect(at(4, boardRelease - 0.05, locale).time).toBe(0);
      expect(at(4, boardRelease + 0.05, locale).time).toBeGreaterThan(0);
      expect(at(5, wallOutline - 0.05, locale).showPrediction).toBe(false);
      expect(at(5, wallOutline + 0.05, locale).showPrediction).toBe(true);
      expect(at(6, reveal - 0.05, locale).revealed).toBe(3);
      expect(at(6, reveal + 0.05, locale).revealed).toBe(4);
      expect(at(6, reveal - 0.05, locale).revealed).toBe(3);
      const final = at(7, 50.6, locale);
      expect(final.showResult).toBe(true);
      expect(horizontalProjectile(final.time, final.speed, final.drop).x).toBeCloseTo(0.28, 10);
    }
  });
  it('measured cuts are monotone, bounded and separate time recovery from the speed conclusion', () => {
    for (const locale of ['zh', 'en'] as const) {
      for (let c = 0; c < 8; c++) {
        const cuts = PROJECTILE_SPEECH_CUTS[locale][c];
        for (let i = 1; i < cuts.length; i++) {
          expect(cuts[i][0]).toBeGreaterThan(cuts[i - 1][0]);
          expect(cuts[i][1]).toBeGreaterThanOrEqual(cuts[i - 1][1]);
        }
        for (const t of [NaN, Infinity, -1, 0, 15, 60]) {
          const p = projectileSpeechProgress(c, t, locale);
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        }
      }
      expect(projectileShot(2, projectileSpeechProgress(2, 4, locale)).phase).toBe('coordinates');
      expect(projectileShot(2, projectileSpeechProgress(2, 17, locale)).phase).toBe('inference');
      expect(projectileSpeechProgress(7, 23, locale)).toBeLessThan(0.4);
      expect(projectileSpeechProgress(7, 30, locale)).toBeGreaterThan(0.4);
    }
  });
  it('all three textbook variants choose their own initial apparatus', () => {
    expect(projectileInitialMode('required-2-horizontal-projectile')).toBe('strobe');
    expect(projectileInitialMode('required-2-parabola-check')).toBe('parabola');
    expect(projectileInitialMode('required-2-launch-speed')).toBe('speed');
  });
});
