import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import type { GyroscopeState } from '../../models/gyroscope';
export default function GyroscopeStudio({
  state,
  kind,
  fallback,
}: {
  state: GyroscopeState;
  kind: 'forces' | 'momentum' | 'plain';
  fallback: ReactNode;
}) {
  const live = useRef({ state, kind });
  live.current = { state, kind };
  return (
    <Studio
      cameraPosition={[10, 7, 4]}
      target={[0, 2.2, 0]}
      span={8.2}
      fitHeight={5.9}
      exposure={0.84}
      label={t('固定支点、水平轮轴和绕竖直方向进动的陀螺')}
      fallback={fallback}
      create={({ root }) => {
        const steel = new THREE.MeshStandardMaterial({
            color: '#9eafb1',
            metalness: 0.8,
            roughness: 0.28,
          }),
          bronze = new THREE.MeshStandardMaterial({
            color: '#b79761',
            metalness: 0.72,
            roughness: 0.32,
          }),
          green = new THREE.MeshStandardMaterial({
            color: '#769b8c',
            metalness: 0.3,
            roughness: 0.55,
          }),
          origin = new THREE.Vector3(0, 2.4, 0),
          Y = new THREE.Vector3(0, 1, 0);
        const mesh = (
          g: THREE.BufferGeometry,
          m: THREE.Material,
          parent: THREE.Object3D = root,
        ) => {
          const x = new THREE.Mesh(g, m);
          x.castShadow = x.receiveShadow = true;
          parent.add(x);
          return x;
        };
        const base = mesh(new THREE.CylinderGeometry(0.67, 0.84, 0.28, 48), green);
        base.position.y = 0.14;
        const post = mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.25, 32), steel);
        post.position.y = 1.35;
        const pivot = mesh(new THREE.SphereGeometry(0.18, 32, 24), bronze);
        pivot.position.copy(origin);
        const shaft = mesh(new THREE.CylinderGeometry(0.065, 0.065, 1, 32), steel),
          rotor = new THREE.Group();
        root.add(rotor);
        const disk = mesh(new THREE.CylinderGeometry(1, 1, 0.095, 96), steel, rotor),
          hub = mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.23, 40), bronze, rotor);
        const mark = mesh(new THREE.BoxGeometry(0.08, 0.018, 1.4), bronze, rotor);
        mark.position.set(0.3, 0.058, 0.35);
        const rim = mesh(new THREE.TorusGeometry(0.98, 0.02, 12, 96), green, rotor);
        rim.rotation.x = Math.PI / 2;
        const arrow = (color: number) => {
            const a = new THREE.ArrowHelper(Y, origin, 1, color, 0.18, 0.095);
            // Teaching vectors remain legible when their physical origin is behind the disk.
            for (const part of [a.line, a.cone]) {
              const material = part.material as THREE.Material;
              material.depthTest = false;
              material.depthWrite = false;
              part.renderOrder = 20;
            }
            root.add(a);
            return a;
          },
          gravity = arrow(0xba8a56),
          reaction = arrow(0x799586),
          momentum = arrow(0x6c92a0),
          torque = arrow(0xb1775f);
        const setArrow = (
          a: THREE.ArrowHelper,
          start: THREE.Vector3,
          direction: THREE.Vector3,
          length: number,
          visible: boolean,
        ) => {
          a.visible = visible && length > 1e-7;
          if (!a.visible) return;
          a.position.copy(start);
          a.setDirection(direction.normalize());
          a.setLength(length, Math.min(0.23, length * 0.22), Math.min(0.12, length * 0.12));
        };
        return {
          update() {
            const { state: s, kind: k } = live.current,
              n = new THREE.Vector3(s.axis.x, 0, s.axis.z),
              center = origin.clone().addScaledVector(n, s.arm * 10),
              length = (s.arm + 0.07) * 10;
            shaft.position.copy(origin).addScaledVector(n, length / 2);
            shaft.quaternion.setFromUnitVectors(Y, n);
            shaft.scale.y = length;
            rotor.position.copy(center);
            // Explicit precession and spin avoid the extra axial rotation in the shortest-arc basis.
            rotor.quaternion.setFromAxisAngle(Y, s.azimuth);
            rotor.rotateZ(-Math.PI / 2);
            rotor.rotateY(s.spinAngle);
            disk.scale.set(s.radius * 10, 1, s.radius * 10);
            rim.scale.setScalar(s.radius * 10);
            mark.scale.z = s.radius / 0.18;
            setArrow(
              gravity,
              center,
              new THREE.Vector3(0, -1, 0),
              (1.25 * s.gravity) / 9.81,
              k === 'forces',
            );
            setArrow(
              reaction,
              origin,
              new THREE.Vector3(s.reaction.x, s.reaction.y, s.reaction.z),
              1.25,
              k === 'forces' && s.gravity > 0,
            );
            setArrow(
              momentum,
              origin,
              new THREE.Vector3(s.spinMomentum * s.axis.x, 0, s.spinMomentum * s.axis.z),
              Math.abs(s.spinMomentum) * 0.68,
              k === 'momentum',
            );
            setArrow(
              torque,
              origin,
              new THREE.Vector3(s.torque.x, 0, s.torque.z),
              (1.3 * s.gravity) / 9.81,
              k !== 'plain' && s.gravity > 0,
            );
          },
        };
      }}
    />
  );
}
