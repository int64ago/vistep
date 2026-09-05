import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import type { StudioContext, StudioObject } from './Studio';
import EngineStudio from './EngineStudio';
import { engineBoxCorners, engineFrameDistance } from './EngineFraming';
const harness = vi.hoisted(() => ({
  chapter: 0,
  create: null as null | ((c: StudioContext) => StudioObject),
}));
vi.mock('./Studio', () => ({
  default: (props: { create: (c: StudioContext) => StudioObject }) => {
    harness.create = props.create;
    return null;
  },
}));
vi.mock('../lab/Showcase', () => ({
  useShowcase: () => ({ watch: true, chapter: harness.chapter }),
}));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
describe('engine perspective framing regression', () => {
  it('keeps the previously clipped near base corner inside every aspect', () => {
    const corners = engineBoxCorners([-2.25, 0.005, -1.3], [2.25, 0.155, 1.3]);
    for (const aspect of [254 / 292, 1090 / 490, 700 / 490]) {
      const target = new THREE.Vector3(0, 3.35, 0),
        direction = new THREE.Vector3(5.8, 2.95, 12).normalize(),
        camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
      const d = engineFrameDistance(corners, target.toArray(), direction.toArray(), aspect);
      camera.position.copy(target).addScaledVector(direction, d);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      for (const corner of corners) {
        const p = new THREE.Vector3(...corner).project(camera);
        expect(Math.max(Math.abs(p.x), Math.abs(p.y))).toBeLessThanOrEqual(0.880001);
      }
    }
  });
  it('fits vertices of the actual generated assembly at overview/direct-seek poses', () => {
    for (const aspect of [254 / 292, 1090 / 490, 700 / 490])
      for (const angle of [0, Math.PI / 2, 2 * Math.PI, 3.7 * Math.PI]) {
        harness.chapter = angle === 0 ? 0 : 7;
        renderToStaticMarkup(createElement(EngineStudio, { angle, leverage: false }));
        const scene = new THREE.Scene(),
          root = new THREE.Group(),
          camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
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
          visibleWorst = 0,
          vertices = 0;
        const geometries = new Set<THREE.BufferGeometry>(),
          materials = new Set<THREE.Material>();
        root.traverse((o) => {
          if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
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
              let shown = true;
              for (let parent: THREE.Object3D | null = o; parent; parent = parent.parent)
                shown &&= parent.visible;
              if (shown) visibleWorst = Math.max(visibleWorst, Math.abs(p.x), Math.abs(p.y));
              vertices++;
            }
          }
        });
        expect(vertices).toBeGreaterThan(1000);
        expect(worst).toBeLessThan(0.88001);
        expect(visibleWorst).toBeGreaterThan(0.65);
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        object.dispose?.();
      }
  });
});
