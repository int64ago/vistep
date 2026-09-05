import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import WirelessChargingFlat from './WirelessChargingFlat';
import { t } from '../../i18n';
import {
  WIRELESS as W,
  wirelessCoilPoint,
  wirelessWires,
  wirelessPorts,
  wirelessReceiverOffset,
  wirelessFluxPoint,
  type WCPoint,
  type WirelessShot,
} from '../../models/wireless-charging';

class WirelessSpiral extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const p = wirelessCoilPoint(t);
    return target.set(p[0] * W.scale, p[1] * W.scale, p[2] * W.scale);
  }
}
export default function WirelessChargingStudio({
  shot,
  narrow,
}: {
  shot: WirelessShot;
  narrow: boolean;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      className="wireless-studio"
      exposure={1.05}
      label={t('两组完整八匝线圈、绝缘跨线、补偿电容、发送电路与接收负载的剖视模型')}
      cameraPosition={narrow ? [0.5, 10, 10] : [7.2, 9.2, 11.5]}
      target={narrow ? [0, 1.1, -0.65] : [0.9, 1.05, 0.25]}
      span={narrow ? 8.6 : 9.4}
      fitHeight={narrow ? 9.2 : 6.2}
      fallback={<WirelessChargingFlat shot={shot} narrow={narrow} />}
      create={({ root, controls }) => {
        const tx = new THREE.Group(),
          rx = new THREE.Group();
        root.add(tx, rx);
        tx.position.y = W.txHeight * W.scale;
        const copperTx = new THREE.MeshStandardMaterial({
          color: '#bd8656',
          metalness: 0.84,
          roughness: 0.29,
        });
        const copperRx = new THREE.MeshStandardMaterial({
          color: '#b9824f',
          metalness: 0.8,
          roughness: 0.28,
        });
        const ceramic = new THREE.MeshStandardMaterial({
          color: '#ede4d6',
          roughness: 0.66,
          metalness: 0.06,
        });
        const support = new THREE.MeshStandardMaterial({
          color: '#9eb5aa',
          roughness: 0.7,
          metalness: 0.2,
        });
        const ferriteTx = new THREE.MeshStandardMaterial({
          color: '#3b4650',
          roughness: 0.74,
          metalness: 0.18,
        });
        const ferriteRx = new THREE.MeshStandardMaterial({
          color: '#3b4650',
          roughness: 0.74,
          metalness: 0.18,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        });
        const board = new THREE.MeshStandardMaterial({
          color: '#5c8174',
          roughness: 0.64,
          metalness: 0.1,
        });
        const source = new THREE.MeshStandardMaterial({
          color: '#283f4e',
          roughness: 0.57,
          metalness: 0.18,
        });
        const loadMaterial = new THREE.MeshStandardMaterial({ color: '#ceb98f', roughness: 0.72 });
        const put = (
          g: THREE.BufferGeometry,
          m: THREE.Material,
          p: WCPoint,
          group: THREE.Object3D,
        ) => {
          const mesh = new THREE.Mesh(g, m);
          mesh.position.set(p[0] * W.scale, p[1] * W.scale, p[2] * W.scale);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        };
        const wire = (
          points: WCPoint[],
          material: THREE.Material,
          group: THREE.Object3D,
          r = 0.00034,
        ) => {
          for (let i = 0; i < points.length - 1; i++) {
            const a = new THREE.Vector3(...points[i]).multiplyScalar(W.scale),
              b = new THREE.Vector3(...points[i + 1]).multiplyScalar(W.scale),
              d = b.clone().sub(a);
            const mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(r * W.scale, r * W.scale, d.length(), 10),
              material,
            );
            mesh.position.copy(a).add(b).multiplyScalar(0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
            mesh.castShadow = true;
            group.add(mesh);
          }
          for (const p of points)
            put(new THREE.SphereGeometry(r * W.scale, 10, 7), material, p, group);
        };
        const ferrites: THREE.Mesh[] = [];
        const coilGeometry = new THREE.TubeGeometry(
          new WirelessSpiral(),
          1280,
          W.wireRadius * W.scale,
          8,
          false,
        );
        let switchArm: THREE.Mesh;
        for (const [receiver, group] of [
          [false, tx],
          [true, rx],
        ] as const) {
          const sign = receiver ? 1 : -1,
            mat = receiver ? copperRx : copperTx;
          put(coilGeometry, mat, [0, 0, 0], group);
          ferrites.push(
            put(
              new THREE.CylinderGeometry(2.34, 2.34, 0.11, 72),
              receiver ? ferriteRx : ferriteTx,
              [0, sign * 0.003, 0],
              group,
            ),
          );
          put(
            new THREE.TorusGeometry(2.38, 0.045, 9, 72).rotateX(Math.PI / 2),
            support,
            [0, sign * 0.0022, 0],
            group,
          );
          if (!receiver)
            put(new THREE.CylinderGeometry(2.49, 2.49, 0.13, 72), ceramic, [0, -0.0042, 0], group);
          // The receiver's slim support is cut away over the coil for inspection.
          if (receiver) {
            for (const x of [-0.0248, 0.0248])
              put(new THREE.BoxGeometry(0.085, 0.09, 6.95), support, [x, 0.004, 0], group);
            for (const z of [-0.0346, 0.0346])
              put(new THREE.BoxGeometry(5.04, 0.09, 0.085), support, [0, 0.004, z], group);
          }
          const wires = wirelessWires(receiver);
          // The centre lead crosses below Tx / above Rx on an insulated layer.
          wire([wires.inner[1], wires.inner[2]], ceramic, group, 0.00058);
          wire(wires.inner, mat, group);
          wire(wires.outer, mat, group);
          put(new THREE.BoxGeometry(3.2, 0.08, 1.17), board, [0, -0.0015, 0.0289], group);
          put(new THREE.BoxGeometry(0.37, 0.24, 0.34), ceramic, [-0.0095, 0.0006, 0.029], group);
          for (const x of [-0.012, -0.007])
            put(new THREE.BoxGeometry(0.07, 0.25, 0.35), mat, [x, 0.0006, 0.029], group);
          put(
            new THREE.BoxGeometry(0.6, 0.32, 0.52),
            receiver ? loadMaterial : source,
            [0, 0.0011, 0.029],
            group,
          );
          if (receiver) {
            for (const x of [-0.0016, 0.0016])
              put(new THREE.BoxGeometry(0.04, 0.33, 0.53), support, [x, 0.0011, 0.029], group);
            // A real gap is visible when the series load switch is open.
            switchArm = put(
              new THREE.CylinderGeometry(0.025, 0.025, 0.4, 10)
                .rotateZ(-Math.PI / 2)
                .translate(0.2, 0, 0),
              mat,
              wirelessPorts.capRight,
              group,
            );
            for (const p of wires.bridge)
              put(new THREE.SphereGeometry(0.045, 10, 8), mat, p, group);
          } else wire(wires.bridge, mat, group);
          // Mark the inner (dotted) terminal of each winding without hidden extra turns.
          put(new THREE.SphereGeometry(0.062, 12, 8), source, [W.innerRadius, 0.0005, 0], group);
        }
        const fluxLines = Array.from({ length: 4 }, (_, i) => {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(129 * 3), 3),
          );
          const material = new THREE.LineBasicMaterial({
            color: '#427d94',
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
          });
          const line = new THREE.Line(geometry, material);
          line.frustumCulled = false;
          tx.add(line);
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(),
            0.35,
            0x427d94,
            0.12,
            0.07,
          );
          tx.add(arrow);
          return { geometry, material, line, arrow, azimuth: (i * Math.PI) / 2 };
        });
        let geometryKey = '';
        return {
          update() {
            const sh = latest.current,
              s = sh.state,
              p = wirelessReceiverOffset(sh.input, narrow);
            rx.position.set(p[0] * W.scale, (p[1] + W.txHeight) * W.scale, p[2] * W.scale);
            ferrites.forEach((mesh) => (mesh.visible = sh.input.ferrite));
            switchArm.rotation.z = sh.input.connected ? 0 : 0.82;
            copperTx.emissive.set(s.instantI1 >= 0 ? '#b57940' : '#438baa');
            copperTx.emissiveIntensity = Math.min(0.24, Math.abs(s.instantI1) * 0.065);
            copperRx.emissive.set(s.instantI2 >= 0 ? '#b57940' : '#438baa');
            copperRx.emissiveIntensity = Math.min(0.3, Math.abs(s.instantI2) * 0.28);
            loadMaterial.emissive.set('#b27f3f');
            loadMaterial.emissiveIntensity = Math.min(0.22, s.loadPower * 0.14);
            const key = `${sh.input.gap}/${sh.input.offset}`;
            for (const item of fluxLines) {
              item.line.visible = item.arrow.visible =
                sh.showFlux && Math.abs(s.instantFlux) > 1e-9;
              if (key !== geometryKey) {
                const positions = item.geometry.getAttribute('position') as THREE.BufferAttribute;
                for (let i = 0; i <= 128; i++) {
                  const p = wirelessFluxPoint(sh.input, item.azimuth, i / 128, narrow);
                  positions.setXYZ(i, p[0] * W.scale, p[1] * W.scale, p[2] * W.scale);
                }
                positions.needsUpdate = true;
                item.geometry.computeBoundingSphere();
                item.arrow.position
                  .fromArray(wirelessFluxPoint(sh.input, item.azimuth, 0.045, narrow))
                  .multiplyScalar(W.scale);
              }
              const sign = Math.sign(s.instantFlux) || 1;
              const tangent = new THREE.Vector3(
                ...wirelessFluxPoint(sh.input, item.azimuth, 0.0451, narrow),
              )
                .multiplyScalar(W.scale)
                .sub(item.arrow.position)
                .normalize()
                .multiplyScalar(sign);
              item.arrow.setDirection(tangent);
              item.material.color.set(sign > 0 ? '#427d94' : '#9b7959');
              item.arrow.setColor(item.material.color);
              item.material.opacity = 0.12 + Math.min(0.62, Math.abs(s.instantFlux) * 2e5);
            }
            geometryKey = key;
            if (!controls.enabled) root.rotation.y = 0;
          },
        };
      }}
    />
  );
}
