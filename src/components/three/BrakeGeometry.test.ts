import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import type { StudioContext, StudioObject } from './Studio';
import BrakeStudio from './BrakeStudio';
import { brakeShot, brakeState } from '../../models/brake';
import { BRAKE_LINK, brakeLinkage } from './BrakeGeometry';
const harness = vi.hoisted(() => ({ create: null as null | ((c: StudioContext) => StudioObject) }));
vi.mock('./Studio', () => ({
  default: (props: { create: (c: StudioContext) => StudioObject }) => {
    harness.create = props.create;
    return null;
  },
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => ({ watch: true, chapter: 0 }) }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
describe('rigid brake linkage and framing', () => {
  it('satisfies both fixed-length constraints throughout the complete input travel', () => {
    let prior = -Infinity;
    for (let i = 0; i <= 4000; i++) {
      const p = brakeLinkage(i / 1000),
        dx = p.end[0] - p.start[0],
        dy = p.end[1] - p.start[1];
      expect(Math.hypot(dx, dy)).toBeCloseTo(BRAKE_LINK.length, 12);
      expect(
        Math.hypot(p.start[0] - BRAKE_LINK.pivot[0], p.start[1] - BRAKE_LINK.pivot[1]),
      ).toBeCloseTo(Math.hypot(...BRAKE_LINK.attachment), 12);
      expect(p.start[0]).toBeGreaterThanOrEqual(prior);
      prior = p.start[0];
      expect(p.end[1]).toBe(0);
    }
    expect(brakeLinkage(0).angle).toBeCloseTo(0, 12);
    expect(brakeLinkage(4).angle).toBeGreaterThan(0);
  });
  it('has zero relative velocity along the rigid rod (independent finite difference)', () => {
    for (const s of [0.1, 1, 2, 3, 3.9]) {
      const h = 1e-5,
        a = brakeLinkage(s - h),
        b = brakeLinkage(s + h),
        p = brakeLinkage(s);
      const relative = p.start.map(
        (_, i) => (b.end[i] - a.end[i] - b.start[i] + a.start[i]) / (2 * h),
      );
      const dot = relative.reduce((v, x, i) => v + x * (p.end[i] - p.start[i]), 0);
      expect(Math.abs(dot)).toBeLessThan(1e-9);
    }
  });
  it('fits the actual rotor/base/hose geometry on desktop and the vertically composed phone', () => {
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => ({
          createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          putImageData: () => {},
        }),
      }),
    });
    try {
      for (const compact of [false, true])
        for (const stroke of [0, 2, 4]) {
          vi.stubGlobal('window', { innerWidth: compact ? 320 : 1280 });
          const shot = {
            ...brakeShot(0, 0),
            state: brakeState(stroke, { masterDiameter: 14, bubbleVolume: 100 }),
            focus: 'assembly' as const,
          };
          renderToStaticMarkup(createElement(BrakeStudio, { shot }));
          const scene = new THREE.Scene(),
            root = new THREE.Group(),
            camera = new THREE.PerspectiveCamera(34, compact ? 254 / 238 : 1090 / 440, 0.1, 100),
            controls = { target: new THREE.Vector3() };
          scene.add(root);
          const object = harness.create!({
            scene,
            root,
            camera,
            controls,
            reducedMotion: { matches: false },
          } as unknown as StudioContext);
          object.update?.(0, 0, true);
          camera.lookAt(controls.target);
          camera.updateMatrixWorld();
          root.updateMatrixWorld(true);
          let worst = 0,
            rodBodies = 0;
          const geometries = new Set<THREE.BufferGeometry>(),
            materials = new Set<THREE.Material>();
          root.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              geometries.add(o.geometry);
              (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
                materials.add(m),
              );
              const a = o.geometry.getAttribute('position');
              for (let i = 0; i < a.count; i++) {
                const p = new THREE.Vector3()
                  .fromBufferAttribute(a, i)
                  .applyMatrix4(o.matrixWorld)
                  .project(camera);
                worst = Math.max(worst, Math.abs(p.x), Math.abs(p.y));
              }
              if (
                o.geometry instanceof THREE.CylinderGeometry &&
                o.parent?.name === 'brake-pushrod'
              ) {
                rodBodies++;
                expect(o.geometry.parameters.height).toBe(BRAKE_LINK.length);
                expect(o.parent!.scale.toArray()).toEqual([1, 1, 1]);
                const linkage = brakeLinkage(stroke),
                  master = o.parent!.parent!;
                const ends = [
                  new THREE.Vector3(0, -BRAKE_LINK.length / 2, 0),
                  new THREE.Vector3(0, BRAKE_LINK.length / 2, 0),
                ].map((p) => p.applyMatrix4(o.matrixWorld));
                for (const endpoint of [linkage.start, linkage.end]) {
                  const expected = master.localToWorld(new THREE.Vector3(...endpoint));
                  expect(Math.min(...ends.map((p) => p.distanceTo(expected)))).toBeLessThan(1e-10);
                }
              }
            }
          });
          expect(rodBodies).toBe(1);
          expect(worst).toBeLessThan(0.88001);
          object.dispose?.();
          geometries.forEach((g) => g.dispose());
          materials.forEach((m) => m.dispose());
        }
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
