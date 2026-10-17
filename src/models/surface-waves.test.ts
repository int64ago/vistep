import { describe, it, expect } from 'vitest';
import { surfaceWave, surfaceParcel, surfaceElevation, surfaceBeat } from './surface-waves';
describe('finite-depth gravity wave', () => {
  it('matches independent deep/shallow analytical limits and numerical benchmark', () => {
    const d = surfaceWave({ wavelength: 6, depth: 100 });
    expect(d.c).toBeCloseTo(Math.sqrt((9.81 * 6) / (2 * Math.PI)), 10);
    expect(d.cg / d.c).toBeCloseTo(0.5, 12);
    const shallow = surfaceWave({ wavelength: 1000, depth: 1 });
    expect(shallow.c).toBeCloseTo(Math.sqrt(9.81), 4);
    expect(shallow.cg / shallow.c).toBeCloseTo(1, 4);
    expect(surfaceWave({ wavelength: 2 * Math.PI, depth: Math.log(3) / 2 }).omega).toBeCloseTo(
      Math.sqrt(4.905),
      12,
    );
  });
  it('satisfies bed impermeability, surface kinematics and linear dynamic boundary', () => {
    const o = { wavelength: 7, depth: 1.2, amplitude: 0.03 },
      s = surfaceWave(o),
      t = 0.43,
      x = 3.2,
      dt = 1e-5;
    expect(surfaceParcel(x, -o.depth, t, o).w).toBeCloseTo(0, 12);
    const etaT = (surfaceElevation(x, t + dt, o) - surfaceElevation(x, t - dt, o)) / (2 * dt);
    expect(surfaceParcel(x, 0, t, o).w).toBeCloseTo(etaT, 9);
    expect(s.omega ** 2 * Math.cosh(s.k * s.depth)).toBeCloseTo(
      9.81 * s.k * Math.sinh(s.k * s.depth),
      10,
    );
  });
  it('particle displacement derivatives agree with velocity and close only at first order', () => {
    const s = surfaceWave(),
      x = 4,
      z = -1,
      t = 0.4,
      d = 1e-5,
      a = surfaceParcel(x, z, t),
      b = surfaceParcel(x, z, t + d),
      c = surfaceParcel(x, z, t - d),
      end = surfaceParcel(x, z, t + s.period);
    expect((b.x - c.x) / (2 * d)).toBeCloseTo(a.u, 9);
    expect((b.z - c.z) / (2 * d)).toBeCloseTo(a.w, 9);
    expect(end.x).toBeCloseTo(a.x, 12);
    expect(end.z).toBeCloseTo(a.z, 12);
    expect(a.dx ** 2 / a.a ** 2 + a.dz ** 2 / a.b ** 2).toBeCloseTo(1, 12);
  });
  it('deep orbital decay and shallow flattened orbit are genuinely different', () => {
    const deep = surfaceParcel(2, -3, 0, { depth: 100, wavelength: 6 });
    expect(deep.a / deep.b).toBeCloseTo(1, 12);
    expect(deep.a / 0.06).toBeCloseTo(Math.exp(-Math.PI), 10);
    const bed = surfaceParcel(2, -0.6, 0, { depth: 0.6, wavelength: 12 });
    expect(bed.b).toBe(0);
    expect(bed.a).toBeGreaterThan(0.15);
  });
  it('analytic group velocity matches independent numerical derivative and exact beat peaks', () => {
    for (const depth of [0.6, 2, 6]) {
      const s = surfaceWave({ depth }),
        dk = s.k * 1e-5,
        om = (k: number) => Math.sqrt(9.81 * k * Math.tanh(k * depth));
      expect((om(s.k + dk) - om(s.k - dk)) / (2 * dk)).toBeCloseTo(s.cg, 8);
      const b = surfaceBeat(0, 0, { depth }),
        t = 0.3,
        peak = surfaceBeat(b.origin + b.group * t, t, { depth });
      expect(peak.envelope).toBeCloseTo(s.amplitude, 12);
      expect(peak.sum).toBeCloseTo(peak.one + peak.two, 12);
    }
    expect(surfaceWave({ depth: 6 }).cg / surfaceWave({ depth: 6 }).c).toBeLessThan(0.51);
    expect(
      surfaceWave({ depth: 0.6, wavelength: 12 }).cg /
        surfaceWave({ depth: 0.6, wavelength: 12 }).c,
    ).toBeGreaterThan(0.96);
  });
  it('zero amplitude stops parcels but not dispersion; invalid domains reject', () => {
    const stopped = surfaceParcel(4, -1, 3, { amplitude: 0 });
    expect(stopped.x).toBe(4);
    expect(stopped.z).toBe(-1);
    expect(stopped.u).toBeCloseTo(0, 12);
    expect(stopped.w).toBeCloseTo(0, 12);
    expect(surfaceWave({ amplitude: 0 }).c).toBe(surfaceWave().c);
    expect(() => surfaceWave({ depth: 0 })).toThrow();
    expect(() => surfaceParcel(0, -4, 0)).toThrow();
  });
});
