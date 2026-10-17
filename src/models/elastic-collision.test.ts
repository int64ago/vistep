import { describe, it, expect } from 'vitest';
import { collisionDefaults, elasticCollision } from './elastic-collision';
describe('finite elastic contact', () => {
  it('matches independent classical outgoing velocities for unequal masses', () => {
    for (const [m1, m2, u1, u2] of [
      [1, 1, 1, 0],
      [1, 3, 1, 0],
      [3, 1, 1, 0],
      [1, 3, 1, -0.2],
    ]) {
      const p = { ...collisionDefaults(), m1, m2, u1, u2 },
        s = elasticCollision(p, 2);
      expect(s.v1).toBeCloseTo(((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2), 12);
      expect(s.v2).toBeCloseTo((2 * m1 * u1 + (m2 - m1) * u2) / (m1 + m2), 12);
    }
  });
  it('conserves momentum and total energy during compression and release', () => {
    const p = { ...collisionDefaults(), m2: 3, u2: -0.2 };
    for (let t = 0; t < 1.6; t += 0.007) {
      const s = elasticCollision(p, t);
      expect(s.momentum).toBeCloseTo(0.4, 12);
      expect(s.totalEnergy).toBeCloseTo(0.56, 11);
      expect(s.compression).toBeGreaterThanOrEqual(-1e-12);
    }
  });
  it('has equal speeds at maximum compression but stores relative kinetic energy', () => {
    const p = collisionDefaults(),
      a = elasticCollision(p, 0),
      s = elasticCollision(p, a.contactAt + a.contactDuration / 2);
    expect(s.v1).toBeCloseTo(0.5, 12);
    expect(s.v2).toBeCloseTo(0.5, 12);
    expect(s.springEnergy).toBeCloseTo(0.25, 12);
    expect(s.kinetic).toBeCloseTo(0.25, 12);
  });
  it('position derivatives match velocities and forces give opposite accelerations', () => {
    const p = { ...collisionDefaults(), m2: 3 },
      a = elasticCollision(p, 0),
      t = a.contactAt + a.contactDuration * 0.3,
      h = 1e-5,
      s = elasticCollision(p, t),
      l = elasticCollision(p, t - h),
      r = elasticCollision(p, t + h);
    expect((r.x1 - l.x1) / (2 * h)).toBeCloseTo(s.v1, 7);
    expect((r.x2 - l.x2) / (2 * h)).toBeCloseTo(s.v2, 7);
    expect((r.v1 - l.v1) / (2 * h)).toBeCloseTo(-s.force / p.m1, 6);
    expect((r.v2 - l.v2) / (2 * h)).toBeCloseTo(s.force / p.m2, 6);
  });
  it('force integral equals equal-and-opposite momentum changes', () => {
    const p = { ...collisionDefaults(), m2: 3 },
      a = elasticCollision(p, 0),
      N = 400,
      dt = a.contactDuration / N;
    let sum = 0;
    for (let i = 0; i <= N; i++)
      sum +=
        (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * elasticCollision(p, a.contactAt + i * dt).force;
    const J = (sum * dt) / 3,
      s = elasticCollision(p, a.releaseAt);
    expect(J).toBeCloseTo(s.impulse, 8);
    expect(p.m1 * (s.v1 - p.u1)).toBeCloseTo(-J, 8);
    expect(p.m2 * (s.v2 - p.u2)).toBeCloseTo(J, 8);
  });
  it('series bumper lengths meet exactly without hard-body overlap', () => {
    for (const m1 of [1, 3])
      for (const m2 of [0.5, 3]) {
        const p = { ...collisionDefaults(), m1, m2, u1: 1.2, u2: -0.3 },
          a = elasticCollision(p, 0);
        for (let i = 0; i <= 50; i++) {
          const s = elasticCollision(p, a.contactAt + (a.contactDuration * i) / 50),
            length = s.bumperLength - s.compression / 2;
          expect(length).toBeGreaterThan(0);
          expect(s.x1 + s.bodyHalf + length).toBeCloseTo(s.x2 - s.bodyHalf - length, 12);
          expect(s.x2 - s.x1).toBeGreaterThan(2 * s.bodyHalf);
        }
      }
  });
});
