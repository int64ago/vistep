import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  PLANETARY,
  planetaryOutlines,
  planetaryState,
  type PlanetaryMode,
} from '../../models/planetary';
import { TAU, type Point2 } from '../../models/mechanisms';
import { useShowcase } from '../lab/Showcase';
import PlanetaryDiagram from '../lab/PlanetaryDiagram';
import Studio from './Studio';
import { box, material, roller, screw } from './parts';
/** Fit all eight corners in the actual camera basis, including near-side depth.
 * The 0.88 usable fraction reserves a visible border throughout the camera sweep. */
export function fitPlanetaryCamera(
  bounds: THREE.Box3,
  aspect: number,
  direction: THREE.Vector3,
  fov = 34,
) {
  const target = bounds.getCenter(new THREE.Vector3()),
    back = direction.clone().normalize(),
    right = new THREE.Vector3(0, 1, 0).cross(back).normalize(),
    up = back.clone().cross(right),
    tanV = Math.tan((fov * Math.PI) / 360) * 0.88,
    tanH = tanV * aspect,
    offset = new THREE.Vector3();
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        offset.set(x, y, z).sub(target);
        const near = offset.dot(back);
        distance = Math.max(
          distance,
          near + Math.abs(offset.dot(right)) / tanH,
          near + Math.abs(offset.dot(up)) / tanV,
          near + 0.2,
        );
      }
  return { target, position: target.clone().addScaledVector(back, distance) };
}

