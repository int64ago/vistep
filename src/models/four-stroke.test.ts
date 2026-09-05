import { describe, it, expect } from 'vitest';
import { ENGINE, engineCycle, engineShot, pistonGeometry } from './four-stroke';
describe('four-stroke kinematics and the ideal Otto cycle', () => {
  it('keeps the rod connected at both pins through two crank revolutions', () => {
    for (let i = 0; i <= 720; i++) {
      const p = pistonGeometry((i * Math.PI) / 180);
      expect(Math.hypot(p.crankX, p.pinY - p.crankY)).toBeCloseTo(ENGINE.rod, 12);
      expect(p.down).toBeGreaterThanOrEqual(-1e-12);
      expect(p.down).toBeLessThanOrEqual(2 * ENGINE.crank + 1e-12);
    }
  });
  it('separates four strokes and rotates the camshaft at half crank speed', () => {
    expect([0.5, 1.5, 2.5, 3.5].map((a) => engineCycle(a * Math.PI).stage)).toEqual([0, 1, 2, 3]);
    expect(engineCycle(3 * Math.PI).camAngle).toBeCloseTo(1.5 * Math.PI);
    expect(engineCycle(4 * Math.PI)).toEqual(engineCycle(0));
    expect(engineCycle(1.5 * Math.PI).intake).toBe(0);
    expect(engineCycle(2.5 * Math.PI).exhaust).toBe(0);
  });
  it('matches the pressure-volume integral to heat-based net work', () => {
    const n = 24000,
      step = (4 * Math.PI) / n;
    let work = 0;
    for (let i = 0; i < n; i++) {
      const angle = (i + 0.5) * step,
        state = engineCycle(angle);
      work +=
        (((state.pressure - ENGINE.inletPressure) * Math.PI * ENGINE.bore ** 2) / 4) *
        state.derivative *
        step;
    }
    expect(work).toBeCloseTo(engineCycle(0).netWork, 4);
  });
  it('accounts for clearance volume and produces no net work without heat input', () => {
    const state = engineCycle(0);
    expect(state.maximum / state.clearance).toBeCloseTo(ENGINE.compression);
    expect(engineCycle(0, { ...ENGINE, heatPerKg: 0 }).netWork).toBe(0);
    expect(() => pistonGeometry(0, 0.1, 0.05)).toThrow();
    expect(() => engineCycle(Infinity)).toThrow();
    expect(() => engineCycle(0, { ...ENGINE, bore: NaN })).toThrow();
  });
  it('reconstructs the same states on a chapter seek, including either side of ignition', () => {
    const before = engineShot(3, 0),
      after = engineShot(3, 1);
    expect(engineCycle(before.angle).stage).toBe(1);
    expect(engineCycle(after.angle).stage).toBe(2);
    expect(engineCycle(after.angle).pressure).toBeGreaterThan(engineCycle(before.angle).pressure);
    for (let chapter = 0; chapter < 8; chapter++) {
      const saved = engineCycle(engineShot(chapter, 0.63).angle);
      engineShot(7, 0.2);
      engineShot(0, 0.9);
      expect(engineCycle(engineShot(chapter, 0.63).angle)).toEqual(saved);
    }
  });
});
