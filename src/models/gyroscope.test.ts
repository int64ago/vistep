import { describe, it, expect } from 'vitest';
import { gyroscopeDefaults, gyroscopeState } from './gyroscope';
const dot = (a: { x: number; y: number; z: number }, b: typeof a) =>
  a.x * b.x + a.y * b.y + a.z * b.z;
describe('horizontal steady gyroscope', () => {
  it('has the independently calculated thin-disk inertia and precession', () => {
    const s = gyroscopeState(gyroscopeDefaults(), 0);
    expect(s.axial).toBeCloseTo(0.0162, 12);
    expect(s.precession).toBeCloseTo(2.1582 / 1.944, 12);
    expect(s.transverse).toBeCloseTo(0.0565, 12);
  });
  it('satisfies dL/dt = r cross gravity including transverse angular momentum', () => {
    const p = gyroscopeDefaults(),
      dt = 1e-5;
    for (const time of [0.1, 0.8, 2, 4]) {
      const a = gyroscopeState(p, time - dt),
        s = gyroscopeState(p, time),
        b = gyroscopeState(p, time + dt);
      for (const k of ['x', 'y', 'z'] as const)
        expect((b.momentum[k] - a.momentum[k]) / (2 * dt)).toBeCloseTo(s.torque[k], 8);
      expect(s.torque.x).toBeCloseTo(s.center.z * p.mass * p.gravity, 12);
      expect(s.torque.z).toBeCloseTo(-s.center.x * p.mass * p.gravity, 12);
    }
  });
  it('has support reaction consistent with circular center acceleration', () => {
    const p = gyroscopeDefaults(),
      s = gyroscopeState(p, 1),
      dt = 1e-4,
      a = gyroscopeState(p, 1 - dt),
      b = gyroscopeState(p, 1 + dt);
    expect(s.reaction.y).toBe(p.mass * p.gravity);
    for (const k of ['x', 'z'] as const)
      expect((p.mass * (a.center[k] - 2 * s.center[k] + b.center[k])) / (dt * dt)).toBeCloseTo(
        s.reaction[k],
        6,
      );
  });
  it('torque changes direction of total momentum without work in steady motion', () => {
    const p = gyroscopeDefaults();
    for (let t = 0; t < 5; t += 0.1) {
      const s = gyroscopeState(p, t);
      expect(dot(s.momentum, s.torque)).toBeCloseTo(0, 12);
      expect(
        dot(s.torque, { x: s.spin * s.axis.x, y: s.precession, z: s.spin * s.axis.z }),
      ).toBeCloseTo(0, 10);
      expect(s.energy).toBe(gyroscopeState(p, 0).energy);
    }
  });
  it('doubling spin halves precession and reversing spin reverses it', () => {
    const p = gyroscopeDefaults(),
      a = gyroscopeState(p, 1),
      b = gyroscopeState({ ...p, spin: 240 }, 1),
      c = gyroscopeState({ ...p, spin: -120 }, 1);
    expect(b.precession).toBeCloseTo(a.precession / 2, 12);
    expect(c.precession).toBe(-a.precession);
    expect(c.axis.z).toBeCloseTo(-a.axis.z, 12);
  });
  it('zero gravity fixes direction but permits spin; excludes singular no-spin state', () => {
    const p = { ...gyroscopeDefaults(), gravity: 0 },
      a = gyroscopeState(p, 0),
      b = gyroscopeState(p, 3);
    expect(b.axis).toEqual(a.axis);
    expect(b.spinAngle).toBe(360);
    expect(b.torqueMagnitude).toBe(0);
    expect(() => gyroscopeState({ ...p, spin: 0 }, 1)).toThrow();
  });
});
