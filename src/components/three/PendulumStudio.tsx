import { t } from '../../i18n';
import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, tube, roller, screw, material } from './parts';
export default function PendulumStudio({
  angle,
  length,
  mass,
  showForces = false,
  onDrag,
  onRelease,
}: {
  angle: number;
  length: number;
  mass: number;
  showForces?: boolean;
  onDrag: (angle: number) => void;
  onRelease: () => void;
}) {
  const current = useRef({ angle, length, mass, showForces, onDrag, onRelease });
  current.current = { angle, length, mass, showForces, onDrag, onRelease };
  return (
    <Studio
      label={t('黄铜摆球、悬线与精密支架构成的单摆。拖动摆球后释放')}
      cameraPosition={[2.9, 2.1, 10]}
      target={[0, 1.85, 0]}
      span={5.8}
      fitHeight={5.3}
      create={({ root, camera, controls }) => {
        const brass = material('#b49653', 0.88, 0.26),
          dark = material('#283129', 0.35, 0.5),
          silver = material('#bbc0b5', 0.9, 0.2),
          marble = material('#b4b6a6', 0.08, 0.7);
        box(root, [4.5, 0.22, 2.5], [0, 0.1, 0], marble, 0.08);
        box(root, [4.55, 0.04, 2.55], [0, 0.0, 0], dark, 0.02);
        for (const x of [-1.9, 1.9])
          for (const z of [-0.9, 0.9]) {
            screw(root, [x, 0.23, z], silver, 0.045);
          }
        // Two slanted feet keep the stand structurally plausible when seen from the side.
        for (const x of [-1.86, 1.86]) {
          tube(
            root,
            [
              [x, 0.25, -0.72],
              [x, 4.15, -0.72],
            ],
            0.055,
            dark,
          );
          tube(
            root,
            [
              [x, 0.25, 1],
              [x, 2.2, -0.72],
            ],
            0.03,
            silver,
          );
          box(root, [0.34, 0.065, 0.35], [x, 0.26, -0.72], brass, 0.025);
        }
        tube(
          root,
          [
            [-1.93, 4.16, -0.72],
            [1.93, 4.16, -0.72],
          ],
          0.075,
          dark,
        );
        box(root, [0.46, 0.25, 0.37], [0, 4.13, -0.72], brass, 0.04);
        roller(root, 0.07, 1.1, [0, 3.98, -0.25], silver);
        roller(root, 0.15, 0.08, [0, 3.98, 0.37], brass);
        const swinging = new THREE.Group();
        swinging.position.set(0, 3.98, 0.4);
        root.add(swinging);
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 10), silver);
        swinging.add(wire);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 64, 48), brass);
        ball.castShadow = true;
        ball.receiveShadow = true;
        swinging.add(ball);
        const collar = roller(swinging, 0.075, 0.14, [0, 0, 0], brass);
        collar.rotation.x = Math.PI / 2;
        const scale = new THREE.Group();
        root.add(scale);
        for (let degree = -80; degree <= 80; degree += 5) {
          const a = (degree * Math.PI) / 180,
            r = 2.7,
            major = degree % 20 === 0;
          const points = [
            new THREE.Vector3(Math.sin(a) * r, 3.98 - Math.cos(a) * r, 0.28),
            new THREE.Vector3(
              Math.sin(a) * (r + (major ? 0.09 : 0.04)),
              3.98 - Math.cos(a) * (r + (major ? 0.09 : 0.04)),
              0.28,
            ),
          ];
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: major ? '#7d866f' : '#c6cbb9' }),
          );
          scale.add(line);
        }
        const trailMaterial = new THREE.LineBasicMaterial({
          color: '#ab8950',
          transparent: true,
          opacity: 0.36,
        });
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 180 }, () => new THREE.Vector3()),
        );
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        root.add(trail);
        const gravityArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0),
          new THREE.Vector3(),
          0.8,
          0x557f9d,
          0.13,
          0.065,
        );
        const restoringArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(),
          0.5,
          0xc18d50,
          0.12,
          0.06,
        );
        root.add(gravityArrow, restoringArrow);
        const history: THREE.Vector3[] = [];
        let lastAngle = angle,
          lastLength = length;
        const canvas = controls.domElement!;
        let dragging = false;
        const raycaster = new THREE.Raycaster(),
          pointer = new THREE.Vector2(),
          plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.4),
          hit = new THREE.Vector3();
        const move = (event: PointerEvent) => {
          const bounds = canvas.getBoundingClientRect();
          pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          if (dragging && raycaster.ray.intersectPlane(plane, hit)) {
            current.current.onDrag(
              THREE.MathUtils.clamp((Math.atan2(hit.x, 3.98 - hit.y) * 180) / Math.PI, -80, 80),
            );
          }
        };
        const down = (event: PointerEvent) => {
          if (!controls.enabled) return;
          move(event);
          if (raycaster.intersectObject(ball).length) {
            dragging = true;
            controls.enabled = false;
            canvas.setPointerCapture(event.pointerId);
            event.stopImmediatePropagation();
            current.current.onDrag((current.current.angle * 180) / Math.PI);
          }
        };
        const up = () => {
          if (dragging) {
            dragging = false;
            controls.enabled = true;
            current.current.onRelease();
          }
        };
        canvas.addEventListener('pointerdown', down, true);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', up);
        return {
          update() {
            const state = current.current,
              L = state.length * 1.23;
            const bob = new THREE.Vector3(
              Math.sin(state.angle) * L,
              3.98 - Math.cos(state.angle) * L,
              0.55,
            );
            gravityArrow.visible = restoringArrow.visible = state.showForces;
            gravityArrow.position.copy(bob);
            restoringArrow.position.copy(bob);
            restoringArrow.setDirection(
              new THREE.Vector3(
                -Math.cos(state.angle) * Math.sign(state.angle),
                -Math.sin(state.angle) * Math.sign(state.angle),
                0,
              ),
            );
            restoringArrow.setLength(
              Math.max(0.005, 0.8 * Math.abs(Math.sin(state.angle))),
              0.1,
              0.05,
            );
            swinging.rotation.z = state.angle;
            wire.scale.y = L;
            wire.position.y = -L / 2;
            ball.position.y = -L;
            ball.scale.setScalar(Math.cbrt(state.mass) * 0.9);
            collar.position.y = -L + 0.25 * Math.cbrt(state.mass) * 0.9;
            if (state.length !== lastLength || Math.abs(state.angle - lastAngle) > 0.12) {
              history.length = 0;
              trailGeometry.setDrawRange(0, 0);
              lastLength = state.length;
            }
            if (Math.abs(state.angle - lastAngle) > 0.0002) {
              lastAngle = state.angle;
              history.push(
                new THREE.Vector3(Math.sin(state.angle) * L, 3.98 - Math.cos(state.angle) * L, 0.4),
              );
              if (history.length > 180) history.shift();
              const pos = trailGeometry.getAttribute('position') as THREE.BufferAttribute;
              history.forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z));
              pos.needsUpdate = true;
              trailGeometry.setDrawRange(0, history.length);
            }
          },
          dispose() {
            canvas.removeEventListener('pointerdown', down, true);
            canvas.removeEventListener('pointermove', move);
            canvas.removeEventListener('pointerup', up);
            canvas.removeEventListener('pointercancel', up);
          },
        };
      }}
      fallback={
        <svg
          viewBox="0 0 500 400"
          role="img"
          aria-label={t('单摆二维侧视图；使用角度滑块设置并释放')}
        >
          <path d="M120 45H380" stroke="#718269" strokeWidth="4" />
          <path
            d={`M250 45l${Math.sin(angle) * length * 110} ${Math.cos(angle) * length * 110}`}
            stroke="#707b68"
            strokeWidth="2"
          />
          <circle
            cx={250 + Math.sin(angle) * length * 110}
            cy={45 + Math.cos(angle) * length * 110}
            r="20"
            fill="#b29453"
          />
        </svg>
      }
    />
  );
}
