import { describe, expect, it } from 'vitest';
import {
  venturi,
  venturiConstants,
  venturiFlowFromDifference,
  venturiProfile,
  venturiMarker,
  venturiPressure,
} from './venturi-meter';
describe('Venturi inverse meter and connected manometer', () => {
  it('matches independently computed 50/25 mm,1 L/s benchmark', () => {
    const s = venturi({ flow: 0.001 });
    expect(s.velocity1).toBeCloseTo(0.5092958179, 9);
    expect(s.velocity2).toBeCloseTo(2.037183272, 9);
    expect(s.difference).toBeCloseTo(1945.3667, 3);
    expect(s.measured).toBeCloseTo(0.001, 14);
  });
  it('closes the two-liquid U-tube hydrostatic path and conserves dense-liquid levels', () => {
    const s = venturi(),
      left = -0.1 - s.height / 2,
      right = -0.1 + s.height / 2,
      rho = venturiConstants.density,
      rhom = venturiConstants.manometerDensity,
      g = 9.81;
    expect(s.wideGauge + rho * g * -left - (s.throatGauge + rho * g * -right)).toBeCloseTo(
      rhom * g * (right - left),
      10,
    );
    expect(left + right).toBeCloseTo(-0.2, 14);
  });
  it('has quadratic differential calibration and cannot distinguish flow direction alone', () => {
    const a = venturi({ flow: 0.0005 }),
      b = venturi({ flow: 0.001 }),
      c = venturi({ flow: -0.001 });
    expect(b.difference / a.difference).toBe(4);
    expect(c.difference).toBe(b.difference);
    expect(c.measured).toBe(b.measured);
    expect(c.velocity2).toBe(-b.velocity2);
  });
  it('independently checks volume-coordinate travel against the local axial velocity', () => {
    const profile = venturiProfile(),
      flow = 0.0008,
      dt = 1e-7;
    for (const seed of [0.15, 0.38, 0.48, 0.68, 0.83]) {
      const a = venturiMarker(profile, flow, 0, seed),
        b = venturiMarker(profile, flow, dt, seed);
      expect(Math.abs((b.x - a.x) / dt / a.velocity - 1)).toBeLessThan(0.003);
    }
    expect(venturiMarker(profile, 0, 15, 0.4).x).toBe(venturiMarker(profile, 0, 0, 0.4).x);
  });
  it('preserves mechanical energy and recovers ideal static pressure at the wide exit', () => {
    const s = venturi();
    for (let x = 0; x <= 0.65; x += 0.01) {
      const p = venturiPressure(x);
      expect(p.pressure + p.kinetic).toBeCloseTo(s.total, 10);
    }
    expect(venturiPressure(0.6).pressure).toBeCloseTo(s.wideGauge, 10);
    expect(venturi({ flow: 0 }).height).toBe(0);
  });
  it('keeps the exposed range positive-pressure and rejects invalid inverse data', () => {
    expect(venturi({ flow: 0.001, throat: 0.02 }).throatGauge).toBeGreaterThan(0);
    for (const o of [{ flow: 0.002 }, { throat: 0.01 }, { flow: NaN }])
      expect(() => venturi(o)).toThrow(RangeError);
    expect(() => venturiFlowFromDifference(-1)).toThrow(RangeError);
  });
});
