import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { createElectricalFraming } from './electrical-framing';
import InductionMotorFlat from './InductionMotorFlat';
import { t } from '../../i18n';
import {
  MOTOR as M,
  motorAxes,
  motorBarPoint,
  motorWindingPoint,
  motorWindingLead,
  motorTerminal,
  motorStatorBore,
  type MotorPoint,
  type MotorShot,
} from '../../models/induction-motor';

const colors = ['#d68a64', '#6fb0a7', '#9a97d3'];
class Winding extends THREE.Curve<THREE.Vector3> {
  constructor(private phase: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(motorWindingPoint(this.phase, t));
  }
}
export default function InductionMotorStudio({
  shot,
  narrow,
}: {
  shot: MotorShot;
  narrow: boolean;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      dark
      className="indmotor-studio"
      label={t('剖开的定子包围完整鼠笼；每根铜条都连接前后端环，轴穿过转子与轴承')}
      cameraPosition={narrow ? [3.2, 4.4, 11] : [6, 4.7, 10]}
      target={[0, 1.7, 0]}
      span={narrow ? 7.1 : 8.2}
      fitHeight={narrow ? 5.7 : 7}
      fallback={<InductionMotorFlat shot={shot} narrow={narrow} />}
      create={({ root, controls, camera }) => {
        const assembly = new THREE.Group();
        assembly.position.y = M.axisY;
        root.add(assembly);
        const rotor = new THREE.Group();
        assembly.add(rotor);
        const steel = new THREE.MeshStandardMaterial({
          color: '#91a2a5',
          metalness: 0.85,
          roughness: 0.34,
        });
        const darkSteel = new THREE.MeshStandardMaterial({
          color: '#384d55',
          metalness: 0.72,
          roughness: 0.43,
        });
        const iron = new THREE.MeshStandardMaterial({
          color: '#6c7c82',
          metalness: 0.78,
          roughness: 0.46,
        });
        const copper = new THREE.MeshStandardMaterial({
          color: '#d9a278',
          metalness: 0.82,
          roughness: 0.28,
        });
        const ceramic = new THREE.MeshStandardMaterial({ color: '#b8c4bb', roughness: 0.7 });
        const base = new THREE.MeshStandardMaterial({
          color: '#24434a',
          metalness: 0.4,
          roughness: 0.6,
        });
        const put = (
          g: THREE.BufferGeometry,
          m: THREE.Material,
          p: MotorPoint = [0, 0, 0],
          group: THREE.Object3D = assembly,
        ) => {
          const mesh = new THREE.Mesh(g, m);
          mesh.position.fromArray(p);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        };
        const zCylinder = (r: number, l: number) =>
          new THREE.CylinderGeometry(r, r, l, 48).rotateX(Math.PI / 2);
        const line = (
          points: MotorPoint[],
          material: THREE.Material,
          r = 0.028,
          group: THREE.Object3D = assembly,
        ) =>
          put(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(
                points.map((p) => new THREE.Vector3(...p)),
                false,
                'centripetal',
              ),
              Math.max(20, points.length * 10),
              r,
              8,
              false,
            ),
            material,
            [0, 0, 0],
            group,
          );
        // A sectional annular stack, not disconnected decorative teeth.
        const section = new THREE.Shape(),
          start = Math.PI * 0.08,
          end = Math.PI * 0.62;
        section.absarc(0, 0, M.statorOuter, end, start + 2 * Math.PI, false);
        for (let i = 0; i <= 840; i++) {
          const a = start + 2 * Math.PI - ((start + 2 * Math.PI - end) * i) / 840,
            r = motorStatorBore(a);
          section.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        section.closePath();
        const lamination = new THREE.ExtrudeGeometry(section, {
          depth: 0.058,
          bevelEnabled: false,
          curveSegments: 48,
        });
        const stack = (
          geometry: THREE.BufferGeometry,
          count: number,
          startZ: number,
          pitch: number,
          group: THREE.Object3D,
        ) => {
          for (const dark of [false, true]) {
            const indices = Array.from({ length: count }, (_, i) => i).filter(
              (i) => (i % 4 === 0) === dark,
            );
            const mesh = new THREE.InstancedMesh(geometry, dark ? darkSteel : iron, indices.length);
            const matrix = new THREE.Matrix4();
            indices.forEach((i, k) =>
              mesh.setMatrixAt(k, matrix.makeTranslation(0, 0, startZ + i * pitch)),
            );
            mesh.instanceMatrix.needsUpdate = true;
            mesh.castShadow = mesh.receiveShadow = true;
            group.add(mesh);
          }
        };
        stack(lamination, 30, -0.98, 0.066, assembly);
        // A complete rotor lamination stack; exposed axial bars occupy its rim.
        const disk = zCylinder(0.892, 0.058);
        stack(disk, 29, -0.955, 0.068, rotor);
        put(zCylinder(M.shaftRadius, 5.4), steel, [0, 0, 0], rotor);
        const ring = new THREE.TorusGeometry(M.cageRadius, 0.072, 12, 96);
        for (const sign of [-1, 1]) put(ring, copper, [0, 0, sign * M.ringZ], rotor);
        const barMaterials: THREE.MeshStandardMaterial[] = [],
          arrows: THREE.ArrowHelper[] = [];
        const barGeometry = zCylinder(M.barRadius, 2 * M.ringZ);
        for (let i = 0; i < M.bars; i++) {
          const material = copper.clone();
          barMaterials.push(material);
          put(barGeometry, material, motorBarPoint(i, 0), rotor);
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(...motorBarPoint(i, 0)),
            0.38,
            0xedc08a,
            0.1,
            0.07,
          );
          rotor.add(arrow);
          arrows.push(arrow);
        }
        // The key is mechanically part of the shaft and makes lag observable.
        put(new THREE.BoxGeometry(0.075, 0.1, 0.75), copper, [0, M.shaftRadius, 2.15], rotor);
        for (const z of [-2.05, 2.05]) {
          put(new THREE.TorusGeometry(0.29, 0.1, 12, 36), steel, [0, 0, z]);
          put(new THREE.BoxGeometry(0.64, 1.4, 0.3), base, [0, -0.96, z]);
        }
        put(new THREE.BoxGeometry(4.55, 0.22, 4.6), base, [-0.22, -1.71, 0]);
        const windingMaterials = colors.map(
          (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.35 }),
        );
        for (let phase = 0; phase < 3; phase++) {
          put(
            new THREE.TubeGeometry(new Winding(phase), 720, 0.023, 7, false),
            windingMaterials[phase],
          );
          for (const end of [0, 1]) {
            line(motorWindingLead(phase, end), windingMaterials[phase], 0.025);
            put(new THREE.SphereGeometry(0.049, 10, 8), copper, motorTerminal(phase, end));
          }
        }
        put(new THREE.BoxGeometry(0.96, 0.63, 0.12), ceramic, [-1.76, -0.93, -1.96]);
        // Star point joins all three return terminals; supply leads remain separate.
        line([motorTerminal(0, 1), motorTerminal(1, 1), motorTerminal(2, 1)], copper, 0.036);
        for (let phase = 0; phase < 3; phase++) {
          const p = motorTerminal(phase, 0);
          line([p, [p[0], -1.35, -2.15], [p[0], -1.59, -2.28]], windingMaterials[phase], 0.027);
        }
        const field = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 1.31),
          0.83,
          0x9bc9c3,
          0.18,
          0.1,
        );
        assembly.add(field);
        const sweep = new THREE.Mesh(
          new THREE.TorusGeometry(1.07, 0.013, 7, 72),
          new THREE.MeshBasicMaterial({ color: '#7ab0ad', transparent: true, opacity: 0.45 }),
        );
        sweep.position.z = 1.31;
        assembly.add(sweep);
        const phaseVectors = motorAxes.map(() => {
          const a = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 1.33),
            0.5,
            0xffffff,
            0.11,
            0.06,
          );
          assembly.add(a);
          return a;
        });
        const framing = createElectricalFraming(root, camera, controls, [rotor], [-0.09, 0]);
        return {
          update() {
            const sh = latest.current,
              s = sh.state;
            rotor.rotation.z = s.rotorAngle;
            const strength = Math.hypot(s.field.x, s.field.y) / 8.3;
            field.visible = strength > 1e-7;
            field.setDirection(
              new THREE.Vector3(Math.cos(s.fieldAngle), Math.sin(s.fieldAngle), 0),
            );
            field.setLength(0.75 * Math.min(1.1, strength), 0.15, 0.095);
            barMaterials.forEach((m, i) => {
              const current = s.cage.bars[i];
              m.emissive.set(current >= 0 ? '#f0a363' : '#539fbc');
              m.emissiveIntensity = sh.showBarCurrent ? Math.abs(current) * 0.52 : 0;
              const a = arrows[i];
              a.visible = sh.showBarCurrent && Math.abs(current) > 0.04 && i % 3 === 0;
              a.setDirection(new THREE.Vector3(0, 0, Math.sign(current) || 1));
              a.setColor(current >= 0 ? 0xedb984 : 0x8cc8d4);
              a.setLength(0.18 + 0.45 * Math.abs(current), 0.095, 0.055);
            });
            windingMaterials.forEach((m, i) => {
              m.emissive.set(colors[i]);
              m.emissiveIntensity = 0.08 + (0.24 * Math.abs(s.phases[i])) / 75;
            });
            phaseVectors.forEach((a, i) => {
              a.visible = sh.chapter === 0;
              a.setColor(new THREE.Color(colors[i]));
              const value = s.magnetizingPhases[i];
              a.setDirection(
                new THREE.Vector3(
                  Math.cos(motorAxes[i]) * Math.sign(value || 1),
                  Math.sin(motorAxes[i]) * Math.sign(value || 1),
                  0,
                ),
              );
              a.setLength(0.12 + Math.abs(value) / 8, 0.09, 0.055);
            });
            framing.update();
            if (!controls.enabled) root.rotation.y = sh.chapter === 2 ? -0.09 : 0;
          },
          dispose() {
            framing.dispose();
          },
        };
      }}
    />
  );
}
