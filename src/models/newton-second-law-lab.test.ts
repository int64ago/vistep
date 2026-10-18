import { describe, it, expect } from 'vitest';
import {
  newtonCart,
  cartTapeAcceleration,
  hangerForTension,
  cartForceSequence,
  releaseTrial,
  balancedTrial,
  newtonRigGeometry,
} from './newton-second-law-lab';
describe('cart and hanging mass experiment', () => {
  it('recovers exact two-body acceleration rather than treating weight as tension', () => {
    const s = newtonCart(0.2, { cartMass: 0.6, hangerMass: 0.03 });
    expect(s.acceleration).toBeCloseTo((0.03 * 9.8) / 0.63, 12);
    expect(s.tension).toBeCloseTo(0.6 * s.acceleration, 12);
    expect(s.tension).toBeLessThan(s.hangerWeight);
  });
  it('compensating tilt balances resistance with the paper attached', () => {
    const s = newtonCart(0.5, { cartMass: 0.6, hangerMass: 0, initialVelocity: 0.2 });
    expect(s.acceleration).toBeCloseTo(0, 12);
    expect(s.position).toBeCloseTo(0.1, 12);
    expect(s.gravityAlong).toBeCloseTo(s.resistanceForce, 12);
  });
  it('both cart and hanging mass obey their own force balances', () => {
    const s = newtonCart(0.3, { cartMass: 0.5, hangerMass: 0.02, incline: 0.04 });
    expect(s.cartNet).toBeCloseTo(0.5 * s.acceleration, 12);
    expect(s.hangerWeight - s.tension).toBeCloseTo(0.02 * s.acceleration, 12);
  });
  it('simultaneous zero-speed starts give displacement ratio equal to acceleration ratio', () => {
    const a = newtonCart(0.5, { cartMass: 0.6, hangerMass: 0.01 }),
      b = newtonCart(0.5, { cartMass: 0.6, hangerMass: 0.02 });
    expect(b.position / a.position).toBeCloseTo(b.acceleration / a.acceleration, 12);
  });
  it('finite differences on equal-time tape recover acceleration', () => {
    expect(cartTapeAcceleration(0.7).reconstructed).toBeCloseTo(0.7, 12);
  });
  it('a heavy hanging mass makes the weight-as-tension approximation worse', () => {
    const a = newtonCart(0.2, { cartMass: 0.6, hangerMass: 0.01 }),
      b = newtonCart(0.2, { cartMass: 0.6, hangerMass: 0.2 });
    expect(b.approximationError).toBeCloseTo(0.25, 12);
    expect(b.approximationError).toBeGreaterThan(a.approximationError);
  });
  it('insufficient force can remain static without a false negative launch', () => {
    const s = newtonCart(1, { cartMass: 1, hangerMass: 0.01, incline: 0 });
    expect(s.stopped).toBe(true);
    expect(s.position).toBe(0);
    expect(s.cartNet).toBeCloseTo(0, 12);
  });
});

