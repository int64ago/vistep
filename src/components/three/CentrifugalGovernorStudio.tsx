import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import type { GovernorState } from '../../models/centrifugal-governor';
export default function CentrifugalGovernorStudio({
  state,
  fallback,
}: {
  state: GovernorState;
  fallback: ReactNode;
}) {
  const live = useRef(state);
  live.current = state;
  return (
    <Studio
      cameraPosition={[5, 3.4, 12]}
      target={[0.4, 1.7, 0]}
      span={7.6}
      fitHeight={5.8}
      exposure={0.83}
      label={t('飞球、等长连杆、套筒和真实连接的节流阀')}
      fallback={fallback}
      create={({ root }) => {
        const steel = new THREE.MeshStandardMaterial({
            color: '#a9b7ae',
            metalness: 0.8,
            roughness: 0.28,
          }),
          bronze = new THREE.MeshStandardMaterial({
            color: '#b79962',
            metalness: 0.72,
            roughness: 0.28,
          }),
          green = new THREE.MeshStandardMaterial({
            color: '#6e9486',
            metalness: 0.3,
            roughness: 0.48,
          }),
          pale = new THREE.MeshStandardMaterial({
            color: '#c9d5c3',
            metalness: 0.22,
            roughness: 0.65,
          }),
          flow = new THREE.MeshStandardMaterial({
            color: '#81b8ad',
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.55,
          });
        const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => {
          const o = new THREE.Mesh(g, m);
          o.castShadow = o.receiveShadow = true;
          root.add(o);
          return o;
        };
        const rod = (m: THREE.Material, r = 0.055) =>
            mesh(new THREE.CylinderGeometry(r, r, 1, 24), m),
          Y = new THREE.Vector3(0, 1, 0);
        const between = (o: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
          const d = b.clone().sub(a);
          o.position.copy(a).add(b).multiplyScalar(0.5);
          o.quaternion.setFromUnitVectors(Y, d.clone().normalize());
          o.scale.y = d.length();
        };
        const shaft = rod(steel, 0.085);
        between(shaft, new THREE.Vector3(-0.8, 0.18, 0), new THREE.Vector3(-0.8, 3.8, 0));
        const base = mesh(new THREE.CylinderGeometry(0.54, 0.67, 0.3, 48), green);
        base.position.set(-0.8, 0.15, 0);
        const top = mesh(new THREE.SphereGeometry(0.14, 28, 20), bronze);
        top.position.set(-0.8, 3.6, 0);
        const arms = [rod(steel), rod(steel), rod(steel), rod(steel)],
          balls = [
            mesh(new THREE.SphereGeometry(0.115, 32, 24), bronze),
            mesh(new THREE.SphereGeometry(0.115, 32, 24), bronze),
          ];
        const sleeve = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 32), bronze),
          collar = mesh(new THREE.TorusGeometry(0.205, 0.055, 16, 48), green);
        collar.rotation.x = Math.PI / 2;
        const bridge = rod(green, 0.045),
          upright = rod(green, 0.045),
          gate = mesh(new THREE.BoxGeometry(0.11, 1.6, 0.78), bronze),
          opening = mesh(new THREE.PlaneGeometry(1, 1), flow);
        opening.rotation.y = Math.PI / 2;
        // A fixed open frame exposes the port and gate rather than hiding them in an opaque housing.
        for (const x of [1.8, 3.0])
          for (const z of [-0.48, 0.48]) {
            const o = rod(pale, 0.055);
            between(o, new THREE.Vector3(x, 1.8, z), new THREE.Vector3(x, 3.3, z));
          }
        for (const y of [1.8, 3.3])
          for (const z of [-0.48, 0.48]) {
            const o = rod(pale, 0.055);
            between(o, new THREE.Vector3(1.8, y, z), new THREE.Vector3(3, y, z));
          }
        for (const x of [1.8, 3])
          for (const y of [1.8, 3.3]) {
            const o = rod(pale, 0.055);
            between(o, new THREE.Vector3(x, y, -0.48), new THREE.Vector3(x, y, 0.48));
          }
        const support = mesh(new THREE.BoxGeometry(1.45, 0.22, 1.15), green);
        support.position.set(2.4, 0.11, 0);
        for (const x of [1.85, 2.95]) {
          const o = rod(pale, 0.07);
          between(o, new THREE.Vector3(x, 0.22, -0.4), new THREE.Vector3(x, 1.8, -0.4));
        }
        return {
          update() {
            const s = live.current,
              scale = 6,
              h = s.height * scale,
              r = s.radius * scale,
              sy = 3.6 - 2 * h,
              phase = s.phase * 0.12;
            balls.forEach((ball, i) => {
              const a = phase + i * Math.PI,
                pos = new THREE.Vector3(-0.8 + r * Math.cos(a), 3.6 - h, r * Math.sin(a));
              ball.position.copy(pos);
              between(arms[i * 2], new THREE.Vector3(-0.8, 3.6, 0), pos);
              between(arms[i * 2 + 1], pos, new THREE.Vector3(-0.8, sy, 0));
            });
            sleeve.position.set(-0.8, sy, 0);
            collar.position.set(-0.8, sy, 0);
            const raw = s.baseValve - (s.feedback ? 4 * (s.rise - s.referenceRise) : 0),
              gateTop = 3.3 - 1.5 * raw;
            gate.position.set(2.4, gateTop - 0.8, 0);
            const height = 1.5 * s.valve;
            opening.scale.set(0.74, Math.max(0.001, height), 1);
            opening.position.set(2.465, 3.3 - height / 2, 0);
            opening.visible = s.valve > 0.001;
            bridge.visible = upright.visible = s.feedback;
            between(bridge, new THREE.Vector3(-0.8, sy, 0.205), new THREE.Vector3(2.4, sy, 0.48));
            between(
              upright,
              new THREE.Vector3(2.4, sy, 0.48),
              new THREE.Vector3(2.4, gateTop, 0.48),
            );
          },
        };
      }}
    />
  );
}
