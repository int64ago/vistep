import { describe, it, expect } from 'vitest';
import {
  armKinematics,
  flickDrop,
  ARM_RELEASE,
  textbookFlick,
  wristPhone,
  javelinRelease,
} from './arm-motion-lab';
describe('articulated arm and measured estimates', () => {
  it('keeps upper arm, forearm and hand lengths fixed', () => {
    for (const t of [0, 0.12, 0.3, 0.5]) {
      const s = armKinematics(t);
      for (let i = 0; i < 3; i++)
        expect(
          Math.hypot(s.points[i + 1].x - s.points[i].x, s.points[i + 1].y - s.points[i].y),
        ).toBeCloseTo([0.25, 0.23, 0.17][i], 12);
    }
  });
  it('velocity and acceleration are derivatives of the full chain', () => {
    const t = 0.34,
      dt = 0.000001,
      s = armKinematics(t),
      l = armKinematics(t - dt),
      r = armKinematics(t + dt);
    expect((r.tip.x - l.tip.x) / (2 * dt)).toBeCloseTo(s.velocity.x, 7);
    expect((r.tip.y - l.tip.y) / (2 * dt)).toBeCloseTo(s.velocity.y, 7);
    expect((r.velocity.x - l.velocity.x) / (2 * dt)).toBeCloseTo(s.acceleration.x, 6);
    expect((r.velocity.y - l.velocity.y) / (2 * dt)).toBeCloseTo(s.acceleration.y, 6);
  });
  it('component velocities sum as vectors, not magnitudes', () => {
    const s = armKinematics(0.36),
      v = s.components.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
    expect(v.x).toBeCloseTo(s.velocity.x);
    expect(v.y).toBeCloseTo(s.velocity.y);
    expect(s.components.reduce((a, b) => a + Math.hypot(b.x, b.y), 0)).toBeGreaterThan(s.speed);
  });
  it('drop release is position/velocity continuous then accelerates downward', () => {
    const a = armKinematics(ARM_RELEASE),
      d = flickDrop(ARM_RELEASE),
      e = flickDrop(ARM_RELEASE + 0.1);
    expect(d.x).toBeCloseTo(a.tip.x);
    expect(d.vy).toBeCloseTo(a.velocity.y);
    expect(e.x - d.x).toBeCloseTo(d.vx * 0.1);
    expect(e.vy - d.vy).toBeCloseTo(-0.98);
  });
  it('reproduces the source estimates without implying independent precision', () => {
    const s = textbookFlick();
    expect(s.speed).toBe(6.5);
    expect(s.normal).toBeCloseTo(248.5294118);
    expect(s.textbookRounded).toBe(256);
    expect(s.scaledWrist).toBeCloseTo(258.133333);
  });
  it('phone at rest has nonzero raw gravity reading but zero coordinate acceleration', () => {
    const s = wristPhone(0);
    expect(Math.hypot(s.rawAlong, s.rawAcross)).toBeCloseTo(9.8);
    expect(Math.hypot(s.coordinateAlong, s.coordinateAcross)).toBe(0);
  });
  it('run-up contribution adds to the release velocity vector', () => {
    const a = javelinRelease(0),
      b = javelinRelease(4);
    expect(b.state.velocity.x - a.state.velocity.x).toBeCloseTo(4);
    expect(b.state.velocity.y).toBeCloseTo(a.state.velocity.y);
  });
});
