import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import * as THREE from 'three';
import {
  SUSPENSION,
  simulateSuspension,
  sampleSuspension,
  suspensionPose,
  suspensionInitial,
  suspensionShot,
  sampleSuspensionPair,
} from '../../models/suspension';
import {
  suspensionHardware as H,
  suspensionBearingGeometry,
  suspensionGuideClearance,
  suspensionGuideEnds,
  suspensionDiagramFrame,
} from './suspension-geometry';
const capture = vi.hoisted(() => ({ ref: null as any, props: null as any }));
vi.mock('react', async (original) => {
  const actual = await original<typeof import('react')>();
  return {
    ...actual,
    useRef: (value: any) => {
      const ref = actual.useRef(value);
      capture.ref = ref;
      return ref;
    },
  };
});
vi.mock('../lab/Showcase', () => ({ useShowcase: () => ({ watch: true }) }));
vi.mock('./Studio', () => ({
  default: (props: any) => {
    capture.props = props;
    return null;
  },
}));
import SuspensionStudio from './SuspensionStudio';

function dispose(root: THREE.Object3D) {
  root.traverse((o: any) => {
    o.geometry?.dispose();
    for (const m of [o.material].flat()) m?.dispose();
  });
}

test('the complete sliding-guide cross-section clears the platen for the entire vertical sweep', () => {
  // Separating z planes prove clearance at every time, not merely at sampled frames.
  expect(suspensionGuideClearance()).toBeGreaterThan(0.05);
  expect(H.guideZ + H.guideRadius).toBeLessThan(H.platenZ - H.platenDepth / 2);
  expect(H.guideX - H.guideRadius).toBeGreaterThan(H.guideX - H.bearingWidth / 2);
  const bearing = new THREE.Mesh(
    suspensionBearingGeometry(),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  );
  bearing.updateMatrixWorld(true);
  for (const radius of [0, H.guideRadius])
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const ray = new THREE.Raycaster(
        new THREE.Vector3(radius * Math.cos(a), 1, radius * Math.sin(a)),
        new THREE.Vector3(0, -1, 0),
      );
      expect(ray.intersectObject(bearing)).toHaveLength(0);
    }
  expect(
    new THREE.Raycaster(new THREE.Vector3(0.03, 1, 0), new THREE.Vector3(0, -1, 0)).intersectObject(
      bearing,
    ).length,
  ).toBeGreaterThan(0);
  dispose(bearing);
});

test('all sampled input extremes retain guide engagement, and complete guide ends/base fit the 2D frame', () => {
  for (const stiffness of [12000, 18000, 30000])
    for (const damping of [0, 1400, 6500])
      for (const kind of ['bump', 'ripple', 'flat'] as const)
        for (const frequency of kind === 'ripple'
          ? [1, 1.1, 1.2, 1.3, 1.5, 1.6, 6, 10.4, 14]
          : [10.4])
          for (const amplitude of kind === 'bump'
            ? [0.005, 0.035, 0.045]
            : kind === 'ripple'
              ? [0.005, 0.021, 0.025]
              : [0]) {
            const p = { ...SUSPENSION, stiffness, damping },
              road = { kind, amplitude, frequency };
            const trace = simulateSuspension(
              p,
              road,
              8,
              suspensionInitial(kind === 'flat' ? 0.04 : 0),
            );
            for (const state of trace.states) {
              const pose = suspensionPose(state, p, road),
                ends = suspensionGuideEnds(pose),
                frame = suspensionDiagramFrame(pose);
              if (pose.wheelY - 0.185 <= pose.roadY)
                throw new Error('Lower attachment meets platen');
              // A finite shaft can end inside a slider; retain at least 60 mm engagement.
              if (
                ends.bottom >= pose.wheelY + H.bearingHeight / 2 - 0.06 ||
                ends.top <= pose.wheelY + H.bearingHeight / 2 ||
                ends.bottom <= -0.225
              )
                throw new Error(JSON.stringify({ p, road, state, pose, ends }));
              for (const y of [ends.bottom, ends.top, -0.28, pose.upperMountY + 0.2]) {
                if (frame.y(y) <= 0 || frame.y(y) >= 320)
                  throw new Error(`2D bounds: ${frame.y(y)}`);
              }
            }
          }
}, 30000);

test('actual mesh vertices stay inside perspective margins across watch chapters, aspect ratios and manual extremes', () => {
  const trace = simulateSuspension(),
    a = { state: sampleSuspension(trace, 0), parameters: trace.parameters, road: trace.road };
  renderToStaticMarkup(<SuspensionStudio a={a} b={null} chapter={0} progress={0} />);
  const ref = capture.ref;
  for (const aspect of [1110 / 460, 650 / 460, 262 / 300, 262 / 260]) {
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
      controls = { target: new THREE.Vector3(0, 3.4, 0) };
    camera.position.set(4, 4.5, 11);
    const object = capture.props.create({ root, camera, controls });
    const check = () => {
      object.update();
      root.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      root.traverseVisible((mesh: any) => {
        if (!mesh.isMesh) return;
        const positions = mesh.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          const point = new THREE.Vector3()
            .fromBufferAttribute(positions, i)
            .applyMatrix4(mesh.matrixWorld)
            .project(camera);
          if (
            Math.abs(point.x) >= 0.881 ||
            Math.abs(point.y) >= 0.881 ||
            point.z <= -1 ||
            point.z >= 1
          )
            throw new Error(`Perspective bounds: ${point.toArray()}`);
        }
      });
    };
    for (let chapter = 0; chapter < 8; chapter++) {
      const s = suspensionShot(chapter, 0),
        ta = simulateSuspension(s.parameters, s.road, 8, suspensionInitial(s.initialBody)),
        tb = s.comparison ? simulateSuspension(s.comparison, s.road) : null;
      for (let i = 0; i <= 12; i++) {
        const progress = i / 12,
          shot = suspensionShot(chapter, progress),
          pair = sampleSuspensionPair(
            ta,
            tb,
            chapter === 6 ? (progress / 0.84) * (ta.contactLimit ?? 8) : shot.modelTime,
          );
        ref.current = {
          a: { state: pair.a, parameters: ta.parameters, road: ta.road },
          b: tb && pair.b ? { state: pair.b, parameters: tb.parameters, road: tb.road } : null,
          chapter,
          progress,
          demo: { watch: true },
        };
        check();
      }
    }
    const finalWatch = ref.current;
    check();
    const expectedCamera = camera.position.toArray();
    ref.current = { ...finalWatch, progress: 0.17 };
    check();
    ref.current = finalWatch;
    check();
    expect(camera.position.toArray()).toEqual(expectedCamera);
    const p = { ...SUSPENSION, stiffness: 12000, damping: 0 },
      road = { kind: 'ripple', amplitude: 0.025, frequency: 1 } as const,
      extreme = simulateSuspension(p, road);
    for (const time of [0, 2, 4, 7.92, 8]) {
      ref.current = {
        a: { state: sampleSuspension(extreme, time), parameters: p, road },
        b: null,
        chapter: 0,
        progress: 0,
        demo: { watch: false },
      };
      for (const direction of [new THREE.Vector3(2, 1, 4), new THREE.Vector3(-3, 1, -2)]) {
        camera.position.copy(controls.target).add(direction);
        check();
      }
    }
    dispose(root);
  }
}, 30000);
