import { useRef, useState } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, roller, material } from './parts';
import { useSimulation } from '../lab/useSimulation';
import { chainLoop, TAU, sprocketOutline } from '../../models/mechanisms';

export default function BicycleStudio({
  front,
  rear,
  cadence,
  playing,
  closeup = false,
}: {
  front: number;
  rear: number;
  cadence: number;
  playing: boolean;
  closeup?: boolean;
}) {
  const state = useRef({ front, rear, cadence, playing, closeup });
  state.current = { front, rear, cadence, playing, closeup };
  return (
    <Studio
      key={`${front}-${rear}`}
      span={6.2}
      fitHeight={3.3}
      target={[0, 1.4, 0]}
      cameraPosition={[1.3, 2.8, 11]}
      label="闭合滚子链传动：链销、内外链板、齿槽、轴承与曲柄"
      create={({ root, camera, controls }) => {
        root.position.y = 1.5;
        const chain = chainLoop(front, rear),
          metal = material('#b4bec2', 0.88, 0.29),
          dark = material('#3b4448', 0.72, 0.38),
          black = material('#243136', 0.25, 0.6),
          brass = material('#b5a77e', 0.8, 0.34);
        function sprocket(teeth: number, r: number, x: number, mat: THREE.Material) {
          const group = new THREE.Group();
          group.position.x = x;
          root.add(group);
          const shape = new THREE.Shape();
          sprocketOutline(teeth, chain.pitch).forEach((p, i) =>
            i ? shape.lineTo(p.x, p.y) : shape.moveTo(p.x, p.y),
          );
          shape.closePath();
          const hole = new THREE.Path();
          hole.absarc(0, 0, r * 0.77, 0, TAU, true);
          shape.holes.push(hole);
          const ring = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, {
              depth: 0.034,
              bevelEnabled: true,
              bevelSize: 0.002,
              bevelThickness: 0.002,
              bevelSegments: 2,
              steps: 1,
            }),
            mat,
          );
          ring.position.z = -0.017;
          ring.castShadow = true;
          ring.receiveShadow = true;
          group.add(ring);
          for (let i = 0; i < 5; i++) {
            const a = (i * TAU) / 5;
            const arm = box(
              group,
              [r * 0.69, 0.085, 0.036],
              [Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, 0],
              mat,
              0.016,
            );
            arm.rotation.z = a;
            roller(group, 0.035, 0.055, [Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, 0], metal);
          }
          roller(group, r * 0.19, 0.16, [0, 0, -0.01], dark);
          return group;
        }
        const frontGroup = sprocket(front, chain.ra, -chain.distance / 2, dark);
        const rearGroup = sprocket(rear, chain.rb, chain.distance / 2, brass);
        // The chain sits between the two crank planes, with visible clearance.
        box(frontGroup, [1.2, 0.16, 0.12], [-0.56, 0, 0.23], black, 0.05);
        const pedal = new THREE.Group();
        pedal.position.set(-1.13, 0, 0.28);
        frontGroup.add(pedal);
        box(pedal, [0.4, 0.13, 0.48], [0, 0, 0], dark, 0.035);
        for (let i = 0; i < 5; i++)
          box(pedal, [0.02, 0.012, 0.38], [-0.15 + i * 0.075, 0.073, 0], metal, 0.004);
        roller(frontGroup, 0.048, 0.18, [-1.13, 0, 0.18], metal);
        box(frontGroup, [1.2, 0.14, 0.1], [0.56, 0, -0.38], dark, 0.045);
        const farPedal = new THREE.Group();
        farPedal.position.set(1.13, 0, -0.46);
        frontGroup.add(farPedal);
        box(farPedal, [0.4, 0.13, 0.48], [0, 0, 0], dark, 0.035);
        for (const x of [-chain.distance / 2, chain.distance / 2]) {
          roller(root, 0.09, 0.9, [x, 0, -0.3], metal);
          roller(root, 0.17, 0.2, [x, 0, -0.45], dark);
          box(root, [0.3, 1.22, 0.23], [x, -0.78, -0.45], metal, 0.025);
          box(root, [0.77, 0.12, 0.73], [x, -1.44, -0.43], black, 0.035);
          for (const dx of [-0.27, 0.27])
            roller(root, 0.03, 0.027, [x + dx, -1.37, -0.43], metal).rotation.x = Math.PI / 2;
        }
        const shape = new THREE.Shape(),
          half = chain.pitch / 2,
          radius = 0.027;
        shape.moveTo(-half, -radius);
        shape.lineTo(half, -radius);
        shape.absarc(half, 0, radius, -Math.PI / 2, Math.PI / 2, false);
        shape.lineTo(-half, radius);
        shape.absarc(-half, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
        const plateGeometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.014,
          bevelEnabled: true,
          bevelSize: 0.002,
          bevelThickness: 0.002,
          bevelSegments: 2,
          steps: 1,
        });
        plateGeometry.translate(0, 0, -0.007);
        const plates = new THREE.InstancedMesh(
          plateGeometry,
          material('#ffffff', 0.85, 0.33),
          chain.count * 2,
        );
        const rollerGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.074, 16);
        rollerGeometry.rotateX(Math.PI / 2);
        const rollers = new THREE.InstancedMesh(rollerGeometry, dark, chain.count);
        const pinGeometry = new THREE.CylinderGeometry(0.0135, 0.0135, 0.166, 12);
        pinGeometry.rotateX(Math.PI / 2);
        const pins = new THREE.InstancedMesh(pinGeometry, metal, chain.count);
        for (const mesh of [plates, rollers, pins]) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          root.add(mesh);
          mesh.frustumCulled = false;
        }
        for (let i = 0; i < chain.count * 2; i++)
          plates.setColorAt(i, new THREE.Color(i < 2 ? '#bd8e51' : '#aebcc2'));
        const dummy = new THREE.Object3D();
        let phase = 0;
        let overview: THREE.Vector3 | null = null;
        const originalTarget = controls.target.clone(),
          closeTarget = new THREE.Vector3(chain.distance / 2, 1.5, 0);
        return {
          update(dt) {
            if (!overview) overview = camera.position.clone();
            const target = state.current.closeup ? closeTarget : originalTarget;
            const destination = state.current.closeup
              ? closeTarget
                  .clone()
                  .add(
                    new THREE.Vector3(0.25, 0.4, 1)
                      .normalize()
                      .multiplyScalar(Math.max(2.4, 2.4 / camera.aspect)),
                  )
              : overview;
            if (!controls.enabled) {
              camera.position.lerp(destination, 1 - Math.exp(-dt * 3));
              controls.target.lerp(target, 1 - Math.exp(-dt * 3));
            }
            if (state.current.playing)
              phase = (phase + (dt * state.current.cadence * front) / 60) % chain.count;
            frontGroup.rotation.z = chain.alpha - (phase * TAU) / front;
            rearGroup.rotation.z = chain.alpha + ((chain.lengths[0] - phase) * TAU) / rear;
            pedal.rotation.z = farPedal.rotation.z = -frontGroup.rotation.z;
            for (let i = 0; i < chain.count; i++) {
              const a = chain.sample(i + phase),
                b = chain.sample(i + 1 + phase),
                length = Math.hypot(b.x - a.x, b.y - a.y);
              dummy.rotation.set(0, 0, Math.atan2(b.y - a.y, b.x - a.x));
              dummy.scale.set(length / chain.pitch, 1, 1);
              for (let side = 0; side < 2; side++) {
                dummy.position.set(
                  (a.x + b.x) / 2,
                  (a.y + b.y) / 2,
                  (side ? 1 : -1) * (i % 2 ? 0.047 : 0.064),
                );
                dummy.updateMatrix();
                plates.setMatrixAt(i * 2 + side, dummy.matrix);
              }
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(1, 1, 1);
              dummy.position.set(a.x, a.y, 0);
              dummy.updateMatrix();
              rollers.setMatrixAt(i, dummy.matrix);
              pins.setMatrixAt(i, dummy.matrix);
            }
            plates.instanceMatrix.needsUpdate =
              rollers.instanceMatrix.needsUpdate =
              pins.instanceMatrix.needsUpdate =
                true;
          },
        };
      }}
      fallback={<BicycleFlat front={front} rear={rear} cadence={cadence} playing={playing} />}
    />
  );
}

