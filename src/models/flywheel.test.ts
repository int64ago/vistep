import { describe, it, expect } from 'vitest';
import {
  flywheelDefaults,
  flywheelGeometry,
  flywheelPeriodic,
  flywheelCoast,
  flywheelStart,
} from './flywheel';
describe('flywheel mass geometry, energy and time', () => {
  it('matches the independent solid-disc limit and preserves mass when moved outward', () => {
    const p = { ...flywheelDefaults(), inner: 0 },
      g = flywheelGeometry(p);
    expect(g.inertia).toBe(0.625);
    const ring = { ...p, inner: 0.21 },
      r = flywheelGeometry(ring);
    expect(r.inertia).toBeCloseTo(1.066);
    expect(r.thickness * Math.PI * (ring.outer ** 2 - ring.inner ** 2) * ring.density).toBeCloseTo(
      20,
    );
    expect(r.thickness).toBeGreaterThan(g.thickness);
  });
  it('returns to the same speed and energy with exact mean angular advance per period', () => {
    const p = flywheelDefaults(),
      a = flywheelPeriodic(p, 0),
      b = flywheelPeriodic(p, p.period);
    expect(b.omega).toBeCloseTo(a.omega);
    expect(b.energy).toBeCloseTo(a.energy);
    expect(b.angle).toBeCloseTo(p.meanSpeed * p.period);
  });
  it('agrees with independent numerical torque-work quadrature through both half-cycles', () => {
    const p = flywheelDefaults(),
      h = 0.0002;
    for (const end of [0.7, 1.5, 2]) {
      let input = 0,
        load = 0;
      for (let t = h / 2; t < end; t += h) {
        const s = flywheelPeriodic(p, t);
        input += s.driveTorque * s.omega * h;
        load += s.loadTorque * s.omega * h;
      }
      const s = flywheelPeriodic(p, end);
      expect(s.inputWork).toBeCloseTo(input, 4);
      expect(s.loadWork).toBeCloseTo(load, 4);
      expect(s.energy - s.initialEnergy).toBeCloseTo(input - load, 4);
    }
  });
  it('derives actual angle velocity and kinetic-energy rate from the same torque', () => {
    const p = flywheelDefaults(),
      h = 1e-5,
      s = flywheelPeriodic(p, 0.4),
      a = flywheelPeriodic(p, 0.4 - h),
      b = flywheelPeriodic(p, 0.4 + h);
    expect((b.angle - a.angle) / (2 * h)).toBeCloseTo(s.omega, 7);
    expect((b.energy - a.energy) / (2 * h)).toBeCloseTo(s.power, 5);
  });
  it('larger inertia reduces ripple at the same mean speed and programmed torque', () => {
    const p = flywheelDefaults(),
      a = flywheelGeometry(p),
      b = flywheelGeometry({ ...p, inner: 0.21 });
    expect(b.ripple).toBeLessThan(a.ripple);
    expect(a.ripple * a.inertia).toBeCloseTo(b.ripple * b.inertia);
  });
  it('coasts to a finite stop and delivers only its initial stored energy', () => {
    const p = flywheelDefaults(),
      a = flywheelCoast(p, 0),
      s = flywheelCoast(p, 2 * a.stopTime);
    expect(s.omega).toBe(0);
    expect(s.energy).toBe(0);
    expect(s.loadWork).toBeCloseTo(s.initialEnergy);
    expect(s.inputWork).toBe(0);
    expect(flywheelCoast(p, 3 * a.stopTime).angle).toBe(s.angle);
  });
  it('same starting torque accelerates larger inertia less and obeys work-energy', () => {
    const p = flywheelDefaults(),
      a = flywheelStart(p, 0.5),
      b = flywheelStart({ ...p, inner: 0.21 }, 0.5);
    expect(b.omega).toBeLessThan(a.omega);
    expect(a.energy).toBeCloseTo(a.inputWork);
    expect(() => flywheelGeometry({ ...p, inner: p.outer })).toThrow();
  });
});
