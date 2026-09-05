import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import {
  LITHIUM,
  lithiumGeometry,
  lithiumPath,
  lithiumTracer,
  type LithiumPoint,
  type LithiumShot,
} from '../../models/lithium-battery';
import { LithiumBatteryFlat } from '../lab/LithiumBatteryEvidence';
const v = (p: LithiumPoint) => new THREE.Vector3(...p);
class Route extends THREE.Curve<THREE.Vector3> {
  constructor(private points: LithiumPoint[]) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(lithiumPath(this.points, t));
  }
}
export default function LithiumBatteryStudio({
  shot,
  width,
  compact,
}: {
  shot: LithiumShot;
  width: number;
  compact: boolean;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      className="lb-studio"
      exposure={1.12}
      label={t('石墨与磷酸铁锂电芯剖面：离子在内部，电子走外部回路')}
      cameraPosition={[3, 3, 9]}
      target={[0, 1.9, 0]}
      span={5.5}
      fitHeight={4.8}
      fallback={<LithiumBatteryFlat shot={shot} width={width} />}
      create={({ root, camera, controls, scene }) => {
        root.position.y = 1.4;
        scene.environmentIntensity = 0.55;
        const g = lithiumGeometry(),
          copper = new THREE.MeshStandardMaterial({
            color: '#b88059',
            metalness: 0.7,
            roughness: 0.34,
          }),
          aluminum = new THREE.MeshStandardMaterial({
            color: '#a7bec1',
            metalness: 0.8,
            roughness: 0.31,
          }),
          graphite = new THREE.MeshStandardMaterial({
            color: '#344850',
            metalness: 0.18,
            roughness: 0.74,
          }),
          lfp = new THREE.MeshStandardMaterial({
            color: '#729285',
            metalness: 0.15,
            roughness: 0.63,
          }),
          polymer = new THREE.MeshStandardMaterial({
            color: '#ede6d0',
            roughness: 0.8,
            side: THREE.DoubleSide,
          }),
          binder = new THREE.MeshStandardMaterial({ color: '#586167', roughness: 0.72 }),
          electrolyte = new THREE.MeshStandardMaterial({
            color: '#a5c5bd',
            roughness: 0.35,
            transparent: true,
            opacity: 0.075,
            depthWrite: false,
          }),
          caseMaterial = new THREE.MeshStandardMaterial({
            color: '#aebbb4',
            roughness: 0.65,
            metalness: 0.23,
            transparent: true,
            opacity: 0.86,
          }),
          ionMaterial = new THREE.MeshBasicMaterial({ color: '#d2a545' }),
          electronMaterial = new THREE.MeshBasicMaterial({ color: '#367f99' }),
          wireMaterial = new THREE.MeshStandardMaterial({
            color: '#718d92',
            metalness: 0.45,
            roughness: 0.42,
          });
        const put = (geometry: THREE.BufferGeometry, material: THREE.Material, p: LithiumPoint) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.fromArray(p);
          mesh.castShadow = material === graphite || material === lfp;
          mesh.receiveShadow = true;
          root.add(mesh);
          return mesh;
        };
        const box = (w: number, h: number, d: number, material: THREE.Material, p: LithiumPoint) =>
          put(new THREE.BoxGeometry(w, h, d), material, p);
        const wire = (
          points: LithiumPoint[],
          radius = 0.025,
          material: THREE.Material = wireMaterial,
        ) =>
          put(
            new THREE.TubeGeometry(
              new Route(points),
              Math.max(24, points.length * 22),
              radius,
              8,
              false,
            ),
            material,
            [0, 0, 0],
          );
        box(0.055, 2.5, 1, copper, [-1.25, 0, 0]);
        box(0.055, 2.5, 1, aluminum, [1.25, 0, 0]);
        box(0.12, 0.3, 0.15, copper, [-1.25, 1.37, 0]);
        box(0.12, 0.3, 0.15, aluminum, [1.25, 1.37, 0]);
        box(2.72, 0.07, 1.1, polymer, [0, -1.3, 0]);
        box(0.065, 2.63, 1.1, polymer, [-1.36, 0, 0]);
        box(0.065, 2.63, 1.1, polymer, [1.36, 0, 0]);
        box(2.42, 2.48, 1, electrolyte, [0, 0, 0]);
        for (const [index, p] of g.negative.entries()) {
          for (const z of [-0.22, -0.14, -0.06, 0.02])
            box(0.26, 0.22, 0.028, graphite, [p[0], p[1], z]);
          wire([[-1.25, p[1], -0.12], p], 0.018, binder);
          const positive = g.positive[index];
          put(new THREE.IcosahedronGeometry(0.18, 1), lfp, positive);
          wire([[1.25, positive[1], -0.12], positive], 0.018, binder);
        }
        // A genuinely perforated membrane. Each displayed ionic lane passes through a hole.
        const shape = new THREE.Shape();
        shape.moveTo(-0.5, -1.25);
        shape.lineTo(0.5, -1.25);
        shape.lineTo(0.5, 1.25);
        shape.lineTo(-0.5, 1.25);
        shape.closePath();
        for (const pore of g.pores) {
          const hole = new THREE.Path();
          hole.absellipse(
            -pore.center[2],
            pore.center[1],
            pore.radius,
            pore.radius,
            0,
            Math.PI * 2,
            true,
            0,
          );
          shape.holes.push(hole);
        }
        const membrane = put(
          new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false, curveSegments: 10 }),
          polymer,
          [-0.12, 0, 0],
        );
        membrane.rotation.y = Math.PI / 2;
        wire(g.external);
        for (const p of g.external.slice(1, -1))
          put(new THREE.SphereGeometry(0.025, 10, 7), wireMaterial, p);
        const device = new THREE.MeshStandardMaterial({ color: '#7e948a', roughness: 0.56 });
        box(0.68, 0.34, 0.35, device, [0, 2.05, 0]);
        wire(
          [
            [-0.28, 2.05, 0.19],
            [-0.2, 2.05, 0.19],
            [-0.14, 2.13, 0.19],
            [-0.05, 1.97, 0.19],
            [0.05, 2.13, 0.19],
            [0.14, 1.97, 0.19],
            [0.2, 2.05, 0.19],
            [0.28, 2.05, 0.19],
          ],
          0.016,
          binder,
        );
        const cover = box(2.7, 2.55, 0.025, caseMaterial, [0, 0, 0.55]);
        const ions: THREE.Mesh[] = [],
          electrons: THREE.Mesh[] = [];
        for (let id = 0; id < LITHIUM.tracers; id++) {
          const ion = put(
              new THREE.SphereGeometry(id === 0 ? 0.068 : 0.043, 14, 10),
              ionMaterial,
              [0, 0, 0],
            ),
            electron = put(
              new THREE.SphereGeometry(id === 0 ? 0.062 : 0.04, 14, 10),
              electronMaterial,
              [0, 0, 0],
            );
          ions.push(ion);
          electrons.push(electron);
        }
        const tracer = lithiumTracer(0, 0.85),
          guideMaterial = new THREE.MeshBasicMaterial({
            color: '#c29b4c',
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
          }),
          guide = wire(tracer.ionPath, 0.009, guideMaterial);
        const ring = put(
          new THREE.TorusGeometry(0.1, 0.01, 6, 28),
          new THREE.MeshBasicMaterial({ color: '#e0b958', transparent: true, opacity: 0.85 }),
          [0, 0, 0],
        );
        let fitKey = '';
        return {
          update() {
            const s = latest.current;
            caseMaterial.opacity = 0.86 * (1 - s.reveal);
            cover.visible = s.reveal < 0.999;
            guide.visible = s.view === 'paths' || s.view === 'charge' || s.view === 'separator';
            graphite.color
              .set('#344850')
              .lerp(new THREE.Color('#857859'), s.values.inventory.x * 0.28);
            lfp.color.set('#678b80').lerp(new THREE.Color('#a6b68d'), s.values.inventory.y * 0.44);
            device.color.set(
              s.state.current < 0 ? '#4d9693' : s.state.current > 0 ? '#ac9664' : '#8f9e96',
            );
            for (let id = 0; id < LITHIUM.tracers; id++) {
              const mark = lithiumTracer(id, s.state.soc);
              ions[id].position.fromArray(mark.ion);
              ions[id].visible = s.reveal > 0.45;
              electrons[id].position.fromArray(mark.electron);
              electrons[id].visible = mark.moving && s.reveal > 0.45;
            }
            ring.position.copy(ions[0].position);
            ring.visible = s.reveal > 0.7;
            ring.quaternion.copy(camera.quaternion);
            const key = `${controls.enabled}:${camera.aspect}`;
            if (!controls.enabled || key !== fitKey) {
              fitKey = key;
              const direction = new THREE.Vector3(
                  compact ? 0.65 : 3.1,
                  compact ? 1.4 : 2.5,
                  9,
                ).normalize(),
                right = new THREE.Vector3()
                  .crossVectors(new THREE.Vector3(0, 1, 0), direction)
                  .normalize(),
                up = new THREE.Vector3().crossVectors(direction, right),
                points = g.bounds.map((p) => v(p).add(root.position)),
                middle = (axis: THREE.Vector3) => {
                  const values = points.map((p) => p.dot(axis));
                  return (Math.min(...values) + Math.max(...values)) / 2;
                };
              controls.target
                .copy(right)
                .multiplyScalar(middle(right))
                .addScaledVector(up, middle(up))
                .addScaledVector(direction, middle(direction));
              const tan = Math.tan((camera.fov * Math.PI) / 360),
                margin = 0.87;
              let distance = 1;
              for (const p of points) {
                const q = p.clone().sub(controls.target),
                  near = q.dot(direction);
                distance = Math.max(
                  distance,
                  near + Math.abs(q.dot(right)) / (margin * tan * camera.aspect),
                  near + Math.abs(q.dot(up)) / (margin * tan),
                );
              }
              if (controls.enabled) {
                const radius = Math.max(...points.map((p) => p.distanceTo(controls.target)));
                distance = Math.max(
                  distance,
                  radius / (margin * Math.sin(Math.atan(tan * Math.min(1, camera.aspect)))),
                );
              }
              camera.position.copy(controls.target).addScaledVector(direction, distance);
              camera.lookAt(controls.target);
            }
          },
        };
      }}
    />
  );
}
