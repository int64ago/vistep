import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { box, material, roller } from './parts';
import {
  EXCAVATOR_BUCKET,
  EXCAVATOR_CYLINDERS,
  excavatorPose,
  mix,
  type XY,
} from '../../models/excavator';
import ExcavatorDrawing from '../lab/ExcavatorDrawing';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
type Props = { boom: number; stick: number; curl: number; closeup?: boolean };
export default function ExcavatorStudio(props: Props) {
  const film = useShowcase();
  const live = useRef({ ...props, watch: film.watch });
  live.current = { ...props, watch: film.watch };
  return (
    <Studio
      label={t('挖掘机的动臂、斗杆和铲斗连杆')}
      cameraPosition={[7, 4, 12]}
      target={[1.3, 2, 0]}
      span={9}
      fitHeight={5.3}
      exposure={1.15}
      fallback={<ExcavatorDrawing {...props} />}
      create={({ root, camera, controls, reducedMotion }) => {
        const yellow = material('#d8a445', 0.45, 0.34),
          dark = material('#3d4c50', 0.6, 0.4),
          steel = material('#c1ced0', 0.85, 0.22),
          blue = material('#7eabb4', 0.55, 0.22),
          pin = material('#65797e', 0.7, 0.32);
        for (const z of [-0.73, 0.73]) {
          box(root, [2.45, 0.5, 0.48], [-0.5, 0.32, z], dark, 0.19);
          for (let x = -1.35; x < 0.6; x += 0.38) roller(root, 0.18, 0.5, [x, 0.35, z], pin);
          for (let i = 0; i < 15; i++)
            box(root, [0.13, 0.035, 0.54], [-1.62 + i * 0.16, 0.59, z], pin, 0.01);
        }
        roller(root, 0.65, 0.22, [-0.4, 0.78, 0], steel).rotation.x = Math.PI / 2;
        box(root, [2.15, 0.48, 1.55], [-0.55, 1, 0], yellow, 0.16);
        // Chassis clevises carry the boom pivot and both boom-cylinder base eyes.
        box(root, [0.4, 0.45, 0.64], [-0.03, 1.3, 0], yellow, 0.06);
        box(root, [0.48, 0.25, 0.86], [0.49, 1.14, 0], yellow, 0.05);
        box(root, [0.85, 1.25, 0.72], [-0.75, 1.75, 0.42], yellow, 0.09);
        box(root, [0.76, 0.83, 0.025], [-0.75, 1.9, 0.795], blue, 0.04);
        box(root, [0.045, 0.83, 0.6], [-0.3, 1.9, 0.42], blue, 0.03);
        box(root, [0.9, 0.73, 0.75], [-1.18, 1.4, -0.4], yellow, 0.15);
        for (let i = 0; i < 7; i++)
          box(root, [0.035, 0.36, 0.02], [-1.53 + i * 0.1, 1.5, -0.79], dark, 0.008);
        const beam = (width: number, depth: number, mat: THREE.Material) =>
          box(root, [1, width, depth], [0, 0, 0], mat, 0.06);
        const boom = beam(0.34, 0.42, yellow),
          stick = beam(0.25, 0.32, yellow),
          links = [beam(0.1, 0.15, steel), beam(0.1, 0.15, steel)],
          mounts = [beam(0.18, 0.46, yellow), beam(0.18, 0.46, yellow)];
        const joints = Array.from({ length: 6 }, () => roller(root, 0.13, 0.84, [0, 0, 0], pin));
        const cylinders = [0, 0, 1, 2].map((i, index) => ({
          index: i,
          z: i === 2 || index === 0 ? -0.36 : 0.36,
          body: roller(root, 0.075, 1, [0, 0, 0], i === 0 ? yellow : dark),
          rod: roller(root, 0.03, 1, [0, 0, 0], steel),
        }));
        // Each cylinder eye bears on a pin that actually reaches its paired clevis.
        const cylinderPins = Array.from({ length: 6 }, () =>
          roller(root, 0.105, 0.92, [0, 0, 0], pin),
        );
        const bucket = new THREE.Group();
        root.add(bucket);
        const shapeFrom = (points: readonly XY[]) => {
          const shape = new THREE.Shape(points.map(({ x, y }) => new THREE.Vector2(x, y)));
          shape.closePath();
          return shape;
        };
        const shape = shapeFrom(EXCAVATOR_BUCKET.side);
        // Twin bucket mounting ears join the linkage pin (0, .55) to the shell.
        const earShape = shapeFrom(EXCAVATOR_BUCKET.ear);
        for (const z of [-0.23, 0.18]) {
          const ear = new THREE.Mesh(
            new THREE.ExtrudeGeometry(earShape, {
              depth: 0.05,
              bevelEnabled: true,
              bevelSize: 0.012,
              bevelThickness: 0.012,
              bevelSegments: 2,
              steps: 1,
            }),
            yellow,
          );
          ear.position.z = z;
          ear.castShadow = true;
          bucket.add(ear);
        }
        for (const z of [-0.325, 0.275]) {
          const side = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, {
              depth: 0.05,
              bevelEnabled: true,
              bevelSize: 0.012,
              bevelThickness: 0.012,
              bevelSegments: 2,
              steps: 1,
            }),
            yellow,
          );
          side.position.z = z;
          side.castShadow = true;
          bucket.add(side);
        }
        const shellShape = shapeFrom(EXCAVATOR_BUCKET.shell);
        const shell = new THREE.Mesh(
          new THREE.ExtrudeGeometry(shellShape, { depth: 0.55, bevelEnabled: false, steps: 1 }),
          yellow,
        );
        shell.position.z = -0.275;
        shell.castShadow = true;
        bucket.add(shell);
        const toothGeometry = new THREE.ExtrudeGeometry(shapeFrom(EXCAVATOR_BUCKET.tooth), {
          depth: 0.075,
          bevelEnabled: true,
          bevelSize: 0.008,
          bevelThickness: 0.008,
          bevelSegments: 2,
          steps: 1,
        });
        for (let i = 0; i < 4; i++) {
          const tooth = new THREE.Mesh(toothGeometry, steel);
          tooth.position.z = -0.2775 + i * 0.16;
          tooth.castShadow = true;
          bucket.add(tooth);
        }
        const setBeam = (mesh: THREE.Object3D, a: XY, b: XY, z = 0) => {
          mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
          mesh.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
          mesh.scale.x = Math.hypot(b.x - a.x, b.y - a.y);
        };
        const cylinderAxis = new THREE.Vector3(0, 0, 1);
        const direction = new THREE.Vector3();
        const setCylinder = (mesh: THREE.Object3D, a: XY, b: XY, z: number) => {
          mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
          direction.set(b.x - a.x, b.y - a.y, 0);
          mesh.scale.z = direction.length();
          mesh.quaternion.setFromUnitVectors(cylinderAxis, direction.normalize());
        };
        let wasWatching = live.current.watch,
          returnProgress = 1;
        const returnPosition = new THREE.Vector3(),
          returnTarget = new THREE.Vector3();
        return {
          update: (dt, _elapsed, settle) => {
            const p = excavatorPose(live.current.boom, live.current.stick, live.current.curl);
            setBeam(boom, p.origin, p.elbow);
            setBeam(stick, p.elbow, p.wrist);
            // Separate bearing planes meet on common through-pins without
            // placing both steel links and the rod eye in the same solid layer.
            setBeam(links[0], p.rockerPin, p.joint, -0.2);
            setBeam(links[1], p.joint, p.bucketPin, 0.3);
            p.cylinderMounts.forEach(({ a, b }, i) => setBeam(mounts[i], a, b));
            [p.origin, p.elbow, p.wrist, p.rockerPin, p.joint, p.bucketPin].forEach((p, i) =>
              joints[i].position.set(p.x, p.y, 0),
            );
            cylinders.forEach(({ body, rod, index, z }) => {
              const { a, b } = p.cylinders[index];
              const split = mix(
                a,
                b,
                EXCAVATOR_CYLINDERS[index].housing / Math.hypot(b.x - a.x, b.y - a.y),
              );
              setCylinder(body, a, split, z);
              setCylinder(rod, split, b, z);
            });
            p.cylinders
              .flatMap(({ a, b }) => [a, b])
              .forEach((p, i) => cylinderPins[i].position.set(p.x, p.y, 0));
            const watching = live.current.watch;
            if (wasWatching && !watching) {
              // Exploration cannot zoom out. Give it a complete machine view
              // once, then release the camera to the reader and Studio.resize.
              returnProgress = 0;
              returnPosition.copy(camera.position);
              returnTarget.copy(controls.target);
            }
            wasWatching = watching;
            if (watching || returnProgress < 1) {
              const close = watching && live.current.closeup;
              const aim = close
                ? new THREE.Vector3(
                    (p.wrist.x + p.joint.x) / 2,
                    (p.wrist.y + p.joint.y) / 2 - 0.3,
                    0.12,
                  )
                : new THREE.Vector3(1.5, 2, 0);
              // Side-on detail keeps all four linkage pivots in one readable plane.
              const direction = new THREE.Vector3(
                close ? 0.12 : 0.32,
                close ? 0.16 : 0.18,
                1,
              ).normalize();
              const height = watching
                ? Math.max((close ? 2.85 : 8.6) / camera.aspect, close ? 3.15 : 5.2)
                : Math.max(9 / camera.aspect, 5.3);
              const distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
              const position = aim.clone().addScaledVector(direction, distance);
              if (watching) {
                returnProgress = 1;
                const blend = settle || reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 4.5);
                controls.target.lerp(aim, blend);
                camera.position.lerp(position, blend);
              } else {
                returnProgress = reducedMotion.matches ? 1 : Math.min(1, returnProgress + dt / 0.7);
                const blend = returnProgress * returnProgress * (3 - 2 * returnProgress);
                controls.target.lerpVectors(returnTarget, aim, blend);
                camera.position.lerpVectors(returnPosition, position, blend);
              }
            }
            bucket.position.set(p.wrist.x, p.wrist.y, 0);
            bucket.rotation.z = p.bucketAngle;
          },
        };
      }}
    />
  );
}
