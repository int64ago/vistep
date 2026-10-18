import { describe, expect, it } from 'vitest';
import {
  ELEMENTARY_CHARGE,
  ELECTRON_MASS,
  acceleratedSpeed,
  magneticTrajectory,
  isotopeRadius,
  positronTrack,
  relativisticRadius,
} from './charged-particle-lab';
describe('charged-particle paths', () => {
  it('preserves speed and returns to the launch point after one cyclotron period', () => {
    const field = 0.001,
      speed = acceleratedSpeed(200),
      period = (2 * Math.PI * ELECTRON_MASS) / (ELEMENTARY_CHARGE * field);
    const p = magneticTrajectory({ field, speed, time: period });
    expect(Math.hypot(p.x, p.y)).toBeLessThan(1e-12);
    expect(Math.hypot(p.vx, p.vy, p.vz)).toBeCloseTo(speed, 6);
    expect(p.radius).toBeCloseTo((ELECTRON_MASS * speed) / (ELEMENTARY_CHARGE * field), 12);
  });
  it('gives a straight path for zero field and no force for parallel motion', () => {
    expect(magneticTrajectory({ field: 0, speed: 1e6, time: 1e-8 }).x).toBeCloseTo(0.01, 12);
    expect(magneticTrajectory({ field: 0.1, speed: 1e6, angle: 0, time: 1e-8 }).z).toBeCloseTo(
      0.01,
      12,
    );
    expect(magneticTrajectory({ field: 0.1, speed: 1e6, angle: 0, time: 1e-8 }).radius).toBe(0);
  });
  it('separates equal-charge isotopes by sqrt(m) at equal voltage', () => {
    expect(isotopeRadius(22).radius / isotopeRadius(20).radius).toBeCloseTo(Math.sqrt(22 / 20), 12);
  });
  it('tightens curvature after energy loss without breaking tangent or reversing charge', () => {
    expect(relativisticRadius(3)).toBeLessThan(relativisticRadius(6));
    const a = positronTrack(-1e-6),
      b = positronTrack(1e-6);
    expect(Math.abs(a.x) + Math.abs(b.x)).toBeLessThan(1e-12);
    expect(a.y).toBeLessThan(0);
    expect(b.y).toBeGreaterThan(0);
    expect(positronTrack(0.5, 6, 3, 1.5, -1).x).toBeCloseTo(-positronTrack(0.5).x, 12);
  });
});
