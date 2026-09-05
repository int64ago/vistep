import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, roller, gear, material } from './parts';
export default function BicycleStudio({
  front,
  rear,
  cadence,
  playing,
}: {
  front: number;
  rear: number;
  cadence: number;
  playing: boolean;
}) {
  const state = useRef({ front, rear, cadence, playing });
  state.current = { front, rear, cadence, playing };
  return (
    <Studio
      key={`${front}-${rear}`}
      span={6.6}
      fitHeight={3.5}
      target={[0, 1.5, 0]}
      cameraPosition={[1.2, 2.1, 10]}
      label="自行车链传动：切削齿形、双片链节、前链盘、后飞轮组与曲柄踏板"
      create={({ root }) => {
        root.position.y = 1.5;
        const metal = material('#a9b3b7', 0.92, 0.22),
          dark = material('#343b3d', 0.65, 0.36),
          black = material('#161f22', 0.3, 0.5),
          titanium = material('#c2b991', 0.85, 0.3),
          marker = material('#d8994e', 0.55, 0.35);
        const frontGroup = new THREE.Group();
        frontGroup.position.x = -1.55;
        root.add(frontGroup);
        const rearGroup = new THREE.Group();
        rearGroup.position.x = 1.55;
        root.add(rearGroup);
        const frontRadius = front * 0.022,
          rearRadius = rear * 0.022;
        function chainring(
          parent: THREE.Group,
          r: number,
          teeth: number,
          z: number,
          mat: THREE.Material,
        ) {
          const ring = gear(parent, r, teeth, [0, 0, z], mat, 0.047);
          const shape = ring.geometry as THREE.ExtrudeGeometry;
          shape.dispose();
          const outline = new THREE.Shape();
          for (let i = 0; i < teeth * 4; i++) {
            const a = (i / (teeth * 4)) * Math.PI * 2,
              rr = r * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.967);
            i
              ? outline.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
              : outline.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          outline.closePath();
          const hole = new THREE.Path();
          hole.absarc(0, 0, r * 0.81, 0, Math.PI * 2, true);
          outline.holes.push(hole);
          ring.geometry = new THREE.ExtrudeGeometry(outline, {
            depth: 0.047,
            bevelEnabled: true,
            bevelSize: 0.008,
            bevelThickness: 0.005,
            bevelSegments: 2,
            steps: 1,
          });
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5;
            const arm = box(
              parent,
              [r * 0.78, 0.09, 0.045],
              [Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48, z + 0.02],
              mat,
              0.022,
            );
            arm.rotation.z = a;
            roller(
              parent,
              0.042,
              0.06,
              [Math.cos(a) * r * 0.59, Math.sin(a) * r * 0.59, z + 0.05],
              metal,
            );
          }
          roller(parent, r * 0.19, 0.12, [0, 0, z], dark);
        }
        chainring(frontGroup, frontRadius, front, 0, dark);
        chainring(frontGroup, frontRadius * 0.86, Math.round(front * 0.86), -0.12, metal);
        roller(frontGroup, 0.15, 0.6, [0, 0, -0.19], metal);
        const arm = box(frontGroup, [1.29, 0.18, 0.14], [-0.59, 0, 0.21], black, 0.08);
        arm.rotation.z = 0.0;
        box(frontGroup, [0.43, 0.16, 0.55], [-1.16, 0, 0.26], dark, 0.045);
        for (let i = 0; i < 5; i++)
          box(frontGroup, [0.02, 0.02, 0.44], [-1.32 + i * 0.08, 0.087, 0.26], metal, 0.004);
        roller(frontGroup, 0.048, 0.17, [-1.16, 0, 0.23], metal);
        box(frontGroup, [1.2, 0.14, 0.1], [0.55, 0, -0.45], dark, 0.045);
        box(frontGroup, [0.4, 0.13, 0.5], [1.1, 0, -0.5], dark, 0.035);
        for (let layer = 8; layer >= 0; layer--) {
          const n = Math.round(11 + layer * 2.6),
            r = n * 0.022;
          chainring(rearGroup, r, n, -0.12 - (8 - layer) * 0.12, metal);
        }
        chainring(rearGroup, rearRadius, rear, 0.04, titanium);
        roller(rearGroup, 0.12, 1.5, [0, 0, -0.5], metal);
        const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 5, 96), metal);
        rotor.position.z = -1.1;
        rearGroup.add(rotor);
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12;
          const points = [
            new THREE.Vector3(Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.7),
            new THREE.Vector3(Math.cos(a) * 0.9, Math.sin(a) * 0.9, -1.1),
          ];
          rearGroup.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(points),
              new THREE.LineBasicMaterial({ color: '#9aa8a9' }),
            ),
          );
        }
        const a = Math.acos((frontRadius - rearRadius) / 3.1),
          points: THREE.Vector3[] = [];
        for (let i = 0; i <= 70; i++) {
          const angle = a + ((2 * Math.PI - 2 * a) * i) / 70;
          points.push(
            new THREE.Vector3(
              -1.55 + Math.cos(angle) * frontRadius,
              Math.sin(angle) * frontRadius,
              0.085,
            ),
          );
        }
        for (let i = 0; i <= 70; i++) {
          const angle = -a + (2 * a * i) / 70;
          points.push(
            new THREE.Vector3(
              1.55 + Math.cos(angle) * rearRadius,
              Math.sin(angle) * rearRadius,
              0.085,
            ),
          );
        }
        const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
        const count = Math.round(curve.getLength() / 0.14),
          links: THREE.Group[] = [];
        for (let i = 0; i < count; i++) {
          const link = new THREE.Group();
          root.add(link);
          links.push(link);
          for (const z of [-0.045, 0.045])
            box(link, [0.123, 0.048, 0.018], [0, 0, z], i % 9 === 0 ? marker : metal, 0.022);
          roller(link, 0.025, 0.12, [-0.055, 0, 0], metal);
          roller(link, 0.025, 0.12, [0.055, 0, 0], metal);
        }
        roller(root, 0.23, 0.2, [-1.55, 0, -0.6], dark);
        roller(root, 0.17, 0.25, [1.55, 0, -1.25], dark);
        let rotation = 0;
        const len = curve.getLength();
        return {
          update(dt) {
            const s = state.current;
            if (s.playing) rotation -= (dt * s.cadence * Math.PI * 2) / 60;
            frontGroup.rotation.z = rotation;
            rearGroup.rotation.z = (rotation * s.front) / s.rear;
            links.forEach((link, i) => {
              const t = (((i / count + (rotation * frontRadius) / len) % 1) + 1) % 1;
              link.position.copy(curve.getPointAt(t));
              const tangent = curve.getTangentAt(t);
              link.rotation.z = Math.atan2(tangent.y, tangent.x);
            });
          },
        };
      }}
      fallback={
        <svg viewBox="0 0 600 320" aria-label="链传动二维结构">
          <circle cx="160" cy="160" r={front * 1.7} fill="none" stroke="#53605c" strokeWidth="9" />
          <circle cx="450" cy="160" r={rear * 1.7} fill="none" stroke="#9b967e" strokeWidth="8" />
          <path
            d={`M160 ${160 - front * 1.7}L450 ${160 - rear * 1.7}M160 ${160 + front * 1.7}L450 ${160 + rear * 1.7}`}
            stroke="#72807b"
            strokeWidth="3"
          />
        </svg>
      }
    />
  );
}
