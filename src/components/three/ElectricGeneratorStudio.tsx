import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { createElectricalFraming } from './electrical-framing';
import ElectricGeneratorFlat from './ElectricGeneratorFlat';
import { t } from '../../i18n';
import {
  GENERATOR as G,
  generatorConductorPoint,
  generatorRotorLeads,
  generatorContacts,
  generatorExternalCircuit,
  rotateGeneratorPoint,
  type GeneratorPoint,
  type GeneratorShot,
} from '../../models/electric-generator';

class GeneratorLoopCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(generatorConductorPoint(t));
  }
}
export default function ElectricGeneratorStudio({
  shot,
  narrow,
}: {
  shot: GeneratorShot;
  narrow: boolean;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      dark
      className="generator-studio"
      label={t('单匝发电机：铜线圈随轴旋转，两只完整滑环接触固定电刷')}
      cameraPosition={narrow ? [5.2, 8.9, 12.5] : [8, 6.5, 11]}
      target={narrow ? [0, 1.4, 1.25] : [0.25, 1.35, 1.3]}
      span={narrow ? 6.7 : 9.2}
      fitHeight={narrow ? 7.6 : 5.7}
      fallback={<ElectricGeneratorFlat shot={shot} narrow={narrow} />}
      create={({ root, controls, camera }) => {
        const assembly = new THREE.Group();
        assembly.position.y = G.axisY;
        root.add(assembly);
        const rotor = new THREE.Group();
        assembly.add(rotor);
        const copper = new THREE.MeshStandardMaterial({
          color: '#d9a16b',
          metalness: 0.82,
          roughness: 0.24,
        });
        const brass = new THREE.MeshStandardMaterial({
          color: '#c2ad78',
          metalness: 0.86,
          roughness: 0.3,
        });
        const steel = new THREE.MeshStandardMaterial({
          color: '#a0b0b6',
          metalness: 0.8,
          roughness: 0.32,
        });
        const frame = new THREE.MeshStandardMaterial({
          color: '#314852',
          metalness: 0.38,
          roughness: 0.56,
        });
        const carbon = new THREE.MeshStandardMaterial({ color: '#27383a', roughness: 0.9 });
        const ceramic = new THREE.MeshStandardMaterial({ color: '#d2ceb9', roughness: 0.68 });
        const north = new THREE.MeshStandardMaterial({
          color: '#ae685a',
          metalness: 0.25,
          roughness: 0.65,
          transparent: true,
          opacity: 0.66,
          depthWrite: false,
        });
        const south = north.clone();
        south.color.set('#6599b2');
        const textures: THREE.Texture[] = [];
        const put = (
          geometry: THREE.BufferGeometry,
          material: THREE.Material,
          p: GeneratorPoint,
          group: THREE.Object3D = assembly,
        ) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.fromArray(p);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        };
        const tube = (
          points: GeneratorPoint[],
          material: THREE.Material = copper,
          radius: number = G.wireRadius,
          group: THREE.Object3D = assembly,
        ) =>
          put(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(
                points.map((p) => new THREE.Vector3(...p)),
                false,
                'centripetal',
              ),
              Math.max(24, points.length * 18),
              radius,
              9,
              false,
            ),
            material,
            [0, 0, 0],
            group,
          );
        const cylinderZ = (r: number, length: number) =>
          new THREE.CylinderGeometry(r, r, length, 32).rotateX(Math.PI / 2);
        // Cantilever rotor: both shaft bearings are after the slip rings, so leads
        // never have to pass through a stationary bearing or a conducting shaft.
        put(cylinderZ(G.shaftRadius, 5.1), steel, [0, 0, 2.55], rotor);
        put(
          new THREE.TubeGeometry(new GeneratorLoopCurve(), 480, G.wireRadius, 12, false),
          copper,
          [0, 0, 0],
          rotor,
        );
        for (const side of [-1, 1]) {
          const hub = 0.1,
            contact = G.halfWidth - G.wireRadius;
          put(
            new THREE.BoxGeometry(0.1, contact - hub, 0.18),
            ceramic,
            [0, (side * (contact + hub)) / 2, 0],
            rotor,
          );
        }
        put(cylinderZ(0.16, 0.4), ceramic, [0, 0, 0.15], rotor);
        for (const points of generatorRotorLeads()) tube(points, copper, 0.027, rotor);
        for (const [i, z] of G.ringZ.entries()) {
          put(cylinderZ(0.12, 0.23), ceramic, [0, 0, z], rotor);
          put(new THREE.TorusGeometry(G.ringRadius, G.ringTube, 12, 64), brass, [0, 0, z], rotor);
          // An insulating disk supports the ring; its conductive track remains continuous.
          put(cylinderZ(0.24, 0.055), ceramic, [0, 0, z], rotor);
          put(
            new THREE.SphereGeometry(0.05, 12, 8),
            copper,
            generatorRotorLeads()[i].at(-1)!,
            rotor,
          );
        }
        const circuit = generatorExternalCircuit(narrow);
        for (const contact of generatorContacts()) {
          put(new THREE.BoxGeometry(0.26, 0.12, 0.13), carbon, contact.center);
          put(new THREE.BoxGeometry(0.26, 0.25, 0.27), frame, [
            contact.center[0] + 0.24,
            0,
            contact.z,
          ]);
          put(new THREE.BoxGeometry(0.13, 1.42, 0.16), frame, [0.84, -0.68, contact.z]);
          tube([contact.lead, [0.72, 0.0, contact.z]], brass, 0.024);
        }
        tube(circuit.feed, copper, 0.032);
        tube(circuit.return, copper, 0.032);
        put(new THREE.CylinderGeometry(0.16, 0.16, 0.84, 24), ceramic, circuit.loadPosition);
        for (const dy of [-0.33, 0.33])
          put(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 24), brass, [
            circuit.loadPosition[0],
            circuit.loadPosition[1] + dy,
            circuit.loadPosition[2],
          ]);
        for (const point of [circuit.switchTop, circuit.switchBottom])
          put(new THREE.SphereGeometry(0.055, 12, 8), brass, point);
        const switchArm = put(
          new THREE.CylinderGeometry(0.025, 0.025, 0.48, 12).translate(0, 0.24, 0),
          brass,
          circuit.switchBottom,
        );
        for (const z of [3.96, 4.6]) {
          put(new THREE.TorusGeometry(0.2, 0.11, 12, 40), steel, [0, 0, z]);
          put(new THREE.BoxGeometry(0.48, 1.22, 0.22), frame, [0, -0.78, z]);
        }
        // A continuous arm and handle show where external mechanical work enters.
        put(new THREE.BoxGeometry(0.14, 1.1, 0.12), steel, [0, 0.48, 5.07], rotor);
        put(cylinderZ(0.11, 0.62), frame, [0, 1.0, 5.4], rotor);
        put(new THREE.BoxGeometry(4.5, 0.24, 4.25), frame, [0, -1.42, -0.1]);
        put(new THREE.BoxGeometry(narrow ? 3.4 : 5.5, 0.18, 3.9), frame, [
          narrow ? 0.2 : 0.7,
          -1.48,
          3.35,
        ]);
        for (const sign of [-1, 1]) {
          put(new THREE.BoxGeometry(0.68, 2.65, 4.05), sign < 0 ? north : south, [
            sign * 1.87,
            0,
            -0.1,
          ]);
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#f8f0d6';
            ctx.font = '600 84px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sign < 0 ? 'N' : 'S', 64, 67);
          }
          const map = new THREE.CanvasTexture(canvas);
          textures.push(map);
          put(
            new THREE.PlaneGeometry(0.43, 0.43),
            new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }),
            [sign * 1.87, 0.84, 1.94],
          );
        }
        const fieldArrows: THREE.ArrowHelper[] = [];
        for (const y of [-0.66, 0, 0.66])
          for (const z of [-1.05, 0.72]) {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(-1.46, y, z),
              2.88,
              0x82b7c4,
              0.11,
              0.085,
            );
            assembly.add(arrow);
            fieldArrows.push(arrow);
          }
        const areaMaterial = new THREE.MeshBasicMaterial({
          color: '#e9c18b',
          transparent: true,
          opacity: 0.17,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const areaShape = new THREE.Shape();
        for (let i = 0; i <= 240; i++) {
          const p = generatorConductorPoint(i / 240);
          if (i === 0) areaShape.moveTo(-p[2], p[1]);
          else areaShape.lineTo(-p[2], p[1]);
        }
        areaShape.closePath();
        const areaPlane = put(
          new THREE.ShapeGeometry(areaShape).rotateY(Math.PI / 2),
          areaMaterial,
          [0, 0, 0],
          rotor,
        );
        const normal = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          0.95,
          0xedc383,
          0.15,
          0.1,
        );
        rotor.add(normal);
        const forces = [-1, 1].map((side) => {
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, side, 0),
            new THREE.Vector3(),
            0.55,
            0xe8ae79,
            0.14,
            0.1,
          );
          assembly.add(arrow);
          return { side, arrow };
        });
        const torqueArrow = new THREE.ArrowHelper(
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(0, 1.36, 1.98),
          0.7,
          0xf1bd80,
          0.17,
          0.12,
        );
        assembly.add(torqueArrow);
        const framing = createElectricalFraming(root, camera, controls, [rotor], [-0.09, 0]);
        return {
          update() {
            const shot = latest.current,
              s = shot.state;
            rotor.rotation.z = s.theta;
            north.opacity = south.opacity = shot.cutaway;
            areaPlane.visible = normal.visible = shot.showArea;
            fieldArrows.forEach((arrow) => {
              arrow.visible = Math.abs(s.input.field) > 0.001;
              arrow.setColor(s.input.field >= 0 ? 0x82b7c4 : 0xcc9e91);
              arrow.setDirection(new THREE.Vector3(Math.sign(s.input.field) || 1, 0, 0));
              arrow.position.x = s.input.field >= 0 ? -1.46 : 1.46;
            });
            switchArm.rotation.z = s.input.connected ? 0 : -0.68;
            for (const { side, arrow } of forces) {
              arrow.visible = shot.showForces && Math.abs(s.current) > 1e-4;
              const point = rotateGeneratorPoint([0, side * G.halfWidth, 0], s.theta);
              arrow.position.fromArray(point);
              arrow.setDirection(
                new THREE.Vector3(0, side * Math.sign(s.current * s.input.field) || 1, 0),
              );
              arrow.setLength(
                0.15 + Math.min(0.6, Math.abs(s.current * s.input.field) * 3.125),
                0.12,
                0.08,
              );
            }
            torqueArrow.visible = shot.showForces && Math.abs(s.torque) > 1e-7;
            torqueArrow.setDirection(new THREE.Vector3(-Math.sign(s.torque) || 1, 0, 0));
            torqueArrow.setLength(0.18 + Math.min(0.65, Math.abs(s.torque) * 180), 0.12, 0.085);
            framing.update();
            if (!controls.enabled) root.rotation.y = -0.09 * shot.contactFocus;
          },
          dispose() {
            framing.dispose();
            textures.forEach((texture) => texture.dispose());
          },
        };
      }}
    />
  );
}
