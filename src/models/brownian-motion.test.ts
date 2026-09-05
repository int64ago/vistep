import { describe, expect, it } from 'vitest';
import {
  BROWNIAN,
  brownianDefault as p,
  brownianCoefficients as coefficients,
  brownianKernel as kernel,
  brownianNormal as normal,
  brownianStep as step,
  brownianMSD as msd,
  brownianTrack as track,
  brownianSample as sample,
  brownianStatistics as statistics,
  brownianFilm,
  brownianShot,
  brownianExtent,
  brownianImpulse,
} from './brownian-motion';

describe('free equilibrium Langevin tracer', () => {
  const c = coefficients(p);
  it('uses SI Stokes drag, mass and Einstein diffusion with correct parameter scaling', () => {
    expect(c.diffusion * 1e12).toBeCloseTo(0.439474226, 7);
    expect(c.tau).toBeCloseTo(5.833333333e-8, 16);
    expect(coefficients({ ...p, temperature: 450 }).diffusion / c.diffusion).toBeCloseTo(1.5, 14);
    expect(coefficients({ ...p, viscosity: 3e-3 }).diffusion / c.diffusion).toBeCloseTo(1 / 3, 14);
    expect(coefficients({ ...p, radius: 1e-6 }).diffusion / c.diffusion).toBeCloseTo(0.5, 14);
    expect(coefficients({ ...p, radius: 1e-6 }).tau / c.tau).toBeCloseTo(4, 14);
  });
  it('has an exact zero-time identity and zero-temperature stationary limit', () => {
    expect(step({ x: 2e-6, v: 3 }, 0, p, 2, -1)).toEqual({
      x: 2e-6,
      v: 3,
      dragImpulse: -0,
      thermalImpulse: 0,
    });
    const z = track({ ...p, temperature: 0 }, 19);
    expect(z.points.every((s) => s.x === 0 && s.y === 0 && s.vx === 0 && s.vy === 0)).toBe(true);
    expect(msd({ ...p, temperature: 0 }, 5)).toBe(0);
  });
  it('zero-temperature initial momentum decays; its lost kinetic energy is positive', () => {
    const z = track({ ...p, temperature: 0 }, 31, 8 * c.tau, 256, [0.004, -0.003]);
    const end = z.points.at(-1)!;
    expect(end.vx / 0.004).toBeCloseTo(Math.exp(-8), 14);
    expect(end.x / (0.004 * c.tau)).toBeCloseTo(1 - Math.exp(-8), 14);
    expect(Math.max(...z.points.map((s) => Math.abs(s.thermalX)))).toBeLessThan(1e-32);
    for (let i = 1; i < z.points.length; i++)
      expect(Math.hypot(z.points[i].vx, z.points[i].vy)).toBeLessThan(
        Math.hypot(z.points[i - 1].vx, z.points[i - 1].vy),
      );
  });
  it('joint noise covariance agrees with independent numerical integrals', () => {
    for (const h of [0.0001, 0.2, 1, 5]) {
      const n = 4096,
        du = h / n;
      let xx = 0,
        xv = 0,
        vv = 0;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) * du,
          e = Math.exp(-u),
          b = -Math.expm1(-u);
        xx += 2 * b * b * du;
        xv += 2 * b * e * du;
        vv += 2 * e * e * du;
      }
      const k = kernel(h);
      expect(k.xx / xx).toBeCloseTo(1, 5);
      expect(k.xv / xv).toBeCloseTo(1, 5);
      expect(k.vv / vv).toBeCloseTo(1, 5);
    }
  });
  it('remains positive and stable for extreme timestep-to-relaxation ratios', () => {
    for (const h of [0, 1e-10, 1e-7, 0.000999, 0.001, 1, 100, 1e9]) {
      const k = kernel(h);
      expect(k.xx).toBeGreaterThanOrEqual(0);
      expect(k.vv * k.xx - k.xv ** 2).toBeGreaterThanOrEqual(-1e-25);
      expect(Object.values(k).every(Number.isFinite)).toBe(true);
    }
  });
  it('converges under timestep subdivision: exact covariance semigroup at 1, 2, 8, 128 steps', () => {
    const exact = kernel(7);
    for (const n of [1, 2, 8, 128]) {
      const k = kernel(7 / n);
      let xx = 0,
        xv = 0,
        vv = 0;
      for (let i = 0; i < n; i++) {
        const nextX = xx + 2 * k.b * xv + k.b ** 2 * vv + k.xx;
        xv = k.a * xv + k.a * k.b * vv + k.xv;
        vv = k.a ** 2 * vv + k.vv;
        xx = nextX;
      }
      expect(xx).toBeCloseTo(exact.xx, 11);
      expect(xv).toBeCloseTo(exact.xv, 12);
      expect(vv).toBeCloseTo(exact.vv, 12);
    }
  });
  it('recovers ballistic 2 kT/m t² and long-time 4Dt in the observed plane', () => {
    const tiny = c.tau * 1e-6,
      long = 2;
    expect(msd(p, tiny) / (2 * c.velocityVariance * tiny ** 2)).toBeCloseTo(1, 5);
    expect(msd(p, long) / (4 * c.diffusion * long)).toBeCloseTo(1, 6);
  });
  it('matches long-time MSD and stationary equipartition in 8192 independent trials', () => {
    let square = 0,
      energy = 0,
      meanX = 0;
    const n = 8192,
      time = 0.4;
    for (let i = 0; i < n; i++) {
      const s = track(p, i + 42000, time, 8).points.at(-1)!;
      square += s.x ** 2 + s.y ** 2;
      energy += s.vx ** 2 + s.vy ** 2;
      meanX += s.x;
    }
    expect(square / n / msd(p, time)).toBeGreaterThan(0.96);
    expect(square / n / msd(p, time)).toBeLessThan(1.04);
    expect(energy / n / (2 * c.velocityVariance)).toBeGreaterThan(0.96);
    expect(energy / n / (2 * c.velocityVariance)).toBeLessThan(1.04);
    expect(Math.abs(meanX / n) / Math.sqrt(msd(p, time))).toBeLessThan(0.025);
  });
  it('velocity autocorrelation decays with the declared inertial time', () => {
    let cv = 0;
    for (let i = 0; i < 16384; i++) {
      const v = Math.sqrt(c.velocityVariance) * normal(i, 0);
      cv += v * step({ x: 0, v }, c.tau, p, normal(i, 1), normal(i, 2)).v;
    }
    expect(cv / 16384 / c.velocityVariance).toBeCloseTo(Math.exp(-1), 1);
  });
  it('impulses close momentum exactly and couple the overdamped path to the same bath', () => {
    const tr = track(p, 17, c.tau * 12, 384);
    for (let i = 1; i < tr.points.length; i++) {
      const a = tr.points[i - 1],
        b = tr.points[i];
      expect(Math.abs(b.thermalX + b.dragX - c.mass * (b.vx - a.vx))).toBeLessThan(1e-33);
      expect(Math.abs(b.ox - b.x - c.tau * (b.vx - tr.points[0].vx))).toBeLessThan(1e-24);
    }
  });
  it('complete-window impulses never use future observations and close net momentum', () => {
    const tr = track(p, 17, 12 * c.tau, 384);
    for (let i = 0; i < 384; i++) {
      const time = (i + 0.1) * tr.dt,
        impulse = brownianImpulse(tr, time);
      expect(impulse.end).toBeLessThanOrEqual(time);
      expect(Math.abs(impulse.thermal + impulse.drag - impulse.momentum)).toBeLessThan(1e-33);
      expect(impulse.duration / c.tau).toBeCloseTo(0.5, 14);
    }
    expect(() => brownianImpulse(tr, NaN)).toThrow();
    expect(() => brownianImpulse(tr, 1, 0)).toThrow();
  });
  it('preserves deterministic seeds, direct-seek reconstruction and independent histories', () => {
    const a = track(p, BROWNIAN.seed),
      b = track(p, BROWNIAN.seed),
      other = track(p, BROWNIAN.seed + 1);
    expect(a).toEqual(b);
    expect(a.points.at(-1)).not.toEqual(other.points.at(-1));
    const positions = Array.from({ length: 169 }, (_, i) => sample(a, i / 42));
    for (let i = 168; i >= 0; i--) expect(sample(b, i / 42)).toEqual(positions[i]);
  });
  it('one path is not the ensemble mean; framing contains all modeled physical radii', () => {
    const film = brownianFilm(),
      stats = statistics(film.ensemble, 4),
      extent = brownianExtent(film.ensemble);
    expect(stats.msd).toBeGreaterThan(stats.x ** 2 + stats.y ** 2);
    expect(Math.hypot(stats.samples[0].x - stats.x, stats.samples[0].y - stats.y)).toBeGreaterThan(
      1e-7,
    );
    for (const tr of film.ensemble)
      for (const s of tr.points)
        expect(Math.hypot(s.x, s.y) + tr.parameters.radius).toBeLessThan(extent);
    expect(brownianShot(6, 1).time).toBe(brownianShot(7, 0).time);
    for (let i = 0; i < 8; i++) expect(brownianShot(i, 0)).toEqual(brownianShot(i, -1));
  });
  it('rejects invalid physical inputs and unbounded allocations', () => {
    expect(() => coefficients({ ...p, radius: 0 })).toThrow();
    expect(() => coefficients({ ...p, viscosity: 0 })).toThrow();
    expect(() => coefficients({ ...p, temperature: -1 })).toThrow();
    expect(() => track(p, 1, 2, 1e6)).toThrow();
    expect(() => sample(track(p, 1), NaN)).toThrow();
    expect(() => msd(p, -1)).toThrow();
    expect(() => brownianShot(0, NaN)).toThrow();
  });
});
