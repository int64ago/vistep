import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { JELLY, jellyVortices, type JellyFrame, type JellyShot } from '../../models/jellyfish';
import {
  jellyBellMesh,
  jellyGonadPoint,
  jellyOralPoint,
  jellyTentaclePoint,
} from '../../models/jellyfish-geometry';
import Studio, { type StudioContext } from './Studio';
import JellyfishFlat, { jellyVortexSection } from './JellyfishFlat';
export type JellyVisual = { frame: JellyFrame; shot: JellyShot; watch: boolean };
export default function JellyfishStudio({ visual }: { visual: JellyVisual }) {
  const live = useRef(visual);
  live.current = visual;
  return (
    <Studio
      className="jelly-studio"
      dark
      exposure={0.72}
      cameraPosition={[2.3, 2.7, 6]}
      target={[0, 1.3, 0]}
      span={3.2}
      fitHeight={3.4}
      label={t('月水母：透明伞壁、四个生殖腺、口腕和伞缘触手')}
      fallback={<JellyfishFlat visual={visual} />}
      create={(context) => createJellyfish(live, context)}
    />
  );
}
export function createJellyfish(
  live: { current: JellyVisual },
  { root, camera, controls, scene, reducedMotion }: StudioContext,
) {
  const animal = new THREE.Group();
  animal.position.y = 1.6;
  root.add(animal);
  const tissue = new THREE.MeshPhysicalMaterial({
    color: '#d0f0f3',
    roughness: 0.17,
    metalness: 0,
    transparent: true,
    opacity: 0.29,
    depthWrite: false,
    transmission: 0.25,
    thickness: 0.06,
    ior: 1.34,
    clearcoat: 0.8,
    side: THREE.DoubleSide,
  });
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: '#b9e3e8',
    roughness: 0.28,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const waterMaterial = new THREE.MeshBasicMaterial({
    color: '#79becd',
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const bodyMeshes = [false, true].map((inner) => {
    const art = jellyBellMesh(live.current.frame, 24, 64, inner),
      geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(art.vertices.flat(), 3));
    geometry.setIndex(art.indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, inner ? innerMaterial : tissue);
    mesh.renderOrder = inner ? 4 : 5;
    animal.add(mesh);
    return { mesh, geometry, inner, indices: art.indices };
  });
  const waterGeometry = bodyMeshes[1].geometry.clone(),
    water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.renderOrder = 0;
  animal.add(water);
  const organGroup = new THREE.Group();
  animal.add(organGroup);
  const gonadMaterial = new THREE.MeshStandardMaterial({
    color: '#c3a0bf',
    roughness: 0.43,
    transparent: true,
    opacity: 0.77,
    depthWrite: false,
  });
  const canalsMaterial = new THREE.LineBasicMaterial({
    color: '#91c2cf',
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  for (let arm = 0; arm < 4; arm++) {
    const path = new THREE.CatmullRomCurve3(
      Array.from({ length: 33 }, (_, i) => new THREE.Vector3(...jellyGonadPoint(arm, i / 32))),
    );
    const gland = new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.028, 8, false), gonadMaterial);
    gland.renderOrder = 2;
    organGroup.add(gland);
  }
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const points = Array.from({ length: 20 }, (_, j) => {
      const radius = 0.15 + (j / 19) * 0.82;
      return new THREE.Vector3(
        radius * Math.cos(angle),
        0.425 * Math.sqrt(Math.max(0, 1 - (radius / 0.975) ** 2)) - 0.01,
        radius * Math.sin(angle),
      );
    });
    organGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), canalsMaterial),
    );
  }
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: '#a6d9db',
    transparent: true,
    opacity: 0.43,
    roughness: 0.45,
    depthWrite: false,
  });
  const rimPath = new THREE.CatmullRomCurve3(
    Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a), -0.006 + Math.cos(a * 16) * 0.009, Math.sin(a));
    }),
    true,
  );
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimPath, 192, 0.018, 6, true), rimMaterial);
  animal.add(rim);
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 10),
    new THREE.MeshStandardMaterial({
      color: '#bdc5cd',
      roughness: 0.5,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  mouth.scale.set(1, 0.3, 1);
  mouth.position.y = 0.07;
  animal.add(mouth);
  const oralMaterial = new THREE.MeshStandardMaterial({
    color: '#c3dce1',
    roughness: 0.38,
    transparent: true,
    opacity: 0.43,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const oralArms = Array.from({ length: 4 }, (_, arm) => {
    const indices: number[] = [];
    for (let row = 0; row < 32; row++)
      for (let across = 0; across < 4; across++) {
        const a = row * 5 + across;
        indices.push(a, a + 1, a + 5, a + 1, a + 6, a + 5);
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(33 * 5 * 3), 3));
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, oralMaterial);
    mesh.renderOrder = 3;
    animal.add(mesh);
    return { arm, geometry };
  });
  const tentacleMaterial = new THREE.LineBasicMaterial({
    color: '#c7e4df',
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const tentacles = Array.from({ length: 64 }, (_, index) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(13 * 3), 3));
    animal.add(new THREE.Line(geometry, tentacleMaterial));
    return { index, geometry };
  });
  const ringColors = ['#5da7bf', '#d8ab6b'];
  const rings = ringColors.map((color) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.018, 8, 80),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    mesh.rotation.x = Math.PI / 2;
    root.add(mesh);
    return mesh;
  });
  const vortexSections = ringColors.map((color, index) =>
    ([-1, 1] as const).map((side) => {
      const group = new THREE.Group();
      group.name = `vortex-section:${index === 0 ? 'starting' : 'stopping'}:${side}`;
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(33 * 3), 3));
      group.add(new THREE.Line(lineGeometry, material));
      const headGeometry = new THREE.BufferGeometry();
      headGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
      const head = new THREE.Mesh(
        headGeometry,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      group.add(head);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.023, 10, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }),
      );
      group.add(marker);
      root.add(group);
      return { side, group, lineGeometry, material, headGeometry, head, marker };
    }),
  );
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 1.25, 0),
    0.4,
    '#dfb878',
    0.09,
    0.045,
  );
  root.add(arrow);
  const flowArrows = [-0.35, 0, 0.35].map((x) => {
    const flow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(x, 1.5, 0.1),
      0.4,
      '#81c8cd',
      0.08,
      0.035,
    );
    root.add(flow);
    return flow;
  });
  const key = new THREE.PointLight('#a8eaf6', 2.2, 12);
  key.position.set(-2, 4, 3);
  scene.add(key);
  const back = new THREE.PointLight('#92bccc', 1.8, 10);
  back.position.set(2, 2, -3);
  scene.add(back);
  let previousFrame: JellyFrame | null = null,
    previousSection: boolean | undefined,
    previousCameraSection: boolean | undefined,
    lastAspect = 0,
    cameraBlend = 1,
    wasWatching = false;
  const cameraFrom = new THREE.Vector3(),
    cameraTo = new THREE.Vector3(),
    targetFrom = new THREE.Vector3(),
    targetTo = new THREE.Vector3();
  const update = (dt = 0, _elapsed = 0, settle = false) => {
    const { frame, shot } = live.current,
      r = frame.radius / JELLY.radius,
      h = frame.height / JELLY.height;
    if (previousFrame !== frame) {
      for (const part of bodyMeshes) {
        const art = jellyBellMesh(frame, 24, 64, part.inner),
          attribute = part.geometry.getAttribute('position') as THREE.BufferAttribute;
        attribute.array.set(art.vertices.flat());
        attribute.needsUpdate = true;
        part.geometry.computeVertexNormals();
      }
      const positions = waterGeometry.getAttribute('position') as THREE.BufferAttribute;
      positions.array.set(
        (bodyMeshes[1].geometry.getAttribute('position') as THREE.BufferAttribute).array,
      );
      positions.needsUpdate = true;
      for (const { arm, geometry } of oralArms) {
        const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let row = 0; row <= 32; row++)
          for (let across = 0; across < 5; across++)
            positions.setXYZ(
              row * 5 + across,
              ...jellyOralPoint(arm, row / 32, across / 2 - 1, frame),
            );
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      for (const { index, geometry } of tentacles) {
        const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let j = 0; j <= 12; j++)
          positions.setXYZ(j, ...jellyTentaclePoint(index, j / 12, frame));
        positions.needsUpdate = true;
      }
      organGroup.scale.set(r, h, r);
      rim.scale.set(r, 1, r);
      previousFrame = frame;
    }
    if (previousSection !== shot.section) {
      for (const part of bodyMeshes) {
        const selected: number[] = [];
        for (let i = 0; i < part.indices.length; i += 3) {
          const ids = part.indices.slice(i, i + 3);
          if (
            !shot.section ||
            ids.reduce(
              (sum, id) => sum + Number(part.geometry.getAttribute('position').getZ(id)),
              0,
            ) <= 1e-8
          )
            selected.push(...ids);
        }
        part.geometry.setIndex(selected);
        part.geometry.computeVertexNormals();
      }
      previousSection = shot.section;
    }
    water.visible = shot.view === 'volume';
    tissue.opacity = shot.section ? 0.22 : 0.29;
    const vortices = jellyVortices(frame);
    rings.forEach((ring, i) => {
      const vortex = vortices.find((v) => v.type === (i === 0 ? 'starting' : 'stopping'));
      ring.visible = !!vortex && ['vortices', 'pressure'].includes(shot.view);
      if (vortex) {
        ring.position.y = 1.6 + vortex.y;
        ring.scale.setScalar(vortex.radius);
        (ring.material as THREE.MeshBasicMaterial).opacity = vortex.strength * 0.65;
      }
      vortexSections[i].forEach((section) => {
        section.group.visible = ring.visible;
        if (!vortex) return;
        const cross = jellyVortexSection(vortex, section.side, frame.phase);
        section.group.userData.sense = cross.sense;
        section.group.position.y = 1.6;
        const linePositions = section.lineGeometry.getAttribute(
          'position',
        ) as THREE.BufferAttribute;
        linePositions.array.set(cross.arc.flat());
        linePositions.needsUpdate = true;
        const headPositions = section.headGeometry.getAttribute(
          'position',
        ) as THREE.BufferAttribute;
        headPositions.array.set(cross.head.flat());
        headPositions.needsUpdate = true;
        section.headGeometry.computeBoundingSphere();
        section.lineGeometry.computeBoundingSphere();
        section.marker.position.fromArray(cross.marker);
        section.material.opacity = 0.4 + vortex.strength * 0.5;
        (section.head.material as THREE.MeshBasicMaterial).opacity = 0.5 + vortex.strength * 0.5;
        (section.marker.material as THREE.MeshBasicMaterial).opacity = 0.5 + vortex.strength * 0.5;
      });
    });
    arrow.visible = shot.view === 'pressure' && frame.recoveryForce > 0;
    arrow.setLength(0.16 + Math.min(0.7, frame.recoveryForce / 0.000015), 0.09, 0.045);
    flowArrows.forEach((flow) => {
      flow.visible =
        ['volume', 'vortices'].includes(shot.view) && (frame.inflow > 0 || frame.outflow > 0);
      flow.setDirection(new THREE.Vector3(0, frame.inflow > 0 ? 1 : -1, 0));
      flow.setLength(0.18 + Math.min(0.45, (frame.inflow + frame.outflow) * 70000), 0.08, 0.035);
    });
    if (
      live.current.watch &&
      (!wasWatching || previousCameraSection !== shot.section || lastAspect !== camera.aspect)
    ) {
      const distance = camera.position.distanceTo(controls.target),
        direction = new THREE.Vector3(
          ...(shot.section ? [0, 0.12, 1] : [0.25, 0.6, 1]),
        ).normalize();
      cameraFrom.copy(camera.position);
      targetFrom.copy(controls.target);
      targetTo.set(0, shot.section ? 1.05 : 1.3, 0);
      cameraTo.copy(targetTo).addScaledVector(direction, distance);
      cameraBlend = 0;
      previousCameraSection = shot.section;
      lastAspect = camera.aspect;
    }
    if (live.current.watch) {
      cameraBlend = settle || reducedMotion.matches ? 1 : Math.min(1, cameraBlend + dt / 0.55);
      const blend = cameraBlend * cameraBlend * (3 - 2 * cameraBlend);
      camera.position.lerpVectors(cameraFrom, cameraTo, blend);
      controls.target.lerpVectors(targetFrom, targetTo, blend);
      camera.lookAt(controls.target);
    }
    wasWatching = live.current.watch;
  };
  update(0, 0, true);
  return {
    update,
    dispose: () => {
      scene.remove(key, back);
    },
  };
}
