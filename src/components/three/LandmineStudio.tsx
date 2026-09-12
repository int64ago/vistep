import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import LandmineFlat from './LandmineFlat';
import { t } from '../../i18n';
import { LANDMINE_OBJECT, landmineWeather } from '../../models/landmine';
import {
  landmineNoise,
  landmineDirt,
  LANDMINE_DIRT_COUNT,
  landminePlant,
  landmineSurface,
  landmineCut,
  LANDMINE_COVER_PROFILE,
  LANDMINE_SHELL_PROFILE,
  LANDMINE_HANDLE,
  LANDMINE_GROUND as G,
} from '../../models/landmine-geometry';

export type LandmineVisual = {
  reveal: number;
  season: number;
  closeup: number;
  angle: number;
  watch: boolean;
};
export default function LandmineStudio({ visual }: { visual: LandmineVisual }) {
  const live = useRef(visual);
  live.current = visual;
  return (
    <Studio
      label={t('完整地雷外壳与不透明土壤切面；仅重建外观，不展示内部')}
      cameraPosition={[5, 4.5, 6]}
      target={[0, 0.7, 0]}
      span={7.8}
      fitHeight={5.7}
      exposure={0.78}
      fallback={<LandmineFlat visual={visual} />}
      create={(ctx) => createLandmineExterior(live, ctx)}
    />
  );
}
function texture(kind: 'paint' | 'soil' | 'rough') {
  const smoothNoise = (x: number, y: number) => {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = x - ix,
      fy = y - iy,
      u = fx * fx * (3 - 2 * fx),
      v = fy * fy * (3 - 2 * fy);
    const a = landmineNoise(ix, iy, 2) * (1 - u) + landmineNoise(ix + 1, iy, 2) * u,
      b = landmineNoise(ix, iy + 1, 2) * (1 - u) + landmineNoise(ix + 1, iy + 1, 2) * u;
    return a * (1 - v) + b * v;
  };
  const size = 128,
    bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = landmineNoise(x, y, 1),
        coarse = smoothNoise(x / 15, y / 15);
      const rust = coarse > 0.74 && n > 0.4;
      const base =
        kind === 'soil'
          ? [103, 80, 52]
          : kind === 'rough'
            ? [194, 194, 194]
            : rust
              ? [91, 79, 49]
              : [101, 105, 68];
      const variation =
        kind === 'rough' ? n * 15 : (n - 0.5) * (kind === 'soil' ? 18 : 7) + (coarse - 0.5) * 10;
      for (let c = 0; c < 3; c++)
        bytes[(y * size + x) * 4 + c] = Math.max(0, Math.min(255, base[c] + variation));
      bytes[(y * size + x) * 4 + 3] = 255;
    }
  const result = new THREE.DataTexture(bytes, size, size);
  result.needsUpdate = true;
  result.magFilter = THREE.LinearFilter;
  result.minFilter = THREE.LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.colorSpace = kind === 'rough' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.repeat.set(kind === 'soil' ? 4 : 2, kind === 'soil' ? 3 : 1);
  return result;
}
function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
) {
  const value = new THREE.Mesh(geometry, material);
  value.name = name;
  value.castShadow = value.receiveShadow = true;
  parent.add(value);
  return value;
}
function points(object: THREE.Object3D) {
  object.updateMatrixWorld(true);
  const out: THREE.Vector3[] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    let b: THREE.Box3 | null;
    if (child instanceof THREE.InstancedMesh) {
      child.computeBoundingBox();
      b = child.boundingBox;
    } else {
      child.geometry.computeBoundingBox();
      b = child.geometry.boundingBox;
    }
    if (!b) return;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z])
          out.push(new THREE.Vector3(x, y, z).applyMatrix4(child.matrixWorld));
  });
  return out;
}
export function fitLandmineCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  extent: THREE.Vector3[],
  direction: THREE.Vector3,
) {
  const center = new THREE.Box3().setFromPoints(extent).getCenter(new THREE.Vector3()),
    right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
    up = new THREE.Vector3().crossVectors(direction, right).normalize(),
    tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = 1;
  for (const point of extent) {
    const v = point.clone().sub(center),
      d = v.dot(direction);
    distance = Math.max(
      distance,
      d + Math.abs(v.dot(right)) / (tan * camera.aspect * 0.86),
      d + Math.abs(v.dot(up)) / (tan * 0.86),
    );
  }
  target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  return distance;
}
export function createLandmineExterior(
  live: { current: LandmineVisual },
  { root, camera, controls }: StudioContext,
) {
  const mine = new THREE.Group(),
    ground = new THREE.Group();
  mine.name = 'sealed-exterior';
  mine.position.set(...LANDMINE_OBJECT.position);
  ground.name = 'terrain-observation';
  root.add(mine, ground);
  const paint = texture('paint'),
    soilMap = texture('soil'),
    rough = texture('rough');
  const shellMat = new THREE.MeshStandardMaterial({
    map: paint,
    roughnessMap: rough,
    roughness: 0.85,
    metalness: 0.22,
    bumpMap: rough,
    bumpScale: 0.007,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#59593d',
    roughness: 0.79,
    metalness: 0.28,
  });
  for (const [name, profile] of [
    ['outer-shell', LANDMINE_SHELL_PROFILE],
    ['closed-top-cover', LANDMINE_COVER_PROFILE],
  ] as const) {
    const geometry = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      96,
    );
    const position = geometry.attributes.position,
      normal = geometry.attributes.normal,
      uv = geometry.attributes.uv;
    for (let i = 0; i < position.count; i++)
      if (Math.abs(normal.getY(i)) > 0.6)
        uv.setXY(i, 0.5 + position.getX(i) / 2.3, 0.5 + position.getZ(i) / 2.3);
    mesh(mine, geometry, shellMat, name);
  }
  for (const [radius, y] of [
    [1.089, 0.53],
    [1.088, 0.79],
  ] as const) {
    const m = mesh(
      mine,
      new THREE.TorusGeometry(radius, 0.014, 8, 96),
      rimMat,
      'rolled-casing-edge',
    );
    m.rotation.x = Math.PI / 2;
    m.position.y = y;
  }
  const curve = new THREE.CatmullRomCurve3(
    LANDMINE_HANDLE.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  );
  mesh(
    mine,
    new THREE.TubeGeometry(curve, 42, 0.024, 8, false),
    rimMat,
    'fixed-external-carry-handle',
  );
  for (const z of [-0.27, 0.33]) {
    const m = mesh(mine, new THREE.BoxGeometry(0.07, 0.105, 0.1), rimMat, 'external-handle-lug');
    m.position.set(-1.066, 0.63, z);
  }
  // Fixed dirt flecks hug the sealed exterior. They are not openings or operating parts.
  const fleckGeo = new THREE.SphereGeometry(1, 10, 8),
    fleckMat = new THREE.MeshStandardMaterial({ color: '#786748', roughness: 1 });
  const flecks = new THREE.InstancedMesh(fleckGeo, fleckMat, LANDMINE_DIRT_COUNT),
    dummy = new THREE.Object3D();
  flecks.name = 'fixed-casing-dirt';
  for (let i = 0; i < LANDMINE_DIRT_COUNT; i++) {
    const dirt = landmineDirt(i);
    dummy.position.fromArray(dirt.position);
    dummy.scale.fromArray(dirt.size);
    dummy.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(
        new THREE.Vector3(...dirt.radial),
        new THREE.Vector3(...dirt.normal),
        new THREE.Vector3(...dirt.lateral),
      ),
    );
    dummy.updateMatrix();
    flecks.setMatrixAt(i, dummy.matrix);
  }
  mine.add(flecks);
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), G.front);
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilMap,
    bumpMap: rough,
    bumpScale: 0.025,
    roughness: 1,
    clippingPlanes: [clip],
    clipShadows: true,
  });
  const earth = mesh(
    ground,
    new THREE.BoxGeometry(G.halfWidth * 2, LANDMINE_SHELL_PROFILE[0][1], G.front - G.back),
    new THREE.MeshStandardMaterial({
      map: soilMap,
      bumpMap: rough,
      bumpScale: 0.013,
      roughness: 1,
    }),
    'opaque-earth-base',
  );
  earth.position.set(0, LANDMINE_SHELL_PROFILE[0][1] / 2, 0);
  for (const side of ['left', 'right', 'back'] as const) {
    const across = side === 'back' ? G.halfWidth * 2 : G.front - G.back,
      g = new THREE.PlaneGeometry(across, 1.28, 70, 10),
      pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const along = pos.getX(i),
        q = (pos.getY(i) + 0.64) / 1.28,
        x = side === 'back' ? along : side === 'left' ? -G.halfWidth : G.halfWidth,
        z = side === 'back' ? G.back : along;
      pos.setXYZ(i, x, q * landmineSurface(x, z), z);
    }
    g.computeVertexNormals();
    const wallMat = soilMat.clone();
    wallMat.side = THREE.DoubleSide;
    mesh(ground, g, wallMat, 'opaque-soil-' + side);
  }
  const topGeo = new THREE.PlaneGeometry(G.halfWidth * 2, G.front - G.back, 70, 48);
  topGeo.rotateX(-Math.PI / 2);
  const topPos = topGeo.attributes.position;
  for (let i = 0; i < topPos.count; i++)
    topPos.setY(i, landmineSurface(topPos.getX(i), topPos.getZ(i)));
  topGeo.computeVertexNormals();
  mesh(ground, topGeo, soilMat, 'uneven-soil-surface');
  const capMat = new THREE.MeshStandardMaterial({
    map: soilMap,
    roughness: 1,
    bumpMap: rough,
    bumpScale: 0.036,
    side: THREE.DoubleSide,
  });
  const capGeo = new THREE.PlaneGeometry(G.halfWidth * 2, 1.28, 70, 10);
  const cap = mesh(ground, capGeo, capMat, 'virtual-observation-cut');
  const capPos = capGeo.attributes.position;
  const capBase = Float32Array.from(capPos.array);
  cap.position.y = 0.64;
  // Stone and grass locations are persistent across all chapters and replay positions.
  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({
      color: '#9a917a',
      roughness: 1,
      clippingPlanes: [clip],
      clipShadows: true,
    }),
    88,
  );
  stones.name = 'ground-pebbles';
  stones.castShadow = stones.receiveShadow = true;
  for (let i = 0; i < 88; i++) {
    const p = landminePlant(i + 600);
    dummy.position.set(p.x, p.y + 0.014, p.z);
    dummy.rotation.set(i, i * 0.7, i * 0.3);
    const s = 0.018 + landmineNoise(i, 5) * 0.052;
    dummy.scale.set(s * 1.2, s * 0.48, s);
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  ground.add(stones);
  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        -0.025, 0, 0, 0.025, 0, 0, 0.015, 0.5, 0.02, -0.025, 0, 0, 0.015, 0.5, 0.02, -0.015, 0.5,
        0.02, -0.015, 0.5, 0.02, 0.015, 0.5, 0.02, 0.12, 1, 0.055,
      ],
      3,
    ),
  );
  bladeGeo.computeVertexNormals();
  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#627047',
    roughness: 1,
    side: THREE.DoubleSide,
    clippingPlanes: [clip],
    clipShadows: true,
  });
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, 390);
  blades.name = 'persistent-grass';
  blades.castShadow = blades.receiveShadow = true;
  ground.add(blades);
  const leaves = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 4),
    new THREE.MeshStandardMaterial({
      color: '#8c663a',
      roughness: 1,
      clippingPlanes: [clip],
      clipShadows: true,
    }),
    95,
  );
  leaves.name = 'persistent-leaf-litter';
  leaves.castShadow = leaves.receiveShadow = true;
  ground.add(leaves);
  // Local soft contact darkening only: no infinite receiver plane that could
  // turn a shadow-map boundary into a large trapezoid across the close-up.
  const contactBytes = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const r = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5),
        i = (y * 64 + x) * 4;
      contactBytes[i] = contactBytes[i + 1] = contactBytes[i + 2] = 45;
      contactBytes[i + 3] = Math.round(55 * Math.exp(-r * r * r * r * 8));
    }
  const contactMap = new THREE.DataTexture(contactBytes, 64, 64);
  contactMap.needsUpdate = true;
  contactMap.magFilter = THREE.LinearFilter;
  const contactRadius = LANDMINE_SHELL_PROFILE[1][0];
  const displayFloor = mesh(
    root,
    new THREE.PlaneGeometry(contactRadius * 3, contactRadius * 3),
    new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false }),
    'local-soft-contact',
  );
  displayFloor.rotation.x = -Math.PI / 2;
  displayFloor.position.y = LANDMINE_SHELL_PROFILE[0][1] - 0.002;
  displayFloor.castShadow = displayFloor.receiveShadow = false;
  const minePoints = points(mine),
    widePoints = [...minePoints];
  for (const x of [-G.halfWidth, G.halfWidth])
    for (const y of [0, 1.75])
      for (const z of [G.back, G.front]) widePoints.push(new THREE.Vector3(x, y, z));
  let previousCut = NaN,
    previousSeason = NaN;
  return {
    update() {
      const v = live.current,
        cut = landmineCut(v.reveal);
      clip.constant = cut;
      cap.position.z = cut;
      if (cut !== previousCut) {
        for (let i = 0; i < capPos.count; i++) {
          const x = capBase[i * 3],
            normalized = (capBase[i * 3 + 1] + 0.64) / 1.28;
          capPos.setY(i, normalized * landmineSurface(x, cut) - 0.64);
        }
        capPos.needsUpdate = true;
        capGeo.computeVertexNormals();
        previousCut = cut;
      }
      if (v.season !== previousSeason) {
        const coverState = landmineWeather(v.season),
          growth = coverState.grass;
        for (let i = 0; i < 390; i++) {
          const p = landminePlant(Math.floor(i / 3)),
            bend = ((i % 3) - 1) * 0.3;
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(bend, p.angle + i * 2.1, 0);
          dummy.scale.set(0.75, p.height * growth, 1);
          dummy.updateMatrix();
          blades.setMatrixAt(i, dummy.matrix);
        }
        blades.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 95; i++) {
          const p = landminePlant(i + 1200),
            s = coverState.leafSize;
          dummy.position.set(p.x, p.y + 0.012, p.z);
          dummy.rotation.set(0, p.angle, 0);
          dummy.scale.set(s, 0.008, s * 0.46);
          dummy.updateMatrix();
          leaves.setMatrixAt(i, dummy.matrix);
        }
        leaves.instanceMatrix.needsUpdate = true;
        previousSeason = v.season;
      }
      ground.visible = v.closeup < 0.985;
      displayFloor.visible = !ground.visible;
      // The camera moves; the sealed mine never moves or opens. A complete close-up
      // fits the whole external assembly, including its side handle.
      const focus = v.closeup,
        extent = widePoints.map((p, i) => p.clone().lerp(minePoints[i % minePoints.length], focus));
      extent.push(...minePoints);
      const direction = v.watch
        ? new THREE.Vector3(Math.sin(v.angle) * 0.72, 0.6, Math.cos(v.angle) * 0.72).normalize()
        : camera.position.clone().sub(controls.target).normalize();
      const distance = fitLandmineCamera(camera, controls.target, extent, direction);
      controls.minDistance = controls.maxDistance = distance;
    },
    dispose() {
      paint.dispose();
      soilMap.dispose();
      rough.dispose();
      contactMap.dispose();
    },
  };
}