function BicycleFlat({
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
  const chain = chainLoop(front, rear),
    [phase, setPhase] = useState(0);
  const host = useSimulation(
    (dt) => setPhase((p) => (p + (dt * cadence * front) / 60) % chain.count),
    playing,
  );
  const points = Array.from({ length: chain.count }, (_, i) => chain.sample(i + phase));
  return (
    <div ref={host} style={{ height: '100%' }}>
      <svg viewBox="-3 -1.8 6 3.6" role="img" aria-label="闭合链传动，金色链节沿两轮之间循环">
        <g transform="scale(1,-1)">
          {[
            [front, chain.ra, -chain.distance / 2, chain.alpha - (phase * TAU) / front],
            [
              rear,
              chain.rb,
              chain.distance / 2,
              chain.alpha + ((chain.lengths[0] - phase) * TAU) / rear,
            ],
          ].map(([n, r, x, a], i) => (
            <g key={i} transform={`translate(${x},0) rotate(${(a * 180) / Math.PI})`}>
              <circle
                r={r - 0.025}
                fill="none"
                stroke={i ? '#ac9d7a' : '#53605c'}
                strokeWidth=".06"
              />
              <circle r=".1" fill="#53605c" />
              {Array.from({ length: n }, (_, j) => (
                <circle
                  key={j}
                  cx={r * Math.cos((j * TAU) / n)}
                  cy={r * Math.sin((j * TAU) / n)}
                  r=".028"
                  fill="#eaf0e8"
                  stroke="#53605c"
                  strokeWidth=".006"
                />
              ))}
              {Array.from({ length: 5 }, (_, j) => (
                <path
                  key={j}
                  d={`M0 0L${r * 0.9 * Math.cos((j * TAU) / 5)} ${r * 0.9 * Math.sin((j * TAU) / 5)}`}
                  stroke="#65736b"
                  strokeWidth=".05"
                />
              ))}
              {!i && <path d="M0 0h-1.13" stroke="#34453b" strokeWidth=".1" />}
            </g>
          ))}
          {points.map((p, i) => {
            const q = points[(i + 1) % points.length];
            return (
              <g key={i}>
                <path
                  d={`M${p.x} ${p.y}L${q.x} ${q.y}`}
                  stroke={i === 0 ? '#bd8e51' : '#83958c'}
                  strokeWidth=".05"
                  strokeLinecap="round"
                />
                <circle cx={p.x} cy={p.y} r=".012" fill="#eaf1eb" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
