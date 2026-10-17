import { describe, it, expect } from 'vitest';
import { angularMomentumDefaults, angularMomentumState, angularRadius } from './angular-momentum';
describe('radial sliders and angular momentum', () => {
  it('checks independent endpoint values with equal-and-opposite sliders', () => {
    const p = angularMomentumDefaults(),
      s = angularMomentumState(p, 3);
    expect(s.initialInertia).toBeCloseTo(1.145, 12);
    expect(s.inertia).toBeCloseTo(0.425, 12);
    expect(s.momentum).toBeCloseTo(2.29, 12);
    expect(s.omega).toBeCloseTo(2.29 / 0.425, 12);
    expect(s.radialEnergy).toBeCloseTo(0, 12);
  });
  it('conserves axial momentum throughout arbitrary prescribed radial travel', () => {
    for (const endRadius of [0.25, 0.45, 0.65])
      for (let time = 0; time <= 4; time += 0.13) {
        const s = angularMomentumState({ ...angularMomentumDefaults(), endRadius }, time);
        expect(s.inertia * s.omega).toBeCloseTo(2.29, 11);
      }
  });
  it('has endpoint velocity and acceleration zero and continuous radius after travel', () => {
    const p = angularMomentumDefaults();
    for (const t of [0, 3, 4]) {
      const q = angularRadius(p, t);
      expect(q.velocity).toBeCloseTo(0, 12);
      expect(q.acceleration).toBeCloseTo(0, 12);
    }
    expect(angularRadius(p, 4).radius).toBeCloseTo(0.25, 12);
  });
  it('independently integrates internal force work including radial kinetic energy', () => {
    for (const externalTorque of [0, -0.35, 0.2]) {
      const p = { ...angularMomentumDefaults(), externalTorque },
        T = 2.4,
        N = 800,
        dt = T / N;
      let work = 0;
      for (let i = 0; i <= N; i++) {
        const q = angularRadius(p, i * dt),
          I = p.baseInertia + 2 * p.mass * q.radius ** 2,
          L =
            (p.baseInertia + 2 * p.mass * p.startRadius ** 2) * p.initialSpeed +
            externalTorque * i * dt,
          w = L / I,
          F = p.mass * (q.acceleration - q.radius * w * w);
        work += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * 2 * F * q.velocity;
      }
      const s = angularMomentumState(p, T);
      expect((work * dt) / 3).toBeCloseTo(s.internalWork, 7);
    }
  });
  it('tracks external angular impulse without relabeling it conservation', () => {
    const p = { ...angularMomentumDefaults(), endRadius: 0.65, externalTorque: -0.35 },
      s = angularMomentumState(p, 4);
    expect(s.momentum).toBeCloseTo(0.89, 12);
    expect(s.internalWork).toBeCloseTo(0, 9);
    expect(s.energy - s.initialEnergy).toBeCloseTo(s.externalWork, 9);
  });
  it('angle derivative equals instantaneous speed; inward work is positive at rest endpoints', () => {
    const p = angularMomentumDefaults(),
      dt = 1e-4,
      s = angularMomentumState(p, 1.3);
    expect(
      (angularMomentumState(p, 1.3 + dt).angle - angularMomentumState(p, 1.3 - dt).angle) /
        (2 * dt),
    ).toBeCloseTo(s.omega, 6);
    expect(angularMomentumState(p, 3).internalWork).toBeGreaterThan(3.8);
  });
});
