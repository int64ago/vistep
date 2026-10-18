import { describe, it, expect } from 'vitest';
import { newtonCart, cartTapeAcceleration } from './newton-second-law-lab';
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
