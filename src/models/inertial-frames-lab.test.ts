import { describe, it, expect } from 'vitest';
import { movingPaper, paperBall } from './inertial-frames-lab';
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
