import { describe, expect, it } from 'vitest';
import {
  cameraCurtains,
  cameraGeometry,
  cameraMirror,
  cameraPathPoint,
  cameraPose,
  cameraPrism,
  cameraRowExposure,
  cameraShot,
  prismSlopes,
  reflectCameraRay,
} from './slr-mirrorless';
describe('the connected camera section', () => {
  it('reflects the incoming chief ray upward and the two prism facets toward the eye', () => {
    let direction = reflectCameraRay({ x: 1, y: 0 }, Math.PI / 4);
    expect(direction.x).toBeCloseTo(0, 12);
    expect(direction.y).toBeCloseTo(1, 12);
    direction = reflectCameraRay(direction, Math.atan(prismSlopes[0]));
    expect(direction.x).toBeCloseTo(-Math.SQRT1_2);
    expect(direction.y).toBeCloseTo(-Math.SQRT1_2);
    direction = reflectCameraRay(direction, Math.atan(prismSlopes[1]));
    expect(direction.x).toBeCloseTo(1, 12);
    expect(direction.y).toBeCloseTo(0, 12);
    expect(cameraPrism).toHaveLength(5);
    expect(cameraGeometry.prismSecond.y - cameraGeometry.prismFirst.y).toBeCloseTo(
      cameraGeometry.prismSecond.x - cameraGeometry.prismFirst.x,
    );
  });
  it('keeps the mirror hinge and four-bar link lengths closed throughout the lift', () => {
    for (let i = 0; i <= 100; i++) {
      const m = cameraMirror(((i / 100) * Math.PI) / 4);
      const d = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(a.x - b.x, a.y - b.y);
      expect(d(m.pivot, m.end)).toBeCloseTo(cameraGeometry.mirrorLength, 12);
      expect(d(m.drive, m.joint)).toBeCloseTo(cameraGeometry.crankLength, 12);
      expect(d(m.joint, m.attachment)).toBeCloseTo(cameraGeometry.linkLength, 12);
    }
  });
  it('opens the sensor only after the mirror is clear; optical blackout follows the mirror', () => {
    expect(cameraPose('dslr', 0).optical).toBe(true);
    expect(cameraPose('dslr', 0.15).optical).toBe(false);
    for (let i = 0; i <= 1000; i++) {
      const pose = cameraPose('dslr', i / 1000);
      if (pose.curtains.open > 1e-8) expect(pose.mirror.end.y).toBeGreaterThan(1);
    }
    expect(cameraPose('dslr', 1).optical).toBe(true);
  });
  it('gives every row the same exposure duration while both curtains move downward', () => {
    for (const mode of ['dslr', 'mirrorless'] as const)
      for (const row of [0, 0.25, 0.5, 0.75, 1]) {
        const start = (mode === 'dslr' ? 0.28 : 0.3) + 0.17 * row;
        expect(cameraRowExposure(mode, start, row)).toBeCloseTo(0);
        expect(cameraRowExposure(mode, start + 0.16, row)).toBeCloseTo(0.5);
        expect(cameraRowExposure(mode, start + 0.32, row)).toBeCloseTo(1);
      }
    expect(cameraCurtains('dslr', 0).open).toBe(0);
    expect(cameraCurtains('mirrorless', 0).open).toBe(1);
    expect(cameraCurtains('dslr', 0.5).open).toBe(1);
    expect(cameraCurtains('mirrorless', 1).open).toBe(1);
  });
  it('reconstructs seek and live-view states without depending on playback history', () => {
    const seek = cameraShot(2, 0.53);
    for (let c = 0; c < 7; c++) for (let p = 0; p <= 1; p += 0.02) cameraShot(c, p);
    expect(cameraShot(2, 0.53)).toEqual(seek);
    expect(cameraShot(3, 0.8).dslr.mode).toBe('live-view');
    expect(cameraShot(3, 0.8).dslr.optical).toBe(false);
    expect(cameraShot(3, 0.8).dslr.curtains.open).toBe(1);
  });
  it('restores mirrorless live readout only after the return curtain has fully opened', () => {
    for (const phase of [0.88, 0.95]) {
      const pose = cameraPose('mirrorless', phase);
      expect(pose.curtains.open).toBeLessThan(1);
      expect(pose.live).toBe(false);
      expect(cameraShot(5, phase).mirrorless.live).toBe(false);
    }
    expect(cameraPose('mirrorless', 1).curtains.open).toBe(1);
    expect(cameraPose('mirrorless', 1).live).toBe(true);
    expect(cameraShot(5, 1).mirrorless.live).toBe(true);
    for (let i = 0; i <= 1000; i++) {
      const pose = cameraPose('mirrorless', i / 1000);
      if (pose.live) expect(pose.curtains.open).toBe(1);
    }
  });
  it('binds photon markers to the exact polyline and sanitizes numeric boundaries', () => {
    const path = cameraPose('dslr').path;
    expect(cameraPathPoint(path, 0)).toEqual(path[0]);
    expect(cameraPathPoint(path, 1).x).toBeCloseTo(path.at(-1)!.x);
    for (const phase of [-10, 0, 0.14, 0.22, 0.5, 0.75, 1, 10, NaN])
      for (const mode of ['dslr', 'live-view', 'mirrorless'] as const) {
        const pose = cameraPose(mode, phase, Infinity);
        for (const point of pose.path)
          expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
        expect(pose.brightness).toBe(1);
      }
  });
});
