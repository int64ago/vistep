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
import { curvedFilmState } from './curved-motion-lab';
it('aligns actual release with the spoken exit and preserves the same speed', () => {
  for (const l of ['zh', 'en'] as const) {
    const t = l === 'zh' ? 9.97 : 8.23,
      a = curvedFilmState(0, t - 0.001, l),
      b = curvedFilmState(0, t + 0.001, l);
    expect(arcExit(a.time).released).toBe(false);
    expect(arcExit(b.time).released).toBe(true);
    expect(Math.hypot(arcExit(a.time).vx, arcExit(a.time).vy)).toBeCloseTo(0.6, 14);
  }
});
it('keeps the dart airborne at its explanatory apex and uses physical first contact', () => {
  for (const l of ['zh', 'en'] as const) {
    const s = curvedFilmState(5, 8, l),
      d = dartFlight(s.time, s.angle);
    expect(d.vy).toBeCloseTo(0, 12);
    expect(d.landed).toBe(false);
    const end = curvedFilmState(5, 26, l);
    expect(dartFlight(end.time, end.angle).tipY).toBeCloseTo(0, 12);
  }
});
it('rejects nonfinite and numerical-overflow inputs instead of rendering invalid geometry', () => {
  for (const f of [arcExit, magneticRolling, dartFlight])
    for (const x of [NaN, Infinity, -Infinity]) expect(() => f(x)).toThrow();
  expect(() => arcExit(1e308, 0, 1e308, 1)).toThrow();
  expect(() => magneticRolling(1, true, 1e308)).toThrow();
  expect(() => dartFlight(1, 0.5, 1e308)).toThrow();
  expect(() => curvedFilmState(1, NaN)).toThrow();
});
