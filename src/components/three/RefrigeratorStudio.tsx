import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, roller, tube, material, screw } from './parts';
export default function RefrigeratorStudio({
  phase,
  cutaway,
}: {
  phase: number;
  cutaway: boolean;
}) {
  const current = useRef({ phase, cutaway });
  current.current = { phase, cutaway };
  return (
    <Studio
      label="冰箱剖面与制冷管路：箱内蒸发器、压缩机、外部冷凝器与毛细管"
      span={7.3}
      fitHeight={6.3}
      cameraPosition={[7, 4.2, 10]}
      target={[0, 2.3, 0]}
      create={({ root }) => {
        const enamel = material('#dedfd9', 0.15, 0.28),
          liner = material('#e9f0eb', 0.08, 0.43),
          metal = material('#a6b6b5', 0.8, 0.26),
          rubber = material('#273535', 0.2, 0.56),
          hot = material('#bd7143', 0.75, 0.3),
          cold = material('#6fa6ae', 0.55, 0.31);
        const glass = new THREE.MeshPhysicalMaterial({
          color: '#d5e7df',
          metalness: 0,
          roughness: 0.15,
          transparent: true,
          opacity: 0.27,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        box(root, [5.85, 0.13, 3.1], [0, 0.08, 0], material('#c9d5ce', 0.12, 0.7), 0.065);
        box(root, [2.35, 4.7, 0.17], [-1.6, 2.6, -1.03], enamel, 0.07);
        box(root, [0.17, 4.7, 2.1], [-2.77, 2.6, 0], enamel, 0.07);
        box(root, [2.35, 0.16, 2.1], [-1.6, 4.94, 0], enamel, 0.07);
        box(root, [2.35, 0.24, 2.1], [-1.6, 0.36, 0], enamel, 0.06);
        box(root, [2.1, 0.035, 1.85], [-1.6, 3.66, 0], liner, 0.01);
        for (const y of [1.2, 2.2, 3.05]) {
          box(root, [2.1, 0.033, 1.8], [-1.6, y, 0], glass, 0.01);
          box(root, [2.12, 0.05, 0.045], [-1.6, y, 0.91], metal, 0.01);
        }
        box(root, [1.95, 0.57, 1.62], [-1.6, 0.77, 0.03], glass, 0.05);
        const vegmat = material('#80966a', 0.05, 0.7),
          fruit = material('#ca975b', 0, 0.63);
        for (let i = 0; i < 5; i++) {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 20, 12),
            i % 2 ? fruit : vegmat,
          );
          sphere.position.set(-2.23 + i * 0.29, 0.86, 0.24);
          root.add(sphere);
        }
        for (let i = 0; i < 3; i++) {
          const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.65, 24), glass);
          bottle.position.set(-2.22 + i * 0.42, 1.56, -0.28);
          root.add(bottle);
          roller(root, 0.07, 0.09, [-2.22 + i * 0.42, 1.94, -0.28], liner).rotation.x = Math.PI / 2;
        }
        box(root, [0.67, 0.53, 0.55], [-1.1, 2.49, -0.06], material('#e8c898', 0, 0.8), 0.045);
        box(root, [0.42, 0.32, 0.63], [-2, 2.37, 0.12], material('#b0c6a9', 0, 0.75), 0.055);
        const compressor = new THREE.Mesh(new THREE.SphereGeometry(0.52, 40, 28), rubber);
        compressor.scale.set(1.1, 0.85, 0.88);
        compressor.position.set(0.15, 0.64, 0);
        root.add(compressor);
        box(root, [1.2, 0.12, 0.9], [0.15, 0.27, 0], metal);
        for (const x of [-0.37, 0.68])
          for (const z of [-0.32, 0.32]) screw(root, [x, 0.35, z], metal);
        const coils: number[][] = [];
        for (let row = 0; row < 10; row++) {
          const y = 4.7 - row * 0.3;
          coils.push([row % 2 ? 2.58 : 1.06, y, -0.18], [row % 2 ? 1.06 : 2.58, y, -0.18]);
        }
        for (let i = 0; i < 18; i++)
          box(root, [0.018, 3.0, 0.034], [1.02 + i * 0.095, 3.23, -0.2], metal, 0);
        tube(root, coils, 0.032, hot);
        const evaporator: number[][] = [];
        for (let row = 0; row < 5; row++) {
          const y = 4.64 - row * 0.18;
          evaporator.push([row % 2 ? -2.47 : -0.78, y, -0.78], [row % 2 ? -0.78 : -2.47, y, -0.78]);
        }
        tube(root, evaporator, 0.032, cold);
        const capillary = Array.from({ length: 120 }, (_, i) => {
          const a = (i / 120) * Math.PI * 2 * 8;
          return [2.45 + Math.cos(a) * 0.17, 1.44 - (i / 120) * 0.65, Math.sin(a) * 0.17];
        });
        tube(root, capillary, 0.013, hot);
        const segments = [
          [[0.2, 0.92, 0], [0.5, 1.22, -0.18], [0.5, 4.7, -0.18], ...coils.slice(0, 1)],
          coils,
          [
            coils[coils.length - 1],
            ...capillary,
            [-0.55, 0.79, -0.2],
            [-0.55, 4.64, -0.78],
            evaporator[0],
          ],
          [
            ...evaporator,
            [-2.47, 3.5, -0.78],
            [-2.48, 0.58, -0.78],
            [-0.38, 0.57, -0.25],
            [0.2, 0.92, 0],
          ],
        ];
        const curves = segments.map((p, i) => {
          const curve = new THREE.CatmullRomCurve3(
            p.map((v) => new THREE.Vector3(...(v as [number, number, number]))),
            false,
            'centripetal',
          );
          if (i !== 1) tube(root, p, i === 2 ? 0.018 : 0.033, i < 2 ? hot : cold);
          return curve;
        });
        const particleMaterial = new THREE.MeshBasicMaterial({ color: '#ffe3b5' }),
          particles: THREE.Mesh[] = [];
        for (let i = 0; i < 12; i++) {
          const particle = new THREE.Mesh(
            new THREE.SphereGeometry(i === 0 ? 0.065 : 0.033, 12, 8),
            particleMaterial,
          );
          root.add(particle);
          particles.push(particle);
        }
        const side = new THREE.Group();
        root.add(side);
        box(side, [0.17, 4.7, 2.1], [-0.43, 2.6, 0], enamel, 0.05);
        const door = new THREE.Group();
        door.position.set(-2.77, 0, 1.11);
        root.add(door);
        box(door, [2.36, 3.28, 0.18], [1.18, 2.04, 0], enamel, 0.08);
        box(door, [2.36, 1.17, 0.18], [1.18, 4.35, 0], enamel, 0.07);
        box(door, [0.06, 0.72, 0.08], [2.03, 3.02, 0.15], metal, 0.025);
        box(door, [0.06, 0.48, 0.08], [2.03, 4.35, 0.15], metal, 0.025);
        let openness = cutaway ? 1 : 0;
        return {
          update(dt) {
            const s = current.current;
            openness = THREE.MathUtils.damp(openness, s.cutaway ? 1 : 0, 6, dt);
            door.rotation.y = -openness * 1.92;
            door.visible = openness < 0.95;
            side.visible = openness < 0.9;
            const active = Math.min(3, Math.floor(s.phase)),
              t = s.phase % 1;
            particles.forEach((p, i) => {
              p.position.copy(curves[active].getPointAt((t + i / particles.length) % 1));
              p.material = particleMaterial;
            });
          },
        };
      }}
      fallback={
        <svg viewBox="0 0 550 390" aria-label="四阶段制冷循环二维图">
          <rect x="30" y="40" width="155" height="300" rx="10" fill="#e1eee8" />
          <path
            d="M275 295V70H445V300H105V130H155V295H275"
            stroke="#c49b76"
            strokeWidth="6"
            fill="none"
          />
          <path d="M445 300H105V130H155V295H275" stroke="#74a8b6" strokeWidth="4" fill="none" />
          <rect x="244" y="277" width="64" height="39" rx="17" fill="#486663" />
          <g fill="#71937e" fontSize="13">
            <text x="60" y="95">
              箱内吸热
            </text>
            <text x="300" y="50">
              向室内放热
            </text>
            <text x="260" y="340">
              压缩机
            </text>
          </g>
        </svg>
      }
    />
  );
}
