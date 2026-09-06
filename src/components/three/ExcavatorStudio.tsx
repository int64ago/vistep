import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, material, roller } from './parts';
import {
  BUCKET,
  EXCAVATOR,
  boomOutline,
  excavatorPose,
  stickOutline,
  type Cylinder,
  type ExcavatorPose,
  type Pose,
  type Valve,
  type View,
  type XY,
} from '../../models/excavator';
import ExcavatorDrawing from '../lab/ExcavatorDrawing';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';

/** Everything the renderer needs, derived by the experiment from one model state. */
export type ExcavatorVisual = {
  pose: Pose;
  payload: number;
  flow: number;
  valve: Valve;
  relief: boolean;
  /** Cap-end pressure as a fraction of the relief setting. */
  pressure: number;
  /** Piston force in newtons, for the force arrow. */
  force: number;
  view: View;
  cutaway: number;
  lever: boolean;
  forceArrow: boolean;
  rock: boolean;
  labels: string[];
};
type Props = { visual: ExcavatorVisual; labelHost: React.RefObject<HTMLDivElement | null> };

const BOOM_Z = -0.25;
const v3 = (p: XY, z = 0) => new THREE.Vector3(p.x, p.y, z);
const shapeOf = (points: readonly XY[]) => {
  const shape = new THREE.Shape(points.map(({ x, y }) => new THREE.Vector2(x, y)));
  shape.closePath();
  return shape;
};
const extrude = (
  points: readonly XY[],
  depth: number,
  mat: THREE.Material,
  bevel = 0.02,
  z = -depth / 2,
) => {
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shapeOf(points), {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      steps: 1,
    }),
    mat,
  );
  mesh.position.z = z;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
