import { describe, it, expect } from 'vitest';
import {
  collision1D,
  textbookSticky,
  flagTransit,
  springSeparation,
  hangingCollision,
  cartCollisionRun,
  tapeDots,
} from './momentum-collision-lab';
describe('momentum apparatus models', () => {
  it('conserves signed momentum for elastic and sticking limits; only elastic conserves K', () => {
    for (const e of [0, 0.4, 1]) {
      const s = collision1D(0.4, 0.8, 0.6, 0, e);
      expect(s.pAfter).toBeCloseTo(s.pBefore, 12);
      expect(s.v2 - s.v1).toBeCloseTo(e * 0.6, 12);
      if (e === 1) expect(s.kAfter).toBeCloseTo(s.kBefore, 12);
      else expect(s.kAfter).toBeLessThan(s.kBefore);
    }
    expect(collision1D(0.4, 0.8, 0.6, 0, 1).v1).toBeLessThan(0);
  });
  it('preserves printed data and their nonzero experimental residual', () => {
    const s = textbookSticky(0);
    expect(s.v).toBe(0.307);
    expect(s.pBefore).toBeCloseTo(0.325932, 10);
    expect(s.pAfter).toBeCloseTo(0.318666, 10);
    expect(s.residual).toBeCloseTo(-0.022293, 5);
    expect(s.kAfter).toBeLessThan(s.kBefore);
  });
  it('flags measure finite transit time and recover sign from motion direction', () => {
    const s = flagTransit(1, -0.2, 0.8)!;
    expect(s.duration).toBeCloseTo(0.1, 12);
    expect(s.velocity).toBe(-0.2);
    expect(flagTransit(1, 0, 0.8)).toBeNull();
  });
  it('spring separation conserves momentum and spring+kinetic energy until detachment', () => {
    for (const t of [0, 0.1, 0.3, 1, 3]) {
      const s = springSeparation(t);
      expect(s.p).toBeCloseTo(0, 12);
      expect(s.elastic + s.kinetic).toBeCloseTo(s.totalEnergy, 12);
    }
    expect(springSeparation(1).detached).toBe(true);
  });
  it('equal hanging balls transfer height; heavier incident ball sends the other higher', () => {
    const s = hangingCollision(1, 1);
    expect(s.v1).toBeCloseTo(0, 12);
    expect(s.height2).toBeCloseTo(s.initialHeight, 12);
    expect(s.length * (1 - Math.cos(s.b.angle))).toBeCloseTo(s.height2, 9);
    expect(hangingCollision(1, 2).height2).toBeGreaterThan(s.height2);
  });
  it('cart contact is continuous and sticking preserves the contact gap; tape spacing changes only after contact', () => {
    const s = cartCollisionRun('sticky', 0),
      a = cartCollisionRun('sticky', s.impact),
      b = cartCollisionRun('sticky', s.impact + 1);
    expect(a.x2 - a.x1).toBeCloseTo(0.2, 12);
    expect(b.x2 - b.x1).toBeCloseTo(0.2, 12);
    const dots = tapeDots(),
      first = dots[1].x - dots[0].x,
      last = dots.at(-1)!.x - dots.at(-2)!.x;
    expect(first / last).toBeCloseTo(3, 10);
  });
});
