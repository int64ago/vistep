import { describe, expect, it } from 'vitest';
import { viscosityLayers, layerVelocity, couetteStart } from './viscosity-layers';
describe('Layered shear and momentum diffusion', () => {
  it('matches independent two-fluid Couette values and no slip', () => {
    const s = viscosityLayers();
    expect(s.shear).toBeCloseTo(0.16, 12);
    expect(s.interfaceSpeed).toBeCloseTo(0.008, 12);
    expect(layerVelocity(0)).toBe(0);
    expect(layerVelocity(0.01)).toBeCloseTo(0.01, 12);
  });
  it('preserves interface velocity and actual shear stress on both sides', () => {
    const s = viscosityLayers(),
      dy = 1e-8,
      lo = layerVelocity(s.h1 - dy),
      at = layerVelocity(s.h1),
      hi = layerVelocity(s.h1 + dy);
    expect(((at - lo) / dy) * s.lowerViscosity).toBeCloseTo(s.shear, 8);
    expect(((hi - at) / dy) * s.upperViscosity).toBeCloseTo(s.shear, 8);
  });
  it('independently integrates dissipation to the plate power input', () => {
    const o = { lowerSpeed: -0.003, upperSpeed: 0.01, fraction: 0.4 },
      s = viscosityLayers(o),
      n = 10000,
      dy = s.height / n;
    let power = 0;
    for (let i = 0; i < n; i++) {
      const y = (i + 0.5) * dy,
        mu = y < s.h1 ? s.lowerViscosity : s.upperViscosity,
        gradient = (layerVelocity(y + dy / 4, o) - layerVelocity(y - dy / 4, o)) / (dy / 2);
      power += mu * gradient ** 2 * dy;
    }
    expect(power).toBeCloseTo(s.power, 10);
    expect(s.power).toBeGreaterThan(0);
  });
  it('distinguishes gap, layer order and rigid translation', () => {
    const a = viscosityLayers(),
      b = viscosityLayers({ height: 0.02 }),
      swap = viscosityLayers({ lowerViscosity: 0.4, upperViscosity: 0.1 });
    expect(b.shear / a.shear).toBeCloseTo(0.5, 12);
    expect(swap.shear).toBe(a.shear);
    expect(swap.interfaceSpeed).toBeCloseTo(0.002, 12);
    const rigid = viscosityLayers({ lowerSpeed: 0.01 });
    expect(rigid.shear).toBe(0);
    expect(rigid.power).toBe(0);
    expect(layerVelocity(0.003, { lowerSpeed: 0.01 })).toBe(0.01);
  });
  it('recovers the startup diffusion PDE and momentum balance independently', () => {
    const y = 0.004,
      t = 0.08,
      dy = 1e-6,
      dt = 1e-5,
      u = couetteStart(y, t),
      ut = (couetteStart(y, t + dt).velocity - couetteStart(y, t - dt).velocity) / (2 * dt),
      uyy =
        (couetteStart(y + dy, t).velocity - 2 * u.velocity + couetteStart(y - dy, t).velocity) /
        dy ** 2;
    expect(ut).toBeCloseTo(0.0001 * uyy, 6);
    let momentumRate = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      const z = ((i + 0.5) * 0.01) / n;
      momentumRate +=
        (((1000 * (couetteStart(z, t + dt).velocity - couetteStart(z, t - dt).velocity)) /
          (2 * dt)) *
          0.01) /
        n;
    }
    expect(momentumRate).toBeCloseTo(u.topShear! - u.bottomShear, 6);
    const displacementRate =
      (couetteStart(y, t + dt).displacement - couetteStart(y, t - dt).displacement) / (2 * dt);
    expect(displacementRate).toBeCloseTo(u.velocity, 7);
  });
  it('keeps startup boundary/long-time limits and rejects invalid cases', () => {
    expect(couetteStart(0, 0.1).velocity).toBeCloseTo(0, 12);
    expect(couetteStart(0.01, 0.1).velocity).toBeCloseTo(0.01, 12);
    expect(couetteStart(0.004, 2).velocity).toBeCloseTo(0.004, 8);
    for (const o of [{ height: 0 }, { fraction: 1 }, { lowerViscosity: -1 }])
      expect(() => viscosityLayers(o)).toThrow(RangeError);
  });
});