describe('principle-first evidence', () => {
  it('holds actual tension fixed when mass doubles, so acceleration halves exactly', () => {
    const states = [0.4, 0.8].map((M) =>
      newtonCart(1, { cartMass: M, hangerMass: hangerForTension(M, 0.16), distance: 0.44 }),
    );
    expect(states[0].tension).toBeCloseTo(0.16, 12);
    expect(states[1].tension).toBeCloseTo(0.16, 12);
    expect(states[0].acceleration / states[1].acceleration).toBeCloseTo(2, 12);
    expect(states[0].velocity).toBeCloseTo(0.4, 12);
    expect(states[1].velocity).toBeCloseTo(0.2, 12);
  });
  it('doubles velocity gain, not an arbitrarily assigned speed, at twice the net force', () => {
    const a = newtonCart(1, { cartMass: 0.6, hangerMass: hangerForTension(0.6, 0.12) });
    const b = newtonCart(1, { cartMass: 0.6, hangerMass: hangerForTension(0.6, 0.24) });
    expect(a.position).toBeCloseTo(0.1, 12);
    expect(b.position).toBeCloseTo(0.2, 12);
    expect(b.velocity / a.velocity).toBeCloseTo(2, 12);
  });
  it('balanced nonzero forces preserve an existing velocity', () => {
    const state = cartForceSequence(1.5, 0.6, 0.24, balancedTrial);
    expect(state.applied).toBe(0.18);
    expect(state.netForce).toBe(0);
    expect(state.velocity).toBe(0.24);
    expect(state.position).toBeCloseTo(0.36, 12);
  });
  it('release keeps velocity continuous and a later opposing force slows the moving cart', () => {
    const release = cartForceSequence(0.8, 0.6, 0, releaseTrial);
    const coast = cartForceSequence(1.8, 0.6, 0, releaseTrial);
    const braking = cartForceSequence(2.2, 0.6, 0, releaseTrial);
    const end = cartForceSequence(2.6, 0.6, 0, releaseTrial);
    expect(release.velocity).toBeCloseTo(0.24, 12);
    expect(release.acceleration).toBe(0);
    expect(coast.velocity).toBeCloseTo(release.velocity, 12);
    expect(coast.position - release.position).toBeCloseTo(0.24, 12);
    expect(braking.velocity).toBeCloseTo(0.12, 12);
    expect(braking.acceleration).toBeCloseTo(-0.3, 12);
    expect(end.position).toBeCloseTo(0.432, 12);
    expect(end.velocity).toBeCloseTo(0, 12);
    expect(end.applied).toBe(0);
    expect(end.acceleration).toBe(0);
    for (const junction of [0.8, 1.8]) {
      expect(cartForceSequence(junction - 1e-8, 0.6, 0, releaseTrial).velocity).toBeCloseTo(
        cartForceSequence(junction + 1e-8, 0.6, 0, releaseTrial).velocity,
        7,
      );
    }
  });
  it('clamps time and brakes at rest without a false reversal', () => {
    expect(cartForceSequence(-3, 0.6, 0, releaseTrial).position).toBe(0);
    expect(cartForceSequence(50, 0.6, 0, releaseTrial).position).toBeCloseTo(0.432, 12);
    const stopped = cartForceSequence(3, 1, 0.2, [{ duration: 3, applied: -1, resistance: 0 }]);
    expect(stopped.position).toBeCloseTo(0.02, 12);
    expect(stopped.velocity).toBe(0);
    expect(stopped.acceleration).toBe(0);
  });
  it('keeps the real rope length and tangencies unchanged over the full measured travel', () => {
    for (const angle of [0, 0.025, 0.052]) {
      const first = newtonRigGeometry(0, angle);
      for (const position of [0.01, 0.12, 0.3, 0.44]) {
        const rig = newtonRigGeometry(position, angle);
        expect(rig.ropeLength).toBeCloseTo(first.ropeLength, 12);
        expect(rig.hanger.y - first.hanger.y).toBeCloseTo(position, 12);
        const r = { x: rig.entry.x - rig.pulley.x, y: rig.entry.y - rig.pulley.y };
        expect(r.x * rig.tangent.x + r.y * rig.tangent.y).toBeCloseTo(0, 12);
        expect(Math.hypot(r.x, r.y)).toBeCloseTo(rig.radius, 12);
        expect(rig.exit.x - rig.pulley.x).toBeCloseTo(rig.radius, 12);
      }
    }
  });
  it('rejects impossible controlled-tension and geometry inputs', () => {
    expect(() => hangerForTension(0.6, 5.88)).toThrow(RangeError);
    expect(() => hangerForTension(0, 0.2)).toThrow(RangeError);
    expect(() => newtonRigGeometry(0.5)).toThrow(RangeError);
    expect(() => cartForceSequence(NaN, 1, 0, balancedTrial)).toThrow(RangeError);
  });
});
