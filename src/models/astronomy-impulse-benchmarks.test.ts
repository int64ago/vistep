import { expect, it } from 'vitest';
import {
  cannonOrbit,
  EARTH_MU,
  EARTH_RADIUS,
  GRAVITY_G,
  torsionTorque,
} from './gravity-measurements';
import { flightClock, muonFlight } from './relativity-experiments';
import { binaryPulsar, inspiral } from './gravitational-wave-lab';
import { halleyOrbit } from './textbook-astronomy';
import { crashTrace, stoppedMotion } from './impulse-contact-lab';

it('matches the analytic four-mass torque, including the distant attracting spheres', () => {
  const arm = 0.9,
    separation = 0.23;
  const expected =
    2 *
    GRAVITY_G *
    0.73 *
    158 *
    arm *
    (1 / separation ** 2 - separation / (4 * arm ** 2 + separation ** 2) ** 1.5);
  expect(torsionTorque(0)).toBeCloseTo(expected, 17);
});
it('preserves orbital specific energy on a noncircular no-impact trajectory', () => {
  const orbit = cannonOrbit(9.5);
  expect(orbit.hit).toBe(false);
  const initial = 9500 ** 2 / 2 - EARTH_MU / (EARTH_RADIUS + 300000);
  const relativeError = Math.max(
    ...orbit.points.map((p) => Math.abs((p.speed ** 2 / 2 - EARTH_MU / p.r - initial) / initial)),
  );
  expect(relativeError).toBeLessThan(1e-5);
  expect(orbit.circularSpeed).toBeCloseTo(7.7299, 3);
});
it('uses the PDG mean lifetime and recovers the independent analytic clock benchmark', () => {
  const mu = muonFlight(0.995, 10000, 1);
  expect(mu.gamma).toBeCloseTo(10.0125234864, 8);
  expect(mu.labTime * 1e6).toBeCloseTo(33.5240296682, 8);
  expect(mu.survival).toBeCloseTo(Math.exp(-33.5240296682 / (10.0125234864 * 2.1969811)), 10);
  const east = flightClock(1),
    west = flightClock(-1);
  // Reversing u cancels the gravitational term; the difference is 2 v_ground u t/c².
  expect(west.total - east.total).toBeCloseTo(
    ((2 * 465.1 * 250 * 144000) / 299792458 ** 2) * 1e9,
    10,
  );
});
it('shortens received pulsar periods on approach to the illustrated right-side observer', () => {
  const epsilon = 1e-5;
  for (const phase of [0.12, 0.25, 0.6, 0.75, 0.9]) {
    const dx = binaryPulsar(0, phase + epsilon).x - binaryPulsar(0, phase - epsilon).x;
    expect((binaryPulsar(0, phase).observedPulseMs - 59.03) * dx).toBeLessThan(0);
  }
  // The approximately 75 μs/year orbital shortening is an independent published benchmark.
  expect(-binaryPulsar().pdot * 365.25 * 86400 * 1e6).toBeCloseTo(75.8, 0);
});
it('integrates the chirp phase at the stated instantaneous frequency', () => {
  const dt = 1e-7;
  for (const t of [0.01, 0.15, 0.28]) {
    const phaseRate = (inspiral(t + dt).phase - inspiral(t - dt).phase) / (2 * dt);
    expect(phaseRate / (2 * Math.PI)).toBeCloseTo(inspiral(t).frequency, 5);
  }
});
it('solves the high-eccentricity comet equation over a full orbit including near perihelion', () => {
  for (let j = 1; j < 1000; j++) {
    const fraction = j / 1000,
      p = halleyOrbit(fraction);
    let E = Math.atan2(p.y / (p.a * Math.sqrt(1 - p.e ** 2)), p.x / p.a + p.e);
    if (E < 0) E += 2 * Math.PI;
    expect(E - p.e * Math.sin(E)).toBeCloseTo(2 * Math.PI * fraction, 9);
  }
});
it('satisfies the vehicle and occupant momentum balances at both exposed stopping-time limits', () => {
  for (const T of [0.04, 0.16]) {
    const trace = crashTrace(T),
      dt = 0.0005;
    let carImpulse = 0,
      occupantImpulse = 0;
    for (let j = 1; j < trace.trace.length; j++) {
      carImpulse += ((trace.trace[j - 1].carForce + trace.trace[j].carForce) * dt) / 2;
      occupantImpulse += ((trace.trace[j - 1].restraint + trace.trace[j].restraint) * dt) / 2;
    }
    expect(Math.abs(carImpulse / (-trace.mass * trace.speed) - 1)).toBeLessThan(0.0002);
    const end = trace.trace.at(-1)!;
    expect(
      Math.abs(occupantImpulse / trace.occupantMass - (end.occupantVelocity - trace.speed)),
    ).toBeLessThan(0.002);
    expect(end.car.displacement).toBeCloseTo((trace.speed * T) / 2, 12);
    expect(
      trace.trace.every((p) => p.car.velocity >= 0 && Number.isFinite(p.q + p.restraint)),
    ).toBe(true);
  }
  expect(stoppedMotion(4, 0.5, 1).impulsePerMass).toBe(-4);
});
