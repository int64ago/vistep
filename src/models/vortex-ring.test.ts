import { describe, expect, it } from 'vitest';
import { ellipticKE, vortexRing, vortexField, vortexTrail, vortexMarker } from './vortex-ring';
describe('Regularized circular vortex filament', () => {
  it('matches independent complete elliptic integral reference values', () => {
    const e = ellipticKE(0.5);
    expect(e.K).toBeCloseTo(1.854074677301372, 13);
    expect(e.E).toBeCloseTo(1.350643881047676, 13);
  });
  it('matches a direct 4096-segment Biot–Savart integral away from and on the ring', () => {
    const R = 0.02,
      G = 0.001,
      a = 0.0024,
      n = 4096,
      dtheta = (2 * Math.PI) / n;
    for (const [x, y, z] of [
      [0.01, 0.015, 0.004],
      [0, R, 0],
      [0.03, -0.007, 0.01],
    ]) {
      let ux = 0,
        uy = 0,
        uz = 0;
      for (let i = 0; i < n; i++) {
        const th = (i + 0.5) * dtheta,
          c = Math.cos(th),
          s = Math.sin(th),
          rx = x,
          ry = y - R * c,
          rz = z - R * s,
          den = (rx * rx + ry * ry + rz * rz + a * a) ** 1.5,
          k = (G * R * dtheta) / (4 * Math.PI * den);
        ux += k * (-s * rz - c * ry);
        uy += k * c * rx;
        uz += k * s * rx;
      }
      const f = vortexField(x, y, z);
      expect(f.axial).toBeCloseTo(ux, 11);
      expect(f.vy).toBeCloseTo(uy, 11);
      expect(f.vz).toBeCloseTo(uz, 11);
    }
  });
  it('matches the independent axis formula and preserves circulation/radius scaling', () => {
    const a = vortexRing();
    for (const x of [0, 0.01, 0.05])
      expect(vortexField(x, 0).axial).toBeCloseTo(
        (0.001 * 0.02 ** 2) / (2 * (0.02 ** 2 + x * x + 0.0024 ** 2) ** 1.5),
        13,
      );
    expect(vortexRing({ circulation: 0.002 }).self / a.self).toBeCloseTo(2, 12);
    expect(vortexRing({ radius: 0.04 }).self / a.self).toBeCloseTo(0.5, 12);
  });
  it('is divergence free in cylindrical coordinates and reverses exactly with circulation', () => {
    const x = 0.007,
      r = 0.014,
      d = 1e-6,
      f = vortexField(x, r),
      ux = (vortexField(x + d, r).axial - vortexField(x - d, r).axial) / (2 * d),
      ru =
        ((r + d) * vortexField(x, r + d).radial - (r - d) * vortexField(x, r - d).radial) /
        (2 * d * r);
    expect(ux + ru).toBeCloseTo(0, 5);
    const b = vortexField(x, r, 0, { circulation: -0.001 });
    expect(b.axial).toBe(-f.axial);
    expect(b.radial).toBe(-f.radial);
  });
  it('integrates actual co-moving paths with step-size convergence and no closure snap', () => {
    const a = vortexTrail({ x: 0, y: 0.8 }, 0.12, 8, 0.02),
      b = vortexTrail({ x: 0, y: 0.8 }, 0.12, 8, 0.01),
      p = a.at(-1)!,
      q = b.at(-1)!;
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(1e-5);
    const t = 3,
      dt = 0.001,
      first = vortexMarker(a, t),
      second = vortexMarker(a, t + dt),
      f = vortexField(first.x, first.y, 0, { radius: 1, circulation: 1 }),
      self = vortexField(0, 1, 0, { radius: 1, circulation: 1 }).axial;
    expect((second.x - first.x) / dt).toBeCloseTo(f.axial - self, 2);
    expect(a[0].time).toBe(0);
  });
  it('keeps far laboratory fluid still and exposes the core-model dependence', () => {
    expect(Math.abs(vortexField(1, 0).axial)).toBeLessThan(1e-6);
    expect(vortexRing({ coreRatio: 0.08 }).self).toBeGreaterThan(
      vortexRing({ coreRatio: 0.2 }).self,
    );
    expect(vortexRing({ circulation: 0 }).self).toBe(0);
    expect(() => vortexRing({ radius: 0 })).toThrow(RangeError);
  });
});
