import { describe, it, expect } from 'vitest';
import { mirageRay } from './mirage';
describe('thin continuously refracting mirage layer', () => {
  it('reduces to a straight ground-intersecting ray without a temperature gradient', () => {
    const s = mirageRay({ groundTemperature: 300 });
    expect(s.a).toBe(0);
    expect(s.turns).toBe(false);
    expect(s.end).toBeCloseTo(1.2 / Math.tan((0.35 * Math.PI) / 180), 10);
    expect(s.at(s.end).y).toBeCloseTo(0, 12);
  });
  it('conserves independently derived horizontal Snell invariant throughout the curved segment', () => {
    const s = mirageRay();
    expect(s.turns).toBe(true);
    expect(s.nt).toBeCloseTo(1.00026462, 10);
    for (let i = 0; i <= 100; i++) {
      const x = s.entry + ((s.turnX! - s.entry) * 2 * i) / 100,
        p = s.at(x);
      expect(s.index(p.y) / Math.sqrt(1 + p.slope * p.slope)).toBeCloseTo(Math.sqrt(s.p2), 12);
    }
    expect(s.turnY).toBeGreaterThan(0);
    expect(s.turnY).toBeLessThan(s.H);
  });
  it('matches independent numerical integration of the ray equation inside the layer', () => {
    const s = mirageRay(),
      dx = (s.turnX! - s.entry) / 20000;
    let y = s.H,
      theta = (s.angle * Math.PI) / 180;
    for (let i = 0; i < 20000; i++) {
      const derivative = s.a / (2 * (s.n0 * s.n0 + s.a * y)),
        halfTheta = theta + (dx * derivative) / 2,
        halfY = y + (dx * Math.tan(theta)) / 2;
      y += dx * Math.tan(halfTheta);
      theta += (dx * s.a) / (2 * (s.n0 * s.n0 + s.a * halfY));
    }
    expect(y).toBeCloseTo(s.turnY!, 9);
    expect(theta).toBeCloseTo(0, 9);
  });
  it('joins the uniform upper air continuously and reversibly without a reflecting surface', () => {
    const s = mirageRay(),
      exit = 2 * s.turnX! - s.entry;
    expect(s.at(s.entry).y).toBeCloseTo(s.H, 12);
    expect(s.at(exit).y).toBeCloseTo(s.H, 10);
    expect(s.at(exit).slope).toBeCloseTo(-s.m, 12);
    expect(s.turnY).not.toBe(0);
  });
  it('clips a steep ray at actual ground contact instead of inventing a below-ground turn', () => {
    const s = mirageRay({ angle: -0.5 });
    expect(s.turns).toBe(false);
    expect(s.groundX).not.toBeNull();
    expect(s.at(s.end).y).toBeCloseTo(0, 11);
    expect(s.points.every((p) => p.y >= -1e-10)).toBe(true);
  });
  it('changes the bending sign with a reversed gradient and respects valid heights', () => {
    const s = mirageRay({ groundTemperature: 280 });
    expect(s.curvature).toBeLessThan(0);
    expect(s.turns).toBe(false);
    expect(() => mirageRay({ eyeHeight: 0.01 })).toThrow(RangeError);
  });
});
