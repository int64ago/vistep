import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import { box, material, tube } from './parts';
import { t } from '../../i18n';
import {
  AK47_ASSEMBLY as A,
  AK47_SURFACES,
  AK47_ROUND_SURFACES,
  AK47_BOX_SURFACES,
  ak47SurfaceGeometry,
  ak47SpringPoint,
} from '../../models/ak47-art';
import { AK47_MODEL, type Ak47Sample } from '../../models/ak47';
import { AK47_OBSERVATION_MARKS, ak47TeachingDetails } from '../../models/ak47-cover';
import Ak47Flat from './Ak47Flat';
export type Ak47Visual = {
  state: Ak47Sample;
  reveal: number;
  closeup: boolean;
  compare?: Ak47Sample;
  input: boolean;
  narrow: boolean;
};
export default function Ak47Studio({ visual }: { visual: Ak47Visual }) {
  const live = useRef(visual);
  live.current = visual;
  return (
    <Studio
      cameraPosition={[3.3, 5.5, 14]}
      target={[0, 1.8, 0]}
      span={10}
      fitHeight={4.2}
      exposure={0.8}
      label={t('AK-47 实物外观与相连的导气活塞、枪机框和回位簧')}
      fallback={<Ak47Flat visual={visual} />}
      create={(c) => createAk47(live, c)}
    />
  );
}
function woodTexture() {
  const w = 512,
    h = 256,
    data = new Uint8Array(w * h * 4);
  const hash = (x: number, y: number) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const drift =
        7 * Math.sin(x * 0.005 + Math.sin(y * 0.012)) + 2.3 * Math.sin(x * 0.017 + y * 0.011);
      const grain =
        Math.pow(Math.abs(Math.sin(y * 0.18 + drift + 1.2 * Math.sin(y * 0.049))), 18) * 0.09;
      const cloud =
          0.022 * Math.sin(x * 0.011 + y * 0.024) + 0.018 * Math.sin(x * 0.004 - y * 0.041),
        noise = (hash(x, y) - 0.5) * 0.022;
      const shade = 1 - grain + cloud + noise,
        i = (y * w + x) * 4;
      data[i] = 108 * shade;
      data[i + 1] = 68 * shade;
      data[i + 2] = 39 * shade;
      data[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, w, h);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.37, 0.59);
  texture.needsUpdate = true;
  return texture;
}
function steelTexture() {
  const w = 256,
    h = 128,
    data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453,
        noise = n - Math.floor(n),
        v = 173 + noise * 20 + 6 * Math.sin(x * 0.15 + y * 0.02),
        i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, w, h);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}
class SpringCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private relative: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(ak47SpringPoint(t, this.relative));
  }
}
export function ak47FramePoints(closeup = false, compare = false, input = false) {
  const points: THREE.Vector3[] = [];
  const ranges = closeup
    ? [
        [-2.6, input ? 3.1 : 1.85],
        [compare ? 1.16 : 1.62, compare ? 2.87 : 2.5],
        [-0.32, 0.32],
      ]
    : [
        [-4.5, 4.4],
        [0.0, 2.65],
        [-0.43, 0.43],
      ];
  for (const x of ranges[0])
    for (const y of ranges[1]) for (const z of ranges[2]) points.push(new THREE.Vector3(x, y, z));
  return points;
}
export function fitAk47Camera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  points: THREE.Vector3[],
  direction?: THREE.Vector3,
) {
  const dir = (direction ?? camera.position.clone().sub(target)).normalize();
  const center = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()),
    right = new THREE.Vector3().crossVectors(camera.up, dir).normalize(),
    up = new THREE.Vector3().crossVectors(dir, right).normalize(),
    tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = 2.8 / (2 * tan);
  for (const p of points) {
    const v = p.clone().sub(center),
      z = v.dot(dir);
    distance = Math.max(
      distance,
      z + Math.abs(v.dot(right)) / (tan * camera.aspect * 0.89),
      z + Math.abs(v.dot(up)) / (tan * 0.89),
    );
  }
  target.copy(center);
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  return distance;
}
export function createAk47(
  live: { current: Ak47Visual },
  { root, camera, controls }: StudioContext,
) {
  const texture = woodTexture(),
    surface = steelTexture();
  const wood = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: texture,
    roughness: 0.49,
    metalness: 0.02,
  });
  const steel = material('#535b60', 0.72, 0.54),
    cover = material('#596267', 0.77, 0.47),
    edge = material('#8a9495', 0.76, 0.34),
    rod = material('#b1a699', 0.88, 0.26),
    springMat = material('#869297', 0.83, 0.23);
  for (const mat of [steel, cover, edge]) {
    mat.roughnessMap = surface;
    mat.bumpMap = surface;
    mat.bumpScale = 0.002;
  }
  const housings: THREE.MeshStandardMaterial[] = [];
  const whole = new THREE.Group();
  root.add(whole);
  for (const spec of AK47_SURFACES) {
    const base = spec.material === 'wood' ? wood : spec.material === 'cover' ? cover : steel;
    const mat = base.clone();
    if (['body', 'cover', 'upperWood', 'wood'].includes(spec.key)) {
      mat.transparent = true;
      housings.push(mat);
    }
    const mesh = new THREE.Mesh(ak47SurfaceGeometry(spec.key, spec.depth), mat);
    mesh.name = `ak47-${spec.key}`;
    mesh.castShadow = mesh.receiveShadow = true;
    whole.add(mesh);
  }
  const cylinder = (
    parent: THREE.Object3D,
    r: number,
    length: number,
    at: number[],
    mat: THREE.Material,
    name: string,
  ) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 32), mat);
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.fromArray(at);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  for (const spec of AK47_ROUND_SURFACES) {
    const mat = cover.clone();
    if (spec.name === 'gas-tube-exterior') {
      mat.transparent = true;
      housings.push(mat);
    }
    cylinder(whole, spec.radius, spec.length, spec.position, mat, spec.name);
  }
  tube(
    whole,
    [
      [2.85, 1.79, 0],
      [2.72, 2.15, 0],
      [2.65, 2.165, 0],
    ],
    0.072,
    cover,
  );
  for (const spec of AK47_BOX_SURFACES) box(whole, spec.size, spec.position, steel, 0.02);
  const sight = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.023, 8, 24), steel);
  sight.rotation.y = Math.PI / 2;
  sight.position.set(3.56, 2.225, 0);
  whole.add(sight);

  // Large exterior reinforcing contours; no internal locking or trigger surfaces.
  for (const z of [-0.145, 0.145])
    for (const n of [0, 1, 2])
      tube(
        whole,
        [
          [-0.54 + n * 0.11, 1.34, z],
          [-0.45 + n * 0.13, 0.86, z],
          [-0.19 + n * 0.17, 0.48, z],
          [0.32 + n * 0.09, 0.2, z],
        ],
        0.009,
        edge,
      );
  tube(
    whole,
    [
      [-1.31, 1.48, 0],
      [-1.28, 1.16, 0],
      [-0.93, 1.17, 0],
      [-0.75, 1.45, 0],
    ],
    0.023,
    steel,
  );
  for (const z of [-0.247, 0.247])
    tube(
      whole,
      [
        [-2.16, 1.51, z],
        [0.42, 1.51, z],
      ],
      0.008,
      edge,
    );
  for (const side of [-1, 1]) {
    const z = side * 0.25;
    tube(
      whole,
      [
        [-2.15, 2.08, z],
        [-1.7, 2.1, z],
        [-0.4, 2.09, z],
        [0.43, 2.08, z],
      ],
      0.007,
      edge,
    );
    tube(
      whole,
      [
        [-2.1, 1.61, z],
        [-1.83, 1.6, z],
        [-0.58, 1.6, z],
        [0.41, 1.61, z],
      ],
      0.006,
      edge,
    );
    const inset = material('#424b50', 0.61, 0.48);
    box(whole, [0.89, 0.225, 0.008], [-1.27, 1.805, side * 0.234], inset, 0.04);
    tube(
      whole,
      [
        [-1.69, 1.715, side * 0.242],
        [-0.86, 1.715, side * 0.242],
      ],
      0.004,
      edge,
    );
    for (const x of [-2.05, -1.89, 0.33]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 16), cover);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(x, 1.685, side * 0.245);
      whole.add(pin);
    }
  }
  const assembly = (offset: number) => {
    const group = new THREE.Group();
    root.add(group);
    group.position.y = offset;
    const fixed = box(group, [0.1, 0.27, 0.27], [A.rear, A.axisY, 0], edge, 0.02);
    fixed.name = 'spring-anchor';
    const moving = new THREE.Group();
    group.add(moving);
    const carrier = box(moving, [A.carrierLength, 0.265, 0.3], [A.carrier, A.axisY, 0], rod, 0.055);
    carrier.name = 'carrier-mass';
    cylinder(
      moving,
      0.041,
      A.rodEnd - A.carrier,
      [(A.rodEnd + A.carrier) / 2, A.axisY, 0],
      rod,
      'linked-piston-rod',
    );
    cylinder(moving, 0.093, 0.16, [A.rodEnd, A.axisY, 0], rod, 'piston-face');
    const markMat = new THREE.MeshBasicMaterial({ color: '#d9ad6c', transparent: true });
    for (const spec of AK47_OBSERVATION_MARKS) {
      const mark = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 16, 10), markMat);
      mark.position.fromArray(spec.point);
      mark.name = spec.name;
      moving.add(mark);
    }
    const spring = new THREE.Mesh(
      new THREE.TubeGeometry(new SpringCurve(0), 352, 0.012, 8, false),
      springMat,
    );
    spring.castShadow = true;
    spring.name = 'continuous-return-spring';
    group.add(spring);
    const rail = box(group, [4.5, 0.016, 0.035], [-0.12, A.axisY - 0.185, -0.2], edge, 0.005);
    rail.name = 'context-rail';
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-0.65, A.axisY - 0.4, 0.22),
      0.45,
      '#688977',
      0.1,
      0.07,
    );
    group.add(arrow);
    let last = NaN;
    return {
      group,
      moving,
      arrow,
      update(state: Ak47Sample, reveal: number) {
        const details = ak47TeachingDetails(state);
        const relative = state.x / AK47_MODEL.maximumX;
        moving.position.x = details.offset;
        markMat.opacity = reveal;
        if (relative !== last) {
          const old = spring.geometry;
          spring.geometry = new THREE.TubeGeometry(new SpringCurve(relative), 352, 0.012, 8, false);
          old.dispose();
          last = relative;
        }
        arrow.visible = details.arrow.visible && reveal > 0;
        arrow.position.fromArray(details.arrow.origin);
        arrow.setDirection(new THREE.Vector3(details.arrow.direction, 0, 0));
      },
    };
  };
  const first = assembly(0),
    second = assembly(0);
  const energyMat = new THREE.MeshBasicMaterial({
    color: '#d9ad6c',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const energy = tube(root, ak47TeachingDetails(live.current.state).gas.points, 0.027, energyMat);
  energy.name = 'gas-energy-highlight';
  let mode = '';
  const fit = () => {
    const v = live.current;
    const d = fitAk47Camera(
      camera,
      controls.target,
      ak47FramePoints(v.closeup, !!v.compare, v.input),
    );
    controls.minDistance = controls.maxDistance = d;
  };
  controls.addEventListener('change', fit);
  return {
    update(dt: number, _elapsed: number, settle: boolean) {
      const v = live.current,
        comparing = !!v.compare;
      first.update(v.state, comparing ? 1 : v.reveal);
      second.update(v.compare ?? v.state, comparing ? 1 : v.reveal);
      second.group.visible = comparing;
      first.group.position.y = comparing ? 0.46 : 0;
      second.group.position.y = -0.46;
      whole.visible = !comparing;
      for (const mat of housings) {
        mat.opacity = 1 - v.reveal * 0.94;
        mat.depthWrite = v.reveal < 0.15;
      }
      energyMat.opacity = v.input ? ak47TeachingDetails(v.state).gas.opacity : 0;
      energy.visible = !comparing;
      const next = `${v.closeup}-${comparing}-${v.narrow}`;
      const currentPosition = camera.position.clone(),
        currentTarget = controls.target.clone();
      const dir =
        !controls.enabled || next !== mode || settle
          ? v.closeup
            ? new THREE.Vector3(0.4, 1, 10)
            : new THREE.Vector3(v.narrow ? -0.9 : 2.7, 3.1, 13)
          : camera.position.clone().sub(controls.target);
      const d = fitAk47Camera(
        camera,
        controls.target,
        ak47FramePoints(v.closeup, comparing, v.input),
        dir,
      );
      const targetPosition = camera.position.clone(),
        targetLook = controls.target.clone();
      const alpha = settle || !dt ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.copy(currentPosition).lerp(targetPosition, alpha);
      controls.target.copy(currentTarget).lerp(targetLook, alpha);
      camera.lookAt(controls.target);
      camera.updateMatrixWorld(true);
      controls.minDistance = controls.maxDistance = d;
      mode = next;
    },
    dispose() {
      controls.removeEventListener('change', fit);
      texture.dispose();
      surface.dispose();
    },
  };
}
