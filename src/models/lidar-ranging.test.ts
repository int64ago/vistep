import { describe, it, expect } from 'vitest';
import {
  lidarRay,
  lidarScan,
  lidarPolar,
  lidarDelay,
  LIDAR_C,
  LIDAR_DEFAULT,
  LIDAR_CYLINDER,
} from './lidar-ranging';
describe('deterministic lidar first returns', () => {
  it('intersects exact walls, partition and cylinder in distance order', () => {
    expect(lidarRay(0).range).toBeCloseTo(6);
    expect(lidarRay(Math.PI).id).toBe('partition');
    const a = Math.atan2(1, 2),
      h = lidarRay(a);
    expect(h.id).toBe('cylinder');
    expect(h.range).toBeCloseTo(Math.sqrt(5) - LIDAR_CYLINDER.radius, 12);
    expect(lidarRay(a, true).range).toBeGreaterThan(h.range);
  });
  it('reconstructs Cartesian points and round trip timing', () => {
    const pts = lidarScan(LIDAR_DEFAULT);
    for (const p of pts) {
      expect(Math.hypot(p.point.x, p.point.y)).toBeCloseTo(p.hit.range, 11);
      expect((lidarDelay(p.range) * LIDAR_C) / 2).toBeCloseTo(p.range, 11);
    }
    expect(lidarPolar(2, Math.PI / 2).y).toBeCloseTo(2);
  });
  it('seeking retains identical noise and thresholds only remove returns', () => {
    const input = { ...LIDAR_DEFAULT, jitter: 1 };
    expect(lidarScan(input, 0.7)).toEqual(
      lidarScan(input).filter((p) => p.angle <= 2 * Math.PI * 0.7),
    );
    const weak = lidarScan({ ...input, threshold: 0.025 });
    expect(weak.filter((p) => p.detected).length).toBeLessThan(weak.length);
    expect(weak.some((p) => p.hit.id === 'cylinder' && !p.detected)).toBe(true);
    expect(() => lidarScan({ ...input, step: 0 })).toThrow();
  });
});
