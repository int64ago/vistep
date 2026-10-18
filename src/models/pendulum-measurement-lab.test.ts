import { describe, it, expect } from 'vitest';
import {
  measuredPendulumPeriod,
  measurementPendulum,
  gravityMeasurement,
  inkDrop,
  rodGeometry,
  effectiveDataFit,
  EFFECTIVE_DATA,
} from './pendulum-measurement-lab';
describe('pendulum measurement pathways', () => {
  it('nonlinear period approaches the small-angle benchmark and increases with amplitude', () => {
    expect(measuredPendulumPeriod(0.7, 9.81, 0)).toBeCloseTo(
      2 * Math.PI * Math.sqrt(0.7 / 9.81),
      12,
    );
    expect(measuredPendulumPeriod(0.7, 9.81, 0.45)).toBeGreaterThan(
      measuredPendulumPeriod(0.7, 9.81, 0.08),
    );
    const s = measurementPendulum(0);
    expect(s.angle).toBeCloseTo(0, 9);
    expect(s.velocity).toBeLessThan(0);
  });
  it('separates length error, finite-amplitude bias and accumulated timing error', () => {
    expect(gravityMeasurement(0.7, 0).inferred).toBeCloseTo(9.81, 12);
    expect(gravityMeasurement(0.7, 0.45).inferred).toBeLessThan(
      gravityMeasurement(0.7, 0.08).inferred,
    );
    expect(gravityMeasurement(0.7, 0.08, 20, 0, 0, false).inferred).toBeLessThan(
      gravityMeasurement().inferred,
    );
    expect(gravityMeasurement(0.7, 0.08, 20, 0.2).period - measuredPendulumPeriod(0.7)).toBeCloseTo(
      0.01,
      12,
    );
  });
  it('ink retains tangential velocity and lands on the board after a finite delay', () => {
    const d = inkDrop(0.2);
    expect(d.flight).toBeGreaterThan(0);
    expect(d.z + d.vz * d.flight - 0.5 * 9.81 * d.flight * d.flight).toBeCloseTo(0, 12);
    expect(d.landing).not.toBe(d.x);
  });
  it('rod and string stay connected at constant lengths in a plane normal to the tilted axis', () => {
    const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
    for (const theta of [0, 11, 29, 40])
      for (const phase of [-0.1, 0, 0.1]) {
        const s = rodGeometry(theta, phase);
        expect(dist(s.bob, s.pivot)).toBeCloseTo(0.27, 12);
        expect(dist(s.bob, s.upper)).toBeCloseTo(Math.hypot(0.27, 0.3), 12);
        expect(s.bob.reduce((sum, v, i) => sum + (v - s.pivot[i]) * s.n[i], 0)).toBeCloseTo(0, 12);
      }
    expect(rodGeometry(0, 0).effectiveGravity).toBe(0);
  });
  it('preserves actual printed data and nonzero fit residuals', () => {
    expect(EFFECTIVE_DATA[0].T).toBe(2.52);
    expect(Math.max(...effectiveDataFit().residuals.map(Math.abs))).toBeGreaterThan(0.05);
    expect(() => measuredPendulumPeriod(0)).toThrow();
  });
});
