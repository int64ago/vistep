import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { engineCycle, ENGINE } from '../../models/four-stroke';
import { useShowcase } from '../lab/Showcase';
import EngineDiagram, { strokeColors } from '../lab/EngineDiagram';
import Studio from './Studio';
import { box, material, roller, screw } from './parts';
export default function EngineStudio({ angle, leverage }: { angle: number; leverage: boolean }) {
  const demo = useShowcase(),
    current = useRef({ angle, leverage, demo });
  current.current = { angle, leverage, demo };
  return (
    <Studio
      label={t('四冲程发动机剖面：活塞、连杆、曲轴、飞轮与进排气门')}
      cameraPosition={[5.8, 6.3, 12]}
      target={[0, 3.35, 0]}
      span={6.5}
      fitHeight={7.7}
      fallback={<EngineDiagram angle={angle} />}
      create={({ root, camera, controls }) => {
        const metal = material('#9cafa2', 0.78, 0.28),
          dark = material('#294a39', 0.35, 0.4),
          bronze = material('#a17c40', 0.45, 0.31),
          casing = material('#456e5b', 0.25, 0.36),
          ceramic = material('#e6e5d2', 0.1, 0.3);
        const scale = 20,
          origin = 1.35,
          crownOffset = 0.5,
          head =
            origin +
            (ENGINE.rod + ENGINE.crank) * scale +
            crownOffset +
            (2 * ENGINE.crank * scale) / (ENGINE.compression - 1);
        const cylinder = (
          parent: THREE.Object3D,
          r: number,
          h: number,
          mat: THREE.Material,
          x: number,
          y: number,
          z: number,
        ) => {
          const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), mat);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const halfShell = (
          parent: THREE.Object3D,
          outer: number,
          inner: number,
          height: number,
          top: number,
          mat: THREE.Material,
        ) => {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, outer, Math.PI, 2 * Math.PI, false);
          shape.lineTo(inner, 0);
          shape.absarc(0, 0, inner, 2 * Math.PI, Math.PI, true);
          shape.closePath();
          const mesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, {
              depth: height,
              bevelEnabled: false,
              curveSegments: 48,
            }),
            mat,
          );
          mesh.rotation.x = Math.PI / 2;
          mesh.position.y = top;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        box(root, [4.5, 0.15, 2.6], [0, 0.08, 0], dark, 0.075);
        for (const x of [-1.7, 1.7])
          for (const z of [-0.9, 0.9]) screw(root, [x, 0.17, z], metal, 0.07);
        // The rear half remains to expose the bore, crown and every mechanical joint.
        halfShell(root, 0.94, 0.81, 2.4, head, casing);
        for (let i = 0; i < 9; i++)
          halfShell(root, 1.12, 0.94, 0.055, head - 0.12 - i * 0.25, casing);
        box(root, [2.05, 0.21, 0.8], [0, head + 0.11, -0.4], casing, 0.035);
        for (const x of [-1.03, 1.03]) box(root, [0.16, 3.1, 0.22], [x, 1.76, -0.55], casing, 0.04);
        box(root, [2.32, 0.25, 0.8], [0, 0.4, -0.4], casing, 0.08);
        const piston = new THREE.Group();
        root.add(piston);
        halfShell(piston, 0.785, 0.64, 0.72, crownOffset, metal);
        cylinder(piston, 0.785, 0.12, metal, 0, crownOffset - 0.06, 0);
        for (const offset of [0.19, 0.28])
          halfShell(piston, 0.8, 0.777, 0.025, crownOffset - offset, dark);
        const pin = roller(piston, 0.13, 1.25, [0, 0, 0], bronze);
        for (const z of [-0.5, 0.5]) box(piston, [0.32, 0.42, 0.23], [0, 0.13, z], metal, 0.055);
        const crank = new THREE.Group();
        crank.position.y = origin;
        root.add(crank);
        roller(root, 0.16, 2.25, [0, origin, -0.65], metal);
        for (const z of [-0.72, 0.78]) {
          box(root, [0.42, origin - 0.38, 0.35], [0, (origin + 0.38) / 2, z], casing, 0.045);
          roller(root, 0.27, 0.35, [0, origin, z], casing);
          roller(root, 0.17, 0.37, [0, origin, z], metal);
        }
        for (const z of [-0.42, 0.42]) {
          box(crank, [0.3, 0.98, 0.18], [0, 0.32, z], dark, 0.14);
          roller(crank, 0.48, 0.18, [0, -0.18, z - 0.09], dark);
        }
        roller(crank, 0.16, 1.05, [0, ENGINE.crank * scale, 0], bronze);
        const flywheel = roller(root, 1.18, 0.22, [0, origin, -1.13], dark);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.065, 12, 96), metal);
        flywheel.add(ring);
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const hole = roller(
            flywheel,
            0.12,
            0.235,
            [Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.005],
            material('#29483b', 0.25, 0.5),
          );
          hole.children.forEach((m) => {
            if (m instanceof THREE.Mesh) m.castShadow = false;
          });
        }
        const marker = box(flywheel, [0.11, 0.19, 0.015], [0, 1.03, 0.125], bronze, 0.015);
        const rod = new THREE.Group();
        root.add(rod);
        const length = ENGINE.rod * scale;
        box(rod, [0.19, length, 0.14], [0, length / 2, 0.2], bronze, 0.05);
        for (const z of [0.11, 0.29])
          box(rod, [0.28, length - 0.35, 0.035], [0, length / 2, z], metal, 0.014);
        for (const [y, r] of [
          [0, 0.26],
          [length, 0.19],
        ]) {
          const eye = new THREE.Mesh(new THREE.TorusGeometry(r, 0.075, 12, 48), bronze);
          eye.position.set(0, y, 0.2);
          rod.add(eye);
        }
        const valves = [-0.4, 0.4].map((x, i) => {
          const g = new THREE.Group();
          g.position.set(x, head, 0.16);
          root.add(g);
          cylinder(g, 0.215, 0.06, metal, 0, 0, 0);
          cylinder(g, 0.035, 1.02, metal, 0, 0.5, 0);
          cylinder(root, 0.08, 0.35, dark, x, head + 0.57, 0.16);
          cylinder(root, 0.155, 0.045, metal, x, head + 0.4275, 0.16);
          cylinder(g, 0.155, 0.045, metal, 0, 0.89, 0);
          const springPoints = Array.from({ length: 201 }, (_, k) => {
            const a = (k / 200) * Math.PI * 12;
            return new THREE.Vector3(Math.cos(a) * 0.12, (k / 200) * 0.42, Math.sin(a) * 0.12);
          });
          const spring = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 200, 0.014, 6, false),
            metal,
          );
          spring.position.set(x, head + 0.45, 0.16);
          root.add(spring);
          const side = i ? 1 : -1;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 2.05, head + 0.5, 0.16),
            new THREE.Vector3(side * 0.95, head + 0.5, 0.16),
            new THREE.Vector3(x, head + 0.3, 0.16),
            new THREE.Vector3(x, head - 0.08, 0.16),
          ]);
          const pipeMat = new THREE.MeshPhysicalMaterial({
            color: i ? '#b69d78' : '#739f9b',
            metalness: 0.25,
            roughness: 0.3,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.24, 20, false), pipeMat));
          const lip = new THREE.Mesh(
            new THREE.TorusGeometry(0.24, 0.035, 12, 48),
            i ? bronze : casing,
          );
          lip.rotation.y = Math.PI / 2;
          lip.position.copy(curve.getPoint(0));
          root.add(lip);
          const dots = Array.from({ length: 8 }, () => {
            const m = new THREE.Mesh(
              new THREE.SphereGeometry(0.042, 10, 8),
              new THREE.MeshBasicMaterial({ color: i ? '#bb8e60' : '#6aaca6' }),
            );
            root.add(m);
            return m;
          });
          return { g, curve, dots, spring };
        });
        cylinder(root, 0.11, 0.43, ceramic, 0, head + 0.39, 0.18);
        cylinder(root, 0.12, 0.13, metal, 0, head + 0.13, 0.18);
        box(root, [0.03, 0.19, 0.03], [0, head - 0.02, 0.18], metal, 0);
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 20, 12),
          new THREE.MeshBasicMaterial({ color: '#fff0af', transparent: true, opacity: 1 }),
        );
        spark.position.set(0, head - 0.15, 0.18);
        root.add(spark);
        const gasMat = new THREE.MeshBasicMaterial({
          color: '#6e9898',
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const gas = cylinder(root, 0.78, 1, gasMat, 0, head - 0.2, 0);
        const force = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0),
          new THREE.Vector3(0.05, head - 0.3, 0.82),
          0.4,
          0xb57848,
          0.14,
          0.1,
        );
        root.add(force);
        const pinHalo = new THREE.Mesh(
          new THREE.TorusGeometry(0.26, 0.024, 10, 48),
          new THREE.MeshBasicMaterial({ color: '#d7ad6d' }),
        );
        root.add(pinHalo);
        const v = new THREE.Vector3();
        return {
          update(dt, _elapsed, settle) {
            const { angle: a, leverage: lever, demo: d } = current.current,
              s = engineCycle(a);
            piston.position.y = origin + s.pinY * scale;
            crank.rotation.z = -a;
            flywheel.rotation.z = -a;
            rod.position.set(s.crankX * scale, origin + s.crankY * scale, 0);
            rod.rotation.z = -s.rodAngle;
            const crown = piston.position.y + crownOffset,
              height = head - crown;
            gas.scale.y = height;
            gas.position.y = crown + height / 2;
            gasMat.color.set(strokeColors[s.stage]);
            gasMat.opacity = 0.1 + Math.min(1, s.pressure / 6e6) * 0.22;
            valves.forEach(({ g, curve, dots, spring }, i) => {
              const lift = i ? s.exhaust : s.intake;
              g.position.y = head - lift * 0.13;
              spring.scale.y = (0.42 - lift * 0.13) / 0.42;
              dots.forEach((m, k) => {
                m.visible = lift > 0.01;
                const p = ((s.cycle / Math.PI) * 2 + k / 8) % 1;
                m.position.copy(curve.getPoint(i ? 1 - p : p));
              });
            });
            const burn = s.cycle - 2 * Math.PI;
            spark.visible = burn >= 0 && burn < 0.14;
            spark.scale.setScalar(1 + Math.max(0, 1 - burn / 0.14) * 1.4);
            const forceLength = 0.25 + Math.min(0.65, (s.pressure / 6e6) * 0.65);
            force.visible = s.stage === 2 || lever;
            force.position.set(0.05, crown + forceLength + 0.05, 0.82);
            force.setLength(forceLength, 0.13, 0.09);
            pinHalo.visible = lever;
            pinHalo.position.set(s.crankX * scale, origin + s.crankY * scale, 0.65);
            marker.visible = true;
            pin.visible = true;
            if (d.watch) {
              const close = [1, 2, 3, 5].includes(d.chapter);
              const framing = new THREE.Vector3(
                0,
                close ? (camera.aspect > 1 ? 5.2 : 4.4) : 3.35,
                0,
              );
              const amount = settle ? 1 : 1 - Math.exp(-dt * 2);
              const viewHeight = close
                ? Math.max(4.4, 4.7 / camera.aspect)
                : Math.max(6.5 / camera.aspect, 7.7);
              const homeDistance = viewHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
              controls.target.lerp(framing, amount);
              v.set(close ? 3.5 : 5.8, close ? 6.1 : 6.3, 12)
                .sub(framing)
                .normalize()
                .multiplyScalar(homeDistance)
                .add(controls.target);
              camera.position.lerp(v, amount);
            }
          },
        };
      }}
    />
  );
}
