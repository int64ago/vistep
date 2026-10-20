import { describe, it, expect } from 'vitest';
import { movingPaper, paperBall, inertiaDirector, inertiaGeometry } from './inertial-frames-lab';
describe('paper pull in two frames', () => {
  it('paper starts and ends at rest with half a metre displacement', () => {
    expect(movingPaper(0).position).toBe(0);
    expect(movingPaper(0.35).position).toBe(0.5);
    expect(movingPaper(0.35).velocity).toBe(0);
  });
  it('zero paper friction leaves the ball at rest in the lab', () => {
    for (const t of [0.1, 0.2, 0.3, 0.6]) {
      const s = paperBall(t, 0.35, 0);
      expect(s.position).toBeCloseTo(0, 12);
      expect(s.velocity).toBeCloseTo(0, 12);
      expect(s.relativePosition).toBeCloseTo(-s.paper.position);
    }
  });
  it('frame transformation changes apparent motion without changing the physical state', () => {
    const s = paperBall(0.15);
    expect(s.relativeVelocity + s.paper.velocity).toBeCloseTo(s.velocity, 12);
    expect(s.relativeAcceleration + s.paper.acceleration).toBeCloseTo(s.acceleration, 12);
  });
  it('fast pulling gives the ball a smaller displacement than slow pulling', () => {
    expect(paperBall(0.55, 0.35).position).toBeLessThan(paperBall(2.2, 2).position);
  });
  it('under gentle sticking motion the solid sphere center follows 2/7 of paper travel', () => {
    const s = paperBall(0.8, 2, 0.1);
    expect(s.position).toBeCloseTo(s.paper.position / 3.5, 5);
    expect(s.velocity - s.spinSpeed).toBeCloseTo(s.paper.velocity, 8);
  });
  it('finite friction can change lab motion, so approximate rest is not imposed', () => {
    const s = paperBall(0.18, 0.35, 0.03);
    expect(s.position).toBeGreaterThan(0);
    expect(s.acceleration).toBeCloseTo(0.03 * 9.8, 8);
  });
});

describe('contact, replay and accepted finite domain', () => {
  it('uses the current contact region and a common tangent plane in both coordinate views', () => {
    for (const time of [0.1995, 0.2, 0.2001, 0.25, 0.55, 1, 2.2]) {
      const s = paperBall(time);
      expect(s.onPaper).toBe(
        s.position >= s.paper.position - 0.3 && s.position <= s.paper.position + 0.3,
      );
      for (const frame of ['lab', 'paper'] as const) {
        const g = inertiaGeometry(s, frame, 288);
        expect(g.ballY + g.ballRadius).toBeCloseTo(g.surfaceY, 12);
        expect(g.paperWidth / g.scale).toBeCloseTo(0.6, 12);
      }
    }
  });
  it('retains the same physical history when changing camera and remains continuous on a solver boundary', () => {
    expect(inertiaDirector(0, 0, (0.45 + 10.05) / 2).time).toBeCloseTo(
      inertiaDirector(1, 0, (4.79 + 10.8) / 2).time,
      12,
    );
    const a = paperBall(0.18049999),
      b = paperBall(0.18050001);
    expect(Math.abs(a.position - b.position)).toBeLessThan(1e-8);
    expect(Math.abs(a.velocity - b.velocity)).toBeLessThan(1e-7);
  });
  it('rejects nonfinite or excessively small pull time and bounds director states', () => {
    for (const d of [NaN, Infinity, 0, 1e-100, 6]) expect(() => paperBall(0.2, d)).toThrow();
    for (const t of [NaN, Infinity, -1, 6]) expect(() => paperBall(t)).toThrow();
    expect(inertiaDirector(NaN, Infinity).time).toBe(0);
    expect(() => inertiaGeometry(paperBall(0.2), 'lab', NaN)).toThrow();
  });
});
