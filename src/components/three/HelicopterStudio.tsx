import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { HELICOPTER, helicopterElement, helicopterSolve } from '../../models/helicopter';
import Studio, { type StudioContext } from './Studio';
import HelicopterFlat from './HelicopterFlat';
import {
  helicopterSolids,
  helicopterWorldPoint,
  type HelicopterVisual,
  HELI_ART,
} from '../../models/helicopter-geometry';

export default function HelicopterStudio({ visual }: { visual: HelicopterVisual }) {
  const live = useRef(visual);
  live.current = visual;
  return (
    <Studio
      className="helicopter-studio"
      cameraPosition={[4.8, 4.5, 12]}
      target={[-0.4, 1.6, 0]}
      span={11}
      fitHeight={5.9}
      exposure={0.7}
      label={t('民用直升机：主旋翼、旋翼毂、尾桨与相连的起落架')}
      fallback={<HelicopterFlat visual={visual} />}
      create={(context) => createHelicopter(live, context)}
    />
  );
}
/** Perspective fitting against a complete swept rotor envelope, kept constant
 * across phases so rotation cannot cause a breathing camera or clip a blade tip. */
export function helicopterFramingPoints(maxTiltDeg = 25) {
  const points: THREE.Vector3[] = [];
  for (const solid of helicopterSolids()) {
    if (solid.frame === 'fixed') points.push(...solid.vertices.map((p) => new THREE.Vector3(...p)));
    else {
      const center =
        solid.frame === 'tail'
          ? new THREE.Vector3(-4.7, 2.03, 0.25)
          : new THREE.Vector3(...HELI_ART.mast);
      const radius = solid.frame === 'tail' ? 0.7 : 4.54;
      for (let i = 0; i < 64; i++)
        for (const side of [
          -0.09 - 4.54 * Math.sin((maxTiltDeg * Math.PI) / 180),
          0.09 + 4.54 * Math.sin((maxTiltDeg * Math.PI) / 180),
        ]) {
          const a = (i / 64) * Math.PI * 2;
          points.push(
            solid.frame === 'tail'
              ? center
                  .clone()
                  .add(new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), side))
              : center
                  .clone()
                  .add(new THREE.Vector3(radius * Math.cos(a), side, radius * Math.sin(a))),
          );
        }
    }
  }
  return points;
}
export function fitHelicopterCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  points = helicopterFramingPoints(),
) {
  const direction = camera.position.clone().sub(target).normalize(),
    center = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()),
    right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
    up = new THREE.Vector3().crossVectors(direction, right).normalize(),
    tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = 5.5 / (2 * tangent);
  for (const p of points) {
    const v = p.clone().sub(center),
      depth = v.dot(direction);
    distance = Math.max(
      distance,
      depth + Math.abs(v.dot(right)) / (tangent * camera.aspect * 0.89),
      depth + Math.abs(v.dot(up)) / (tangent * 0.89),
    );
  }
  target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  return distance;
}
export function createHelicopter(
  live: { current: HelicopterVisual },
  { root, camera, controls }: StudioContext,
) {
  const parts = helicopterSolids().map((solid) => {
    const geometry = new THREE.BufferGeometry(),
      positions = new Float32Array(solid.vertices.length * 3),
      indices: number[] = [];
    for (const face of solid.faces)
      for (let i = 1; i < face.length - 1; i++) indices.push(face[0], face[i], face[i + 1]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    const material = new THREE.MeshStandardMaterial({
      color: solid.color,
      transparent: solid.part === 'canopy',
      opacity: solid.part === 'canopy' ? 0.83 : 1,
      depthWrite: solid.part !== 'canopy',
      metalness: solid.part.includes('mast') || solid.part.includes('grip') ? 0.6 : 0.12,
      roughness: solid.part === 'canopy' ? 0.24 : 0.48,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = solid.part;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    return { solid, geometry, positions, mesh };
  });
  const tailArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-4.7, 2.03, 0.25),
    1,
    '#2e7881',
    0.16,
    0.085,
  );
  const sectionFlow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -0.05, 1).normalize(),
      new THREE.Vector3(3.375, HELI_ART.mast[1] + 0.12, -0.27),
      0.58,
      '#77989d',
      0.045,
      0.024,
    ),
    sectionLift = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(3.375, HELI_ART.mast[1], 0),
      0.1,
      '#2e7881',
      0.035,
      0.02,
    );
  root.add(sectionFlow, sectionLift);
  const thrustArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(...HELI_ART.mast),
      1.3,
      '#2e7881',
      0.19,
      0.1,
    ),
    weightArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0.25, 1.25, 0.7),
      0.981,
      '#677075',
      0.16,
      0.085,
    );
  for (const arrow of [tailArrow, thrustArrow, weightArrow]) {
    for (const child of [arrow.line, arrow.cone]) {
      const material = child.material as THREE.Material;
      material.depthTest = false;
      material.depthWrite = false;
      child.renderOrder = 8;
    }
  }
  root.add(tailArrow, thrustArrow, weightArrow);
  const ordinary = helicopterFramingPoints(0),
    tilted = helicopterFramingPoints(25);
  ordinary.push(new THREE.Vector3(0, 4.9, 0));
  tilted.push(new THREE.Vector3(0, 4.9, 0));
  const fit = () => {
    const v = live.current,
      closeup = v.view === 'section' || v.view === 'cyclic' || v.view === 'collective';
    let d: number;
    if (closeup) {
      const section = v.view === 'section',
        collective = v.view === 'collective',
        radius = section ? 3.375 : collective ? 0 : 0.4,
        spin = collective ? 0 : v.phase,
        point = new THREE.Vector3(
          radius * Math.cos(spin),
          HELI_ART.mast[1],
          -radius * Math.sin(spin),
        ),
        direction = new THREE.Vector3(
          ...((section ? [2.5, 0.32, 1.5] : collective ? [2.5, 2.4, 8] : [0.3, 0.85, 3]) as [
            number,
            number,
            number,
          ]),
        )
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), spin)
          .normalize(),
        tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
        span = section ? 0.67 : collective ? 2.9 : 1.8,
        height = section ? 0.48 : collective ? 1.45 : 1.08;
      d = Math.max(span / (2 * tangent * camera.aspect), height / (2 * tangent));
      if (section && camera.aspect < 1.25) {
        // The phone stage is 310 CSS px tall. Translate the camera's viewing
        // center upward by exactly 40 screen px, leaving the actual section and
        // its airflow arrows below the fixed location guide without zooming.
        const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
          up = new THREE.Vector3().crossVectors(direction, right).normalize();
        point.addScaledVector(up, (2 * d * tangent * 40) / 310);
      }
      controls.target.copy(point);
      camera.position.copy(point).addScaledVector(direction, d);
      camera.lookAt(point);
      camera.updateMatrixWorld(true);
    } else
      d = fitHelicopterCamera(
        camera,
        controls.target,
        (v.diskTiltDeg ?? 0) > 0 ? tilted : ordinary,
      );
    controls.minDistance = controls.maxDistance = d;
  };
  controls.addEventListener('change', fit);
  let lastPhase = NaN,
    lastPitch = NaN,
    lastCyclic = NaN,
    lastTilt = NaN,
    lastView: string | undefined;
  return {
    update() {
      const v = live.current;
      if (
        lastView !== v.view &&
        !['section', 'cyclic', 'collective'].includes(v.view ?? 'aircraft')
      )
        camera.position.copy(controls.target).add(new THREE.Vector3(4.8, 4.5, 12));
      lastView = v.view;
      sectionFlow.visible = sectionLift.visible = v.view === 'section';
      if (v.view === 'section') {
        const state = helicopterSolve({ collectiveDeg: v.collectiveDeg }),
          e = helicopterElement(v.collectiveDeg, state.induced, 0.75 * HELICOPTER.radius);
        sectionFlow.setDirection(new THREE.Vector3(0, -state.induced, e.tangential).normalize());
        sectionLift.setDirection(
          new THREE.Vector3(0, Math.cos(e.inflowAngle), Math.sin(e.inflowAngle)),
        );
        sectionLift.setLength(Math.max(0.0001, e.liftPerMetre * 0.00006), 0.035, 0.02);
      }
      const forceView = ['aircraft', 'vector', 'balance'].includes(v.view ?? 'aircraft');
      thrustArrow.visible = weightArrow.visible = forceView;
      if (forceView) {
        const angle = ((v.diskTiltDeg ?? 0) * Math.PI) / 180;
        thrustArrow.setDirection(new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0));
        thrustArrow.setLength((v.thrust ?? 9810) * 0.0001, 0.19, 0.1);
        weightArrow.setLength((v.weight ?? 9810) * 0.0001, 0.16, 0.085);
      }
      tailArrow.visible = v.torque && (v.tailForce ?? 0) > 0.1;
      if (tailArrow.visible) {
        const length = (v.tailForce ?? 0) / 500;
        tailArrow.setLength(length, Math.min(0.16, length * 0.4), Math.min(0.085, length * 0.2));
      }
      const changed =
        v.phase !== lastPhase ||
        v.collectiveDeg !== lastPitch ||
        v.cyclicDeg !== lastCyclic ||
        v.diskTiltDeg !== lastTilt;
      for (const { solid, mesh } of parts) {
        mesh.visible = solid.part !== 'blade-section-face' || v.view === 'section';
        if (solid.part === 'blade-a' || solid.part === 'blade-a-tip') {
          const n = new THREE.Vector3(-Math.cos(v.phase), 0, Math.sin(v.phase));
          (mesh.material as THREE.MeshStandardMaterial).clippingPlanes =
            v.view === 'section' ? [new THREE.Plane(n, 3.375)] : [];
        }
      }
      if (changed)
        for (const { solid, geometry, positions } of parts) {
          if (solid.frame === 'fixed' && Number.isFinite(lastPhase)) continue;
          solid.vertices.forEach((p, i) =>
            positions.set(helicopterWorldPoint(p, solid.frame, v), i * 3),
          );
          geometry.attributes.position.needsUpdate = true;
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
        }
      lastPhase = v.phase;
      lastPitch = v.collectiveDeg;
      lastCyclic = v.cyclicDeg;
      lastTilt = v.diskTiltDeg ?? 0;
      fit();
    },
    dispose() {
      controls.removeEventListener('change', fit);
    },
  };
}
