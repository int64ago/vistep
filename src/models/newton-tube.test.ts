import { describe, expect, it } from 'vitest';
import {
  newtonFall,
  newtonPair,
  newtonShot,
  NEWTON_OBJECTS,
  NEWTON_GRAVITY,
  NEWTON_HEIGHT,
} from './newton-tube';
describe('Newton tube: controlled air comparison', () => {
  it('matches the independent 1m ballistic benchmark for either mass', () => {
    for (const body of Object.values(NEWTON_OBJECTS)) {
      const s = newtonFall(body, 0.3, 0, 1);
      expect(s.impactTime).toBeCloseTo(0.4517539514526256, 12);
      expect(s.distance).toBeCloseTo(0.441, 12);
      expect(s.speed).toBeCloseTo(2.94, 12);
      expect(s.acceleration).toBe(NEWTON_GRAVITY);
    }
  });
  it('matches an independent RK4 integration with drag before landing', () => {
    const b = NEWTON_OBJECTS.feather,
      rho = 1.225,
      dt = 0.00001;
    const a = (v: number) => 9.8 - (rho * b.dragCoefficient * b.area * v * v) / (2 * b.mass);
    let y = 0,
      v = 0;
    for (let i = 0; i < 40000; i++) {
      const a1 = a(v),
        a2 = a(v + (dt * a1) / 2),
        a3 = a(v + (dt * a2) / 2),
        a4 = a(v + dt * a3);
      y += (dt * (v + 2 * (v + (dt * a1) / 2) + 2 * (v + (dt * a2) / 2) + v + dt * a3)) / 6;
      v += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
    }
    const s = newtonFall(b, 0.4);
    expect(s.distance).toBeCloseTo(y, 8);
    expect(s.speed).toBeCloseTo(v, 8);
  });
  it('does not claim equal arrival in air; reaches the same limit as air vanishes', () => {
    const air = newtonPair(0.5),
      vacuum = newtonPair(0.5, 0);
    expect(air.feather.impactTime).toBeGreaterThan(air.iron.impactTime * 2);
    expect(air.feather.distance).toBeLessThan(air.iron.distance);
    expect(vacuum.feather).toEqual(vacuum.iron);
    for (const body of Object.values(NEWTON_OBJECTS)) {
      const almost = newtonFall(body, 0.3, 1e-8),
        zero = newtonFall(body, 0.3, 0);
      expect(almost.distance).toBeCloseTo(zero.distance, 7);
      expect(almost.impactTime).toBeCloseTo(zero.impactTime, 7);
    }
  });
  it('handles release, contact, long time and zero height without penetration or invalid values', () => {
    expect(newtonPair(0).feather.drag).toBe(0);
    expect(newtonPair(0).feather.acceleration).toBe(9.8);
    for (const rho of [0, 0.0001, 1.225, 100]) {
      const s = newtonFall(NEWTON_OBJECTS.feather, 1e9, rho);
      expect(s.distance).toBe(NEWTON_HEIGHT);
      expect(s.speed).toBe(0);
      expect(s.landed).toBe(true);
    }
    expect(newtonFall(NEWTON_OBJECTS.iron, 0, 0, 0).landed).toBe(true);
    expect(newtonFall(NEWTON_OBJECTS.iron, -1).distance).toBe(0);
  });
  it('reconstructs direct seeks and synchronizes the final controlled comparison', () => {
    const shot = newtonShot(4, 0.53);
    newtonShot(1, 0.9);
    expect(newtonShot(4, 0.53)).toEqual(shot);
    expect(shot.airTime).toBe(shot.vacuumTime);
    expect(shot.density).toBe(0);
    expect(newtonShot(2, 0).density).toBe(1.225);
    expect(newtonShot(2, 1).density).toBe(0);
  });
});
