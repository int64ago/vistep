import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import NfcFlat, { NfcFluxLabel } from './NfcFlat';
import { box, material } from './parts';
import { t } from '../../i18n';
import {
  NFC_ART as A,
  nfcArtCenterMm,
  nfcConnections,
  nfcSpiralPoint,
  nfcFluxArrow,
  type NfcPoint,
  type NfcVisual,
} from '../../models/nfc-geometry';

export type { NfcVisual } from '../../models/nfc-geometry';
class NfcSpiral extends THREE.Curve<THREE.Vector3> {
  constructor(private which: 'reader' | 'tag') {
    super();
  }
  getPoint(progress: number, target = new THREE.Vector3()) {
    return target.fromArray(nfcSpiralPoint(this.which, progress)).multiplyScalar(A.scale);
  }
}

export default function NfcStudio({ visual, narrow }: { visual: NfcVisual; narrow: boolean }) {
  const live = useRef({ visual, narrow });
  live.current = { visual, narrow };
  return (
    <div
      className="nfc-object-frame"
      style={{ height: '100%', width: '100%', position: 'relative' }}
    >
      <Studio
        className="nfc-studio"
        label={t('NFC 读取器与无电池标签：连续线圈、绝缘跨线、调谐电容和芯片')}
        cameraPosition={[-6.8, 12, 13]}
        target={[0, 2, 0]}
        span={8.6}
        fitHeight={8.8}
        exposure={0.84}
        fallback={<NfcFlat visual={visual} narrow={narrow} label={false} />}
        create={(context) => createNfcApparatus(live, context)}
      />
      {visual.fluxNormalized !== undefined && <NfcFluxLabel />}
    </div>
  );
}

/** Exact geometry bounds, including near corners, board thickness and crossovers. */
export function nfcApparatusPoints(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const points: THREE.Vector3[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const b = object.geometry.boundingBox;
    if (!b) return;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z])
          points.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
  });
  return points;
}

/** Maintain a common scale for ordinary comparisons. Only very tall combinations
 * and narrow aspect ratios require a wider fit. The target follows the assembly
 * continuously; paused seeks receive the exact requested projection. */
export function fitNfcCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  points: THREE.Vector3[],
  closeup = 0,
) {
  const direction = camera.position.clone().sub(target).normalize(),
    bounds = new THREE.Box3().setFromPoints(points),
    center = bounds.getCenter(new THREE.Vector3()),
    right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
    up = new THREE.Vector3().crossVectors(direction, right).normalize(),
    tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
    margin = 0.88;
  let distance = (8.8 - 2.8 * Math.max(0, Math.min(1, closeup))) / (2 * tangent);
  for (const point of points) {
    const relative = point.clone().sub(center),
      depth = relative.dot(direction);
    distance = Math.max(
      distance,
      depth + Math.abs(relative.dot(right)) / (tangent * camera.aspect * margin),
      depth + Math.abs(relative.dot(up)) / (tangent * margin),
    );
  }
  target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  return distance;
}

