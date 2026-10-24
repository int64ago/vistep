import { describe, it, expect } from 'vitest';
import {
  cutString,
  sandbagCone,
  centripetalRig,
  forceLever,
  funnelOrbit,
} from './centripetal-force-lab';
describe('centripetal experimental mechanisms', () => {
  it('cut releases along tangent with continuous velocity, not radially', () => {
    const a = cutString(0.8),
      b = cutString(1);
    expect(a.x * a.vx + a.y * a.vy).toBeCloseTo(0);
    expect(b.x - a.x).toBeCloseTo(a.vx * 0.2);
    expect(b.tension).toBe(0);
  });
  it('conical bag tension contains gravity and is not identical to centripetal force', () => {
    const s = sandbagCone(1);
    expect(Math.hypot(s.radius, s.vertical)).toBeCloseTo(0.8);
    expect((s.tension * s.vertical) / 0.8).toBeCloseTo(s.gravity);
    expect((s.tension * s.radius) / 0.8).toBeCloseTo(s.force);
    expect(s.tension).toBeGreaterThan(s.force);
  });
  it('slow bag cannot sustain an arbitrary horizontal circular radius', () => {
    expect(sandbagCone(1, 0.08, 0.8, 2).radius).toBe(0);
    expect(sandbagCone(1, 0.08, 0.8, 0).tension).toBeCloseTo(0.784);
  });
  it('isolated mass/radius/frequency comparisons give1:2,1:2,1:4 force ratios', () => {
    const b = centripetalRig();
    expect(centripetalRig(0.08).force / b.force).toBeCloseTo(2);
    expect(centripetalRig(0.04, 0.3).force / b.force).toBeCloseTo(2);
    expect(centripetalRig(0.04, 0.15, 12).force / b.force).toBeCloseTo(4);
  });
  it('calibrated lever has fixed length and force/spring torque equilibrium', () => {
    for (const f of [0, 0.216, 0.432, 0.864, 3.5]) {
      const s = forceLever(f);
      expect(Math.hypot(s.endX - s.pivot, s.endZ - s.zp)).toBeCloseTo(s.leverLength, 12);
      expect(Math.hypot(s.stopX - s.pivot, s.stopZ - s.zp)).toBeCloseTo(s.arm, 12);
      expect(s.torque).toBeCloseTo(f * s.arm * Math.cos(s.angle), 12);
    }
  });
  it('funnel support cancels vertical weight while horizontal resultant supplies orbit', () => {
    const s = funnelOrbit(0.4, 0.2, Math.PI / 3);
    expect(s.normal * Math.cos(s.wallAngle)).toBeCloseTo(s.gravity);
    expect(s.normal * Math.sin(s.wallAngle)).toBeCloseTo(s.force);
    expect(0.03 * s.omega * s.omega * s.radius).toBeCloseTo(s.force);
  });
  it('funnel ball centre has normal-radius clearance from cone', () => {
    const s = funnelOrbit(0.4);
    expect((s.height - s.radius * Math.tan(s.wallAngle)) * Math.cos(s.wallAngle)).toBeCloseTo(
      s.ballRadius,
    );
  });
  it('the displayed bag forces produce the independently differentiated orbit acceleration', () => {
    const h = 0.0001;
    for (const length of [0.65, 0.8, 1])
      for (const omega of [0, 2, 4.5, 6])
        for (const time of [0.2, 0.7, 1.9]) {
          const s = sandbagCone(time, 0.08, length, omega);
          const before = sandbagCone(time - h, 0.08, length, omega);
          const after = sandbagCone(time + h, 0.08, length, omega);
          expect(s.tensionVector.x / 0.08).toBeCloseTo((after.x - 2 * s.x + before.x) / h ** 2, 5);
          expect(s.tensionVector.y / 0.08).toBeCloseTo((after.y - 2 * s.y + before.y) / h ** 2, 5);
          expect(s.tensionVector.z - s.gravity).toBe(0);
          expect(Math.hypot(...Object.values(s.tensionVector))).toBeCloseTo(s.tension, 12);
        }
  });
});
