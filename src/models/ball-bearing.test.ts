import { describe, expect, it } from 'vitest';
import {
  BEARING as b,
  BEARING_TAU as tau,
  bearingSpeeds,
  bearingState,
  bearingRaceRadius,
  bearingPocketPoint,
  bearingShot,
  bearingSurfacePoint,
  bearingContactComparison,
} from './ball-bearing';

describe('ball bearing: contacts, cage and deterministic director', () => {
  it('satisfies both no-slip velocities including reversal and rest', () => {
    for (const omega of [-50, -1, 0, 0.1, 12, 1000]) {
      const v = bearingSpeeds(omega);
      expect(v.outerContact).toBeCloseTo(0, 11);
      expect(v.innerContact).toBeCloseTo(v.innerSurface, 11);
      expect(v.cage * b.pitch).toBeCloseTo(v.center, 11);
      expect(v.relativeSpin).toBeCloseTo(v.spin - v.cage, 11);
    }
    expect(bearingSpeeds().cage).toBeCloseTo((1 - b.ball / b.pitch) / 2, 12);
    expect(bearingSpeeds().relativeSpin).toBeCloseTo(
      -(b.pitch ** 2 - b.ball ** 2) / (2 * b.pitch * b.ball),
      12,
    );
  });
  it('puts all balls on two truly tangent circular races for every phase', () => {
    for (let k = 0; k < 301; k++) {
      const s = bearingState((k * tau) / 47);
      for (const ball of s.balls) {
        expect(Math.hypot(ball.x, ball.y)).toBeCloseTo(b.pitch, 12);
        for (const side of ['inner', 'outer'] as const) {
          const p = side === 'inner' ? ball.innerContact : ball.outerContact;
          expect(Math.hypot(p.x - ball.x, p.y - ball.y)).toBeCloseTo(b.ball, 12);
          expect(Math.hypot(p.x, p.y)).toBeCloseTo(bearingRaceRadius(side, 0), 12);
        }
      }
    }
    expect(2 * b.pitch * Math.sin(Math.PI / b.count)).toBeGreaterThan(2 * b.ball);
  });
  it('clears the grooved shoulders along the entire ball axial section', () => {
    for (let i = -340; i <= 340; i++) {
      const z = i / 1000,
        half = Math.sqrt(Math.max(0, b.ball ** 2 - z ** 2));
      expect(b.pitch - half - bearingRaceRadius('inner', z)).toBeGreaterThanOrEqual(-1e-12);
      expect(bearingRaceRadius('outer', z) - b.pitch - half).toBeGreaterThanOrEqual(-1e-12);
    }
  });
  it('keeps concave cage pockets clear of balls, races and neighboring pockets', () => {
    for (const side of [0, Math.PI])
      for (let i = 0; i <= 40; i++)
        for (let j = 0; j <= 30; j++) {
          const theta = 0.92 + ((Math.PI - 0.92) * i) / 40,
            phi = (Math.PI * (55 + (70 * j) / 30)) / 180 + side;
          for (const outer of [false, true]) {
            const p = bearingPocketPoint(theta, phi, outer),
              radial = Math.hypot(b.pitch + p.x, p.y);
            expect(Math.hypot(p.x, p.y, p.z)).toBeGreaterThan(b.ball);
            expect(radial - bearingRaceRadius('inner', p.z)).toBeGreaterThan(0);
            expect(bearingRaceRadius('outer', p.z) - radial).toBeGreaterThan(0);
          }
        }
  });
  it('keeps the cage pocket phase locked to each ball center', () => {
    for (const angle of [-100, -2, 0, 4, 800]) {
      const state = bearingState(angle);
      for (const ball of state.balls)
        expect(ball.angle - state.cageAngle).toBeCloseTo(
          -Math.PI / 2 + (ball.id * tau) / b.count,
          11,
        );
    }
  });
  it('has zero material-point velocity at instantaneous outer contact', () => {
    const a = 4.31,
      s = bearingState(a),
      ball = s.balls[0],
      m = ball.angle - ball.spin,
      h = 1e-6;
    const before = bearingSurfacePoint(a - h, m),
      after = bearingSurfacePoint(a + h, m);
    expect((after.x - before.x) / (2 * h)).toBeCloseTo(0, 7);
    expect((after.y - before.y) / (2 * h)).toBeCloseTo(0, 7);
  });
  it('seeks all chapters reproducibly and preserves phase at chapter boundaries', () => {
    for (let chapter = 0; chapter < 8; chapter++) {
      const saved = bearingShot(chapter, 0.45);
      bearingShot(7, 0.9);
      bearingShot(0, 0.1);
      expect(bearingShot(chapter, 0.45)).toEqual(saved);
      if (chapter < 7)
        expect(bearingShot(chapter, 1).innerAngle).toBeCloseTo(
          bearingShot(chapter + 1, 0).innerAngle,
          12,
        );
      expect(bearingShot(chapter, -5).progress).toBe(0);
      expect(bearingShot(chapter, 5).progress).toBe(1);
    }
  });
  it('labels a teaching load zone without fabricating forces, friction or efficiency', () => {
    const off = bearingState(0, -Math.PI / 2, 0),
      on = bearingState(0);
    expect(off.balls.every((v) => v.loadWeight === 0)).toBe(true);
    expect(on.balls[0].loadWeight).toBe(1);
    expect(on.balls[5].loadWeight).toBe(0);
    expect(bearingState(0, Math.PI / 2).balls[5].loadWeight).toBe(1);
    expect(bearingContactComparison(1).outerSlip).toBe(0);
    expect(bearingContactComparison(1).innerSlip).toBe(-0);
    expect(bearingContactComparison(0).outerSlip).toBe(0.5);
    expect(bearingContactComparison(0).innerSlip).toBe(-0.5);
  });
  it('rejects nonfinite input before it reaches geometry', () => {
    expect(() => bearingState(NaN)).toThrow();
    expect(() => bearingSpeeds(Infinity)).toThrow();
    expect(() => bearingShot(0, NaN)).toThrow();
  });
});
