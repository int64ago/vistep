import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import {
  INDUCTION as G,
  inductionGeometry,
  inductionSpiral,
  inductionBounds,
  type InductionPoint,
  type InductionShot,
} from '../../models/induction-cooktop';
import { InductionCooktopFlat } from '../lab/InductionCooktopEvidence';
const scale = 30,
  v = (p: InductionPoint) => new THREE.Vector3(...p).multiplyScalar(scale);
class Route extends THREE.Curve<THREE.Vector3> {
  constructor(private points: InductionPoint[]) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const u = t * (this.points.length - 1),
      i = Math.min(this.points.length - 2, Math.floor(u));
    return target.copy(v(this.points[i])).lerp(v(this.points[i + 1]), u - i);
  }
}
class Spiral extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.copy(v(inductionSpiral(t)));
  }
}
export default function InductionCooktopStudio({
  shot,
  compact,
  width,
}: {
  shot: InductionShot;
  compact: boolean;
  width: number;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      label={t('电磁炉剖面：完整线圈回路、玻璃和锅底中的闭合等效涡流')}
      className="ic-studio"
      cameraPosition={compact ? [1, 10, 13] : [8, 10, 13]}
      target={[0, 0.8, 0]}
      span={compact ? 10.6 : 11.8}
      fitHeight={8.8}
      exposure={1}
      fallback={<InductionCooktopFlat shot={shot} width={width} />}
      create={({ root, camera, controls, scene }) => {
        scene.environmentIntensity = 0.75;
        root.position.y = 0.8;
        const copper = new THREE.MeshStandardMaterial({
          color: '#a56842',
          metalness: 0.65,
          roughness: 0.3,
        });
        const steel = new THREE.MeshStandardMaterial({
          color: '#87958d',
          metalness: 0.75,
          roughness: 0.31,
          side: THREE.DoubleSide,
        });
        const ghost = new THREE.MeshStandardMaterial({
          color: '#909b96',
          metalness: 0.25,
          roughness: 0.5,
          transparent: true,
          opacity: 0.065,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const glass = new THREE.MeshStandardMaterial({
          color: '#91b4b1',
          roughness: 0.18,
          metalness: 0.15,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        });
        const frame = new THREE.MeshStandardMaterial({
          color: '#50645f',
          roughness: 0.6,
          metalness: 0.15,
        });
        const ceramic = new THREE.MeshStandardMaterial({ color: '#c7cbb7', roughness: 0.8 });
        const electric = new THREE.MeshBasicMaterial({
          color: '#287f90',
          transparent: true,
          opacity: 0.9,
          depthTest: false,
        });
        const warm = new THREE.MeshBasicMaterial({
          color: '#d48b43',
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          depthTest: false,
        });
        const put = (
          geometry: THREE.BufferGeometry,
          material: THREE.Material,
          point: InductionPoint,
          group: THREE.Object3D = root,
        ) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(v(point));
          mesh.castShadow = material === steel || material === copper;
          mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        };
        const wire = (
          points: InductionPoint[],
          radius = 0.0018,
          material: THREE.Material = copper,
          group: THREE.Object3D = root,
        ) =>
          put(
            new THREE.TubeGeometry(
              new Route(points),
              Math.max(24, points.length * 8),
              radius * scale,
              6,
              false,
            ),
            material,
            [0, 0, 0],
            group,
          );
        const g = inductionGeometry();
        put(
          new THREE.BoxGeometry(0.31 * scale, 0.003 * scale, 0.27 * scale),
          frame,
          [0, -0.024, 0],
        );
        put(
          new THREE.CylinderGeometry(0.109 * scale, 0.109 * scale, 0.002 * scale, 80),
          ceramic,
          [0, -0.0033, 0],
        );
        for (const x of [-0.124, 0.124])
          for (const z of [-0.102, 0.102])
            put(
              new THREE.CylinderGeometry(0.0025 * scale, 0.0025 * scale, 0.026 * scale, 12),
              frame,
              [x, -0.0105, z],
            );
        put(
          new THREE.TubeGeometry(new Spiral(), 768, G.wireRadius * scale, 7, false),
          copper,
          [0, 0, 0],
        );
        wire(g.supply);
        wire(g.returnPath);
        put(
          new THREE.BoxGeometry(0.029 * scale, 0.016 * scale, 0.047 * scale),
          ceramic,
          [-0.145, -0.018, 0.1],
        );
        for (const p of [g.terminalA, g.terminalB])
          put(new THREE.SphereGeometry(0.003 * scale, 12, 8), copper, p);
        // The drawn source symbol is inside the source whose terminals close the primary circuit.
        const wave = Array.from({ length: 25 }, (_, i): InductionPoint => [
          -0.151 + (0.012 * i) / 24,
          -0.0097,
          0.1 + 0.005 * Math.sin((i / 24) * 2 * Math.PI),
        ]);
        wire(wave, 0.0007, frame);
        const glassMesh = put(
          new THREE.BoxGeometry(0.281 * scale, G.glassThickness * scale, 0.25 * scale),
          glass,
          [0, G.glassTop - G.glassThickness / 2, 0],
        );
        const glassEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(glassMesh.geometry),
          new THREE.LineBasicMaterial({ color: '#6a9998', transparent: true, opacity: 0.35 }),
        );
        glassEdges.position.copy(glassMesh.position);
        root.add(glassEdges);
        const pan = new THREE.Group();
        root.add(pan);
        // Rear half is opaque; the front half remains a ghost, so the pan's real circuit stays whole.
        for (const [start, mat] of [
          [Math.PI / 2, steel],
          [-Math.PI / 2, ghost],
        ] as const) {
          put(
            new THREE.CylinderGeometry(
              G.panRadius * scale,
              G.panRadius * scale,
              G.panThickness * scale,
              64,
              1,
              false,
              start,
              Math.PI,
            ),
            mat,
            [0, G.panThickness / 2, 0],
            pan,
          );
          const points = [
            new THREE.Vector2((G.panRadius - G.panWall) * scale, G.panThickness * scale),
            new THREE.Vector2((G.panRadius - G.panWall) * scale, G.panHeight * scale),
            new THREE.Vector2(G.panRadius * scale, G.panHeight * scale),
            new THREE.Vector2(G.panRadius * scale, 0),
          ];
          put(new THREE.LatheGeometry(points, 64, start, Math.PI), mat, [0, 0, 0], pan);
        }
        const loopPoints = Array.from({ length: 129 }, (_, i): InductionPoint => [
          G.loopRadius * Math.cos((i / 128) * 2 * Math.PI),
          G.panThickness / 2,
          G.loopRadius * Math.sin((i / 128) * 2 * Math.PI),
        ]);
        const eddy = wire(loopPoints, 0.00085, electric, pan),
          heatRing = wire(loopPoints, 0.0026, warm, pan);
        eddy.renderOrder = 11;
        heatRing.renderOrder = 10;
        const point = put(
          new THREE.SphereGeometry(0.0025 * scale, 16, 10),
          new THREE.MeshBasicMaterial({ color: '#e3ba6a' }),
          [G.loopRadius, G.panThickness / 2, 0],
          pan,
        );
        const arrows: { arrow: THREE.ArrowHelper; tangent: THREE.Vector3; secondary: boolean }[] =
          [];
        for (const q of [0.13, 0.55, 0.87]) {
          const pos = inductionSpiral(q),
            tangent = v(inductionSpiral(q + 0.0001))
              .sub(v(pos))
              .normalize(),
            arrow = new THREE.ArrowHelper(tangent, v(pos), 0.39, 0x935536, 0.13, 0.095);
          root.add(arrow);
          arrows.push({ arrow, tangent, secondary: false });
        }
        for (const theta of [0.2, 2.3, 4.4]) {
          const pos: InductionPoint = [
              G.loopRadius * Math.cos(theta),
              G.panThickness / 2,
              G.loopRadius * Math.sin(theta),
            ],
            tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)),
            arrow = new THREE.ArrowHelper(tangent, v(pos), 0.55, 0x267c8e, 0.16, 0.12);
          pan.add(arrow);
          arrows.push({ arrow, tangent, secondary: true });
        }
        const flux = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0),
          v([0, 0.044, 0]),
          1.3,
          0x5295a4,
          0.24,
          0.18,
        );
        root.add(flux);
        let fitted = '';
        return {
          update() {
            const s = latest.current;
            pan.position.y = (G.glassTop + s.input.lift) * scale;
            const active = s.on && s.input.current > 0;
            electric.opacity = active
              ? 0.5 + 0.4 * Math.min(1, Math.abs(s.instant.i2) / 180)
              : 0.12;
            warm.opacity = active ? Math.min(0.58, s.response.panPower / 300) : 0;
            heatRing.visible = s.view !== 'assembly' && s.view !== 'flux';
            point.visible = s.view === 'skin';
            eddy.visible = s.view !== 'assembly' || active;
            const tint = new THREE.Color('#87958d').lerp(
              new THREE.Color('#b79770'),
              Math.min(0.5, Math.max(0, (s.thermal.pan - 20) / 100)),
            );
            steel.color.copy(tint);
            for (const { arrow, tangent, secondary } of arrows) {
              const current = secondary ? s.instant.i2 : s.instant.i1;
              arrow.visible = Math.abs(current) > 0.05;
              arrow.setDirection(tangent.clone().multiplyScalar(Math.sign(current) || 1));
              arrow.setLength(
                (secondary ? 0.28 : 0.22) +
                  Math.min(1, Math.abs(current) / (secondary ? 180 : 40)) * 0.34,
                0.14,
                0.1,
              );
            }
            flux.visible =
              (s.view === 'flux' || s.view === 'spacing') && Math.abs(s.instant.flux) > 1e-7;
            flux.position.copy(v([0, G.glassTop + s.input.lift + 0.035, 0]));
            flux.setDirection(new THREE.Vector3(0, -Math.sign(s.instant.flux) || -1, 0));
            flux.setLength(0.5 + Math.min(1, Math.abs(s.instant.flux) / 0.00006) * 0.9, 0.23, 0.15);
            const fitKey = `${controls.enabled}:${camera.aspect}:${s.input.lift}:${s.view}`;
            if (!controls.enabled || fitKey !== fitted) {
              fitted = fitKey;
              const direction = compact
                ? new THREE.Vector3(1, 10, 13)
                : new THREE.Vector3(8, 10, 13);
              if (s.view === 'flux') direction.set(compact ? 1 : 4, 14, 10);
              direction.normalize();
              const right = new THREE.Vector3()
                  .crossVectors(new THREE.Vector3(0, 1, 0), direction)
                  .normalize(),
                up = new THREE.Vector3().crossVectors(direction, right),
                tan = Math.tan((camera.fov * Math.PI) / 360),
                margin = 0.86;
              const bounds = inductionBounds(
                s.input.lift,
                s.view === 'flux' || s.view === 'spacing',
              ).map((p) => v(p).add(root.position));
              const middle = (axis: THREE.Vector3) => {
                const values = bounds.map((p) => p.dot(axis));
                return (Math.min(...values) + Math.max(...values)) / 2;
              };
              controls.target
                .copy(right)
                .multiplyScalar(middle(right))
                .addScaledVector(up, middle(up))
                .addScaledVector(direction, middle(direction));
              let distance = 1;
              for (const p of bounds) {
                const local = p.clone().sub(controls.target),
                  near = local.dot(direction);
                distance = Math.max(
                  distance,
                  near + Math.abs(local.dot(right)) / (margin * tan * camera.aspect),
                  near + Math.abs(local.dot(up)) / (margin * tan),
                );
              }
              if (controls.enabled) {
                const radius = Math.max(...bounds.map((p) => p.distanceTo(controls.target)));
                const halfAngle = Math.atan(tan * Math.min(1, camera.aspect));
                distance = Math.max(distance, radius / (margin * Math.sin(halfAngle)));
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
