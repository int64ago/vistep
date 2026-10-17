import { describe, it, expect } from 'vitest';
import {
  aberrationRay,
  aberrationBestScreen,
  aberrationSpot,
  aberrationSurface,
} from './spherical-aberration';
describe('exact spherical and parabolic mirror tracing', () => {
  it('matches an independent analytic spherical axial-intercept formula', () => {
    for (const r of [1, 10, 20, 30, 40])
      expect(aberrationRay(r).axisAt).toBeCloseTo(10000 / (2 * Math.sqrt(10000 - r * r)) - 100, 10);
    expect(aberrationRay(0.001).axisAt).toBeCloseTo(-50, 7);
    expect(aberrationRay(40).axisAt!).toBeGreaterThan(aberrationRay(10).axisAt!);
  });
  it('conserves direction length and flips the normal component while preserving tangential direction', () => {
    for (const r of [4, 17, 35])
      for (const az of [0, 1, 2]) {
        const ray = aberrationRay(r, az, { angle: 3 }),
          dot = (v: number[]) => v.reduce((s, d, i) => s + d * ray.normal[i], 0);
        expect(Math.hypot(...ray.outgoing)).toBeCloseTo(1, 12);
        expect(dot(ray.outgoing)).toBeCloseTo(-dot(ray.incoming), 12);
        for (let i = 0; i < 3; i++)
          expect(ray.outgoing[i] - dot(ray.outgoing) * ray.normal[i]).toBeCloseTo(
            ray.incoming[i] - dot(ray.incoming) * ray.normal[i],
            12,
          );
      }
  });
  it('focuses all on-axis parabolic rays at the exact focal point, including full3D pupil samples', () => {
    for (const r of [1, 10, 25, 40])
      expect(aberrationRay(r, 0, { correction: 1 }).axisAt).toBeCloseTo(-50, 10);
    const p = aberrationSpot(-50, { correction: 1 });
    expect(p.rms).toBeLessThan(1e-12);
  });
  it('finds an actual minimum receiving plane without claiming a zero spherical spot', () => {
    const z = aberrationBestScreen(),
      spot = (z: number) => aberrationSpot(z, {}, 128, 20).rms;
    expect(spot(z)).toBeGreaterThan(0.1);
    expect(spot(z)).toBeLessThan(spot(z - 0.1));
    expect(spot(z)).toBeLessThan(spot(z + 0.1));
  });
  it('reduces geometric blur by stopping down while accepted area falls quadratically', () => {
    const full = aberrationSpot(aberrationBestScreen()),
      small = aberrationSpot(aberrationBestScreen({ aperture: 10 }), { aperture: 10 });
    expect(small.rms).toBeLessThan(full.rms / 20);
    expect(small.throughput).toBe(0.0625);
  });
  it('retains off-axis aberration after on-axis spherical correction', () => {
    expect(aberrationSpot(-50, { correction: 1, angle: 3 }).rms).toBeGreaterThan(0.2);
    expect(() => aberrationSurface(50)).toThrow(RangeError);
  });
});