/** A cylinder along local +x from 0 to `length`. */
const rod = (radius: number, length: number, mat: THREE.Material, segments = 32) => {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(length / 2, 0, 0);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
/** A pin boss whose axis is z. */
const boss = (
  parent: THREE.Object3D,
  radius: number,
  length: number,
  at: XY,
  z: number,
  mat: THREE.Material,
) => roller(parent, radius, length, [at.x, at.y, z], mat);

export default function ExcavatorStudio({ visual, labelHost }: Props) {
  const film = useShowcase();
  const live = useRef({ visual, watch: film.watch });
  live.current = { visual, watch: film.watch };
  return (
    <Studio
      label={t('液压挖掘机：动臂、斗杆、铲斗、油缸与连杆')}
      cameraPosition={[9.5, 6, 13]}
      target={[2.6, 2.3, 0]}
      span={13.2}
      fitHeight={7.4}
      exposure={1.02}
      fallback={<ExcavatorDrawing visual={visual} />}
      create={({ root, camera, controls, reducedMotion }) => {
        const E = EXCAVATOR;
        const paint = material('#d9952c', 0.18, 0.5),
          paintDeep = material('#b97a22', 0.18, 0.55),
          chassis = material('#3a4043', 0.45, 0.6),
          steel = material('#4c565c', 0.55, 0.42),
          chrome = material('#d3d9db', 0.92, 0.18),
          pin = material('#7f8b91', 0.7, 0.35),
          rubber = material('#2b2e31', 0.1, 0.85),
          glass = new THREE.MeshPhysicalMaterial({
            color: '#9fc1c9',
            metalness: 0,
            roughness: 0.12,
            transmission: 0.55,
            transparent: true,
            opacity: 0.85,
          }),
          soil = material('#8a6b48', 0, 0.95),
          rockMat = material('#66625b', 0.05, 0.92),
          accent = material('#d8742f', 0.1, 0.5);

        // ---------------------------------------------------------------- undercarriage
        const under = new THREE.Group();
        root.add(under);
        const shoeGeometry = new THREE.BoxGeometry(0.2, 0.06, 0.64);
        const grouserGeometry = new THREE.BoxGeometry(0.04, 0.05, 0.64);
        const loop = { half: 1.72, r: 0.46, y: 0.46 };
        const perimeter = 4 * loop.half + 2 * Math.PI * loop.r,
          shoeCount = Math.round(perimeter / 0.22);
        const shoes = new THREE.InstancedMesh(shoeGeometry, chassis, shoeCount * 2),
          grousers = new THREE.InstancedMesh(grouserGeometry, steel, shoeCount * 2);
        shoes.castShadow = grousers.castShadow = true;
        shoes.receiveShadow = true;
        under.add(shoes, grousers);
        const dummy = new THREE.Object3D();
        const sample = (s: number) => {
          // Stadium loop: bottom run, front idler, top run, rear sprocket.
          const L = 2 * loop.half;
          if (s < L) return { x: -loop.half + s, y: loop.y - loop.r, a: 0 };
          s -= L;
          const arc = Math.PI * loop.r;
          if (s < arc) {
            const th = -Math.PI / 2 + (s / arc) * Math.PI;
            return {
              x: loop.half + Math.cos(th) * loop.r,
              y: loop.y + Math.sin(th) * loop.r,
              a: th + Math.PI / 2,
            };
          }
          s -= arc;
          if (s < L) return { x: loop.half - s, y: loop.y + loop.r, a: Math.PI };
          s -= L;
          const th = Math.PI / 2 + (s / arc) * Math.PI;
          return {
            x: -loop.half + Math.cos(th) * loop.r,
            y: loop.y + Math.sin(th) * loop.r,
            a: th + Math.PI / 2,
          };
        };
        [-1.12, 1.12].forEach((z, side) => {
          for (let i = 0; i < shoeCount; i++) {
            const p = sample((perimeter * i) / shoeCount);
            dummy.position.set(p.x, p.y, z);
            dummy.rotation.set(0, 0, p.a);
            dummy.updateMatrix();
            shoes.setMatrixAt(side * shoeCount + i, dummy.matrix);
            dummy.position.set(p.x, p.y, z);
            dummy.translateY(0.05);
            dummy.updateMatrix();
            grousers.setMatrixAt(side * shoeCount + i, dummy.matrix);
          }
          box(under, [3.3, 0.42, 0.42], [0, 0.48, z], steel, 0.05);
          roller(under, 0.36, 0.34, [loop.half, loop.y, z], pin);
          roller(under, 0.36, 0.34, [-loop.half, loop.y, z], pin);
          for (let i = 0; i < 5; i++) roller(under, 0.14, 0.5, [-1.2 + i * 0.6, 0.15, z], pin);
          roller(under, 0.12, 0.4, [0.1, 0.8, z], pin);
        });
        box(under, [1.8, 0.5, 2.0], [0, 0.72, 0], chassis, 0.06);
        roller(under, 0.78, 0.16, [0, 1.02, 0], steel).rotation.x = Math.PI / 2;

        // ---------------------------------------------------------------- upper structure
        const house = new THREE.Group();
        root.add(house);
        box(house, [4.0, 0.22, 2.6], [-0.75, 1.19, 0], paintDeep, 0.04);
        box(house, [0.85, 1.05, 2.55], [-2.55, 1.77, 0], paintDeep, 0.16);
        box(house, [1.6, 0.92, 2.35], [-1.3, 1.72, 0], paint, 0.1);
        for (let i = 0; i < 6; i++)
          box(house, [0.02, 0.48, 0.06], [-1.75 + i * 0.16, 1.85, 1.18], chassis, 0);
        roller(house, 0.07, 0.5, [-1.75, 2.35, 0.75], chassis).rotation.x = Math.PI / 2;
        // Cab: pillars, panels and glass.
        const cab = new THREE.Group();
        cab.position.set(0.25, 1.3, 0.72);
        house.add(cab);
        box(cab, [1.25, 0.12, 1.02], [0, 0.06, 0], paint, 0.03);
        box(cab, [1.25, 0.1, 1.02], [0, 1.72, 0], paint, 0.04);
        for (const [x, z] of [
          [-0.58, -0.47],
          [0.58, -0.47],
          [-0.58, 0.47],
          [0.58, 0.47],
        ])
          box(cab, [0.09, 1.6, 0.08], [x, 0.9, z], chassis, 0.02);
        box(cab, [1.1, 0.5, 0.96], [0, 0.36, 0], paint, 0.02);
        const pane = (size: number[], at: number[]) => {
          const m = box(cab, size, at, glass, 0);
          m.castShadow = false;
          return m;
        };
        pane([0.03, 1.05, 0.9], [0.6, 1.14, 0]);
        pane([1.1, 1.05, 0.03], [0, 1.14, 0.49]);
        pane([1.1, 1.05, 0.03], [0, 1.14, -0.49]);
        pane([0.03, 1.05, 0.9], [-0.6, 1.14, 0]);
        // Boom foot bracket and boom cylinder base brackets.
        for (const dz of [-0.31, 0.31])
          house.add(
            extrude(
              [
                { x: 0.15, y: 1.3 },
                { x: 0.95, y: 1.3 },
                { x: 0.95, y: 1.65 },
                { x: 0.78, y: 2.05 },
                { x: 0.3, y: 2.05 },
                { x: 0.15, y: 1.8 },
              ],
              0.08,
              paintDeep,
              0.01,
              BOOM_Z + dz - 0.04,
            ),
          );
        box(house, [0.5, 0.26, 1.7], [1.25, 0.98, BOOM_Z], paintDeep, 0.05);
        for (const side of [-1, 1]) {
          const z = BOOM_Z + side * E.boomCylinderOffset;
          for (const dz of [-0.13, 0.13])
            house.add(
              extrude(
                [
                  { x: 1.05, y: 0.86 },
                  { x: 1.82, y: 0.86 },
                  { x: 1.82, y: 1.0 },
                  { x: 1.72, y: 1.14 },
                  { x: 1.48, y: 1.14 },
                  { x: 1.05, y: 1.1 },
                ],
                0.07,
                paintDeep,
                0.01,
                z + dz - 0.035,
              ),
            );
          boss(house, 0.075, 0.36, E.boomCylinderBase, z, pin);
        }
        boss(house, 0.14, 0.9, E.foot, BOOM_Z, pin);
        // Hydraulic manifold at the front of the platform, feeding the near cylinder.
        const manifold = box(
          house,
          [0.4, 0.28, 0.34],
          [0.95, 0.98, BOOM_Z + E.boomCylinderOffset + 0.2],
          steel,
          0.03,
        );
        const reliefBlock = box(
          house,
          [0.26, 0.18, 0.2],
          [0.6, 0.96, BOOM_Z + E.boomCylinderOffset + 0.26],
          accent,
          0.02,
        );
        reliefBlock.visible = false;

        // ---------------------------------------------------------------- boom
        const boomGroup = new THREE.Group();
        boomGroup.position.copy(v3(E.foot));
        root.add(boomGroup);
        boomGroup.add(extrude(boomOutline(), E.boomWidth, paint, 0.03, BOOM_Z - E.boomWidth / 2));
        boss(boomGroup, 0.2, 0.62, { x: 0, y: 0 }, BOOM_Z, paint);
        boss(boomGroup, 0.18, 0.62, { x: E.boomLength, y: 0 }, BOOM_Z, paint);
        for (const side of [-1, 1]) {
          const z = BOOM_Z + side * (E.boomWidth / 2 + 0.05);
          boomGroup.add(
            extrude(
              [
                { x: E.boomCylinderLug.x - 0.32, y: 0.3 },
                { x: E.boomCylinderLug.x + 0.32, y: 0.3 },
                { x: E.boomCylinderLug.x + 0.14, y: E.boomCylinderLug.y - 0.1 },
                { x: E.boomCylinderLug.x - 0.14, y: E.boomCylinderLug.y - 0.1 },
              ],
              0.08,
              paintDeep,
              0.01,
              z - 0.04,
            ),
          );
          boomGroup.add(
            extrude(
              [
                { x: E.stickCylinderBase.x - 0.3, y: E.stickCylinderBase.y - 0.32 },
                { x: E.stickCylinderBase.x + 0.3, y: E.stickCylinderBase.y - 0.32 },
                { x: E.stickCylinderBase.x + 0.12, y: E.stickCylinderBase.y + 0.1 },
                { x: E.stickCylinderBase.x - 0.12, y: E.stickCylinderBase.y + 0.1 },
              ],
              0.08,
              paintDeep,
              0.01,
              BOOM_Z + side * 0.14 - 0.04,
            ),
          );
        }
        boss(boomGroup, 0.075, 1.5, E.boomCylinderLug, BOOM_Z, pin);
        boss(boomGroup, 0.07, 0.4, E.stickCylinderBase, BOOM_Z, pin);
        // Pipes along the top of the boom toward the stick cylinder.
        const pipePath = new THREE.CatmullRomCurve3(
          [
            [0.5, 0.36],
            [1.4, 0.85],
            [2.7, 1.1],
            [3.3, 0.95],
          ].map(([x, y]) => new THREE.Vector3(x, y, BOOM_Z + 0.12)),
        );
        for (const dz of [-0.12, 0.12]) {
          const pipe = new THREE.Mesh(new THREE.TubeGeometry(pipePath, 24, 0.028, 8), steel);
          pipe.position.z = dz;
          pipe.castShadow = true;
          boomGroup.add(pipe);
        }

        // ---------------------------------------------------------------- stick
        const stickGroup = new THREE.Group();
        root.add(stickGroup);
        stickGroup.add(
          extrude(stickOutline(), E.stickWidth, paint, 0.03, BOOM_Z - E.stickWidth / 2),
        );
        boss(stickGroup, 0.17, 0.52, { x: 0, y: 0 }, BOOM_Z, paint);
        boss(stickGroup, 0.12, 0.54, { x: E.stickLength, y: 0 }, BOOM_Z, paint);
        boss(stickGroup, 0.07, 1.16, E.rockerPin, BOOM_Z, pin);
        boss(stickGroup, 0.07, 0.5, E.stickCylinderEye, BOOM_Z, pin);
        for (const side of [-1, 1])
          stickGroup.add(
            extrude(
              [
                { x: E.bucketCylinderBase.x - 0.28, y: 0.2 },
                { x: E.bucketCylinderBase.x + 0.28, y: 0.2 },
                { x: E.bucketCylinderBase.x + 0.1, y: E.bucketCylinderBase.y + 0.08 },
                { x: E.bucketCylinderBase.x - 0.1, y: E.bucketCylinderBase.y + 0.08 },
              ],
              0.07,
              paintDeep,
              0.01,
              BOOM_Z + side * 0.13 - 0.035,
            ),
          );
        boss(stickGroup, 0.065, 0.36, E.bucketCylinderBase, BOOM_Z, pin);

        // ---------------------------------------------------------------- bucket
        const bucketGroup = new THREE.Group();
        root.add(bucketGroup);
        const W = E.bucketWidth;
        for (const z of [-W / 2, W / 2 - 0.05])
          bucketGroup.add(extrude(BUCKET.side, 0.05, paintDeep, 0.01, BOOM_Z + z));
        // Curved back plate: offset the shared back curve inward by the plate thickness.
        const back = BUCKET.back,
          inner: XY[] = [];
        for (let i = 0; i < back.length; i++) {
          const a = back[Math.max(0, i - 1)],
            b = back[Math.min(back.length - 1, i + 1)];
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          inner.push({
            x: back[i].x - ((b.y - a.y) / len) * 0.05,
            y: back[i].y + ((b.x - a.x) / len) * 0.05,
          });
        }
        bucketGroup.add(
          extrude([...back, ...inner.reverse()], W - 0.1, paint, 0.005, BOOM_Z - W / 2 + 0.05),
        );
        // Cutting edge and teeth.
        const lip = extrude(
          [
            BUCKET.edge.b,
            BUCKET.edge.a,
            { x: BUCKET.edge.a.x + 0.05, y: BUCKET.edge.a.y + 0.03 },
            { x: BUCKET.edge.b.x + 0.05, y: BUCKET.edge.b.y + 0.03 },
          ],
          W,
          steel,
          0.008,
          BOOM_Z - W / 2,
        );
        bucketGroup.add(lip);
        for (let i = 0; i < 4; i++)
          bucketGroup.add(
            extrude(BUCKET.tooth, 0.09, steel, 0.008, BOOM_Z - W / 2 + 0.09 + i * 0.245),
          );
        for (const z of [-0.2, 0.15])
          bucketGroup.add(extrude(BUCKET.lugs, 0.05, paintDeep, 0.01, BOOM_Z + z));
        boss(bucketGroup, 0.09, 0.5, { x: 0, y: 0 }, BOOM_Z, pin);
        boss(bucketGroup, 0.06, 0.5, E.bucketLug, BOOM_Z, pin);
        const fill = extrude(BUCKET.fill, W - 0.14, soil, 0, BOOM_Z - W / 2 + 0.07);
        fill.castShadow = false;
        bucketGroup.add(fill);

        // ---------------------------------------------------------------- linkage
        const rocker = [rod(0.05, 1, steel), rod(0.05, 1, steel)],
          link = [rod(0.04, 1, steel), rod(0.04, 1, steel)];
        rocker.forEach((m, i) => {
          m.position.z = BOOM_Z + (i ? 0.31 : -0.31);
          root.add(m);
        });
        link.forEach((m, i) => {
          m.position.z = BOOM_Z + (i ? 0.31 : -0.31);
          root.add(m);
        });
        const jointPin = roller(root, 0.06, 0.78, [0, 0, BOOM_Z], pin);

        // ---------------------------------------------------------------- cylinders
        const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
        const barrelSection = material('#4c565c', 0.55, 0.42) as THREE.MeshStandardMaterial;
        barrelSection.side = THREE.DoubleSide;
        barrelSection.clippingPlanes = [clipPlane];
        const capOil = new THREE.MeshStandardMaterial({
          color: '#d98a3a',
          emissive: '#c25a12',
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.72,
          roughness: 0.4,
          side: THREE.DoubleSide,
          clippingPlanes: [clipPlane],
        });
        const rodOil = new THREE.MeshStandardMaterial({
          color: '#9fbfcb',
          transparent: true,
          opacity: 0.45,
          roughness: 0.4,
          side: THREE.DoubleSide,
          clippingPlanes: [clipPlane],
        });
        type CylinderMesh = ReturnType<typeof buildCylinder>;
        function buildCylinder(spec: Cylinder['spec'], z: number, sectioned = false) {
          const g = new THREE.Group();
          g.position.z = z;
          root.add(g);
          const wall = spec.bore / 2 + 0.03;
          const barrel = rod(wall, spec.barrel - 0.1, sectioned ? barrelSection : steel, 40);
          barrel.position.x = 0.1;
          const gland = rod(wall + 0.012, 0.16, sectioned ? barrelSection : steel, 40);
          gland.position.x = spec.barrel - 0.06;
          const base = rod(wall - 0.01, 0.12, steel, 24);
          const eye = roller(g, 0.11, 0.24, [0, 0, 0], steel),
            rodEye = roller(g, 0.1, 0.22, [0, 0, 0], steel);
          const piston = rod(spec.bore / 2 - 0.004, 0.12, material('#2f363a', 0.5, 0.5), 32);
          const shaft = rod(spec.rod / 2, 1, chrome, 28);
          const cap = rod(spec.bore / 2 - 0.006, 1, capOil, 32),
            ring = rod(spec.bore / 2 - 0.006, 1, rodOil, 32);
          cap.castShadow = ring.castShadow = false;
          // Port block at the cap end and a rod-end line along the barrel.
          const port = box(g, [0.16, 0.1, 0.14], [0.28, wall + 0.03, 0], steel, 0.01);
          const line = rod(0.024, spec.barrel - 0.55, steel, 10);
          line.position.set(0.36, wall + 0.06, 0);
          const lineEnd = box(
            g,
            [0.12, 0.08, 0.1],
            [spec.barrel - 0.2, wall + 0.04, 0],
            steel,
            0.01,
          );
          g.add(barrel, gland, base, piston, shaft, cap, ring, line);
          void port;
          void lineEnd;
          return { g, eye, rodEye, piston, shaft, cap, ring, barrel, sectioned };
        }
        const cylinders: Record<'boomNear' | 'boomFar' | 'stick' | 'bucket', CylinderMesh> = {
          boomNear: buildCylinder(E.cylinders.boom, BOOM_Z + E.boomCylinderOffset, true),
          boomFar: buildCylinder(E.cylinders.boom, BOOM_Z - E.boomCylinderOffset),
          stick: buildCylinder(E.cylinders.stick, BOOM_Z),
          bucket: buildCylinder(E.cylinders.bucket, BOOM_Z),
        };
        // Hoses from the manifold to the near cylinder's ports, rebuilt as the boom moves.
        const hoseSupply = new THREE.Mesh(new THREE.BufferGeometry(), rubber),
          hoseReturn = new THREE.Mesh(new THREE.BufferGeometry(), rubber);
        hoseSupply.castShadow = hoseReturn.castShadow = true;
        root.add(hoseSupply, hoseReturn);
        const pelletGeometry = new THREE.SphereGeometry(0.042, 10, 10);
        const oilPellet = new THREE.MeshStandardMaterial({
          color: '#e0842f',
          emissive: '#b84d0c',
          emissiveIntensity: 0.6,
          roughness: 0.35,
        });
        const pelletSupply = new THREE.InstancedMesh(pelletGeometry, oilPellet, 14),
          pelletReturn = new THREE.InstancedMesh(pelletGeometry, material('#6fa2b5', 0.1, 0.5), 10),
          pelletRelief = new THREE.InstancedMesh(pelletGeometry, oilPellet, 10);
        for (const m of [pelletSupply, pelletReturn, pelletRelief]) {
          m.frustumCulled = false;
          m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          root.add(m);
        }
        const hidePellets = (m: THREE.InstancedMesh) => {
          dummy.position.set(0, -50, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          for (let i = 0; i < m.count; i++) m.setMatrixAt(i, dummy.matrix);
          m.instanceMatrix.needsUpdate = true;
        };
        let supplyCurve: THREE.CatmullRomCurve3 | null = null,
          returnCurve: THREE.CatmullRomCurve3 | null = null;
        const reliefCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.95, 1.14, BOOM_Z + E.boomCylinderOffset + 0.2),
          new THREE.Vector3(0.78, 1.32, BOOM_Z + E.boomCylinderOffset + 0.3),
          new THREE.Vector3(0.6, 1.2, BOOM_Z + E.boomCylinderOffset + 0.26),
          new THREE.Vector3(0.42, 1.04, BOOM_Z + E.boomCylinderOffset + 0.1),
        ]);
        let lastHoseAngle = Infinity;
        const rebuildHoses = (cyl: Cylinder) => {
          const angle = Math.atan2(cyl.b.y - cyl.a.y, cyl.b.x - cyl.a.x);
          if (Math.abs(angle - lastHoseAngle) < 0.004) return;
          lastHoseAngle = angle;
          const z = BOOM_Z + E.boomCylinderOffset,
            wall = E.cylinders.boom.bore / 2 + 0.03;
          const local = (x: number, y: number, dz: number) =>
            new THREE.Vector3(
              cyl.a.x + x * Math.cos(angle) - y * Math.sin(angle),
              cyl.a.y + x * Math.sin(angle) + y * Math.cos(angle),
              z + dz,
            );
          supplyCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.05, 1.12, z + 0.2),
            new THREE.Vector3(1.35, 1.15, z + 0.3),
            local(0.2, wall + 0.14, 0.14),
            local(0.28, wall + 0.08, 0),
          ]);
          returnCurve = new THREE.CatmullRomCurve3([
            local(0.36, wall + 0.06, 0),
            local(0.1, wall + 0.2, 0.22),
            new THREE.Vector3(1.25, 1.2, z + 0.42),
            new THREE.Vector3(0.95, 1.12, z + 0.32),
          ]);
          hoseSupply.geometry.dispose();
          hoseSupply.geometry = new THREE.TubeGeometry(supplyCurve, 24, 0.032, 8);
          hoseReturn.geometry.dispose();
          hoseReturn.geometry = new THREE.TubeGeometry(returnCurve, 24, 0.028, 8);
        };
        let pelletPhase = 0;
        const placePellets = (
          m: THREE.InstancedMesh,
          curve: THREE.CatmullRomCurve3 | null,
          phase: number,
          on: boolean,
        ) => {
          if (!curve || !on) return hidePellets(m);
          for (let i = 0; i < m.count; i++) {
            const u = (i / m.count + phase) % 1;
            curve.getPointAt(u, dummy.position);
            dummy.scale.setScalar(1);
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
          }
          m.instanceMatrix.needsUpdate = true;
        };

        // ---------------------------------------------------------------- overlays
        const leverLine = rod(0.014, 1, material('#5a6a70', 0.2, 0.6), 8),
          leverArm = rod(0.03, 1, accent, 12),
          leverFoot = roller(root, 0.05, 0.05, [0, 0, 0], accent);
        leverLine.castShadow = leverArm.castShadow = false;
        root.add(leverLine, leverArm);
        const arrowShaft = rod(0.045, 1, accent, 12),
          arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 16), accent);
        arrowHead.geometry.rotateZ(-Math.PI / 2);
        root.add(arrowShaft, arrowHead);
        // Boulder and heap are scenery for two chapters; they carry no model role.
        const rockGeometry = new THREE.DodecahedronGeometry(0.95, 1);
        const pos = rockGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const n = 0.86 + 0.16 * Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
          pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * n * 0.8, pos.getZ(i) * n);
        }
        rockGeometry.computeVertexNormals();
        const rock = new THREE.Mesh(rockGeometry, rockMat);
        rock.castShadow = rock.receiveShadow = true;
        rock.position.set(10.15, 0.72, BOOM_Z + 0.1);
        rock.rotation.set(0.3, 0.6, 0.15);
        rock.visible = false;
        root.add(rock);

        // ---------------------------------------------------------------- placement helpers
        const placeAlong = (g: THREE.Object3D, a: XY, b: XY) => {
          g.position.x = a.x;
          g.position.y = a.y;
          g.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
        };
        const placeCylinder = (m: CylinderMesh, cyl: Cylinder, pressure: number) => {
          placeAlong(m.g, cyl.a, cyl.b);
          const inner = cyl.spec.bore / 2 - 0.006;
          m.rodEye.position.x = cyl.length;
          m.piston.position.x = cyl.piston - 0.06;
          m.shaft.position.x = cyl.piston + 0.05;
          m.shaft.scale.x = cyl.length - cyl.piston - 0.05;
          m.cap.position.x = 0.16;
          m.cap.scale.x = Math.max(0.01, cyl.piston - 0.06 - 0.16);
          m.ring.position.x = cyl.piston + 0.06;
          m.ring.scale.x = Math.max(0.01, cyl.spec.barrel - 0.14 - cyl.piston - 0.06);
          void inner;
          if (m.sectioned) capOil.emissiveIntensity = 0.1 + 1.3 * pressure;
        };
        const setLine = (m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) => {
          m.position.copy(a);
          m.scale.x = a.distanceTo(b);
          m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
        };

        // ---------------------------------------------------------------- camera
        let wasWatching = live.current.watch,
          returnProgress = 1,
          drift = 0;
        const returnPosition = new THREE.Vector3(),
          returnTarget = new THREE.Vector3(),
          aim = new THREE.Vector3(),
          wanted = new THREE.Vector3(),
          dir = new THREE.Vector3();
        const fitCamera = new THREE.PerspectiveCamera(camera.fov, 1, 0.1, 100),
          fitPoint = new THREE.Vector3(),
          fitRight = new THREE.Vector3(),
          fitUp = new THREE.Vector3();
        /**
         * Solve the camera distance (and recentre the aim) so every listed world
         * point projects inside the frame with `pad` of breathing room. Runs a few
         * fixed-point iterations; perspective makes the exact solution nonlinear.
         */
        const fitDistance = (points: number[][], aspect: number, pad: number) => {
          fitCamera.fov = camera.fov;
          fitCamera.aspect = aspect;
          fitCamera.updateProjectionMatrix();
          dir.normalize();
          let distance = 20;
          for (let pass = 0; pass < 4; pass++) {
            fitCamera.position.copy(aim).addScaledVector(dir, distance);
            fitCamera.lookAt(aim);
            fitCamera.updateMatrixWorld();
            let xMin = 1,
              xMax = -1,
              yMin = 1,
              yMax = -1;
            for (const [x, y, z] of points) {
              fitPoint.set(x, y, z).project(fitCamera);
              xMin = Math.min(xMin, fitPoint.x);
              xMax = Math.max(xMax, fitPoint.x);
              yMin = Math.min(yMin, fitPoint.y);
              yMax = Math.max(yMax, fitPoint.y);
            }
            const halfH = distance * Math.tan((camera.fov * Math.PI) / 360),
              halfW = halfH * aspect;
            fitRight.setFromMatrixColumn(fitCamera.matrixWorld, 0);
            fitUp.setFromMatrixColumn(fitCamera.matrixWorld, 1);
            aim.addScaledVector(fitRight, ((xMin + xMax) / 2) * halfW);
            aim.addScaledVector(fitUp, ((yMin + yMax) / 2) * halfH);
            const spread = Math.max((xMax - xMin) / 2, (yMax - yMin) / 2);
            distance *= spread * (1 + pad);
          }
          return distance;
        };
        const machinePoints = (p: ExcavatorPose, ground: number) => {
          const z = BOOM_Z;
          return [
            [-3.0, 1.2, 1.3],
            [-3.0, 1.2, -1.3],
            [-2.6, 2.4, 1.3],
            [0.9, 3.15, 1.25],
            [0.9, 3.15, -0.3],
            [2.3, ground, 1.35],
            [2.3, ground, -1.35],
            [-2.3, ground, 1.35],
            [p.tip.x, p.tip.y + 0.45, z],
            [p.cylinders.stick.b.x, p.cylinders.stick.b.y + 0.3, z],
            [p.cylinders.stick.a.x, p.cylinders.stick.a.y + 0.35, z],
            [p.joint.x, p.joint.y + 0.3, z],
            // The bucket sweeps a circle about its pin; cover it on both faces.
            ...[-1, 1].flatMap((side) => [
              [p.bucketPin.x + 1.15, p.bucketPin.y, z + side * 0.55],
              [p.bucketPin.x - 0.6, p.bucketPin.y, z + side * 0.55],
              [p.bucketPin.x, p.bucketPin.y - 1.15, z + side * 0.55],
              [p.bucketPin.x, p.bucketPin.y + 0.7, z + side * 0.55],
              [p.tooth.x, p.tooth.y, z + side * 0.55],
            ]),
          ];
        };
        let smoothDistance = 0;
        const frameFor = (
          view: View,
          p: ExcavatorPose,
          aspect: number,
          dt: number,
          snap: boolean,
        ) => {
          const phone = aspect < 1;
          const fixed = (height: number) => height / (2 * Math.tan((camera.fov * Math.PI) / 360));
          let target: number;
          switch (view) {
            case 'cylinder': {
              const c = p.cylinders.boom;
              aim.set(
                (c.a.x + c.b.x) / 2 + 0.05,
                (c.a.y + c.b.y) / 2 + 0.05,
                BOOM_Z + E.boomCylinderOffset,
              );
              dir.set(0.06, 0.16, 1);
              const tall = Math.abs(c.b.y - c.a.y) + 0.9;
              target = fixed(phone ? Math.max(2.9, 3.0 / aspect, tall) : Math.max(2.45, tall));
              break;
            }
            case 'side': {
              aim.set(3, 3, 0);
              dir.set(0.02, 0.1, 1);
              target = fitDistance(machinePoints(p, -0.2), aspect, phone ? 0.1 : 0.07);
              break;
            }
            case 'bucket': {
              const c = p.cylinders.bucket;
              aim.set((p.bucketPin.x + c.a.x) / 2 + 0.3, (p.bucketPin.y + c.a.y) / 2 - 0.1, BOOM_Z);
              dir.set(0.14, 0.14, 1);
              target = fixed(phone ? Math.max(4.4, 4.8 / aspect) : 4.6);
              break;
            }
            default: {
              aim.set(3, 2.5, 0);
              dir.set(
                phone ? 0.85 : 0.5 + Math.sin(drift) * 0.08,
                phone ? 0.45 : 0.27,
                phone ? 0.8 : 1,
              );
              const pts = machinePoints(p, -0.1);
              if (rock.visible) pts.push([11.3, 0.3, BOOM_Z + 1], [11.3, 1.6, BOOM_Z]);
              target = fitDistance(pts, aspect, phone ? 0.08 : 0.06);
            }
          }
          smoothDistance =
            smoothDistance && !snap
              ? smoothDistance + (target - smoothDistance) * (1 - Math.exp(-dt * 2.2))
              : target;
          return smoothDistance;
        };

        // ---------------------------------------------------------------- labels
        const labelPoint = new THREE.Vector3();
        const anchors: Record<string, (p: ExcavatorPose) => THREE.Vector3> = {
          boomCylinder: (p) =>
            v3(p.cylinders.boom.a, BOOM_Z + E.boomCylinderOffset).lerp(
              v3(p.cylinders.boom.b, BOOM_Z + E.boomCylinderOffset),
              0.5,
            ),
          stickCylinder: (p) =>
            v3(p.cylinders.stick.a, BOOM_Z).lerp(v3(p.cylinders.stick.b, BOOM_Z), 0.5),
          bucketCylinder: (p) =>
            v3(p.cylinders.bucket.a, BOOM_Z).lerp(v3(p.cylinders.bucket.b, BOOM_Z), 0.5),
          piston: (p) =>
            cylinders.boomNear.g.localToWorld(new THREE.Vector3(p.cylinders.boom.piston, 0, 0)),
          pistonFace: (p) =>
            cylinders.boomNear.g.localToWorld(
              new THREE.Vector3(p.cylinders.boom.piston - 0.08, 0.02, 0),
            ),
          capEnd: (p) =>
            cylinders.boomNear.g.localToWorld(
              new THREE.Vector3((0.16 + p.cylinders.boom.piston) / 2, -0.02, 0),
            ),
          rodEnd: (p) =>
            cylinders.boomNear.g.localToWorld(
              new THREE.Vector3(
                (p.cylinders.boom.piston + p.cylinders.boom.spec.barrel) / 2,
                -0.02,
                0,
              ),
            ),
          pivot: (p) => v3(p.foot, BOOM_Z + 0.5),
          leverArm: () => leverArm.localToWorld(new THREE.Vector3(0.5, 0, 0)),
          rocker: (p) => v3(p.rockerPin, BOOM_Z + 0.31).lerp(v3(p.joint, BOOM_Z + 0.31), 0.5),
          link: (p) => v3(p.joint, BOOM_Z + 0.31).lerp(v3(p.lug, BOOM_Z + 0.31), 0.5),
          bucketPin: (p) => v3(p.bucketPin, BOOM_Z + 0.3),
          relief: () => reliefBlock.position.clone(),
        };
        const projectLabels = (p: ExcavatorPose) => {
          const host = labelHost.current;
          if (!host) return;
          const w = host.clientWidth,
            h = host.clientHeight;
          host.querySelectorAll<HTMLElement>('[data-label]').forEach((el) => {
            const key = el.dataset.label ?? '',
              anchor = anchors[key];
            if (!anchor) return;
            labelPoint.copy(anchor(p)).project(camera);
            const x = ((labelPoint.x + 1) / 2) * w,
              y = ((1 - labelPoint.y) / 2) * h,
              dy = Number(el.dataset.dy ?? 0);
            let dx = Number(el.dataset.dx ?? 0);
            const visible = labelPoint.z < 1 && x > -40 && x < w + 40 && y > -20 && y < h + 20;
            // Keep the pill inside the stage: flip across the anchor if needed, then clamp.
            const pw = el.offsetWidth,
              ph = el.offsetHeight;
            let left = dx >= 0 ? x + dx : x + dx - pw;
            if (dx >= 0 && left + pw > w - 6) left = x - Math.abs(dx) - pw;
            else if (dx < 0 && left < 6) left = x + Math.abs(dx);
            left = Math.min(w - pw - 6, Math.max(6, left));
            const py = Math.min(h - ph / 2 - 6, Math.max(ph / 2 + 6, y + dy));
            const edgeX = left + pw / 2 < x ? left + pw : left;
            el.style.transform = `translate(${left.toFixed(1)}px, ${(py - ph / 2).toFixed(1)}px)`;
            el.style.opacity = visible ? '1' : '0';
            const leader = host.querySelector<SVGLineElement>(`[data-leader="${key}"]`),
              dot = host.querySelector<SVGCircleElement>(`[data-dot="${key}"]`);
            if (leader) {
              leader.setAttribute('x1', x.toFixed(1));
              leader.setAttribute('y1', y.toFixed(1));
              leader.setAttribute('x2', edgeX.toFixed(1));
              leader.setAttribute('y2', py.toFixed(1));
              leader.style.opacity = visible ? '1' : '0';
            }
            if (dot) {
              dot.setAttribute('cx', x.toFixed(1));
              dot.setAttribute('cy', y.toFixed(1));
              dot.style.opacity = visible ? '1' : '0';
            }
          });
        };

        const fillScale = new THREE.Vector3();
        return {
          update: (dt, _elapsed, settle) => {
            const { visual, watch } = live.current;
            const p = excavatorPose(visual.pose);
            const reduced = reducedMotion.matches;
            drift += dt * 0.12;
            // Rigid members.
            boomGroup.rotation.z = p.boom;
            stickGroup.position.copy(v3(p.tip));
            stickGroup.rotation.z = p.stickAngle;
            bucketGroup.position.copy(v3(p.bucketPin));
            bucketGroup.rotation.z = p.bucketAngle;
            const load = Math.min(1, visual.payload / 1200);
            fill.visible = load > 0.02;
            fillScale.set(0.55 + 0.45 * load, 0.55 + 0.45 * load, 1);
            fill.scale.copy(fillScale);
            fill.position.x = BUCKET.fill[0].x * (1 - fillScale.x) + 0.22 * (1 - load);
            fill.position.y = BUCKET.fill[0].y * (1 - fillScale.y) + 0.14 * (1 - load);
            rocker.forEach((m) => placeAlong(m, p.rockerPin, p.joint));
            rocker.forEach((m) => (m.scale.x = E.rockerLength));
            link.forEach((m) => placeAlong(m, p.joint, p.lug));
            link.forEach((m) => (m.scale.x = E.linkLength));
            jointPin.position.set(p.joint.x, p.joint.y, BOOM_Z);
            placeCylinder(cylinders.boomNear, p.cylinders.boom, visual.pressure);
            placeCylinder(cylinders.boomFar, p.cylinders.boom, visual.pressure);
            placeCylinder(cylinders.stick, p.cylinders.stick, 0);
            placeCylinder(cylinders.bucket, p.cylinders.bucket, 0);
            rebuildHoses(p.cylinders.boom);
            // Cutaway plane sits at the near cylinder axis when fully open.
            const nearZ = BOOM_Z + E.boomCylinderOffset;
            // three.js discards fragments with a negative signed distance, so this
            // plane removes everything nearer the camera than the constant.
            clipPlane.constant = nearZ + 0.22 * (1 - visual.cutaway);
            // Oil motion: supply into the cap end while lifting, rod end returning.
            const moving = visual.valve === 'lift' && !visual.relief && visual.flow > 0;
            pelletPhase = (pelletPhase + dt * (0.12 + visual.flow / 260)) % 1;
            placePellets(
              pelletSupply,
              supplyCurve,
              pelletPhase,
              (moving || visual.relief) && visual.cutaway > 0.5,
            );
            placePellets(pelletReturn, returnCurve, pelletPhase, moving && visual.cutaway > 0.5);
            placePellets(
              pelletRelief,
              reliefCurve,
              pelletPhase * 1.5,
              visual.relief && visual.cutaway > 0.5,
            );
            reliefBlock.visible =
              visual.cutaway > 0.5 && (visual.relief || visual.labels.includes('relief'));
            (accent as THREE.MeshStandardMaterial).emissive.set(
              visual.relief ? '#c24a12' : '#000000',
            );
            // Lever overlay.
            leverLine.visible = leverArm.visible = leverFoot.visible = visual.lever;
            if (visual.lever) {
              const c = p.cylinders.boom;
              const a = v3(c.a, nearZ + 0.2),
                b = v3(c.b, nearZ + 0.2);
              const u = b.clone().sub(a).normalize();
              const foot = v3(p.foot, nearZ + 0.2);
              const along = foot.clone().sub(a).dot(u);
              const perp = a.clone().addScaledVector(u, along);
              setLine(
                leverLine,
                a.clone().addScaledVector(u, -1.2),
                b.clone().addScaledVector(u, 2.2),
              );
              setLine(leverArm, foot, perp);
              leverFoot.position.copy(perp);
            }
            // Force arrow along the rod from the piston.
            arrowShaft.visible = arrowHead.visible = visual.forceArrow && visual.cutaway > 0.5;
            if (arrowShaft.visible) {
              const c = p.cylinders.boom;
              const from = cylinders.boomNear.g.localToWorld(
                new THREE.Vector3(c.piston + 0.08, 0, 0.1),
              );
              const len = 0.35 + (visual.force / 100e3) * 0.55;
              const to = cylinders.boomNear.g.localToWorld(
                new THREE.Vector3(c.piston + 0.08 + len, 0, 0.1),
              );
              setLine(arrowShaft, from, to);
              arrowHead.position.copy(to);
              arrowHead.rotation.z = arrowShaft.rotation.z;
            }
            rock.visible = visual.rock;
            // Camera.
            if (wasWatching && !watch) {
              returnProgress = 0;
              returnPosition.copy(camera.position);
              returnTarget.copy(controls.target);
            }
            wasWatching = watch;
            if (watch || returnProgress < 1) {
              const distance = watch
                ? frameFor(visual.view, p, camera.aspect, dt, settle || reduced)
                : frameFor('wide', p, camera.aspect, dt, reduced);
              wanted.copy(aim).addScaledVector(dir.normalize(), distance);
              if (watch) {
                returnProgress = 1;
                const blend = settle || reduced ? 1 : 1 - Math.exp(-dt * 3.2);
                controls.target.lerp(aim, blend);
                camera.position.lerp(wanted, blend);
              } else {
                returnProgress = reduced ? 1 : Math.min(1, returnProgress + dt / 0.8);
                const s = returnProgress * returnProgress * (3 - 2 * returnProgress);
                controls.target.lerpVectors(returnTarget, aim, s);
                camera.position.lerpVectors(returnPosition, wanted, s);
              }
            }
            projectLabels(p);
          },
          dispose: () => {
            hoseSupply.geometry.dispose();
            hoseReturn.geometry.dispose();
          },
        };
      }}
    />
  );
}