export default function PlanetaryStudio({
  angle,
  mode,
  assembly,
}: {
  angle: number;
  mode: PlanetaryMode;
  assembly: number;
}) {
  const demo = useShowcase(),
    current = useRef({ angle, mode, assembly, demo });
  current.current = { angle, mode, assembly, demo };
  return (
    <Studio
      dark
      cameraPosition={[4.8, 4.2, 8]}
      target={[0, 1.85, 0]}
      span={4.9}
      fitHeight={5.3}
      label={t('行星齿轮装配：渐开线内齿圈、三个行星轮、太阳轮、行星架与同轴轴承')}
      fallback={<PlanetaryDiagram angle={angle} mode={mode} />}
      create={({ root, camera, controls }) => {
        root.position.y = 1.85;
        const p = PLANETARY,
          outlines = planetaryOutlines(),
          steel = material('#a8bdc5', 0.78, 0.28),
          brass = material('#c2a066', 0.72, 0.27),
          teal = material('#659f98', 0.62, 0.3),
          ringMetal = material('#8095a8', 0.75, 0.32),
          housing = material('#314958', 0.5, 0.42),
          black = material('#18303a', 0.3, 0.5);
        const extrude = (
          shape: THREE.Shape,
          parent: THREE.Object3D,
          mat: THREE.Material,
          depth: number,
          z: number,
        ) => {
          const m = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 96 }),
            mat,
          );
          m.position.z = z;
          m.castShadow = true;
          m.receiveShadow = true;
          parent.add(m);
          return m;
        };
        const annulus = (
          parent: THREE.Object3D,
          outer: number,
          inner: number,
          depth: number,
          z: number,
          mat: THREE.Material,
        ) => {
          const s = new THREE.Shape();
          s.absarc(0, 0, outer, 0, TAU, false);
          const hole = new THREE.Path();
          hole.absarc(0, 0, inner, 0, TAU, true);
          s.holes.push(hole);
          return extrude(s, parent, mat, depth, z);
        };
        const toothed = (
          points: Point2[],
          parent: THREE.Object3D,
          mat: THREE.Material,
          holeRadius: number,
        ) => {
          const shape = new THREE.Shape();
          points.forEach((v, i) => (i ? shape.lineTo(v.x, v.y) : shape.moveTo(v.x, v.y)));
          shape.closePath();
          const hole = new THREE.Path();
          hole.absarc(0, 0, holeRadius, 0, TAU, true);
          shape.holes.push(hole);
          return extrude(shape, parent, mat, 0.24, -0.12);
        };
        box(root, [4.3, 0.15, 2.25], [0, -1.77, -0.25], housing, 0.075);
        for (const x of [-1.7, 1.7])
          for (const z of [-1, 0.5]) screw(root, [x, -1.685, z], steel, 0.045);
        annulus(root, 1.72, 1.63, 0.34, -0.2, housing);
        // Saddle tops follow the stationary race, clearing the rotating ring bore.
        for (const x of [-0.95, 0.95]) {
          const foot = new THREE.Shape(),
            left = x - 0.175,
            right = x + 0.175;
          foot.moveTo(left, -1.78);
          foot.lineTo(right, -1.78);
          for (let i = 0; i <= 24; i++) {
            const px = right - ((right - left) * i) / 24;
            foot.lineTo(px, -Math.sqrt(1.7 ** 2 - px ** 2));
          }
          foot.closePath();
          extrude(foot, root, housing, 0.38, -0.23);
        }
        for (let i = 0; i < 8; i++) {
          const a = (i * TAU) / 8,
            m = roller(
              root,
              0.035,
              0.045,
              [Math.cos(a) * 1.675, Math.sin(a) * 1.675, 0.165],
              steel,
            );
          const slot = box(m, [0.04, 0.006, 0.008], [0, 0, 0.024], black, 0);
          slot.rotation.z = a;
        }
        const ringGroup = new THREE.Group();
        root.add(ringGroup);
        const ringShape = new THREE.Shape();
        ringShape.absarc(0, 0, 1.55, 0, TAU, false);
        const ringHole = new THREE.Path();
        [...outlines.ring]
          .reverse()
          .forEach((v, i) => (i ? ringHole.lineTo(v.x, v.y) : ringHole.moveTo(v.x, v.y)));
        ringHole.closePath();
        ringShape.holes.push(ringHole);
        extrude(ringShape, ringGroup, ringMetal, 0.24, -0.12);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.525, 0.018, 10, 128), steel);
        rim.position.z = 0.127;
        ringGroup.add(rim);
        const ringMark = box(ringGroup, [0.075, 0.025, 0.01], [1.47, 0, 0.13], brass, 0.004);
        const balls = Array.from({ length: 36 }, () => {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), steel);
          root.add(ball);
          return ball;
        });
        const carrier = new THREE.Group();
        root.add(carrier);
        annulus(carrier, 0.25, 0.14, 0.14, -0.39, teal);
        annulus(carrier, 0.21, 0.135, 1.1, -1.35, teal);
        const orbit = ((p.sun + p.planet) * p.module) / 2;
        const planets = Array.from({ length: 3 }, (_, i) => {
          const a = (i * TAU) / 3,
            x = Math.cos(a) * orbit,
            y = Math.sin(a) * orbit;
          const centerRadius = (orbit + 0.18) / 2;
          const arm = box(
            carrier,
            [orbit - 0.18, 0.14, 0.12],
            [Math.cos(a) * centerRadius, Math.sin(a) * centerRadius, -0.33],
            teal,
            0.05,
          );
          arm.rotation.z = a;
          const bearing = annulus(carrier, 0.16, 0.095, 0.13, -0.395, steel);
          bearing.position.x = x;
          bearing.position.y = y;
          roller(carrier, 0.087, 0.89, [x, y, -0.14], steel);
          const body = new THREE.Group();
          root.add(body);
          toothed(outlines.planet, body, i === 0 ? teal : steel, 0.095);
          const cap = annulus(body, 0.145, 0.098, 0.025, 0.124, brass);
          const mark = box(
            body,
            [0.1, 0.035, 0.012],
            [0.25, 0, 0.137],
            i === 0 ? brass : black,
            0.01,
          );
          return { body, cap, mark };
        });
        const sun = new THREE.Group();
        root.add(sun);
        toothed(outlines.sun, sun, brass, 0.12);
        box(sun, [0.13, 0.04, 0.012], [0.32, 0, 0.139], material('#f4e5b4', 0.25, 0.4), 0.01);
        roller(root, 0.12, 2.8, [0, 0, 0], steel);
        const inputTip = roller(root, 0.165, 0.18, [0, 0, 1.32], brass);
        box(inputTip, [0.2, 0.025, 0.018], [0, 0, 0.1], black, 0.005);
        // Coaxial sun shaft passes through the hollow carrier output and its rear journal.
        annulus(root, 0.29, 0.215, 0.3, -1.39, housing);
        box(root, [0.4, 1.48, 0.35], [0, -0.96, -1.25], housing, 0.065);
        const fixedMark = new THREE.Mesh(
          new THREE.TorusGeometry(1.61, 0.008, 8, 128),
          new THREE.MeshBasicMaterial({ color: '#d5b676', transparent: true, opacity: 0.75 }),
        );
        fixedMark.position.z = 0.18;
        root.add(fixedMark);
        root.updateWorldMatrix(true, true);
        const assemblyBounds = new THREE.Box3().setFromObject(root),
          desired = new THREE.Vector3();
        // Include the full axial assembly travel before playback. No crop while parts return.
        for (const [object, travel] of [
          [ringGroup, -0.55],
          [carrier, -0.9],
          [sun, 1.1],
          ...planets.map(({ body }) => [body, 0.4]),
        ] as [THREE.Object3D, number][]) {
          assemblyBounds.union(
            new THREE.Box3().setFromObject(object).translate(new THREE.Vector3(0, 0, travel)),
          );
        }
        return {
          update() {
            const { angle: a, mode: m, assembly: split, demo: d } = current.current,
              state = planetaryState(a, m);
            sun.rotation.z = state.sun;
            sun.position.z = split * 1.1;
            ringGroup.rotation.z = state.ring;
            ringGroup.position.z = -split * 0.55;
            carrier.rotation.z = state.carrier;
            carrier.position.z = -split * 0.9;
            inputTip.rotation.z = state.sun;
            planets.forEach(({ body }, i) => {
              const v = state.planets[i];
              body.position.set(v.x, v.y, split * 0.4);
              body.rotation.z = v.angle;
            });
            balls.forEach((ball, i) => {
              const a = (i * TAU) / balls.length + (state.ring * 1.55) / (1.55 + 1.63);
              ball.position.set(1.59 * Math.cos(a), 1.59 * Math.sin(a), 0);
              ball.visible = split < 0.01;
            });
            fixedMark.visible = m === 'ring-fixed' && split < 0.01;
            ringMark.visible = true;
            if (d.watch) {
              // Smooth directional changes are followed by an exact perspective fit,
              // so even the intermediate orbit keeps the near base corners in frame.
              const frontal = [1, 2, 5, 6, 7].includes(d.chapter),
                p = d.chapterProgress,
                q = THREE.MathUtils.smoothstep(p, 0, 0.25),
                previousFrontal = [1, 2, 5, 6, 7].includes(d.chapter - 1),
                frontalMix = THREE.MathUtils.lerp(previousFrontal ? 1 : 0, frontal ? 1 : 0, q);
              desired.set(
                THREE.MathUtils.lerp(4.8, 0.7, frontalMix),
                THREE.MathUtils.lerp(2.35, 0.85, frontalMix),
                8,
              );
              const frame = fitPlanetaryCamera(assemblyBounds, camera.aspect, desired, camera.fov);
              controls.target.copy(frame.target);
              camera.position.copy(frame.position);
            }
          },
        };
      }}
    />
  );
}
