import { describe, expect, it } from 'vitest';
import {
  acceptance,
  bitSignal,
  criticalAngle,
  dielectric,
  FIBER,
  fiberShot,
  flightTime,
  traceFiber,
} from './fiber';
describe('guided light', () => {
  it('obeys Snell and Fresnel at normal, oblique, critical and equal-index boundaries', () => {
    expect(dielectric(1.5, 1, 0).reflectance).toBeCloseTo(0.04, 12);
    const angle = Math.PI / 6,
      d = dielectric(1.5, 1, angle);
    expect(Math.sin(d.transmitted!)).toBeCloseTo(1.5 * Math.sin(angle), 12);
    expect(d.reflectance + d.transmittance).toBe(1);
    const critical = criticalAngle(1.5, 1)!;
    expect(dielectric(1.5, 1, critical - 1e-7).tir).toBe(false);
    expect(dielectric(1.5, 1, critical + 1e-7).tir).toBe(true);
    expect(criticalAngle(1, 1.5)).toBeNull();
    expect(dielectric(1.48, 1.48, 1.5).reflectance).toBe(0);
  });
  it('matches the acceptance-cone condition to side-wall guidance', () => {
    const limit = (acceptance().angle * 180) / Math.PI;
    expect(traceFiber(limit - 0.01).tir).toBe(true);
    expect(traceFiber(limit + 0.01).tir).toBe(false);
    expect(acceptance(1.48, 1.48).na).toBe(0);
  });
  it('keeps every retained segment joined to the real wall, preserves symmetry and conserves power', () => {
    for (const angle of [0, 3, 9, 15, 25, 50, -9, -25]) {
      const ray = traceFiber(angle),
        retained = ray.segments.filter((s) => !s.escaped);
      expect(retained.at(-1)!.b.x).toBeCloseTo(FIBER.length, 8);
      expect(ray.escapedPower + ray.transmittedPower).toBeCloseTo(1, 12);
      retained.slice(1).forEach((segment, i) => {
        expect(segment.a).toEqual(retained[i].b);
        expect(Math.abs(segment.a.y)).toBeCloseTo(FIBER.radius, 10);
      });
      const sum = retained.reduce((v, s) => v + Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y), 0);
      expect(sum).toBeCloseTo(ray.distance, 8);
      expect(traceFiber(-angle).transmittedPower).toBeCloseTo(ray.transmittedPower, 12);
    }
    expect(traceFiber(9, 1.48).transmittedPower).toBe(0);
  });
  it('relates longer paths to delayed arrivals and reconstructs the received bit sequence', () => {
    const axial = flightTime(1000, 0),
      oblique = flightTime(1000, 8);
    expect(axial).toBeCloseTo((1000 * 1.48) / 299792458, 14);
    expect(oblique / axial).toBeCloseTo(1 / Math.cos((8 * Math.PI) / 180), 12);
    for (let i = 0; i < 8; i++) expect(bitSignal(i + 2.5, 2)).toBe(bitSignal(i + 0.5));
    expect(bitSignal(-1)).toBe(0);
    expect(bitSignal(10)).toBe(0);
  });
  it('seeks causal states directly and rejects non-finite geometry', () => {
    expect(fiberShot(2, 0).interfaceAngle).toBeLessThan((criticalAngle(1.5, 1)! * 180) / Math.PI);
    expect(fiberShot(2, 1).interfaceAngle).toBeGreaterThan(
      (criticalAngle(1.5, 1)! * 180) / Math.PI,
    );
    expect(fiberShot(5, 1).cladding).toBe(1.48);
    expect(fiberShot(6, 0.5).medium).toBe('pulse');
    expect(() => traceFiber(NaN)).toThrow();
    expect(() => traceFiber(10, 1.46, Infinity)).toThrow();
    expect(() => dielectric(0, 1, 0.3)).toThrow();
    expect(() => flightTime(-1, 8)).toThrow();
  });
});
