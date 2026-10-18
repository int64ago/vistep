import { it, expect } from 'vitest';
import { stoppedMotion, caughtBalloon, crashTrace } from './impulse-contact-lab';
it('keeps impulse fixed when the stopping time changes, while force changes', () => {
  const a = caughtBalloon(true, 3, 0.2, 1),
    b = caughtBalloon(true, 3, 0.4, 1);
  expect(a.impulse).toBeCloseTo(b.impulse);
  expect(a.peakForce).toBeCloseTo(2 * b.peakForce);
  expect(stoppedMotion(3, 0.4, 1).displacement).toBeCloseTo(0.6);
});
it('includes enclosed air inertia separately from latex', () => {
  const f = caughtBalloon(),
    e = caughtBalloon(false);
  expect(f.airMass).toBeCloseTo((1.2 * Math.PI) / 6);
  expect(f.mass - e.mass).toBeCloseTo(f.airMass);
  expect(f.mass).toBeGreaterThan(6 * e.mass);
});
it('integrates the vehicle force to its momentum change', () => {
  const c = crashTrace(0.1);
  let J = 0;
  for (let j = 1; j < c.trace.length; j++)
    J += ((c.trace[j - 1].carForce + c.trace[j].carForce) / 2) * 0.0005;
  expect(J / (c.mass * c.speed)).toBeCloseTo(-1, 4);
  expect(c.trace.at(-1)!.car.velocity).toBe(0);
});
it('keeps occupant and vehicle force distinct and checks the occupant momentum balance', () => {
  const c = crashTrace(),
    end = c.trace.at(-1)!;
  let J = 0;
  for (let j = 1; j < c.trace.length; j++)
    J += ((c.trace[j - 1].restraint + c.trace[j].restraint) / 2) * 0.0005;
  expect(J / c.occupantMass).toBeCloseTo(end.occupantVelocity - c.speed, 2);
  expect(c.peakOccupantForce).toBeLessThan(c.peakCarForce);
  expect(c.trace.every((p) => Number.isFinite(p.q + p.restraint))).toBe(true);
});
