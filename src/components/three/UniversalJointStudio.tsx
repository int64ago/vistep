import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import type { UniversalJointState, JointVector } from '../../models/universal-joint';
export default function UniversalJointStudio({
  state,
  fallback,
}: {
  state: UniversalJointState;
  fallback: ReactNode;
}) {
  const live = useRef(state);
  live.current = state;
  return (
    <Studio
      key={state.paired ? 'pair' : 'single'}
      cameraPosition={[7, 5, 10]}
      target={state.paired ? [1.5, 1.9, 0] : [0, 1.4, 0]}
      span={state.paired ? 10.8 : 6.8}
      fitHeight={state.paired ? 5.8 : 4.5}
      exposure={0.8}
      label={t('叉头、十字轴与相交传动轴的真实连接')}
      fallback={fallback}
      create={({ root }) => {
        const copper = new THREE.MeshStandardMaterial({
            color: '#ba8354',
            metalness: 0.72,
            roughness: 0.3,
          }),
          teal = new THREE.MeshStandardMaterial({
            color: '#5f9597',
            metalness: 0.72,
            roughness: 0.3,
          }),
          steel = new THREE.MeshStandardMaterial({
            color: '#b0bfc2',
            metalness: 0.85,
            roughness: 0.25,
          }),
          bronze = new THREE.MeshStandardMaterial({
            color: '#d2b779',
            metalness: 0.7,
            roughness: 0.35,
          });
        const v = (a: JointVector) => new THREE.Vector3(a.x, a.y, a.z),
          Y = new THREE.Vector3(0, 1, 0),
          Z = new THREE.Vector3(0, 0, 1);
        const rod = (material: THREE.Material, r = 0.14) => {
          const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 28), material);
          m.castShadow = m.receiveShadow = true;
          root.add(m);
          return m;
        };
        const between = (m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
          const d = b.clone().sub(a);
          m.position.copy(a).add(b).multiplyScalar(0.5);
          m.quaternion.setFromUnitVectors(Y, d.clone().normalize());
          m.scale.y = d.length();
        };
        const makeFork = (material: THREE.Material) => ({
          base: rod(material, 0.16),
          arms: [rod(material, 0.15), rod(material, 0.15)],
          rings: [-1, 1].map(() => {
            const m = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 16, 40), material);
            m.castShadow = true;
            root.add(m);
            return m;
          }),
        });
        const makeJoint = (first: THREE.Material, second: THREE.Material) => ({
          first: makeFork(first),
          second: makeFork(second),
          pins: [rod(steel, 0.13), rod(steel, 0.13)],
          core: (() => {
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 16), steel);
            root.add(m);
            return m;
          })(),
        });
        const one = makeJoint(copper, teal),
          two = makeJoint(teal, copper),
          input = rod(copper, 0.23),
          middle = rod(teal, 0.23),
          output = rod(copper, 0.23),
          markers = [rod(bronze, 0.055), rod(bronze, 0.055), rod(bronze, 0.055)];
        const placeFork = (
          f: ReturnType<typeof makeFork>,
          center: THREE.Vector3,
          axis: THREE.Vector3,
          pin: THREE.Vector3,
          side: number,
        ) => {
          const back = center.clone().addScaledVector(axis, side * 1.05);
          between(
            f.base,
            back.clone().addScaledVector(pin, -0.66),
            back.clone().addScaledVector(pin, 0.66),
          );
          [-1, 1].forEach((sign, i) => {
            const bearing = center.clone().addScaledVector(pin, sign * 0.66);
            between(
              f.arms[i],
              back.clone().addScaledVector(pin, sign * 0.66),
              bearing.clone().addScaledVector(axis, side * 0.25),
            );
            f.rings[i].position.copy(bearing);
            f.rings[i].quaternion.setFromUnitVectors(Z, pin);
          });
        };
        const placeJoint = (
          j: ReturnType<typeof makeJoint>,
          center: THREE.Vector3,
          a: THREE.Vector3,
          b: THREE.Vector3,
          u: THREE.Vector3,
          w: THREE.Vector3,
        ) => {
          placeFork(j.first, center, a, u, -1);
          placeFork(j.second, center, b, w, 1);
          between(
            j.pins[0],
            center.clone().addScaledVector(u, -0.76),
            center.clone().addScaledVector(u, 0.76),
          );
          between(
            j.pins[1],
            center.clone().addScaledVector(w, -0.76),
            center.clone().addScaledVector(w, 0.76),
          );
          j.core.position.copy(center);
        };
        const setVisible = (j: ReturnType<typeof makeJoint>, visible: boolean) => {
          for (const f of [j.first, j.second])
            for (const m of [f.base, ...f.arms, ...f.rings]) m.visible = visible;
          j.pins.forEach((m) => (m.visible = visible));
          j.core.visible = visible;
        };
        return {
          update() {
            const s = live.current,
              a = v(s.inputAxis),
              b = v(s.middleAxis),
              c = v(s.outputAxis),
              u = v(s.inputPin),
              w = v(s.middlePin),
              z = v(s.outputPin),
              origin = new THREE.Vector3(0, 1.2, 0),
              second = origin.clone().addScaledVector(b, 3.0);
            placeJoint(one, origin, a, b, u, w);
            between(
              input,
              origin.clone().addScaledVector(a, -3),
              origin.clone().addScaledVector(a, -1.05),
            );
            setVisible(two, s.paired);
            output.visible = markers[2].visible = s.paired;
            if (s.paired) {
              placeJoint(two, second, b, c, w, z);
              between(
                middle,
                origin.clone().addScaledVector(b, 1.05),
                second.clone().addScaledVector(b, -1.05),
              );
              between(
                output,
                second.clone().addScaledVector(c, 1.05),
                second.clone().addScaledVector(c, 3),
              );
            } else
              between(
                middle,
                origin.clone().addScaledVector(b, 1.05),
                origin.clone().addScaledVector(b, 3),
              );
            const centers = [
                origin.clone().addScaledVector(a, -2.4),
                origin.clone().addScaledVector(b, s.paired ? 1.5 : 2.4),
                second.clone().addScaledVector(c, 2.4),
              ],
              pins = [u, w, z];
            markers.forEach((m, i) =>
              between(
                m,
                centers[i].clone().addScaledVector(pins[i], 0.2),
                centers[i].clone().addScaledVector(pins[i], 0.65),
              ),
            );
          },
        };
      }}
    />
  );
}
