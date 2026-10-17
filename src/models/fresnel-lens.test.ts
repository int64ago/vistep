import { describe, it, expect } from 'vitest';
import {
  fresnelDesign,
  fresnelRay,
  fresnelSurface,
  fresnelConstant,
  fresnelVolume,
  fresnelProfile,
} from './fresnel-lens';
describe('curved refracting Fresnel facets', () => {
  it('focuses independently refracted rays from every annulus, not imposed output directions', () => {
    for (const F of [80, 100, 160])
      for (const pitch of [1, 3, 5]) {
        const s = fresnelDesign({ focal: F, pitch });
        for (let r = 0.31; r < 30; r += 0.71) {
          const ray = fresnelRay(r, s);
          expect(ray.outgoing).not.toBeNull();
          expect(ray.axisAt).toBeCloseTo(F, 8);
          const sinIn = ray.normal.r,
            sinOut = Math.abs(ray.outgoing!.r * ray.normal.z - ray.outgoing!.z * ray.normal.r);
          expect(sinOut).toBeCloseTo(s.n * Math.abs(sinIn), 10);
        }
      }
  });
  it('satisfies equal optical path within each ring, with a derivative independent finite difference', () => {
    const s = fresnelDesign();
    for (const r of [1.2, 7.3, 16.4, 28.1]) {
      const p = fresnelSurface(r, s),
        dr = 1e-4;
      expect(s.n * p.z + Math.hypot(r, s.F - p.z)).toBeCloseTo(p.K, 10);
      const derivative = (fresnelSurface(r + dr, s).z - fresnelSurface(r - dr, s).z) / (2 * dr);
      expect(p.slope).toBeCloseTo(derivative, 7);
    }
  });
  it('has no refractive focusing when surrounding and material indices match', () => {
    const s = fresnelDesign(),
      ray = fresnelRay(22, s, false, s.n);
    expect(ray.outgoing!.r).toBeCloseTo(0, 12);
    expect(ray.outgoing!.z).toBeCloseTo(1, 12);
    expect(ray.axisAt).toBeNull();
  });
  it('distinguishes same geometric focus from equal phase across rings', () => {
    const s = fresnelDesign();
    expect(fresnelConstant(5, s) - fresnelConstant(1, s)).toBeGreaterThan(1);
    expect(fresnelRay(16.1, s).axisAt).toBeCloseTo(fresnelRay(4.1, s).axisAt!, 9);
  });
  it('integrates real rotational volume, agrees with independent midpoint quadrature, and retains positive thickness', () => {
    const s = fresnelDesign();
    const midpoint = (continuous: boolean) => {
      let sum = 0;
      const dr = s.R / 60000;
      for (let i = 0; i < 60000; i++) {
        const r = (i + 0.5) * dr;
        sum += (2 * Math.PI * r * fresnelSurface(r, s, continuous).z * dr) / 1000;
      }
      return sum;
    };
    const thin = fresnelVolume(s),
      full = fresnelVolume(s, true);
    expect(thin).toBeCloseTo(midpoint(false), 4);
    expect(full).toBeCloseTo(midpoint(true), 6);
    expect(thin / full).toBeLessThan(0.5);
    for (const p of fresnelProfile(s)) expect(p.z).toBeGreaterThan(0);
    expect(fresnelRay(12.3, s, true).axisAt).toBeCloseTo(s.F, 9);
  });
  it('rejects invalid designs and outside-aperture probes', () => {
    expect(() => fresnelDesign({ pitch: 0 })).toThrow(RangeError);
    expect(() => fresnelDesign({ focal: 0 })).toThrow(RangeError);
    expect(() => fresnelSurface(31, fresnelDesign())).toThrow(RangeError);
  });
});
