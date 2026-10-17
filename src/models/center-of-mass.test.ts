import { describe, it, expect } from 'vitest';
import { centerMassDefaults, centerMassState } from './center-of-mass';
describe('internally moving cargo', () => {
  it('matches independent displacement balance for120kg platform and60kg cargo', () => {
    const s = centerMassState(centerMassDefaults(), 3);
    expect(s.platformDisplacement).toBeCloseTo(-1.6 / 3, 12);
    expect(s.cargoDisplacement).toBeCloseTo(3.2 / 3, 12);
    expect(s.center).toBeCloseTo(-0.8 / 3, 12);
    expect(s.cargo - s.platform).toBeCloseTo(0.8, 12);
  });
  it('mass-weighted positions equal the calculated center for multiple masses and times', () => {
    for (const cargoMass of [30, 60, 120])
      for (const externalForce of [0, 36])
        for (let t = 0; t < 3.5; t += 0.11) {
          const p = { ...centerMassDefaults(), cargoMass, externalForce, initialSpeed: 0.35 },
            s = centerMassState(p, t);
          expect((p.platformMass * s.platform + p.cargoMass * s.cargo) / s.mass).toBeCloseTo(
            s.center,
            11,
          );
          expect(s.momentum).toBeCloseTo(s.mass * 0.35 + externalForce * t, 10);
        }
  });
  it('internal forces cancel in the acceleration of the system', () => {
    const p = { ...centerMassDefaults(), externalForce: 36 },
      s = centerMassState(p, 1.1);
    expect(p.platformMass * s.platformAcceleration).toBeCloseTo(
      p.externalForce - s.internalForce,
      10,
    );
    expect(p.cargoMass * s.cargoAcceleration).toBeCloseTo(s.internalForce, 10);
    expect(p.platformMass * s.platformAcceleration + p.cargoMass * s.cargoAcceleration).toBeCloseTo(
      36,
      10,
    );
  });
  it('zero external force preserves a moving center rather than fixing it', () => {
    const p = { ...centerMassDefaults(), initialSpeed: 0.35 },
      s = centerMassState(p, 3);
    expect(s.centerDisplacement).toBeCloseTo(1.05, 12);
    expect(s.centerVelocity).toBe(0.35);
    expect(s.platformVelocity).toBeCloseTo(0.35, 12);
    expect(s.cargoVelocity).toBeCloseTo(0.35, 12);
  });
  it('external resultant causes the independent constant-acceleration displacement', () => {
    const s = centerMassState({ ...centerMassDefaults(), externalForce: 36 }, 3);
    expect(s.acceleration).toBeCloseTo(0.2, 12);
    expect(s.centerDisplacement).toBeCloseTo(0.9, 12);
    expect(s.centerVelocity).toBeCloseTo(0.6, 12);
  });
  it('positions and velocities are derivatives of the same smooth internal trajectory', () => {
    const p = centerMassDefaults(),
      t = 1.3,
      h = 1e-4,
      s = centerMassState(p, t),
      a = centerMassState(p, t - h),
      b = centerMassState(p, t + h);
    for (const key of ['platform', 'cargo'] as const) {
      expect((b[key] - a[key]) / (2 * h)).toBeCloseTo(s[`${key}Velocity`], 7);
      expect((b[`${key}Velocity`] - a[`${key}Velocity`]) / (2 * h)).toBeCloseTo(
        s[`${key}Acceleration`],
        7,
      );
    }
    expect(centerMassState(p, 3).relativeVelocity).toBeCloseTo(0, 12);
  });
});
