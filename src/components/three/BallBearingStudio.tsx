import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  BEARING as B,
  BEARING_TAU as TAU,
  bearingRaceProfile,
  bearingPocketPoint,
  type BearingState,
  type BearingShot,
} from '../../models/ball-bearing';
import { useShowcase } from '../lab/Showcase';
import BallBearingDiagram from '../lab/BallBearingDiagram';
import Studio from './Studio';
import { box, material, roller, screw } from './parts';

/** Crown-cage fingers are spherical shells, with a real clearance to the ball. */
function pocketGeometry(side: number) {
  const vertices: number[] = [],
    indices: number[] = [],
    rows = 32,
    cols = 18;
  for (const outside of [false, true])
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const p = bearingPocketPoint(
          0.92 + ((Math.PI - 0.92) * i) / rows,
          ((55 + (70 * j) / cols) * Math.PI) / 180 + side,
          outside,
        );
        vertices.push(p.x, p.y, p.z);
      }
  const layer = (rows + 1) * (cols + 1);
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, d, b, c, d);
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j,
        b = a + 1,
        d = a + cols + 1,
        c = d + 1;
      quad(a, d, c, b);
      quad(a + layer, b + layer, c + layer, d + layer);
    }
  for (let i = 0; i < rows; i++)
    for (const j of [0, cols]) {
      const a = i * (cols + 1) + j,
        b = a + cols + 1;
      quad(a, b, b + layer, a + layer);
    }
  for (let j = 0; j < cols; j++)
    for (const i of [0, rows]) {
      const a = i * (cols + 1) + j,
        b = a + 1;
      quad(a, b, b + layer, a + layer);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function BallBearingStudio({
  state,
  shot,
}: {
  state: BearingState;
  shot: BearingShot;
}) {
  const demo = useShowcase(),
    current = useRef({ state, shot, demo });
  current.current = { state, shot, demo };
  return (
    <Studio
      dark
      className="bb-studio"
      cameraPosition={[3.7, 4.4, 11]}
      target={[0, 2.82, 0]}
      span={6.45}
      fitHeight={6.5}
      label={t('滚珠轴承剖视：轴、内外圈、球面保持架兜孔和固定支座')}
      fallback={<BallBearingDiagram state={state} loadVisible={shot.load > 0} />}
      create={({ root, camera, controls }) => {
        root.position.y = 2.82;
        controls.minPolarAngle = 0.3;
        controls.maxPolarAngle = Math.PI * 0.72;
        const steel = material('#aebec6', 0.93, 0.23),
          raceSteel = material('#839ba7', 0.9, 0.2),
          brass = material('#b89a61', 0.8, 0.29),
          housing = material('#284650', 0.65, 0.38),
          dark = material('#152b33', 0.55, 0.42),
          gold = material('#efc986', 0.78, 0.21);
        brass.side = THREE.DoubleSide;
        brass.transparent = true;
        // Interference-fit seats coincide physically; depth bias prevents coplanar surface striping.
        raceSteel.polygonOffset = true;
        raceSteel.polygonOffsetFactor = -1;
        raceSteel.polygonOffsetUnits = -1;
        const add = (
          parent: THREE.Object3D,
          geometry: THREE.BufferGeometry,
          mat: THREE.Material,
        ) => {
          const mesh = new THREE.Mesh(geometry, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const annulus = (
          parent: THREE.Object3D,
          outer: number,
          inner: number,
          depth: number,
          z: number,
          mat: THREE.Material,
        ) => {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, outer, 0, TAU, false);
          const hole = new THREE.Path();
          hole.absarc(0, 0, inner, 0, TAU, true);
          shape.holes.push(hole);
          const mesh = add(
            parent,
            new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 100 }),
            mat,
          );
          mesh.position.z = z;
          return mesh;
        };
        // Both ring seats share the bearing OD/bore exactly. The shaft shoulder is behind the inner ring.
        annulus(root, B.housingOutside, B.outside, 1.1, -0.58, housing);
        annulus(root, B.housingOutside + 0.035, B.outside + 0.015, 0.08, -0.62, dark);
        const shaft = new THREE.Group();
        root.add(shaft);
        roller(shaft, B.bore, 2.25, [0, 0, -0.45], steel);
        roller(shaft, B.bore + 0.11, 0.13, [0, 0, -0.585], raceSteel);
        annulus(shaft, B.bore + 0.11, B.bore, 0.08, 0.52, steel);
        box(shaft, [0.11, 0.3, 0.01], [0, 0.52, 0.681], gold, 0.015);
        for (const x of [-1.75, 1.75]) {
          const foot = new THREE.Shape(),
            left = x - 0.22,
            right = x + 0.22;
          foot.moveTo(left, -2.7);
          foot.lineTo(right, -2.7);
          for (let j = 0; j <= 32; j++) {
            const px = right - ((right - left) * j) / 32;
            foot.lineTo(px, -Math.sqrt(B.housingOutside ** 2 - px ** 2) + 0.01);
          }
          foot.closePath();
          const leg = add(
            root,
            new THREE.ExtrudeGeometry(foot, { depth: 0.68, bevelEnabled: false }),
            housing,
          );
          leg.position.z = -0.4;
        }
        box(root, [5.8, 0.16, 1.8], [0, -2.72, -0.12], housing, 0.07);
        for (const x of [-2.4, 2.4])
          for (const z of [-0.68, 0.48]) screw(root, [x, -2.63, z], steel, 0.09);
        for (let i = 0; i < 8; i++) {
          const a = (i * TAU) / 8,
            bolt = roller(root, 0.06, 0.06, [2.59 * Math.cos(a), 2.59 * Math.sin(a), 0.55], steel);
          box(bolt, [0.07, 0.012, 0.012], [0, 0, 0.035], dark, 0.002);
        }
        const frontMaterials: THREE.MeshStandardMaterial[] = [];
        const frontMeshes: THREE.Mesh[] = [];
        for (const which of ['inner', 'outer'] as const)
          for (const front of [false, true]) {
            const profile = bearingRaceProfile(which, front).map(
              (p) => new THREE.Vector2(p.r, p.z),
            );
            // A full rear half retains the actual race contacts; a fixed inspection window fades in front.
            const pieces = front
              ? [
                  [0, Math.PI * 0.1],
                  [Math.PI * 0.1, Math.PI * 0.65],
                  [Math.PI * 0.75, Math.PI * 1.25],
                ]
              : [[0, TAU]];
            pieces.forEach(([start, length], i) => {
              const mat = i === 1 && front ? raceSteel.clone() : raceSteel;
              if (i === 1 && front) {
                mat.transparent = true;
                frontMaterials.push(mat);
              }
              const lathe = new THREE.LatheGeometry(
                profile,
                Math.max(24, Math.round((160 * length) / TAU)),
                start,
                length,
              );
              // Lathe's axis is y; this maps (r cos φ, z, r sin φ) into the bearing's xy plane.
              lathe.rotateX(Math.PI / 2);
              const raceMesh = add(root, lathe, mat);
              if (i === 1 && front) frontMeshes.push(raceMesh);
              if (front) {
                // Flush radial cut faces close each lathed inspection segment.
                for (const a of [start, start + length]) {
                  const v: number[] = [],
                    idx: number[] = [];
                  const section = bearingRaceProfile(which, true);
                  const points = section.slice(0, -1).map((p) => new THREE.Vector2(p.r, p.z));
                  const tris = THREE.ShapeUtils.triangulateShape(points, []);
                  points.forEach((p) => v.push(p.x * Math.sin(a), -p.x * Math.cos(a), p.y));
                  tris.forEach((tri) => idx.push(...tri));
                  const g = new THREE.BufferGeometry();
                  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
                  g.setIndex(idx);
                  g.computeVertexNormals();
                  const cutMat = mat.clone();
                  cutMat.side = THREE.DoubleSide;
                  if (i === 1) frontMaterials.push(cutMat);
                  const faceMesh = add(root, g, cutMat);
                  if (i === 1) frontMeshes.push(faceMesh);
                }
              }
            });
          }
        // Ring markings rotate with the shaft without rotating the stationary inspection plane.
        const ringMark = new THREE.Group();
        root.add(ringMark);
        box(ringMark, [0.12, 0.038, 0.012], [1.2, 0, 0.527], gold, 0.006);
        for (let i = 0; i < 36; i++) {
          const a = (i * TAU) / 36,
            tick = box(
              ringMark,
              [0.035, 0.005, 0.006],
              [1.23 * Math.cos(a), 1.23 * Math.sin(a), 0.527],
              dark,
              0.001,
            );
          tick.rotation.z = a;
        }
        const cage = new THREE.Group();
        root.add(cage);
        annulus(cage, B.pitch + 0.11, B.pitch - 0.11, 0.05, B.cageBack - 0.025, brass);
        const pockets = [pocketGeometry(0), pocketGeometry(Math.PI)];
        for (let i = 0; i < B.count; i++) {
          const a = -Math.PI / 2 + (i * TAU) / B.count,
            pocket = new THREE.Group();
          pocket.position.set(B.pitch * Math.cos(a), B.pitch * Math.sin(a), 0);
          pocket.rotation.z = a;
          cage.add(pocket);
          pockets.forEach((g) => add(pocket, g, brass));
        }
        const ballGeometry = new THREE.SphereGeometry(B.ball, 40, 28);
        const balls = Array.from({ length: B.count }, (_, i) => {
          const body = new THREE.Group();
          root.add(body);
          add(body, ballGeometry, i ? steel : gold);
          // Physical paint marks sit on the sphere; their world rotation is the derived spin, not cage-relative spin.
          if (i === 0)
            for (const a of [0, Math.PI]) {
              const mark = add(body, new THREE.SphereGeometry(0.036, 16, 12), dark);
              mark.position.set(
                B.ball * 0.79 * Math.cos(a),
                B.ball * 0.79 * Math.sin(a),
                B.ball * 0.6,
              );
            }
          return body;
        });
        const contactMaterial = new THREE.MeshBasicMaterial({
          color: '#edb567',
          transparent: true,
          depthTest: false,
        });
        const contacts = Array.from({ length: B.count }, () => {
          const inner = add(root, new THREE.SphereGeometry(0.025, 12, 10), contactMaterial.clone());
          const outer = add(root, new THREE.SphereGeometry(0.025, 12, 10), contactMaterial.clone());
          inner.renderOrder = 3;
          outer.renderOrder = 3;
          return { inner, outer };
        });
        const desired = new THREE.Vector3(),
          target = new THREE.Vector3();
        return {
          update() {
            const { state: s, shot: sh, demo: d } = current.current;
            shaft.rotation.z = s.innerAngle;
            ringMark.rotation.z = s.innerAngle;
            cage.rotation.z = s.cageAngle;
            brass.opacity = sh.cageOpacity;
            brass.depthWrite = brass.opacity > 0.98;
            frontMaterials.forEach((m) => {
              m.opacity = 1 - sh.cutaway;
              m.depthWrite = m.opacity > 0.98;
            });
            frontMeshes.forEach((mesh) => {
              mesh.visible = sh.cutaway < 0.9999;
              mesh.castShadow = sh.cutaway < 0.01;
            });
            ringMark.children.forEach((mark) => {
              const a = Math.atan2(
                Math.sin(Math.atan2(mark.position.y, mark.position.x) + s.innerAngle),
                Math.cos(Math.atan2(mark.position.y, mark.position.x) + s.innerAngle),
              );
              mark.visible = !(sh.cutaway > 0.98 && a > -Math.PI * 0.4 && a < Math.PI * 0.25);
            });
            s.balls.forEach((ball, i) => {
              balls[i].position.set(ball.x, ball.y, 0);
              balls[i].rotation.z = ball.spin;
              const pair = contacts[i];
              for (const side of ['inner', 'outer'] as const) {
                const p = side === 'inner' ? ball.innerContact : ball.outerContact;
                pair[side].position.set(p.x, p.y, 0);
                pair[side].visible = sh.load > 0 && ball.loadWeight > 0.01;
                (pair[side].material as THREE.MeshBasicMaterial).opacity = ball.loadWeight;
              }
            });
            if (d.watch) {
              // Camera is a direct function of chapter state, so paused seeking settles immediately.
              const p = sh.progress,
                ease = p * p * (3 - 2 * p);
              const opening = sh.chapter === 0 ? 1 - ease : sh.chapter === 7 ? ease : 0;
              const sweep = Math.sin(Math.PI * p) ** 2 * 0.12;
              target.set(0, 2.82, 0);
              controls.target.copy(target);
              const height = Math.max(6.1 / camera.aspect, 6.4),
                distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
              desired.set(0.65 + opening * 2.85 + sweep, 1 + opening * 0.8, 11).normalize();
              camera.position.copy(target).addScaledVector(desired, distance);
            }
          },
          dispose() {
            contactMaterial.dispose();
          },
        };
      }}
    />
  );
}
