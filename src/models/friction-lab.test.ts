import { describe, it, expect } from 'vitest';
import { frictionPull, frictionSteady, normalFriction } from './friction-lab';
describe('friction apparatus', () => {
  it('static friction adapts below its maximum without motion', () => {
    const s = frictionPull(1);
    expect(s.pull).toBeCloseTo(1.1025);
    expect(s.friction).toBe(s.pull);
    expect(s.position).toBe(0);
    expect(s.sliding).toBe(false);
  });
  it('sliding obeys the instantaneous force balance', () => {
    for (const time of [2.001, 2.1, 2.5, 4]) {
      const s = frictionPull(time);
      expect(s.pull - s.friction).toBeCloseTo(0.5 * s.acceleration, 12);
    }
  });
  it('position and velocity are continuous at breakaway while friction changes law', () => {
    const a = frictionPull(2),
      b = frictionPull(2 + 1e-8);
    expect(b.position).toBeCloseTo(a.position, 10);
    expect(b.velocity).toBeCloseTo(a.velocity, 7);
    expect(b.pull).toBeCloseTo(a.pull, 6);
    expect(b.friction).toBeLessThan(a.friction);
  });
  it('trajectory derivative matches stated velocity and acceleration', () => {
    const dt = 1e-5,
      a = frictionPull(2.2 - dt),
      b = frictionPull(2.2 + dt),
      s = frictionPull(2.2);
    expect((b.position - a.position) / (2 * dt)).toBeCloseTo(s.velocity, 7);
    expect((b.velocity - a.velocity) / (2 * dt)).toBeCloseTo(s.acceleration, 7);
  });
  it('constant speed gives pull equal to kinetic friction and scales with normal load', () => {
    const a = frictionSteady(1, 0.5),
      b = frictionSteady(1, 1);
    expect(a.pull).toBe(a.friction);
    expect(b.pull).toBe(2 * a.pull);
    expect(b.acceleration).toBe(0);
  });
  it('peak marker remains at breakaway after the reading drops', () => {
    const s = frictionPull(4);
    expect(s.peak).toBeCloseTo(normalFriction().staticLimit);
    expect(s.pull).toBeCloseTo(s.kinetic, 5);
    expect(s.peak).toBeGreaterThan(s.pull);
  });
});
