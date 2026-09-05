import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import { box, material } from './parts';
import { useShowcase } from '../lab/Showcase';
import {
  SEWING as S,
  sewingCamera,
  type SewingPoint,
  type SewingPose,
} from '../../models/sewing-machine';
import { SewingMachineDiagram } from './SewingMachineDiagram';
import { t } from '../../i18n';
const tau = Math.PI * 2;
function sector(inner: number, outer: number, start: number, end: number, depth: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 80; i++) {
    const a = start + ((end - start) * i) / 80;
    const x = Math.sin(a) * outer,
      y = Math.cos(a) * outer;
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  for (let i = 80; i >= 0; i--) {
    const a = start + ((end - start) * i) / 80;
    shape.lineTo(Math.sin(a) * inner, Math.cos(a) * inner);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}
export default function SewingMachineStudio({
  pose,
  focus,
  progress,
}: {
  pose: SewingPose;
  focus: string;
  progress: number;
}) {
  const film = useShowcase(),
    live = useRef({ pose, focus, progress, watch: film.watch });
  live.current = { pose, focus, progress, watch: film.watch };
  const create = ({ root, camera, controls }: StudioContext) => {
    const mechanism = new THREE.Group();
    mechanism.position.y = 3.05;
    root.add(mechanism);
    const ivory = material('#b9b3a5', 0.12, 0.46),
      steel = material('#637b82', 0.68, 0.28),
      dark = material('#36494f', 0.45, 0.35),
      brass = material('#a88348', 0.65, 0.32),
      cloth = material('#314f59', 0, 0.94),
      upperMat = material('#be593d', 0.1, 0.44),
      lowerMat = material('#208a86', 0.12, 0.4);
    upperMat.emissive.set('#522315');
    upperMat.emissiveIntensity = 0.2;
    lowerMat.emissive.set('#073e3a');
    lowerMat.emissiveIntensity = 0.2;
    const mesh = (
      g: THREE.BufferGeometry,
      m: THREE.Material,
      parent: THREE.Object3D = mechanism,
      p: SewingPoint = [0, 0, 0],
    ) => {
      const a = new THREE.Mesh(g, m);
      a.position.fromArray(p);
      a.castShadow = true;
      a.receiveShadow = true;
      parent.add(a);
      return a;
    };
    const cylinder = (
      r: number,
      length: number,
      p: SewingPoint,
      m: THREE.Material,
      parent: THREE.Object3D = mechanism,
      axis = 'z',
    ) => {
      const a = mesh(new THREE.CylinderGeometry(r, r, length, 48), m, parent, p);
      if (axis === 'z') a.rotation.x = Math.PI / 2;
      if (axis === 'x') a.rotation.z = Math.PI / 2;
      return a;
    };
    const rod = (parent: THREE.Object3D, r: number, m: THREE.Material) =>
      mesh(new THREE.CylinderGeometry(r, r, 1, 16), m, parent);
    const setRod = (m: THREE.Mesh, a: SewingPoint, b: SewingPoint) => {
      const va = new THREE.Vector3(...a),
        vb = new THREE.Vector3(...b),
        delta = vb.clone().sub(va);
      m.position.copy(va).add(vb).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
      m.scale.y = delta.length();
    };
    const frame = new THREE.Group();
    mechanism.add(frame);
    box(frame, [0.7, 6.5, 1.45], [3.0, 0.9, -0.72], ivory, 0.17);
    box(frame, [3.45, 0.6, 1.45], [1.65, 4.36, -0.72], ivory, 0.16);
    box(frame, [5.5, 0.35, 2.85], [0.7, -2.82, -0.1], ivory, 0.14);
    box(frame, [1.3, 0.74, 0.48], [0, 2.22, -0.09], ivory, 0.12);
    box(frame, [0.25, 1.55, 0.48], [-0.5, 3.35, -0.09], ivory, 0.07);
    // Actual bored needle guides: the moving bar remains inside both journals.
    for (const y of [1.97, 2.53]) {
      const guide = mesh(sector(0.082, 0.17, 0, tau, 0.18), brass, mechanism, [
        0,
        y + 0.09,
        S.needleZ,
      ]);
      guide.rotation.x = Math.PI / 2;
      box(mechanism, [0.13, 0.18, 0.6], [0.19, y, 0.36], steel, 0.02);
    }
    const bar = cylinder(0.07, 3.4, [0, 0, S.needleZ], steel, mechanism, 'y');
    const needleShape = new THREE.Shape();
    needleShape.moveTo(0, -0.24);
    needleShape.lineTo(0.062, -0.08);
    for (const y of [0.07, 0.09, 0.27, 0.29, 0.56]) needleShape.lineTo(0.062, y);
    needleShape.lineTo(-0.062, 0.56);
    for (const y of [0.29, 0.27, 0.09, 0.07, -0.08]) needleShape.lineTo(-0.062, y);
    needleShape.closePath();
    const eye = new THREE.Path();
    eye.absellipse(0, 0, 0.028, 0.058, 0, tau, true, 0);
    needleShape.holes.push(eye);
    const needle = mesh(
      new THREE.ExtrudeGeometry(needleShape, { depth: 0.09, bevelEnabled: false }),
      steel,
      mechanism,
      [0, 0, 0.575],
    );
    const needlePos = needle.geometry.getAttribute('position');
    // Relieve the back face above the eye (scarf); leave the eye opening intact.
    for (let i = 0; i < needlePos.count; i++)
      if (needlePos.getZ(i) < 0.001 && needlePos.getY(i) > 0.07 && needlePos.getY(i) < 0.28)
        needlePos.setZ(i, 0.022);
    needle.geometry.computeVertexNormals();
    cylinder(0.19, 0.4, [0, S.shaftY, 0.12], steel);
    cylinder(0.11, 1.0, [0, S.shaftY, -0.36], dark);
    const crank = rod(mechanism, 0.085, brass),
      link = rod(mechanism, 0.058, steel);
    const crankJoint = cylinder(0.14, 0.16, [0, 0, S.needleZ], brass),
      sliderJoint = cylinder(0.12, 0.16, [0, 0, S.needleZ], brass);
    // Presser foot straddles the needle and both feed-dog lanes.
    for (const z of [0.31, 0.93]) box(mechanism, [0.8, 0.075, 0.16], [0, 0.1175, z], steel, 0.035);
    box(mechanism, [0.16, 0.2, 0.8], [0.35, 0.26, 0.62], steel, 0.025);
    cylinder(0.075, 1.6, [0.35, 1.05, 0.62], steel, mechanism, 'y');
    const presserGuide = mesh(
      sector(0.078, 0.15, 0, tau, 0.28),
      brass,
      mechanism,
      [0.35, 2.13, 0.62],
    );
    presserGuide.rotation.x = Math.PI / 2;
    box(mechanism, [0.16, 0.25, 0.65], [0.53, 1.99, 0.34], steel, 0.025);
    const feed = new THREE.Group();
    mechanism.add(feed);
    for (const z of [0.31, 0.93]) {
      box(feed, [1.1, 0.13, 0.115], [0, -0.12, z], dark, 0.015);
      for (let i = 0; i < 10; i++) {
        const tooth = mesh(new THREE.ConeGeometry(0.04, 0.075, 3), steel, feed, [
          -0.46 + i * 0.1,
          -0.0375,
          z,
        ]);
        tooth.rotation.y = Math.PI / 2;
      }
    }
    box(feed, [0.2, 0.14, 0.78], [0.3, -0.24, 0.62], steel, 0.025);
    const feedStem = rod(mechanism, 0.065, dark);
    // Cut throat plate and cloth, retaining a real slot at the needle and the feed lanes.
    for (const [z, width] of [
      [-0.37, 1.1],
      [1.63, 1.1],
    ] as const)
      box(mechanism, [5.5, 0.12, width], [0.3, -0.16, z], steel, 0.03);
    const fabric = new THREE.Group();
    mechanism.add(fabric);
    for (const [z, width] of [
      [-0.15, 1.05],
      [1.39, 1.05],
    ] as const)
      box(fabric, [4.75, 0.09, width], [-0.75, 0.035, z], cloth, 0.016);
    // Narrow section edges expose both coloured strands in the stitch channel.
    const seamEdge = material('#8dabb0', 0, 0.85);
    for (const z of [0.39, 0.85])
      box(fabric, [4.75, 0.055, 0.045], [-0.75, 0.043, z], seamEdge, 0.01);
    const weave = new THREE.Group();
    fabric.add(weave);
    for (let i = 0; i < 45; i++)
      for (const z of [-0.15, 1.39])
        box(weave, [0.01, 0.004, 0.92], [-3.05 + i * 0.105, 0.083, z], seamEdge, 0);
    // The stationary case rides in the rotary basket; the rear drive never passes through it.
    const caseGroup = new THREE.Group();
    caseGroup.position.y = S.caseY;
    mechanism.add(caseGroup);
    mesh(sector(0.69, 0.75, 0.3, tau - 0.3, 0.5), steel, caseGroup, [0, 0, -0.25]);
    cylinder(0.69, 0.045, [0, 0, -0.265], steel, caseGroup);

    for (const [a, b] of [
      [0.38, S.caseSlotAngle - S.caseSlotHalfAngle],
      [S.caseSlotAngle + S.caseSlotHalfAngle, 3.6],
    ])
      mesh(sector(0.55, S.caseRadius, a, b, 0.035), brass, caseGroup, [0, 0, 0.25]);
    cylinder(0.095, 0.48, [0, 0, -0.02], dark, caseGroup);
    cylinder(S.bobbinFlangeRadius, 0.035, [0, 0, -0.225], brass, caseGroup);
    mesh(sector(0.095, S.bobbinFlangeRadius, 0.1, 3.4, 0.035), brass, caseGroup, [0, 0, 0.2075]);
    cylinder(0.2, 0.42, [0, 0, 0], brass, caseGroup);
    cylinder(0.505, 0.34, [0, 0, 0], lowerMat, caseGroup);
    // Case opening / anti-rotation stop is shown as a fork with a thread-passage gap.
    box(mechanism, [0.08, 0.2, 0.12], [-0.18, -0.88, 0.01], brass, 0.02);
    box(mechanism, [0.09, 0.35, 0.12], [-0.3, -0.69, 0.01], dark, 0.02);
    box(mechanism, [0.45, 0.1, 0.18], [-0.48, -0.51, 0.01], steel, 0.025);
    box(mechanism, [0.08, 0.44, 0.18], [-0.7, -0.32, 0.01], steel, 0.02);
    const rotor = new THREE.Group();
    rotor.position.y = S.caseY;
    mechanism.add(rotor);
    mesh(sector(1.1, 1.2, 0.32, tau - 0.23, 1.01), dark, rotor, [0, 0, -0.55]);
    cylinder(1.2, 0.065, [0, 0, -0.6], steel, rotor);
    mesh(
      sector(S.raceRadius, S.bearingCupRadius, 0, tau, S.bearingCupFront - S.bearingCupRear),
      brass,
      rotor,
      [0, 0, S.bearingCupRear],
    );
    mesh(sector(0.5, S.raceRadius, 0, tau, 0.015), brass, rotor, [0, 0, -0.295]);
    const beak = new THREE.Shape();
    [
      [0.014, 1.035],
      [0.1, 1.02],
      [0.16, 1.025],
      [0.32, 1.14],
      [0.32, 1.2],
      [0.014, 1.2],
    ].forEach(([a, r], i) =>
      i
        ? beak.lineTo(Math.sin(a) * r, Math.cos(a) * r)
        : beak.moveTo(Math.sin(a) * r, Math.cos(a) * r),
    );
    beak.closePath();
    mesh(
      new THREE.ExtrudeGeometry(beak, { depth: 0.035, bevelEnabled: false }),
      brass,
      rotor,
      [0, 0, 0.5175],
    );
    cylinder(0.15, 1.0, [0, S.caseY, -1.11], steel);
    for (const z of [-0.94, -1.47]) {
      mesh(sector(0.155, 0.28, 0, tau, 0.17), brass, mechanism, [0, S.caseY, z]);
      box(mechanism, [0.55, 0.72, 0.25], [0, S.caseY - 0.47, z + 0.08], ivory, 0.05);
    }
    // Spool and a thread-tension gap, with actual guide eyes at the route vertices.
    cylinder(0.11, 0.7, [1.85, 3.91, 0.9], steel, mechanism, 'y');
    for (const y of [3.75, 4.18]) cylinder(0.29, 0.045, [1.85, y, 0.9], brass, mechanism, 'y');
    cylinder(0.215, 0.38, [1.85, 3.97, 0.9], upperMat, mechanism, 'y');
    box(mechanism, [0.65, 0.1, 0.4], [1.85, 3.6, 0.75], ivory, 0.04);
    box(frame, [0.15, 0.55, 0.18], [1.85, 3.86, -0.2], ivory, 0.025);
    box(frame, [0.15, 0.12, 1.08], [1.85, 3.6, 0.28], ivory, 0.025);
    for (const z of [1.1, 1.16]) cylinder(0.16, 0.035, [1.22, 2.65, z], brass);
    cylinder(0.045, 0.36, [1.22, 2.65, 0.91], steel);
    const fixedEye = mesh(
      new THREE.TorusGeometry(0.026, 0.009, 8, 24),
      brass,
      mechanism,
      [0, 1.9, 0.76],
    );
    fixedEye.rotation.x = Math.PI / 2;
    box(mechanism, [0.04, 0.04, 0.67], [0.19, 1.9, 0.435], steel, 0.006);
    box(mechanism, [0.16, 0.04, 0.03], [0.105, 1.9, 0.76], steel, 0.006);
    mesh(new THREE.TorusGeometry(0.033, 0.009, 8, 24), brass, mechanism, [1.4, 3.9, 1.13]);
    box(mechanism, [0.04, 0.04, 1.12], [1.445, 3.9, 0.58], steel, 0.006);
    const takeUp = rod(mechanism, 0.045, steel);
    const takeEye = mesh(new THREE.TorusGeometry(0.049, 0.014, 8, 24), brass);
    cylinder(0.095, 0.2, [0.7, 2.45, 0.83], brass);
    const threadMeshes = (mat: THREE.Material) => {
      const a = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(S.threadRadius, S.threadRadius, 1, 7),
        mat,
        600,
      );
      a.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      a.frustumCulled = false;
      mechanism.add(a);
      return a;
    };
    const upper = threadMeshes(upperMat),
      lower = threadMeshes(lowerMat);
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0),
      va = new THREE.Vector3(),
      vb = new THREE.Vector3();
    const route = (inst: THREE.InstancedMesh, points: SewingPoint[]) => {
      let count = 0;
      for (let i = 1; i < points.length; i++) {
        va.fromArray(points[i - 1]);
        vb.fromArray(points[i]);
        const length = va.distanceTo(vb);
        if (length < 1e-7) continue;
        dummy.position.copy(va).add(vb).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(up, vb.sub(va).normalize());
        dummy.scale.set(1, length, 1);
        dummy.updateMatrix();
        inst.setMatrixAt(count++, dummy.matrix);
      }
      inst.count = count;
      inst.instanceMatrix.needsUpdate = true;
    };
    let signature = '';
    let cameraMode: boolean | null = null;
    return {
      update() {
        const { pose: p, focus: f, progress, watch } = live.current;
        const key = `${p.phase}/${p.pitch}`;
        if (key !== signature) {
          signature = key;
          bar.position.y = p.needle.eye + 2.1;
          needle.position.y = p.needle.eye;
          crankJoint.position.fromArray(p.needle.crankPin);
          sliderJoint.position.fromArray(p.needle.joint);
          setRod(crank, [0, S.shaftY, S.needleZ], p.needle.crankPin);
          setRod(link, p.needle.crankPin, p.needle.joint);
          rotor.rotation.z = -p.hook.angle;
          feed.position.set(p.dogX, p.dogTop, 0);
          fabric.position.x = -p.feed;
          setRod(feedStem, [0.3, -0.85, 0.62], [0.3 + p.dogX, p.dogTop - 0.25, 0.62]);
          setRod(takeUp, p.takeUpPivot, p.takeUpEye);
          takeEye.position.fromArray(p.takeUpEye);
          route(upper, p.upper);
          route(lower, p.lower);
        }
        // Film camera is a pure function of the director. Manual orbit remains available.
        if (watch || cameraMode !== false) {
          const shot = sewingCamera(p, watch ? f : 'overview', progress, camera.aspect);
          controls.target.set(shot.target[0], shot.target[1] + 3.05, shot.target[2]);
          camera.position
            .copy(controls.target)
            .addScaledVector(new THREE.Vector3(...shot.direction), shot.distance);
          frame.visible = !shot.detail;
        } else frame.visible = true;
        cameraMode = watch;
      },
    };
  };
  return (
    <Studio
      create={create}
      label={t('锁式线迹：连续上线、底线与旋梭剖面')}
      className="sewing-studio"
      span={6}
      exposure={0.95}
      fitHeight={8}
      target={[0.4, 3.8, 0.2]}
      cameraPosition={[4, 7, 15]}
      fallback={<SewingMachineDiagram pose={pose} focus={focus} />}
    />
  );
}
