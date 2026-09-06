import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { createElectricalFraming } from './electrical-framing';
import { t } from '../../i18n';
import {
  ELECTRIC_TRANSFORMER as C,
  electricCircuitGeometry,
  electricFluxPoint,
  electricWindingPoint,
  type ElectricPoint,
  type ElectricShot,
} from '../../models/transformer-electric';
import ElectricTransformerFlat from './ElectricTransformerFlat';

class WindingCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private side: 'primary' | 'secondary',
    private turns: number,
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(electricWindingPoint(this.side, this.turns, t));
  }
}
class FluxCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.fromArray(electricFluxPoint(t));
  }
}
const v = (p: ElectricPoint) => new THREE.Vector3(...p);
function ring(outerX: number, outerY: number, innerX: number, innerY: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-outerX / 2, -outerY / 2);
  s.lineTo(outerX / 2, -outerY / 2);
  s.lineTo(outerX / 2, outerY / 2);
  s.lineTo(-outerX / 2, outerY / 2);
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(-innerX / 2, -innerY / 2);
  h.lineTo(-innerX / 2, innerY / 2);
  h.lineTo(innerX / 2, innerY / 2);
  h.lineTo(innerX / 2, -innerY / 2);
  h.closePath();
  s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 });
}

export default function ElectricTransformerStudio({
  shot,
  narrow,
}: {
  shot: ElectricShot;
  narrow: boolean;
}) {
  const latest = useRef(shot);
  latest.current = shot;
  return (
    <Studio
      label={t('叠片铁芯与两个独立铜绕组；箭头表示磁通方向，不是粒子流动')}
      className="electric-transformer-studio"
      cameraPosition={narrow ? [1.1, 4.3, 14] : [4.8, 5.7, 13]}
      target={narrow ? [0, 2.55, 0] : [0, 2.25, 0]}
      span={narrow ? 6.9 : 8.45}
      fitHeight={narrow ? 7.3 : 5.3}
      fallback={<ElectricTransformerFlat shot={shot} narrow={narrow} />}
      create={({ root, controls, camera }) => {
        const g = C.geometry;
        if (narrow) root.position.y = 1.5;
        const iron = new THREE.MeshStandardMaterial({
          color: '#63706e',
          metalness: 0.78,
          roughness: 0.37,
        });
        const copper = new THREE.MeshStandardMaterial({
          color: '#bf794f',
          metalness: 0.8,
          roughness: 0.24,
          transparent: true,
        });
        const copper2 = copper.clone();
        copper2.color.set('#cd9160');
        const insulator = new THREE.MeshStandardMaterial({ color: '#d9c6a8', roughness: 0.75 });
        const dark = new THREE.MeshStandardMaterial({ color: '#343f3d', roughness: 0.55 });
        const metal = new THREE.MeshStandardMaterial({
          color: '#b8ae89',
          metalness: 0.72,
          roughness: 0.3,
        });
        const ceramic = new THREE.MeshStandardMaterial({ color: '#e4d7b9', roughness: 0.6 });
        const loadCeramic = ceramic.clone();
        const ink = new THREE.MeshBasicMaterial({ color: '#52776d' });
        const put = (
          geometry: THREE.BufferGeometry,
          material: THREE.Material,
          p: ElectricPoint,
          group: THREE.Object3D = root,
        ) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.fromArray(p);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        };
        const wire = (
          points: ElectricPoint[],
          material: THREE.Material = copper,
          radius: number = g.wireRadius,
        ) =>
          put(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(points.map(v), false, 'centripetal'),
              Math.max(24, points.length * 12),
              radius,
              7,
              false,
            ),
            material,
            [0, 0, 0],
          );
        // Each sheet is an actual closed ring. Tiny coating gaps remain between sheets.
        const sheetDepth = g.depth / g.laminations;
        const sheet = ring(
          2 * g.halfWidth,
          g.top - g.bottom,
          2 * (g.halfWidth - g.limb),
          g.top - g.bottom - 2 * g.limb,
          sheetDepth * 0.9,
        );
        const stack = new THREE.InstancedMesh(sheet, iron, g.laminations),
          matrix = new THREE.Matrix4();
        for (let i = 0; i < g.laminations; i++) {
          matrix.makeTranslation(0, (g.bottom + g.top) / 2, -g.depth / 2 + i * sheetDepth);
          stack.setMatrixAt(i, matrix);
        }
        stack.castShadow = stack.receiveShadow = true;
        root.add(stack);
        // Insulating sleeves have holes; no solid bobbin box passes through the core.
        for (const x of [-g.limbX, g.limbX]) {
          const sleeve = ring(0.88, 0.94, 0.75, 0.81, g.coilTop - g.coilBottom + 0.11);
          sleeve.rotateX(-Math.PI / 2);
          put(sleeve, insulator, [x, g.coilBottom - 0.055, 0]);
          for (const y of [g.coilBottom - 0.1, g.coilTop + 0.04]) {
            const collar = ring(1.26, 1.23, 0.75, 0.81, 0.06);
            collar.rotateX(-Math.PI / 2);
            put(collar, insulator, [x, y, 0]);
          }
        }
        const primary = put(
          new THREE.TubeGeometry(
            new WindingCurve('primary', C.primaryTurns),
            C.primaryTurns * 64,
            g.wireRadius,
            7,
            false,
          ),
          copper,
          [0, 0, 0],
        );
        const secondary = put(
          new THREE.TubeGeometry(
            new WindingCurve('secondary', latest.current.input.secondaryTurns),
            latest.current.input.secondaryTurns * 64,
            g.wireRadius,
            7,
            false,
          ),
          copper2,
          [0, 0, 0],
        );
        let turns = latest.current.input.secondaryTurns;
        const fluxMaterial = new THREE.MeshBasicMaterial({
          color: '#3b8c80',
          transparent: true,
          opacity: 0.6,
          depthTest: true,
        });
        put(new THREE.TubeGeometry(new FluxCurve(), 160, 0.023, 6, true), fluxMaterial, [0, 0, 0]);
        const fluxArrows = [0.08, 0.24, 0.43, 0.58, 0.74, 0.93].map((f) => {
          const p = v(electricFluxPoint(f)),
            tangent = v(electricFluxPoint(f + 0.002))
              .sub(p)
              .normalize();
          const arrow = new THREE.ArrowHelper(tangent, p, 0.29, 0x2b877a, 0.12, 0.09);
          root.add(arrow);
          return { arrow, tangent };
        });
        const currentArrows: {
          arrow: THREE.ArrowHelper;
          side: 'primary' | 'secondary';
          tangent: THREE.Vector3;
        }[] = [];
        let switchLever: THREE.Mesh | undefined;
        let sourceAC: THREE.Mesh | undefined;
        const sourceDC = new THREE.Group();
        root.add(sourceDC);
        const layouts = electricCircuitGeometry(narrow);
        for (const circuit of layouts) {
          const { x, y, z, side, upper, lower } = circuit;
          const mat = side === 'primary' ? copper : copper2;
          wire(upper, mat, 0.031);
          wire(lower, mat, 0.031);
          // Top polarity dot is on the same actual continuous conductor as the coil.
          for (const t of [0, 1]) {
            const p = electricWindingPoint(side, side === 'primary' ? C.primaryTurns : turns, t);
            put(new THREE.SphereGeometry(0.061, 12, 8), metal, p);
            if (t === 1)
              put(new THREE.SphereGeometry(0.042, 10, 8), dark, [p[0], p[1], p[2] + 0.075]);
          }
          if (side === 'primary') {
            wire([circuit.switchTop, circuit.switchBottom], mat, 0.031);
            const body = new THREE.CylinderGeometry(0.44, 0.44, 0.19, 40);
            body.rotateX(Math.PI / 2);
            put(body, ceramic, [x, y, z]);
            const wave = Array.from({ length: 31 }, (_, i): ElectricPoint => {
              const q = i / 30;
              return [x - 0.27 + 0.54 * q, y + Math.sin(q * 2 * Math.PI) * 0.14, z + 0.105];
            });
            sourceAC = wire(wave, ink, 0.018);
            for (const dy of [-0.065, 0.065])
              put(
                new THREE.BoxGeometry(dy > 0 ? 0.46 : 0.28, 0.03, 0.02),
                ink,
                [x, y + dy, z + 0.11],
                sourceDC,
              );
          } else {
            put(new THREE.CylinderGeometry(0.2, 0.2, 0.87, 20), loadCeramic, [x, y, z]);
            for (const yy of [-0.31, 0.31])
              put(new THREE.CylinderGeometry(0.215, 0.215, 0.09, 20), metal, [x, y + yy, z]);
            const points = [circuit.switchTop, circuit.switchBottom];
            for (const p of points) put(new THREE.SphereGeometry(0.056, 12, 8), metal, p);
            switchLever = put(
              new THREE.CylinderGeometry(0.025, 0.025, 0.43, 10).translate(0, 0.215, 0),
              metal,
              circuit.switchBottom,
            );
          }
          const origin = narrow
            ? v(upper[1]).lerp(v(upper[2]), 0.58)
            : v(upper[1]).lerp(v(upper[2]), 0.52);
          origin.z += 0.055;
          const tangent = narrow
            ? v(upper[2]).sub(v(upper[1])).normalize()
            : v(upper[2]).sub(v(upper[1])).normalize();
          // Upper lead runs outwards from the dot: output i2 follows it; i1 opposes it.
          const arrow = new THREE.ArrowHelper(
            tangent,
            origin,
            0.38,
            side === 'primary' ? 0x945c37 : 0xac703f,
            0.12,
            0.09,
          );
          root.add(arrow);
          currentArrows.push({ arrow, side, tangent });
        }
        // Feet support the core without an unexplained floating assembly.
        for (const x of [-1.65, 1.65]) {
          const bottom = 0.06;
          put(new THREE.BoxGeometry(1.1, g.bottom - bottom, 1.35), dark, [
            x,
            (g.bottom + bottom) / 2,
            0,
          ]);
        }
        const framing = createElectricalFraming(root, camera, controls, [], [-0.12, 0.08]);
        return {
          update() {
            const s = latest.current,
              instant = s.instant;
            if (turns !== s.input.secondaryTurns) {
              turns = s.input.secondaryTurns;
              secondary.geometry.dispose();
              secondary.geometry = new THREE.TubeGeometry(
                new WindingCurve('secondary', turns),
                turns * 64,
                g.wireRadius,
                7,
                false,
              );
            }
            copper2.opacity = s.coilOpacity;
            primary.visible = true;
            const strength = Math.min(1, Math.abs(instant.b) / 1.2);
            fluxMaterial.opacity = 0.1 + 0.85 * strength;
            for (const { arrow, tangent } of fluxArrows) {
              arrow.visible = strength > 0.015;
              arrow.setDirection(tangent.clone().multiplyScalar(Math.sign(instant.flux) || 1));
              arrow.setLength(0.14 + 0.2 * strength, 0.1, 0.075);
            }
            for (const { arrow, side, tangent } of currentArrows) {
              const current = side === 'primary' ? -instant.i1 : instant.i2;
              arrow.visible = Math.abs(current) > 0.0003;
              arrow.setDirection(tangent.clone().multiplyScalar(Math.sign(current) || 1));
              arrow.setLength(0.15 + 0.27 * Math.min(1, Math.abs(current) / 0.3), 0.11, 0.075);
            }
            if (switchLever) switchLever.rotation.z = s.input.connected && !s.dc ? 0 : -0.68;
            if (sourceAC) sourceAC.visible = !s.dc;
            sourceDC.visible = s.dc;
            loadCeramic.emissive.set('#ac5c26');
            loadCeramic.emissiveIntensity = Math.min(0.2, instant.outputPower * 0.12);
            iron.emissive.set('#9c5930');
            iron.emissiveIntensity = s.showLosses ? s.ac.coreWatts * 1.2 : 0;
            copper.emissive.set('#a95723');
            copper2.emissive.copy(copper.emissive);
            copper.emissiveIntensity = copper2.emissiveIntensity = s.showLosses
              ? Math.min(0.25, s.ac.copperWatts * 3)
              : 0;
            framing.update();
            if (controls.enabled) return;
            root.rotation.y = 0.08 * s.fieldFocus - 0.12 * s.laminationFocus;
          },
          dispose() {
            framing.dispose();
            // Studio owns scene traversal, geometries, materials, controls and renderer.
            // ArrowHelper owns its shared internal geometry; Studio traversal releases it.
          },
        };
      }}
    />
  );
}
