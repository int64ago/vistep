import { expect, it } from 'vitest';
import { etherFringes, simultaneity, muonFlight, flightClock } from './relativity-experiments';
it('rotating the hypothetical ether apparatus reverses the phase and zero wind removes it', () => {
  expect(etherFringes(0)).toBeCloseTo(0.22, 2);
  expect(etherFringes(Math.PI / 2)).toBeCloseTo(-etherFringes(0));
  expect(etherFringes(0, 0)).toBe(0);
  expect(etherFringes(Math.PI / 4)).toBeCloseTo(0);
});
it('distinguishes reception times from transformed emission times', () => {
  const s = simultaneity(0.6);
  expect(s.arrivalRight).toBeCloseTo(0.3125);
  expect(s.arrivalLeft).toBeCloseTo(1.25);
  expect(s.emissionRightPrime).toBeLessThan(s.emissionLeftPrime);
  expect(simultaneity(0).arrivalLeft).toBe(simultaneity(0).arrivalRight);
});
it('predicts muon survival consistently from either proper time or contracted distance', () => {
  const m = muonFlight();
  expect(m.survival).toBeGreaterThan(0.2);
  expect(m.classical).toBeLessThan(1e-6);
  expect(m.properTime).toBeCloseTo(m.labTime / m.gamma, 12);
  expect(muonFlight(0.995, 10000, 0).survival).toBe(1);
});
it('includes Earth rotation and gravitational contribution to flying-clock differences', () => {
  const e = flightClock(1),
    w = flightClock(-1);
  expect(e.gravity).toBeGreaterThan(0);
  expect(e.kinetic).toBeLessThan(0);
  expect(w.kinetic).toBeGreaterThan(0);
  expect(w.gravity).toBe(e.gravity);
  expect(flightClock(1, 0, 40, 0).total).toBe(0);
});
