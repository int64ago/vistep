import { describe, it, expect } from 'vitest';
import { arcExit, magneticRolling, dartFlight } from './curved-motion-lab';
describe('curved motion experimental paths', () => {
  it('track exit is position- and velocity-continuous, then tangent-straight', () => {
    for (const a of [0, -Math.PI / 6]) {
      const e = arcExit(0, a).exitTime,
        s = arcExit(e, a),
        later = arcExit(e + 0.4, a);
      expect(s.x * s.vx + s.y * s.vy).toBeCloseTo(0, 12);
      expect(later.x - s.x).toBeCloseTo(s.vx * 0.4);
      expect(later.y - s.y).toBeCloseTo(s.vy * 0.4);
      expect(arcExit(e - 1e-8, a).x).toBeCloseTo(s.x, 7);
    }
  });
  it('moving the exit changes the tangent direction without altering speed', () => {
    const a = arcExit(3, 0),
      b = arcExit(3, -Math.PI / 6);
    expect(a.vx).toBeCloseTo(0);
    expect(b.vx).toBeGreaterThan(0);
    expect(Math.hypot(a.vx, a.vy)).toBeCloseTo(Math.hypot(b.vx, b.vy));
  });
  it('a collinear magnet changes speed without creating curvature', () => {
    const s = magneticRolling(1, false);
    expect(s.y).toBeCloseTo(0, 12);
    expect(s.vy).toBeCloseTo(0, 12);
    expect(s.vx).toBeGreaterThan(0.55);
  });
  it('a lateral magnet curves the motion and conservative model preserves total energy', () => {
    const a = magneticRolling(0),
      b = magneticRolling(1);
    expect(b.y).toBeGreaterThan(0);
    expect(b.vy).toBeGreaterThan(0);
    expect(b.energy).toBeCloseTo(a.energy, 7);
  });
  it('zero magnet strength recovers uniform rectilinear motion', () => {
    const s = magneticRolling(1, true, 0);
    expect(s.x).toBeCloseTo(0.55, 10);
    expect(s.y).toBe(0);
  });
  it('dart direction is tangent and first tip contact defines landing', () => {
    const s = dartFlight(0.25),
      dt = 0.000001,
      a = dartFlight(0.25 - dt),
      b = dartFlight(0.25 + dt);
    expect((b.y - a.y) / (b.x - a.x)).toBeCloseTo(Math.tan(s.heading), 8);
    const end = dartFlight(100);
    expect(end.tipY).toBeCloseTo(0, 12);
    expect(end.y).toBeGreaterThan(0);
    expect(end.vy).toBeLessThan(0);
  });
});
