import { describe, it, expect } from 'vitest';
import { camDefaults, camConstraint, camTrajectory, camSample } from './cam-follower';
describe('eccentric cam geometry and unilateral contact', () => {
  it('has a stroke of twice the eccentricity and no stroke at zero eccentricity', () => {
    const p = camDefaults();
    expect(
      camConstraint(p, Math.PI / 2).height - camConstraint(p, (3 * Math.PI) / 2).height,
    ).toBeCloseTo(0.016);
    for (const a of [0, 1, 3])
      expect(camConstraint({ ...p, eccentricity: 0 }, a).velocity).toBeCloseTo(0, 12);
  });
  it('maintains actual circle tangency, including the lateral contact offset', () => {
    const p = camDefaults();
    for (let a = 0; a < Math.PI * 2; a += 0.17) {
      const q = camConstraint(p, a);
      expect(Math.hypot(q.contact.x - q.cam.x, q.contact.y - q.cam.y)).toBeCloseTo(p.radius, 12);
      expect(Math.hypot(q.contact.x, q.contact.y - q.height)).toBeCloseTo(p.roller, 12);
    }
  });
  it('analytic velocity and acceleration match finite differences', () => {
    const p = camDefaults(),
      a = 0.7,
      h = 1e-4,
      w = (p.rpm * Math.PI) / 30,
      q = camConstraint(p, a),
      lo = camConstraint(p, a - h),
      hi = camConstraint(p, a + h);
    expect(q.velocity).toBeCloseTo(((hi.height - lo.height) / (2 * h)) * w, 7);
    expect(q.acceleration).toBeCloseTo(
      ((hi.height - 2 * q.height + lo.height) / h ** 2) * w * w,
      5,
    );
  });
  it('does not invent a tensile cam force when an un-sprung follower separates', () => {
    const p = { ...camDefaults(), rpm: 600, spring: 0 },
      points = camTrajectory(p);
    expect(Math.max(...points.map((q) => q.gap))).toBeGreaterThan(0.002);
    expect(points.some((q) => !q.contact)).toBe(true);
    expect(points.every((q) => q.normal >= 0 && q.gap >= 0)).toBe(true);
  });
  it('the authored stronger spring maintains contact at the same high speed', () => {
    const points = camTrajectory({ ...camDefaults(), rpm: 600 });
    expect(Math.max(...points.map((q) => q.gap))).toBeLessThan(1e-9);
    expect(points.every((q) => q.contact)).toBe(true);
  });
  it('free-flight result converges with event resolution and seek is deterministic', () => {
    const p = { ...camDefaults(), rpm: 600, spring: 0 },
      a = camTrajectory(p, 2, 1440),
      b = camTrajectory(p, 2, 2880);
    for (const time of [0.03, 0.08, 0.15])
      expect(Math.abs(camSample(a, time).height - camSample(b, time).height)).toBeLessThan(0.0001);
    expect(camSample(a, 0.08)).toEqual(camSample(a, 0.08));
  });
});
