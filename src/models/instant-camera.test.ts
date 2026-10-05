import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  IC,
  icCameraFrame,
  icFramePoints,
  IC_FEED_MAX,
  icChemistry,
  icCovered,
  icDirtPositions,
  icFeed,
  icImagePixels,
  icNipGap,
  icPodProfile,
  icPaperPoint,
  icShot,
  icSubject,
} from './instant-camera';
import { instantCameraCover } from './instant-camera-cover';
describe('integral film transport', () => {
  it('keeps both cylinders exactly tangent to opposite sheet surfaces at the nip', () => {
    for (const d of [0, 14, 23, 48, 100, IC_FEED_MAX]) {
      const f = icFeed(d);
      expect(f.topCenter.y - IC.rollerRadius).toBeCloseTo(IC.plane + IC.thickness / 2, 12);
      expect(f.bottomCenter.y + IC.rollerRadius).toBeCloseTo(IC.plane - IC.thickness / 2, 12);
      expect(f.topCenter.y - f.bottomCenter.y - 2 * IC.rollerRadius).toBeCloseTo(IC.thickness, 12);
      expect(f.topAngle * IC.rollerRadius).toBeCloseTo(d, 12);
      expect(-f.bottomAngle * IC.rollerRadius).toBeCloseTo(d, 12);
    }
  });
  it('preserves one physical sheet, length and continuously increasing position', () => {
    for (let d = 0; d <= IC_FEED_MAX; d += 0.5) {
      const a = icPaperPoint(d, 0, 0),
        b = icPaperPoint(d, IC.length, IC.width);
      expect(a.x - b.x).toBeCloseTo(IC.length, 12);
      expect(b.z - a.z).toBeCloseTo(IC.width, 12);
      if (d > 0) expect(a.x - icPaperPoint(d - 0.5, 0, 0).x).toBeCloseTo(0.5, 12);
    }
    expect(icFeed(IC_FEED_MAX).trail).toBeGreaterThan(IC.rollerRadius);
  });
  it('ruptures only when the same leading-edge pod passes through the nip', () => {
    const distance = IC.podCenter - IC.initialLead;
    expect(icFeed(distance - 0.0001).ruptured).toBe(false);
    expect(icFeed(distance).podX).toBe(0);
    expect(icFeed(distance).ruptured).toBe(true);
    expect(icFeed(distance).podHeight).toBe(0);
    for (let d = 0; d < IC_FEED_MAX; d += 0.2) {
      const f = icFeed(d);
      expect(f.podHeight + IC.thickness).toBeLessThanOrEqual(icNipGap(f.podX) + 1e-10);
    }
  });
  it('keeps the entire finite pod and interpolated surfaces below the upper cylinder', () => {
    for (const d of [19, 21, ...Array.from({ length: 651 }, (_, i) => i / 5)]) {
      const f = icFeed(d),
        profile = f.podProfile;
      for (let i = 0; i < profile.length - 1; i++)
        for (const p of [0, 0.25, 0.5, 0.75, 1]) {
          const x = profile[i].x + (profile[i + 1].x - profile[i].x) * p;
          const height = profile[i].height + (profile[i + 1].height - profile[i].height) * p;
          expect(height).toBeGreaterThanOrEqual(0);
          expect(height).toBeLessThanOrEqual((icNipGap(x) - IC.thickness) / 2 + 1e-12);
        }
    }
    expect(icFeed(19).podProfile.find(({ x }) => x === 0)?.height).toBe(0);
    expect(() => icPodProfile(20, 3)).toThrow();
  });
  it('pushes the same trailing edge until the leading edge reaches the driven nip', () => {
    for (const d of [0, 3, 10, 13.999]) {
      const f = icFeed(d);
      expect(f.pickerX).toBeCloseTo(f.trail, 12);
      expect(f.pickerEngaged).toBe(true);
    }
    expect(icFeed(14).pickerEngaged).toBe(false);
    expect(icFeed(60).pickerX).toBe(icFeed(14).pickerX);
  });
  it('spreads behind the nip and conserves reagent across pod, bead, layer and trap', () => {
    let old = 0;
    for (let d = 0; d <= IC_FEED_MAX; d += 0.5) {
      const f = icFeed(d);
      expect(f.coverage).toBeGreaterThanOrEqual(old - 1e-12);
      old = f.coverage;
      expect(f.volume.inPod + f.volume.bead + f.volume.spread + f.volume.inTrap).toBeCloseTo(
        f.volume.total,
        10,
      );
      expect(f.volume.bead).toBeGreaterThanOrEqual(-1e-10);
      if (f.front > IC.imageStart) expect(f.front).toBeLessThanOrEqual(f.lead + 1e-12);
    }
    expect(icFeed(IC_FEED_MAX).coverage).toBeCloseTo(1, 12);
    expect(icFeed(IC_FEED_MAX).volume.inTrap).toBeGreaterThan(0);
  });
  it('repeated dirt marks are separated by one actual roller circumference', () => {
    const marks = icDirtPositions();
    expect(marks.length).toBe(2);
    expect(marks[1] - marks[0]).toBeCloseTo(2 * Math.PI * IC.rollerRadius, 12);
    for (const u of marks) {
      const f = icFeed(u - IC.initialLead, true);
      expect(Math.sin(f.dirtAngle)).toBeCloseTo(-1, 12);
      expect(icCovered(u, IC.dirtV, IC_FEED_MAX, true)).toBe(false);
      expect(icCovered(u, IC.dirtV + 6, IC_FEED_MAX, true)).toBe(true);
    }
    expect(icFeed(IC_FEED_MAX, true).coverage).toBeLessThan(1);
  });
  it('aligns the mirror chief ray with the initially exposed image centre', () => {
    const center = IC.initialLead - IC.imageStart - IC.imageLength / 2;
    expect(IC.mirror.x).toBeCloseTo(center, 12);
    const incoming = [-1, 0],
      normal = [1 / Math.SQRT2, -1 / Math.SQRT2],
      dot = incoming[0] * normal[0] + incoming[1] * normal[1];
    expect(incoming[0] - 2 * dot * normal[0]).toBeCloseTo(0, 12);
    expect(incoming[1] - 2 * dot * normal[1]).toBeCloseTo(-1, 12);
  });
});
describe('dye transfer teaching model', () => {
  it('preserves normalized dye mass and separates light exposure from visible print formation', () => {
    const exposure = icSubject(0.48, 0.5);
    for (const t of [0, 1, 10, 180, 600, 900]) {
      const c = icChemistry(t, exposure);
      for (let k = 0; k < 3; k++) {
        expect(c.fixed[k] + c.received[k] + c.remaining[k]).toBeCloseTo(1, 12);
        expect(c.remaining[k]).toBeGreaterThanOrEqual(0);
      }
    }
    expect(icChemistry(0, exposure).rgb).not.toEqual(exposure);
    expect(icChemistry(900, exposure).rgb[0]).toBeGreaterThan(icChemistry(900, exposure).rgb[1]);
    expect(icChemistry(900, exposure, false).received).toEqual([0, 0, 0]);
  });
  it('does not show a developed image in dry/unprocessed regions', () => {
    expect(icImagePixels(0, 900)).toEqual(icImagePixels(0, 0));
    expect(icChemistry(0, [1, 0, 0], false).rgb).not.toEqual(icChemistry(0, [1, 0, 0], true).rgb);
    expect(icImagePixels(IC_FEED_MAX, 900, true)).not.toEqual(
      icImagePixels(IC_FEED_MAX, 900, false),
    );
  });
  it('seeks reproducibly through feed, rupture, coverage, layer and compressed chemical time', () => {
    const mid = icShot(3, 0.35);
    for (const [c, p] of [
      [6, 1],
      [0, 0],
      [5, 0.8],
      [1, 0.4],
    ])
      icShot(c, p);
    expect(icShot(3, 0.35)).toEqual(mid);
    expect(icShot(1, 0).feedMm).toBe(0);
    expect(icShot(1, 1).feedMm).toBe(icShot(2, 0).feedMm);
    expect(icShot(2, 1).feedMm).toBe(icShot(3, 0).feedMm);
    expect(icShot(3, 1).feedMm).toBe(IC_FEED_MAX);
    expect(icShot(5, 1).seconds).toBe(900);
    expect(icShot(6, 0.4).dirty).toBe(true);
    expect(icShot(6, 0.9).dirty).toBe(false);
  });
  it('rejects nonfinite, out-of-sheet and unbounded image inputs', () => {
    expect(() => icFeed(-1)).toThrow();
    expect(() => icPaperPoint(0, IC.length + 1, 0)).toThrow();
    expect(() => icChemistry(-1, [1, 0, 0])).toThrow();
    expect(() => icImagePixels(0, 0, false, 500)).toThrow();
    expect(() => icShot(NaN, 0)).toThrow();
  });
  it('retains a bounded original cover with the same complete sheet and visible rollers', () => {
    const paths = instantCameraCover();
    expect(paths.length).toBeGreaterThan(300);
    for (const { d } of paths) {
      expect(d).not.toMatch(/NaN|Infinity/);
      const pairs = [...d.matchAll(/(?:M|L)([-\d.]+),([-\d.]+)/g)];
      for (const p of pairs) {
        expect(Number(p[1])).toBeGreaterThanOrEqual(0);
        expect(Number(p[1])).toBeLessThanOrEqual(400);
        expect(Number(p[2])).toBeGreaterThanOrEqual(0);
        expect(Number(p[2])).toBeLessThanOrEqual(230);
      }
    }
  });
});

it('fits true near corners and full paper travel in desktop and phone projections', () => {
  for (const aspect of [0.72, 0.9, 1.3, 2.2, 3])
    for (const detail of [false, true]) {
      const f = icCameraFrame(aspect, detail),
        camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
      camera.position.fromArray(f.position);
      camera.lookAt(...(f.target as [number, number, number]));
      camera.updateMatrixWorld();
      for (const point of icFramePoints(detail)) {
        const p = new THREE.Vector3(...(point as [number, number, number])).project(camera);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(0.880001);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(0.880001);
      }
    }
});
