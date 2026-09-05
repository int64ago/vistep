import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  electricalBoxCorners,
  electricalMotionBounds,
  fitElectricalCamera,
} from './electrical-framing';
import { generatorDefaults, generatorShot, generatorState } from '../../models/electric-generator';
import {
  electricAC,
  electricDC,
  electricDefaults,
  electricInstant,
  electricShot,
} from '../../models/transformer-electric';
import {
  motorBreakdownSlip,
  motorSample,
  motorShot,
  motorSteadySlip,
} from '../../models/induction-motor';

const refs = vi.hoisted(() => [] as { current: unknown }[]);
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useRef: (current: unknown) => {
    const ref = { current };
    refs.push(ref);
    return ref;
  },
}));
import ElectricGeneratorStudio from './ElectricGeneratorStudio';
import ElectricTransformerStudio from './ElectricTransformerStudio';
import InductionMotorStudio from './InductionMotorStudio';

type Shot =
  ReturnType<typeof generatorShot> | ReturnType<typeof electricShot> | ReturnType<typeof motorShot>;

function vertices(root: THREE.Group, camera: THREE.PerspectiveCamera) {
  root.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const point = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    instance = new THREE.Matrix4();
  let extent = 0,
    count = 0;
  root.traverse((child) => {
    for (let p: THREE.Object3D | null = child; p; p = p.parent) if (!p.visible) return;
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
    const positions = child.geometry.getAttribute('position');
    if (!positions) return;
    for (let i = 0; i < (child instanceof THREE.InstancedMesh ? child.count : 1); i++) {
      matrix.copy(child.matrixWorld);
      if (child instanceof THREE.InstancedMesh) {
        child.getMatrixAt(i, instance);
        matrix.multiply(instance);
      }
      for (let k = 0; k < positions.count; k++) {
        point.fromBufferAttribute(positions, k).applyMatrix4(matrix).project(camera);
        if (!Number.isFinite(point.x + point.y + point.z) || Math.abs(point.z) > 1)
          throw new Error('Nonfinite vertex or near/far plane clipping');
        extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y));
        count++;
      }
    }
  });
  return { extent, count };
}

describe('electrical apparatus perspective framing', () => {
  it('fits near corners, arbitrary camera directions and changing aspect ratios', () => {
    const box = new THREE.Box3(new THREE.Vector3(-3, 0, -2), new THREE.Vector3(3, 4, 5));
    for (const aspect of [0.6, 1, 2, 3])
      for (const phi of [Math.PI * 0.13, 1, Math.PI * 0.48])
        for (const theta of [0, 1.3, Math.PI, 5]) {
          const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
            target = new THREE.Vector3();
          camera.position.setFromSpherical(new THREE.Spherical(10, phi, theta));
          fitElectricalCamera(camera, target, box);
          for (const p of electricalBoxCorners(box)) {
            p.project(camera);
            expect(Math.max(Math.abs(p.x), Math.abs(p.y))).toBeLessThanOrEqual(0.880001);
            expect(Math.abs(p.z)).toBeLessThan(1);
          }
        }
  });

  it('reserves a full moving rotor turn, instances, hidden parts and intermediate yaw extrema', () => {
    const root = new THREE.Group(),
      rotor = new THREE.Group();
    root.position.y = 1.5;
    root.add(rotor);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 4));
    blade.position.set(0.4, 1.2, 2);
    rotor.add(blade);
    const hidden = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    hidden.position.x = -4;
    hidden.visible = false;
    root.add(hidden);
    const bounds = electricalMotionBounds(root, [rotor], [-0.12, 0.08]);
    for (let yaw = -0.12; yaw <= 0.08; yaw += 0.01)
      for (let angle = 0; angle < Math.PI * 2; angle += 0.077) {
        root.rotation.y = yaw;
        rotor.rotation.z = angle;
        root.updateMatrixWorld(true);
        for (const p of electricalBoxCorners(blade.geometry.boundingBox!))
          expect(bounds.containsPoint(p.applyMatrix4(blade.matrixWorld))).toBe(true);
      }
  });

  it('does not depend on the previous camera distance or accept an invalid domain', () => {
    const box = new THREE.Box3(new THREE.Vector3(-3, 0, -2), new THREE.Vector3(3, 4, 5));
    const target = box.getCenter(new THREE.Vector3()),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.copy(target).add(new THREE.Vector3(2, 3, 10));
    fitElectricalCamera(camera, target, box);
    const first = camera.position.clone();
    camera.position.sub(target).multiplyScalar(4).add(target);
    fitElectricalCamera(camera, target, box);
    expect(camera.position.distanceTo(first)).toBeLessThan(1e-10);
    camera.aspect = 0;
    expect(() => fitElectricalCamera(camera, target, box)).toThrow();
  });
});

