import { describe, it, expect } from 'vitest';
import {
  horizontalProjectile,
  rollingLaunch,
  rampFlight,
  wallIntercept,
  reconstructLaunchSpeed,
  projectileRanges,
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
