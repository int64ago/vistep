import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  SUSPENSION_GEOMETRY as G,
  suspensionPose,
  type SuspensionState,
  type SuspensionParameters,
  type SuspensionRoad,
} from '../../models/suspension';
import { useShowcase } from '../lab/Showcase';
import SuspensionDiagram from '../lab/SuspensionDiagram';
import Studio from './Studio';
import { box, material, roller } from './parts';

export type SuspensionVisual = {
  state: SuspensionState;
  parameters: SuspensionParameters;
  road: SuspensionRoad;
};
function springGeometry() {
  const rows = 120,
    sides = 8,
    positions = new Float32Array((rows + 1) * sides * 3),
    index: number[] = [];
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides),
        c = a + sides,
        d = b + sides;
      index.push(a, c, b, b, c, d);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return {
    geometry,
    update(length: number) {
      const rise = length - 0.042,
        radius = 0.097,
        omega = Math.PI * 12,
        norm = Math.hypot(rise, radius * omega);
      for (let i = 0; i <= rows; i++) {
        const u = i / rows,
          angle = omega * u,
          co = Math.cos(angle),
          si = Math.sin(angle);
        for (let j = 0; j < sides; j++) {
          const a = (Math.PI * 2 * j) / sides,
            x = Math.cos(a) * 0.009,
            y = Math.sin(a) * 0.009,
            n = (i * sides + j) * 3;
          positions[n] = radius * co + x * co + (y * rise * si) / norm;
          positions[n + 1] = 0.021 + u * rise + (y * radius * omega) / norm;
          positions[n + 2] = radius * si + x * si - (y * rise * co) / norm;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    },
  };
}
function tireGeometry() {
  const profile = [
      [0.195, -0.095],
      [0.21, -0.116],
      [0.285, -0.128],
      [0.33, -0.095],
      [0.34, -0.06],
      [0.34, 0.06],
      [0.33, 0.095],
      [0.285, 0.128],
      [0.21, 0.116],
      [0.195, 0.095],
    ],
    count = 112;
  const positions = new Float32Array((count + 1) * profile.length * 3),
    rest = new Float32Array(positions.length),
    index: number[] = [];
  for (let i = 0; i <= count; i++)
    for (let j = 0; j < profile.length; j++) {
      const a = (Math.PI * 2 * i) / count,
        n = (i * profile.length + j) * 3;
      rest[n] = profile[j][0] * Math.cos(a);
      rest[n + 1] = profile[j][0] * Math.sin(a);
      rest[n + 2] = profile[j][1];
      if (i < count) {
        const x = i * profile.length + j,
          y = i * profile.length + ((j + 1) % profile.length);
        index.push(x, y, x + profile.length, y, y + profile.length, x + profile.length);
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return {
    geometry,
    update(bottom: number) {
      for (let i = 0; i < rest.length; i += 3) {
        positions[i] = rest[i];
        positions[i + 1] = Math.max(rest[i + 1], bottom);
        positions[i + 2] = rest[i + 2];
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    },
  };
}
function createRig(parent: THREE.Group, alternate: boolean) {
  const root = new THREE.Group();
  parent.add(root);
  const steel = material('#aebabe', 0.86, 0.24),
    darkSteel = material('#3e5058', 0.65, 0.37),
    paint = material(alternate ? '#a1b4b5' : '#d4d0be', 0.28, 0.42),
    rubber = material('#20292c', 0.06, 0.82),
    springMetal = material(alternate ? '#799b9b' : '#b97b55', 0.66, 0.3),
    damperMetal = material('#537f86', 0.64, 0.31);
  const mesh = (p: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const object = new THREE.Mesh(geo, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    p.add(object);
    return object;
  };
  const cylinder = (
    p: THREE.Object3D,
    r: number,
    length: number,
    pos: number[],
    mat: THREE.Material,
  ) => {
    const object = mesh(p, new THREE.CylinderGeometry(r, r, length, 32), mat);
    object.position.fromArray(pos);
    return object;
  };
  const disc = (
    p: THREE.Object3D,
    outer: number,
    inner: number,
    depth: number,
    mat: THREE.Material,
  ) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const object = mesh(
      p,
      new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }),
      mat,
    );
    object.position.z = -depth / 2;
    return object;
  };
  box(root, [1.3, 0.055, 0.86], [0, -0.2525, -0.055], darkSteel, 0.025);
  for (const x of [-0.53, 0.53])
    for (const z of [-0.35, 0.25]) cylinder(root, 0.022, 0.02, [x, -0.215, z], steel);
  const platen = box(
    root,
    [1.06, 0.065, 0.55],
    [0, -0.0325, 0.02],
    material('#596b70', 0.34, 0.65),
    0.014,
  );
  const roadStem = cylinder(root, 0.12, 0.2, [0, -0.15, 0], steel);
  cylinder(root, 0.15, 0.09, [0, -0.2, 0], darkSteel);
  const body = new THREE.Group();
  root.add(body);
  box(body, [1.15, 0.17, 0.54], [0, 0.09, -0.12], paint, 0.035);
  box(body, [1.0, 0.025, 0.47], [0, 0.184, -0.12], steel, 0.009);
  for (const x of [-0.46, 0.46]) {
    cylinder(body, 0.018, G.guideLength, [x, 0.02 - G.guideLength / 2, -0.25], steel);
    box(body, [0.08, 0.07, 0.09], [x, -0.006, -0.25], darkSteel, 0.008);
  }
  // This is a vertical test fixture, not an invented wishbone linkage. Guide rods follow the body.
  const wheel = new THREE.Group();
  root.add(wheel);
  box(wheel, [0.98, 0.065, 0.09], [0, 0, -0.25], darkSteel, 0.014);
  for (const x of [-0.46, 0.46]) box(wheel, [0.075, 0.1, 0.105], [x, 0, -0.25], damperMetal, 0.009);
  roller(wheel, 0.045, 0.5, [0, 0, -0.055], steel);
  const tire = tireGeometry(),
    tireMaterial = rubber.clone();
  tireMaterial.transparent = true;
  const tireMesh = mesh(wheel, tire.geometry, tireMaterial);
  tireMesh.position.z = 0.11;
  const rim = disc(wheel, G.rimRadius, 0.155, 0.195, steel);
  rim.position.z = 0.105;
  roller(wheel, 0.061, 0.22, [0, 0, 0.12], darkSteel);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5,
      spoke = box(
        wheel,
        [0.122, 0.023, 0.021],
        [0.107 * Math.cos(a), 0.107 * Math.sin(a), 0.211],
        steel,
        0.008,
      );
    spoke.rotation.z = a;
    roller(wheel, 0.012, 0.02, [0.043 * Math.cos(a), 0.043 * Math.sin(a), 0.238], steel);
  }
  const springX = -0.17,
    damperX = 0.18,
    rearZ = -0.19;
  const coil = springGeometry(),
    coilMesh = mesh(root, coil.geometry, springMetal);
  coilMesh.position.x = springX;
  coilMesh.position.z = rearZ;
  const lowerSeat = cylinder(root, 0.122, 0.024, [springX, 0, rearZ], darkSteel),
    upperSeat = cylinder(root, 0.122, 0.024, [springX, 0, rearZ], steel);
  const springBracket = box(wheel, [0.29, 0.043, 0.14], [-0.14, 0.25, -0.2], darkSteel, 0.01);
  box(wheel, [0.052, 0.25, 0.12], [-0.03, 0.125, -0.2], darkSteel, 0.009);
  // Damper tube, visible inner wall, piston and a fixed-length rod. A section window faces the reader.
  const damper = new THREE.Group();
  root.add(damper);
  damper.position.x = damperX;
  damper.position.z = rearZ;
  const tubeProfile = [
    [0.055, 0],
    [0.055, G.damperTubeLength],
    [0.041, G.damperTubeLength],
    [0.041, 0],
    [0.055, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const casing = mesh(
    damper,
    new THREE.LatheGeometry(tubeProfile, 52, 0.6, Math.PI * 2 - 1.2),
    damperMetal,
  );
  for (const a of [-0.6, 0.6]) {
    const face = box(
      damper,
      [0.014, G.damperTubeLength, 0.002],
      [0.048 * Math.sin(a), G.damperTubeLength / 2, 0.048 * Math.cos(a)],
      steel,
      0,
    );
    face.rotation.y = -a;
  }
  cylinder(damper, 0.055, 0.021, [0, 0, 0], darkSteel);
  const topCap = cylinder(damper, 0.055, 0.021, [0, G.damperTubeLength, 0], steel);
  const fluidMaterial = new THREE.MeshPhysicalMaterial({
    color: '#afc6b7',
    transmission: 0.12,
    transparent: true,
    opacity: 0.16,
    roughness: 0.2,
    depthWrite: false,
  });
  const fluid = cylinder(
    damper,
    0.04,
    G.damperTubeLength - 0.03,
    [0, G.damperTubeLength / 2, 0],
    fluidMaterial,
  );
  fluid.castShadow = false;
  const piston = cylinder(root, 0.04, 0.019, [damperX, 0, rearZ], springMetal);
  const rod = cylinder(root, 0.017, G.damperRodLength, [damperX, 0, rearZ], steel);
  // The lower damper eye bolts to the wheel carrier. The upper eye bolts directly to the body.
  const lowerEye = roller(wheel, 0.035, 0.11, [damperX, G.damperLowerOffset, rearZ], darkSteel);
  roller(lowerEye, 0.014, 0.12, [0, 0, 0], steel);
  box(wheel, [0.25, 0.035, 0.13], [0.12, G.damperLowerOffset, rearZ], darkSteel, 0.008);
  box(
    wheel,
    [0.04, -G.damperLowerOffset, 0.12],
    [0, G.damperLowerOffset / 2, rearZ],
    darkSteel,
    0.006,
  );
  const upperEye = roller(body, 0.035, 0.11, [damperX, 0, rearZ], steel);
  roller(upperEye, 0.013, 0.12, [0, 0, 0], darkSteel);
  const lowerLip = cylinder(damper, 0.024, 0.025, [0, G.damperTubeLength + 0.012, 0], rubber);
  return {
    root,
    update(v: SuspensionVisual, reveal = 0) {
      const pose = suspensionPose(v.state, v.parameters, v.road);
      body.position.y = pose.upperMountY;
      wheel.position.y = pose.wheelY;
      platen.position.y = pose.roadY - 0.0325;
      const stemLength = pose.roadY + 0.155;
      roadStem.scale.y = stemLength / 0.2;
      roadStem.position.y = -0.22 + stemLength / 2;
      tire.update(pose.roadY - pose.wheelY);
      tireMaterial.opacity = 1 - reveal * 0.84;
      tireMaterial.depthWrite = reveal < 0.01;
      tireMesh.castShadow = reveal < 0.01;
      lowerSeat.position.y = pose.lowerSpringY;
      upperSeat.position.y = pose.upperMountY;
      coilMesh.position.y = pose.lowerSpringY;
      coil.update(pose.springLength);
      damper.position.y = pose.lowerDamperY;
      rod.position.y = pose.upperMountY - G.damperRodLength / 2;
      piston.position.y = pose.upperMountY - G.damperRodLength;
      // All hardware dimensions stay fixed. Only attachment positions and spring length change.
      springBracket.visible = casing.visible = topCap.visible = lowerLip.visible = true;
    },
  };
}

export default function SuspensionStudio({
  a,
  b,
  chapter,
  progress,
}: {
  a: SuspensionVisual;
  b: SuspensionVisual | null;
  chapter: number;
  progress: number;
}) {
  const demo = useShowcase(),
    current = useRef({ a, b, chapter, progress, demo });
  current.current = { a, b, chapter, progress, demo };
  return (
    <Studio
      className="susp-studio"
      cameraPosition={[4.0, 4.5, 11]}
      target={[0, 3.4, 0]}
      span={6.4}
      fitHeight={7.8}
      label={t('四分之一车试验架：弹簧、剖开减振器、车身、轮组和路面激振台相连')}
      fallback={
        <div className="susp-fallback-pair">
          <SuspensionDiagram visual={a} cutaway={chapter === 4} />
          {b && <SuspensionDiagram visual={b} cutaway={chapter === 4} />}
        </div>
      }
      create={({ root, camera, controls }) => {
        root.scale.setScalar(G.scale);
        root.position.y = 0.29 * G.scale;
        const one = createRig(root, false),
          two = createRig(root, true);
        const target = new THREE.Vector3(),
          direction = new THREE.Vector3();
        return {
          update() {
            const v = current.current;
            one.root.position.x = v.b ? -0.76 : 0;
            two.root.position.x = 0.76;
            two.root.visible = Boolean(v.b);
            const reveal = v.chapter === 4 ? 0.8 + 0.2 * Math.sin(Math.PI * v.progress) ** 2 : 0;
            one.update(v.a, reveal);
            if (v.b) two.update(v.b, reveal);
            if (v.demo.watch) {
              const arc = Math.sin(Math.PI * v.progress) ** 2,
                close = v.chapter === 4 ? arc : 0;
              target.set(close * 0.45, 3.3 + close * 0.05, -0.1);
              controls.target.copy(target);
              const height = Math.max(
                  (v.b ? 12.7 : 6.3 - close * 0.6) / camera.aspect,
                  8.0 - close * 0.15,
                ),
                distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
              direction
                .set(2.1 + (v.chapter === 0 ? 1.0 * (1 - v.progress) : 0.3 * arc), 1.25, 11)
                .normalize();
              camera.position.copy(target).addScaledVector(direction, distance);
            }
          },
        };
      }}
    />
  );
}
