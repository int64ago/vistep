import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import * as THREE from 'three';
import { ESC, escapementPose } from '../../models/escapement';
import { ESC_HARDWARE as H, escapementHanger, escapementOverviewFrame } from './EscapementGeometry';

const capture = vi.hoisted(() => ({ ref: null as any, create: null as any, compact: true }));
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
vi.mock('./Studio', () => ({
  default: (props: any) => {
    capture.create = props.create;
    return null;
  },
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => ({ watch: true }) }));
vi.mock('../lab/useCompact', () => ({ useCompact: () => capture.compact }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
import EscapementStudio from './EscapementStudio';
import { EscapementDiagram } from './EscapementDiagram';

function create(aspect = 2) {
  renderToStaticMarkup(<EscapementStudio pose={escapementPose(0)} focus="overview" progress={0} />);
  const root = new THREE.Group(),
    camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
    controls = { target: new THREE.Vector3() },
    object = capture.create({ root, camera, controls }),
    ref = capture.ref;
  const update = (cycles: number, amplitude = 4, length = 1) => {
    ref.current = {
      pose: escapementPose(cycles, amplitude, length),
      focus: 'overview',
      progress: cycles / 4,
      watch: true,
    };
    object.update();
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
  };
  update(0);
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((o: any) => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of [o.material].flat()) if (m) materials.add(m);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };
  return { root, camera, update, dispose };
}

test('actual frame and bearing bores clear both complete shaft cross-sections', () => {
  const rig = create();
  try {
    const frames: THREE.Object3D[] = [],
      bearings: THREE.Object3D[] = [];
    rig.root.traverse((o) => {
      if (o.name === 'escapement-bored-frame') frames.push(o);
      if (o.name === 'escapement-arbor-bearing') bearings.push(o);
    });
    expect(frames).toHaveLength(2);
    expect(bearings).toHaveLength(2);
    for (const y of [0, ESC.height]) {
      for (const radius of [0, H.shaftRadius])
        for (let i = 0; i < 64; i++) {
          const angle = (i * Math.PI) / 32,
            ray = new THREE.Raycaster(
              new THREE.Vector3(radius * Math.cos(angle), y + 2.21 + radius * Math.sin(angle), 0.5),
              new THREE.Vector3(0, 0, -1),
            );
          expect(ray.intersectObjects([...frames, ...bearings])).toHaveLength(0);
        }
      // Real metal remains around the bore: these are drilled supports, not removed beams.
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0.23, y + 2.21, 0.5),
        new THREE.Vector3(0, 0, -1),
      );
      expect(ray.intersectObjects(frames).length).toBeGreaterThan(0);
    }
  } finally {
    rig.dispose();
  }
});

test('the real cord reaches a closed eye attached to the weight through the full travel', () => {
  const rig = create();
  try {
    const rope = rig.root.getObjectByName('escapement-weight-rope')!,
      eye = rig.root.getObjectByName('escapement-weight-eye')!;
    for (let i = 0; i <= 400; i++) {
      const pose = escapementPose(i / 100),
        hanger = escapementHanger(pose);
      rig.update(i / 100);
      const r = new THREE.Box3().setFromObject(rope),
        e = new THREE.Box3().setFromObject(eye);
      expect(r.min.y).toBeCloseTo(e.max.y, 6);
      expect(r.min.y).toBeCloseTo(2.21 + hanger.attachment[1], 10);
      expect(hanger.eyeCentre[1] - H.eyeOuter).toBeLessThan(hanger.bodyTop);
      expect(hanger.eyeCentre[1] - H.eyeInner).toBeGreaterThan(hanger.bodyTop);
      expect(hanger.bodyBottom).toBeGreaterThan(H.baseTop);
    }
    rig.update(0);
    const original = rope.matrixWorld.toArray();
    rig.update(3.9, 5, 1.2);
    rig.update(0);
    expect(rope.matrixWorld.toArray()).toEqual(original);
  } finally {
    rig.dispose();
  }
});

test('the 2D view contains the full base, hanger and bob for every UI limit', () => {
  for (const compact of [false, true]) {
    const frame = escapementOverviewFrame(compact);
    for (const amplitude of [3, 4, 5])
      for (const length of [0.7, 1, 1.2])
        for (let i = 0; i <= 160; i++) {
          const p = escapementPose(i / 40, amplitude, length),
            hanger = escapementHanger(p);
          const points = [
            frame.to([-H.baseWidth / 2, H.baseTop]),
            frame.to([H.baseWidth / 2, H.baseBottom]),
            frame.to([hanger.attachment[0] - H.weightWidth / 2, hanger.bodyTop], ESC.drumZ),
            frame.to([hanger.attachment[0] + H.weightWidth / 2, hanger.bodyBottom], ESC.drumZ),
            frame.to([p.bob[0] - 0.3, p.bob[1] - 0.3], p.bob[2]),
            frame.to([p.bob[0] + 0.3, p.bob[1] + 0.3], p.bob[2]),
          ];
          for (const [x, y] of points)
            if (x < 8 || x > frame.width - 8 || y < frame.top + 8 || y > frame.bottom - 8)
              throw new Error(`2D hardware clipped: ${x},${y}`);
        }
    capture.compact = compact;
    const markup = renderToStaticMarkup(
      <EscapementDiagram pose={escapementPose(0)} focus="overview" />,
    );
    expect(markup).toContain('data-esc-drive="true"');
    expect(markup).toContain('data-esc-eye="true"');
    const base = markup.match(/<rect data-esc-base="true"[^>]+>/)![0],
      y = +base.match(/\sy="([^"]+)"/)![1],
      height = +base.match(/\sheight="([^"]+)"/)![1];
    expect(y + height).toBeLessThan(frame.bottom - 8);
  }
});

test('actual new hardware stays within perspective margins through all allowed extrema', () => {
  for (const aspect of [262 / 320, 1090 / 450, 600 / 450, 262 / 420]) {
    const rig = create(aspect);
    try {
      for (const amplitude of [3, 4, 5])
        for (const length of [0.7, 1, 1.2])
          for (let i = 0; i <= 64; i++) {
            rig.update(i / 16, amplitude, length);
            rig.root.traverseVisible((mesh: any) => {
              if (!mesh.isMesh) return;
              const positions = mesh.geometry.getAttribute('position');
              for (let j = 0; j < positions.count; j++) {
                const p = new THREE.Vector3()
                  .fromBufferAttribute(positions, j)
                  .applyMatrix4(mesh.matrixWorld)
                  .project(rig.camera);
                if (Math.abs(p.x) > 0.86 || Math.abs(p.y) > 0.86 || p.z <= -1 || p.z >= 1)
                  throw new Error(`Actual hardware outside camera: ${p.toArray()}`);
              }
            });
          }
    } finally {
      rig.dispose();
    }
  }
}, 30000);
