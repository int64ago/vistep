import { describe, it, expect } from 'vitest';
import { bicycleCircular, bicycleFilmState, bicycleWheelVelocity } from './bicycle-circular-motion';
describe('bicycle circular-motion measurement', () => {
  it('transport speed is identical at both effective pitch circles', () => {
    for (const n of [16, 20, 24]) {
      const s = bicycleCircular(1, n);
      expect(s.omegaFront * s.radiusFront).toBeCloseTo(s.omegaRear * s.radiusRear, 12);
      expect(s.chainSpeed).toBeCloseTo((s.cadence / 60) * 40 * 0.0127, 12);
    }
  });
  it('equal transported chain length turns smaller sprocket through larger angle', () => {
    const s = bicycleCircular(0.25);
    expect(s.rearSweep / s.frontSweep).toBeCloseTo(2);
  });
  it('coaxial rim and mid-radius have same angular speed and2:1 speed', () => {
    const s = bicycleCircular(1);
    expect(s.wheelRimSpeed / s.wheelMidSpeed).toBeCloseTo(2);
  });
  it('closed chain has an even integer count and continuous seam for every selected sprocket', () => {
    for (const n of [16, 20, 24]) {
      const s = bicycleCircular(0.72, n),
        c = s.chain;
      expect(c.count % 2).toBe(0);
      expect(c.length).toBeCloseTo(c.count, 9);
      const a = c.sample(s.phase),
        b = c.sample(s.phase + c.count);
      expect(a.x).toBeCloseTo(b.x, 10);
      expect(a.y).toBeCloseTo(b.y, 10);
    }
  });
  it('all rollers on each wrapped sprocket coincide with indexed roller seats', () => {
    const s = bicycleCircular(0.17),
      c = s.chain;
    for (let i = 0; i < c.count; i++) {
      const p = c.sample(i + s.phase);
      for (const [center, r, angle, n] of [
        [-c.distance / 2, c.ra, s.frontAngle, 40],
        [c.distance / 2, c.rb, s.rearAngle, s.rear],
      ]) {
        if (Math.abs(Math.hypot(p.x - center, p.y) - r) < 1e-10) {
          const index = ((Math.atan2(p.y, p.x - center) - angle) * n) / (2 * Math.PI);
          expect(index - Math.round(index)).toBeCloseTo(0, 9);
        }
      }
    }
  });
  it('zero cadence freezes both gears and measured speeds', () => {
    const a = bicycleCircular(0, 20, 0),
      b = bicycleCircular(5, 20, 0);
    expect(a.frontAngle).toBe(b.frontAngle);
    expect(b.chainSpeed).toBe(0);
  });
  it('the narrated tracked link traverses the full loop and returns to its starting position', () => {
    const start = bicycleCircular(bicycleFilmState(1, 0).time);
    const end = bicycleCircular(bicycleFilmState(1, 1).time);
    expect(end.phase - start.phase).toBeCloseTo(start.chain.count, 10);
    expect(end.chain.sample(end.phase).x).toBeCloseTo(start.chain.sample(start.phase).x, 10);
    expect(end.chain.sample(end.phase).y).toBeCloseTo(start.chain.sample(start.phase).y, 10);
  });
  it('the narrated forty-to-twenty comparison completes one and two revolutions', () => {
    const end = bicycleCircular(bicycleFilmState(2, 1).time);
    expect(end.frontSweep).toBeCloseTo(2 * Math.PI, 12);
    expect(end.rearSweep).toBeCloseTo(4 * Math.PI, 12);
  });
  it('velocity arrows are tangent to the actual clockwise path and retain the two-to-one radius ratio', () => {
    for (const t of [0, 0.2, 1, 2])
      for (const cadence of [0, 20, 40]) {
        const s = bicycleCircular(t, 16, cadence),
          a = bicycleWheelVelocity(s.rearAngle, 0.34, s.omegaRear),
          b = bicycleWheelVelocity(s.rearAngle, 0.17, s.omegaRear);
        expect(a.x * a.vx + a.y * a.vy).toBeCloseTo(0, 12);
        expect(Math.hypot(a.vx, a.vy)).toBeCloseTo(2 * Math.hypot(b.vx, b.vy), 12);
        const next = bicycleCircular(t + 1e-6, 16, cadence);
        expect((0.34 * Math.cos(next.rearAngle) - a.x) / 1e-6).toBeCloseTo(a.vx, 3);
        expect((0.34 * Math.sin(next.rearAngle) - a.y) / 1e-6).toBeCloseTo(a.vy, 3);
      }
  });
});
