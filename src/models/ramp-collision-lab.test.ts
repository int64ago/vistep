import { describe, it, expect } from 'vitest';
import { rampCollisionSetup, rampCollisionState, rampBallPath } from './ramp-collision-lab';
describe('ramp collision measurement', () => {
  it('mass weighted ranges agree only for matched baseline release', () => {
    const s = rampCollisionSetup();
    expect(s.before).toBeCloseTo(s.after, 12);
    expect(s.actualMomentum).toBeCloseTo(s.postMomentum, 12);
    expect(s.M).toBeLessThan(s.P);
    expect(s.P).toBeLessThan(s.N);
  });
  it('a lower collision release spoils range comparison but not true momentum conservation', () => {
    const s = rampCollisionSetup(0.08, 0.12);
    expect(s.after).toBeLessThan(s.before);
    expect(s.actualMomentum).toBeCloseTo(s.postMomentum, 12);
    expect(s.P).toBe(rampCollisionSetup().P);
  });
  it('preserves momentum for all supported masses and restitution values', () => {
    for (const m of [0.01, 0.02, 0.035])
      for (const e of [0, 0.7, 1]) {
        const s = rampCollisionSetup(0.12, 0.12, m, e);
        expect(s.actualMomentum).toBeCloseTo(s.postMomentum, 12);
        expect(s.v1).toBeGreaterThan(0);
        expect(0.5 * s.incidentMass * s.v1 ** 2 + 0.5 * m * s.v2 ** 2).toBeLessThanOrEqual(
          0.5 * s.incidentMass * s.u ** 2 + 1e-12,
        );
      }
  });
  it('centers touch with no overlap at impact and share launch origin', () => {
    const s = rampCollisionSetup(),
      a = rampCollisionState(s, s.ramp.duration),
      b = rampCollisionState(s, s.ramp.duration + (2 * s.radius) / s.v1);
    expect(a.target.x - a.incident.x).toBeCloseTo(2 * s.radius, 12);
    expect(a.target.y).toBe(a.incident.y);
    expect(b.incident.x).toBeCloseTo(0, 12);
    expect(b.incident.y).toBe(0);
  });
  it('both projectiles have equal flight duration despite different launch times', () => {
    const s = rampCollisionSetup(),
      q = rampCollisionState(s, s.endTime + 1);
    expect(q.incident.x).toBeCloseTo(s.M);
    expect(q.target.x).toBeCloseTo(s.N);
    expect(q.incident.y).toBeCloseTo(s.drop);
    expect(q.target.y).toBeCloseTo(s.drop);
    expect(q.incident.time).toBe(q.target.time);
  });
  it('trajectory endpoint equals landing marker and invalid masses reject', () => {
    const s = rampCollisionSetup();
    expect(rampBallPath(s, s.v2).at(-1)!.x).toBeCloseTo(s.N);
    expect(() => rampCollisionSetup(0.12, 0.12, 0.04)).toThrow();
  });
});
