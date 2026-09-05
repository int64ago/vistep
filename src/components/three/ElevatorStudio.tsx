import { t } from '../../i18n';
import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, tube, material } from './parts';
import type { ElevatorState } from '../../models/elevator';
export default function ElevatorStudio({ state }: { state: ElevatorState }) {
  const current = useRef(state);
  current.current = state;
  return (
    <Studio
      label={t(
        '八层建筑与两部电梯的三维剖面，{0} 人候梯',
        state.requests.filter((r) => r.status === 'waiting').length,
      )}
      span={6.4}
      fitHeight={7.5}
      target={[0, 2.95, 0]}
      cameraPosition={[8, 5, 12]}
      create={({ root }) => {
        const textures: THREE.Texture[] = [];
        const concrete = material('#8d9b85', 0.07, 0.73),
          metal = material('#839487', 0.76, 0.29),
          wall = material('#b4c0ad', 0.02, 0.69),
          dark = material('#506356', 0.25, 0.45),
          amber = material('#b38f5c', 0.4, 0.35);
        box(root, [4.6, 0.18, 2.5], [0, 0.04, 0], concrete, 0.04);
        box(root, [4.25, 6.12, 0.13], [0, 3.14, -1.05], wall, 0.03);
        for (let floor = 0; floor < 8; floor++) {
          const y = 0.2 + floor * 0.75;
          box(root, [2.37, 0.07, 2.04], [-0.97, y, 0], concrete, 0.012);
          for (const x of [-2.1, 0.18, 1.1, 2.0])
            box(root, [0.055, 0.71, 0.065], [x, y + 0.36, -0.85], metal, 0.007);
          box(root, [1.84, 0.06, 0.12], [1.08, y + 0.7, 0.78], concrete, 0.01);
          for (const x of [0.65, 1.57]) {
            box(
              root,
              [0.76, 0.67, 0.055],
              [x, y + 0.37, -0.8],
              material('#c6d0c3', 0.15, 0.5),
              0.01,
            );
            for (const dx of [-0.41, 0.41])
              box(root, [0.045, 0.73, 0.07], [x + dx, y + 0.4, 0.8], metal, 0.006);
          }
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 64;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#50694f';
          ctx.font = '500 40px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${floor + 1}F`, 64, 46);
          const texture = new THREE.CanvasTexture(canvas);
          textures.push(texture);
          const label = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 0.275),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
          );
          label.position.set(-1.96, y + 0.42, 1.04);
          root.add(label);
          box(root, [0.11, 0.17, 0.04], [0.14, y + 0.37, 0.87], metal, 0.01);
          box(root, [0.045, 0.04, 0.012], [0.14, y + 0.37, 0.896], amber, 0.004);
        }
        for (const x of [0.27, 1.09, 1.97]) {
          tube(
            root,
            [
              [x, 0.2, -0.7],
              [x, 6.31, -0.7],
            ],
            0.018,
            metal,
          );
        }
        const cabins: THREE.Group[] = [],
          doors: THREE.Mesh[][] = [];
        for (let id = 0; id < 2; id++) {
          const cabin = new THREE.Group();
          cabin.position.set(0.65 + id * 0.92, 0.25 + current.current.cars[id].position * 0.75, 0);
          root.add(cabin);
          cabins.push(cabin);
          box(cabin, [0.71, 0.06, 1.34], [0, 0, 0], dark, 0.012);
          box(cabin, [0.71, 0.035, 1.34], [0, 0.66, 0], dark, 0.012);
          box(cabin, [0.035, 0.65, 1.34], [-0.34, 0.33, 0], metal, 0.01);
          box(cabin, [0.035, 0.65, 1.34], [0.34, 0.33, 0], metal, 0.01);
          box(cabin, [0.68, 0.63, 0.035], [0, 0.33, -0.65], metal, 0.01);
          doors.push([
            box(cabin, [0.32, 0.58, 0.035], [-0.16, 0.32, 0.67], id ? amber : dark, 0.008),
            box(cabin, [0.32, 0.58, 0.035], [0.16, 0.32, 0.67], id ? amber : dark, 0.008),
          ]);
        }
        const people = new Map<number, THREE.Group>(),
          personMaterial = material('#a57542', 0.04, 0.63);
        function person(id: number) {
          const p = new THREE.Group();
          root.add(p);
          people.set(id, p);
          const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.031, 0.094, 4, 8),
            personMaterial,
          );
          body.position.y = 0.12;
          p.add(body);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.031, 12, 8), personMaterial);
          head.position.y = 0.224;
          p.add(head);
          for (const x of [-0.018, 0.018]) {
            const leg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.01, 0.011, 0.08, 7),
              personMaterial,
            );
            leg.position.set(x, 0.044, 0);
            p.add(leg);
          }
          return p;
        }
        let lastTime = current.current.time;
        const destinations = new Map<number, THREE.Vector3>();
        return {
          update(dt, _elapsed, settle) {
            const motionDt = settle ? Infinity : dt;
            const s = current.current;
            const reset = settle || s.time < lastTime;
            lastTime = s.time;
            if (reset) destinations.clear();
            s.cars.forEach((car, i) => {
              if (reset) cabins[i].position.y = 0.25 + car.position * 0.75;
              cabins[i].position.y = THREE.MathUtils.damp(
                cabins[i].position.y,
                0.25 + car.position * 0.75,
                24,
                motionDt,
              );
              const open = car.door > 0 ? Math.min(1, (1.5 - car.door) / 0.3, car.door / 0.35) : 0;
              doors[i][0].position.x = THREE.MathUtils.damp(
                doors[i][0].position.x,
                -0.16 - open * 0.22,
                15,
                motionDt,
              );
              doors[i][1].position.x = THREE.MathUtils.damp(
                doors[i][1].position.x,
                0.16 + open * 0.22,
                15,
                motionDt,
              );
            });
            people.forEach((p) => (p.visible = false));
            const counters = new Map<number, number>();
            s.requests.forEach((request) => {
              if (request.status === 'future') return;
              if (request.status === 'done' && s.time - request.dropoff! > 1) return;
              const p = people.get(request.id) || person(request.id);
              p.visible = true;
              if (request.status === 'done') {
                const elapsed = Math.min(1, s.time - request.dropoff!);
                const car = s.cars[request.car!];
                p.position.set(
                  0.65 + car.id * 0.92 - elapsed * 0.85,
                  0.25 + request.to * 0.75,
                  0.2 + elapsed * 0.7,
                );
                p.scale.setScalar(1.5 * (1 - elapsed * 0.65));
              } else if (request.status === 'waiting') {
                p.scale.setScalar(1.5);
                const n = counters.get(request.from) || 0;
                counters.set(request.from, n + 1);
                p.position.set(
                  -1.67 + (n % 7) * 0.22,
                  0.25 + request.from * 0.75,
                  0.5 - Math.floor(n / 7) * 0.24,
                );
                destinations.set(request.id, p.position.clone());
              } else {
                p.scale.setScalar(1.5);
                const car = s.cars.find((c) => c.passengers.includes(request.id));
                if (car) {
                  const n = car.passengers.indexOf(request.id);
                  p.position.set(
                    0.65 + car.id * 0.92 + ((n % 2) - 0.5) * 0.19,
                    0.03 + cabins[car.id].position.y,
                    0.2 - Math.floor(n / 2) * 0.25,
                  );
                  const start = destinations.get(request.id),
                    age = s.time - request.pickup!;
                  if (start && age < 1) {
                    const target = p.position.clone(),
                      u = THREE.MathUtils.smoothstep(age, 0.2, 1);
                    p.position.lerpVectors(start, target, u);
                    p.position.z += Math.sin(u * Math.PI) * 0.6;
                  }
                }
              }
            });
          },
          dispose() {
            textures.forEach((t) => t.dispose());
          },
        };
      }}
      fallback={
        <svg viewBox="0 0 530 430" role="img" aria-label={t('八层楼的电梯与候梯人数二维图')}>
          <rect x="300" y="25" width="140" height="363" fill="#dce5d8" />
          {Array.from({ length: 8 }, (_, i) => {
            const y = 375 - i * 44;
            return (
              <g key={i}>
                <path d={`M45 ${y}H465`} stroke="#c3d0ba" />
                <text x="18" y={y - 14} fill="#7c916b" fontSize="13">
                  {i + 1}F
                </text>
                <text x="95" y={y - 14} fill="#8aa177" fontSize="12">
                  {state.requests.filter((r) => r.status === 'waiting' && r.from === i).length}{' '}
                  {t('人候梯')}
                </text>
              </g>
            );
          })}
          {state.cars.map((car) => (
            <g key={car.id}>
              <rect
                x={310 + car.id * 63}
                y={344 - car.position * 44}
                width="48"
                height="30"
                rx="2"
                fill={car.id ? '#ad8d59' : '#5c8067'}
              />
              <text
                x={334 + car.id * 63}
                y={364 - car.position * 44}
                fill="white"
                fontSize="12"
                textAnchor="middle"
              >
                {car.passengers.length}
                {t('人')}
              </text>
            </g>
          ))}
        </svg>
      }
    />
  );
}
