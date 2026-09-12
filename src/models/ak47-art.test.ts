import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  AK47_ASSEMBLY as A,
  ak47SpringPoint,
  ak47ArtPosition,
  AK47_SURFACES,
  ak47SurfaceGeometry,
} from './ak47-art';
import { ak47State, AK47_MODEL } from './ak47';
import {
  createAk47,
  fitAk47Camera,
  ak47FramePoints,
  type Ak47Visual,
} from '../components/three/Ak47Studio';
import type { StudioContext } from '../components/three/Studio';
import { ak47ProjectedArt, ak47TeachingDetails } from './ak47-cover';
import { ak47Compare } from './ak47';
describe('physical-object AK artwork', () => {
  it('keeps visible motion cues and linked marks in the same 3D and fallback states', () => {
    const still = ak47ProjectedArt(320, 245, ak47State(0), 0);
    expect(
      still.paths.filter((p) => p.part.includes('observation-mark')).every((p) => p.opacity === 0),
    ).toBe(true);
    expect(
      still.paths.some((p) => p.part === 'velocity-arrow' || p.part === 'gas-energy-highlight'),
    ).toBe(false);
    const { outward, returning } = ak47Compare(0.5),
      a = ak47TeachingDetails(outward),
      b = ak47TeachingDetails(returning);
    for (let i = 0; i < a.marks.length; i++)
      for (let axis = 0; axis < 3; axis++)
        expect(a.marks[i].point[axis]).toBeCloseTo(b.marks[i].point[axis], 10);
    expect(a.arrow.direction).toBe(-1);
    expect(b.arrow.direction).toBe(1);
    const spacing =
      ak47TeachingDetails(ak47State(0)).marks[1].point[0] -
      ak47TeachingDetails(ak47State(0)).marks[0].point[0];
    for (const state of [ak47State(0.08), outward, returning, ak47State(1)]) {
      const details = ak47TeachingDetails(state),
        art = ak47ProjectedArt(300, 230, state, 1, true, undefined, true);
      expect(details.marks[1].point[0] - details.marks[0].point[0]).toBeCloseTo(spacing, 12);
      const arrows = art.paths.filter((p) => p.part === 'velocity-arrow'),
        energy = art.paths.filter((p) => p.part === 'gas-energy-highlight');
      expect(arrows.length).toBe(details.arrow.visible ? 1 : 0);
      expect(energy.length).toBe(state.drive > 0 ? 1 : 0);
      if (energy.length) expect(energy[0].opacity).toBeCloseTo(details.gas.opacity, 12);
      expect(art.paths.filter((p) => p.part.includes('observation-mark'))).toHaveLength(2);
      for (const p of [...arrows, ...energy]) {
        const points = [...p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)];
        for (const [, x, y] of points) {
          expect(Number(x)).toBeGreaterThan(0);
          expect(Number(x)).toBeLessThan(300);
          expect(Number(y)).toBeGreaterThan(0);
          expect(Number(y)).toBeLessThan(230);
        }
      }
    }
    const comparison = ak47ProjectedArt(300, 230, outward, 1, true, returning);
    expect(comparison.paths.filter((p) => p.part === 'velocity-arrow')).toHaveLength(2);
    expect(comparison.paths.filter((p) => p.part.includes('observation-mark'))).toHaveLength(4);
    expect(comparison.paths.some((p) => p.part === 'gas-energy-highlight')).toBe(false);
  });
  it('keeps spring endpoints connected to its fixed anchor and moving carrier', () => {
    for (let i = 0; i <= 1000; i++) {
      const x = i / 1000,
        a = ak47SpringPoint(0, x),
        b = ak47SpringPoint(1, x);
      expect(a).toEqual([A.rear, A.axisY, 0]);
      expect(b[0]).toBeCloseTo(A.carrier - A.carrierLength / 2 + ak47ArtPosition(x), 10);
      expect(b[1]).toBeCloseTo(A.axisY, 10);
      expect(b[2]).toBeCloseTo(0, 10);
      expect(b[0] - a[0]).toBeGreaterThan(0.27);
    }
  });
  it('builds finite closed exterior surfaces', () => {
    for (const p of AK47_SURFACES) {
      const g = ak47SurfaceGeometry(p.key, p.depth);
      g.computeBoundingBox();
      for (const v of g.attributes.position.array) expect(Number.isFinite(v)).toBe(true);
      expect(g.boundingBox!.max.z - g.boundingBox!.min.z).toBeGreaterThan(p.depth);
      g.dispose();
    }
  });
  it('fits actual assembly vertices in full and declared close views across phone aspects', () => {
    for (const aspect of [230 / 230, 300 / 230, 320 / 245, 760 / 360, 760 / 295])
      for (const compare of [false, true])
        for (const closeup of [false, true]) {
          if (compare && !closeup) continue;
          const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
            root = new THREE.Group();
          camera.position.set(2.7, 3.1, 13);
          const controls = Object.assign(new THREE.EventDispatcher(), {
            target: new THREE.Vector3(),
            minDistance: 0,
            maxDistance: 0,
          });
          const visual: Ak47Visual = {
            state: ak47State(0.2),
            compare: compare ? ak47State(0.8) : undefined,
            closeup,
            reveal: closeup ? 1 : 0,
            input: false,
            narrow: aspect < 1.5,
          };
          const object = createAk47({ current: visual }, {
            root,
            camera,
            controls,
            scene: new THREE.Scene(),
          } as unknown as StudioContext);
          for (const p of [0, 0.16, AK47_MODEL.peakProgress, 0.8, 1]) {
            visual.state = ak47State(p);
            object.update!(0, 0, true);
            root.updateMatrixWorld(true);
            camera.updateProjectionMatrix();
            const target = controls.target;
            fitAk47Camera(camera, target, ak47FramePoints(closeup, compare));
            root.traverse((o) => {
              if (!(o instanceof THREE.Mesh)) return;
              let visible = true,
                parent: THREE.Object3D | null = o;
              while (parent) {
                visible &&= parent.visible;
                parent = parent.parent;
              }
              if (!visible) return;
              // Wide exterior intentionally leaves the declared detail view. Internal assemblies must fit.
              if (
                closeup &&
                ![
                  'carrier-mass',
                  'linked-piston-rod',
                  'piston-face',
                  'continuous-return-spring',
                  'spring-anchor',
                  'context-rail',
                  'carrier-observation-mark',
                  'piston-observation-mark',
                ].includes(o.name)
              )
                return;
              const pos = o.geometry.attributes.position;
              let maxX = 0,
                maxY = 0;
              for (let i = 0; i < pos.count; i++) {
                const ndc = new THREE.Vector3()
                  .fromBufferAttribute(pos, i)
                  .applyMatrix4(o.matrixWorld)
                  .project(camera);
                maxX = Math.max(maxX, Math.abs(ndc.x));
                maxY = Math.max(maxY, Math.abs(ndc.y));
              }
              expect(maxX, o.name).toBeLessThan(0.97);
              expect(maxY, o.name).toBeLessThan(0.97);
            });
          }
          object.dispose!();
          root.traverse((o) => {
            if (o instanceof THREE.Mesh) o.geometry.dispose();
          });
        }
  });
});