const generatorManual = () => {
  const shots: Shot[] = [];
  for (const angle of [0, 45, 90, 135, 180, 225, 270, 315, 360])
    for (const rpm of [-720, 0, 720])
      for (const connected of [false, true])
        for (const high of [false, true]) {
          const input = {
            ...generatorDefaults,
            angle: (angle * Math.PI) / 180,
            rpm,
            connected,
            field: high ? 0.8 : 0,
            load: high ? 2 : 32,
          };
          shots.push({
            ...generatorShot(5, 0.5),
            input,
            state: generatorState(input),
            showArea: true,
            showForces: true,
          });
        }
  return shots;
};
const transformerManual = () => {
  const shots: Shot[] = [];
  for (const secondaryTurns of [12, 24, 48])
    for (const frequency of [40, 100])
      for (const connected of [false, true])
        for (const losses of [false, true])
          for (const loadOhms of [4, 40])
            for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
              const input = {
                  ...electricDefaults,
                  secondaryTurns,
                  frequency,
                  connected,
                  losses,
                  loadOhms,
                },
                ac = electricAC(input);
              shots.push({
                ...electricShot(0, 0),
                input,
                ac,
                phase,
                instant: electricInstant(ac, phase),
              });
            }
  for (const turns of [12, 48])
    for (const time of [0, 0.03125])
      shots.push({ ...electricShot(5, 0.5), dcTime: time, instant: electricDC(time, turns) });
  return shots;
};
const motorManual = () => {
  const shots: Shot[] = [];
  for (const slip of [0, 1, motorBreakdownSlip, motorSteadySlip(2)!, motorSteadySlip(6)!])
    for (const phase of [0, 0.5 * Math.PI, Math.PI, 1.5 * Math.PI, 2 * Math.PI])
      for (const direction of [-1, 1] as const)
        shots.push({
          ...motorShot(2, 0),
          state: motorSample(slip, phase, direction * (1 - slip) * phase, direction),
          showBarCurrent: true,
        });
  return shots;
};

for (const spec of [
  {
    slug: 'generator',
    component: ElectricGeneratorStudio,
    shot: generatorShot,
    manual: generatorManual,
    manualHeight: (width: number) => (width < 320 ? 296 : 326),
    desktop: [1150, 390],
    height: (c: number) => ([2, 3, 4, 7].includes(c) ? 230 : 252),
  },
  {
    slug: 'transformer',
    component: ElectricTransformerStudio,
    shot: electricShot,
    manual: transformerManual,
    manualHeight: (width: number) => (width < 320 ? 284 : 312),
    desktop: [(1150 * 1.35) / 2.35, 350],
    height: () => 220,
  },
  {
    slug: 'motor',
    component: InductionMotorStudio,
    shot: motorShot,
    manual: motorManual,
    manualHeight: () => 248,
    desktop: [(1150 * 1.55) / 2.55, 400],
    height: (c: number) => (c === 2 ? 230 : 210),
  },
])
  it(`${spec.slug}: every chapter and manual boundary fits actual vertices, including resize and orbit`, () => {
    // Text is not rasterized. This regression inspects actual geometry and camera math only.
    vi.stubGlobal('document', {
      documentElement: { lang: 'zh' },
      createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillText() {} }) }),
    });
    let samples = 0,
      projected = 0,
      worst = 0;
    try {
      for (const width of [spec.desktop[0], 278, 348, 598]) {
        const narrow = width !== spec.desktop[0],
          initial = spec.shot(0, 0);
        const element = (
          spec.component as (props: {
            shot: Shot;
            narrow: boolean;
          }) => ReturnType<typeof ElectricGeneratorStudio>
        )({ shot: initial, narrow });
        const ref = refs.at(-1)!,
          props = element.props;
        const root = new THREE.Group(),
          camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.fromArray(props.cameraPosition);
        const listeners = new Set<() => void>();
        const controls = {
          target: new THREE.Vector3(...props.target),
          enabled: false,
          minDistance: 0,
          maxDistance: Infinity,
          addEventListener: (_: string, fn: () => void) => listeners.add(fn),
          removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
        } as unknown as OrbitControls;
        const object = props.create({ root, camera, controls });
        const measure = (shot: Shot) => {
          ref.current = shot;
          const height = narrow
            ? controls.enabled
              ? spec.manualHeight(width)
              : spec.height(shot.chapter)
            : spec.desktop[1];
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          object.update?.(0, 0, true);
          const result = vertices(root, camera);
          expect(
            result.extent,
            `${spec.slug} ${width} chapter ${shot.chapter}`,
          ).toBeLessThanOrEqual(0.880001);
          projected += result.count;
          worst = Math.max(worst, result.extent);
          samples++;
        };
        for (let chapter = 0; chapter < 8; chapter++)
          for (let k = 0; k <= 8; k++) measure(spec.shot(chapter, k / 8));
        // Seek backwards and compare identical projected state, without frame history.
        measure(spec.shot(7, 0.5));
        const end = camera.position.clone();
        measure(spec.shot(0, 0));
        measure(spec.shot(7, 0.5));
        expect(camera.position.distanceTo(end)).toBeLessThan(1e-9);
        controls.enabled = true;
        for (const shot of spec.manual()) measure(shot);
        for (const phi of [Math.PI * 0.13, 1, Math.PI * 0.48])
          for (const theta of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
            camera.position
              .copy(controls.target)
              .add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(10, phi, theta)));
            listeners.forEach((listener) => listener());
            measure(spec.manual().at(-1)!);
          }
        object.dispose?.();
        expect(listeners.size).toBe(0);
        const materials = new Set<THREE.Material>(),
          geometries = new Set<THREE.BufferGeometry>();
        root.traverse((child) => {
          if (child instanceof THREE.InstancedMesh) child.dispose();
          if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            geometries.add(child.geometry);
            (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) =>
              materials.add(m),
            );
          }
        });
        materials.forEach((m) => m.dispose());
        geometries.forEach((g) => g.dispose());
      }
      console.info(
        `${spec.slug}: ${samples} states, ${projected} actual vertex projections, max |NDC xy| ${worst.toFixed(6)}`,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  }, 60000);
