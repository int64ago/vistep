import { it, expect } from 'vitest';
import {
  moonEarthTest,
  torsionTorque,
  torsionBalance,
  cannonOrbit,
  EARTH_MU,
  EARTH_RADIUS,
} from './gravity-measurements';
it('compares lunar acceleration with inverse-square Earth gravity', () => {
  const m = moonEarthTest();
  expect(m.predicted / m.observed).toBeCloseTo(1, 1);
  expect(moonEarthTest(60).predicted / moonEarthTest(30).predicted).toBeCloseTo(0.25);
});
it('reverses torque and scales it with attracting mass', () => {
  expect(torsionTorque(0, -1)).toBeCloseTo(-torsionTorque(0, 1), 12);
  expect(torsionTorque(0, 1, 316)).toBeCloseTo(2 * torsionTorque(0, 1, 158), 12);
  const x = torsionBalance(1, 158, 10000);
  expect(x.theta).toBeCloseTo(x.equilibrium, 5);
  expect(x.theta).toBeGreaterThan(0);
});
it('conserves a circular orbit and intercepts a slow projectile', () => {
  const speed = Math.sqrt(EARTH_MU / (EARTH_RADIUS + 3e5)) / 1000,
    a = cannonOrbit(speed);
  expect(a.hit).toBe(false);
  expect(Math.max(...a.points.map((p) => Math.abs(p.r - (EARTH_RADIUS + 3e5))))).toBeLessThan(20);
  expect(cannonOrbit(4).hit).toBe(true);
  expect(a.escapeSpeed / a.circularSpeed).toBeCloseTo(Math.sqrt(2));
});