/** Constructed once per mounted renderer; phase changes only update material state. */
export function createNfcApparatus(
  live: { current: { visual: NfcVisual; narrow: boolean } },
  { root, camera, controls }: StudioContext,
) {
  const reader = new THREE.Group(),
    tag = new THREE.Group();
  reader.name = 'nfc-reader';
  tag.name = 'nfc-tag';
  root.add(reader, tag);
  root.position.y = A.floorOffsetMm * A.scale;
  const graphite = material('#263437', 0.3, 0.46),
    graphiteEdge = material('#1e2c30', 0.3, 0.52),
    readerBoard = material('#3b514a', 0.15, 0.55),
    ivory = material('#d8c9b0', 0.03, 0.61),
    gold = material('#d8b779', 0.72, 0.34),
    ceramic = material('#c1ad7c', 0.08, 0.57),
    insulator = material('#eee2c7', 0.05, 0.68),
    txCopper = material('#bf854e', 0.78, 0.29),
    rxCopper = material('#ae683d', 0.73, 0.32),
    readerChip = material('#142425', 0.22, 0.44),
    tagChip = material('#223d35', 0.15, 0.5),
    coverMat = new THREE.MeshStandardMaterial({
      color: '#ede4d4',
      roughness: 0.56,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
  const put = (
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    at: NfcPoint,
    parent: THREE.Object3D,
    name: string,
  ) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.fromArray(at).multiplyScalar(A.scale);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (
    radius: number,
    height: number,
    mat: THREE.Material,
    y: number,
    parent: THREE.Object3D,
    name: string,
  ) =>
    put(
      new THREE.CylinderGeometry(radius * A.scale, radius * A.scale, height * A.scale, 96),
      mat,
      [0, y, 0],
      parent,
      name,
    );
  const wire = (
    points: readonly NfcPoint[],
    mat: THREE.Material,
    parent: THREE.Object3D,
    radius: number,
    name: string,
  ) => {
    // Piecewise straight paths preserve exact contacts instead of a smoothing spline
    // wandering into neighbouring turns or bypassing component terminals.
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(...points[i]).multiplyScalar(A.scale),
        b = new THREE.Vector3(...points[i + 1]).multiplyScalar(A.scale),
        delta = b.clone().sub(a);
      if (delta.lengthSq() < 1e-20) continue;
      const mesh = put(
        new THREE.CylinderGeometry(radius * A.scale, radius * A.scale, delta.length(), 10),
        mat,
        [0, 0, 0],
        parent,
        `${name}-${i}`,
      );
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    }
    for (const point of points)
      put(new THREE.SphereGeometry(radius * A.scale, 10, 6), mat, point, parent, `${name}-join`);
  };
  cylinder(
    A.readerRadiusMm,
    A.readerTopMm - A.readerBottomMm,
    graphite,
    (A.readerTopMm + A.readerBottomMm) / 2,
    reader,
    'reader-housing',
  );
  cylinder(31.8, 1.5, graphiteEdge, -7.8, reader, 'reader-foot');
  cylinder(28.8, 0.1, readerBoard, -0.43, reader, 'reader-pcb');
  cylinder(A.tagRadiusMm, A.tagHalfThicknessMm * 2, ivory, 0, tag, 'tag-substrate');
  // Protective face becomes transparent to expose its real connected inlay.
  const coat = cylinder(A.tagRadiusMm, 0.08, coverMat, 2.08, tag, 'tag-protective-face');
  coat.castShadow = false;
  for (const which of ['reader', 'tag'] as const) {
    const receiver = which === 'tag',
      parent = receiver ? tag : reader,
      copper = receiver ? rxCopper : txCopper,
      connection = nfcConnections(which);
    put(
      new THREE.TubeGeometry(new NfcSpiral(which), 768, A.wireRadiusMm * A.scale, 8, false),
      copper,
      [0, 0, 0],
      parent,
      `${which}-continuous-spiral`,
    );
    wire(connection.inner, copper, parent, A.wireRadiusMm, `${which}-inner-lead`);
    connection.capWires.forEach((points, i) =>
      wire(points, copper, parent, A.wireRadiusMm, `${which}-cap-bus-${i}`),
    );
    wire([connection.left, connection.right], gold, parent, 0.27, `${which}-chip-pins`);
    wire([connection.capLeft, connection.capRight], gold, parent, 0.22, `${which}-capacitor-pins`);
    for (const [part, spec, mat] of [
      ['ic', connection.chip, receiver ? tagChip : readerChip],
      ['tuning-capacitor', connection.capacitor, ceramic],
    ] as const) {
      const mesh = box(
        parent,
        spec.size.map((v) => v * A.scale),
        spec.center.map((v) => v * A.scale),
        mat,
        0.008,
      );
      mesh.name = `${which}-${part}`;
    }
    wire(connection.insulation, insulator, parent, 0.42, `${which}-insulated-bridge`);
    wire(connection.outer, copper, parent, A.wireRadiusMm, `${which}-outer-lead`);
    // Rounded solder pads make both actual antenna terminals observable.
    [connection.left, connection.right].forEach((p, i) =>
      put(
        new THREE.SphereGeometry(0.31 * A.scale, 12, 8),
        gold,
        p,
        parent,
        `${which}-terminal-${i}`,
      ),
    );
  }
  // Local explanatory overlay: no particle motion and no claim of a complete
  // magnetic field line. Depth testing is disabled so the substrate cannot hide
  // the arrowhead on the far side of the very surface it describes.
  const fluxMaterial = new THREE.MeshBasicMaterial({
      color: '#236f72',
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
    fluxShaft = put(
      new THREE.CylinderGeometry(0.35 * A.scale, 0.35 * A.scale, 1, 12),
      fluxMaterial,
      [-9, 0, 6],
      tag,
      'local-flux-shaft',
    ),
    fluxTip = put(
      new THREE.ConeGeometry(1, 1, 16),
      fluxMaterial,
      [-9, 0, 6],
      tag,
      'local-flux-tip',
    ),
    fluxReserve = put(
      new THREE.BoxGeometry(4 * A.scale, 16 * A.scale, 4 * A.scale),
      fluxMaterial,
      [-9, 0, 6],
      tag,
      'local-flux-frame-reserve',
    );
  fluxReserve.visible = false;
  fluxShaft.renderOrder = fluxTip.renderOrder = 10;
  fluxShaft.castShadow = fluxTip.castShadow = fluxReserve.castShadow = false;
  fluxShaft.receiveShadow = fluxTip.receiveShadow = fluxReserve.receiveShadow = false;
  let poseKey = '',
    points: THREE.Vector3[] = [];
  const updateCamera = () => {
    if (!points.length) return;
    const distance = fitNfcCamera(camera, controls.target, points, live.current.visual.closeup);
    controls.minDistance = controls.maxDistance = distance;
  };
  controls.addEventListener('change', updateCamera);
  return {
    update() {
      const { visual } = live.current;
      tag.position.y = nfcArtCenterMm(visual) * A.scale;
      tag.rotation.z = THREE.MathUtils.degToRad(visual.tiltDeg);
      coverMat.opacity = 1 - THREE.MathUtils.clamp(visual.showInternals, 0, 1);
      coat.visible = coverMat.opacity > 0.001;
      const flux = nfcFluxArrow(visual.fluxNormalized);
      fluxShaft.visible = fluxTip.visible = visual.fluxNormalized !== undefined && flux.visible;
      fluxShaft.scale.y = Math.max(1e-8, (flux.length - flux.headLength) * A.scale);
      fluxShaft.position.y = (-flux.direction * flux.headLength * A.scale) / 2;
      fluxTip.position.y = (flux.direction * (flux.length - flux.headLength) * A.scale) / 2;
      fluxTip.scale.set(
        flux.headRadius * A.scale,
        flux.headLength * A.scale,
        flux.headRadius * A.scale,
      );
      fluxTip.rotation.z = flux.direction < 0 ? Math.PI : 0;
      fluxMaterial.opacity = flux.opacity;
      // Only the reader winding is phase-coloured; tag current is not assumed to
      // share its phase. The IC responds to the model's powered state separately.
      const readerSign = visual.readerCurrentA ?? Math.sin(visual.phase);
      txCopper.emissive.set(readerSign >= 0 ? '#925029' : '#3c7182');
      txCopper.emissiveIntensity = visual.fieldOn ? 0.13 * Math.min(1, Math.abs(readerSign)) : 0;
      tagChip.emissive.set('#638867');
      tagChip.emissiveIntensity = visual.powered ? 0.2 : 0;
      const key = `${visual.gapMm}/${visual.tiltDeg}`;
      if (key !== poseKey) {
        points = nfcApparatusPoints(root);
        poseKey = key;
      }
      updateCamera();
    },
    dispose() {
      controls.removeEventListener('change', updateCamera);
    },
  };
}
