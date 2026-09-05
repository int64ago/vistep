import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  DIFFERENTIAL as D,
  differentialBevel,
  differentialBevelOutline,
  differentialFrame,
  differentialContacts,
  differentialRotateX,
  type DifferentialBevel,
  type DifferentialMotion,
  type DifferentialGearId,
} from '../../models/differential';
import { useShowcase } from '../lab/Showcase';
import Studio from './Studio';
import { box, material } from './parts';
import { DifferentialMechanism } from './DifferentialDiagram';

/** Closed annular solid with genuinely spherical-involute flanks, scaled along apex rays. */
function bevelGeometry(g: DifferentialBevel) {
  const outline = differentialBevelOutline(g),
    n = outline.length,
    positions: number[] = [],
    indices: number[] = [];
  // Front and rear spherical annuli are subdivided in polar angle. The bore stays cylindrical.
  const steps = 6;
  for (const distance of [g.inner, g.outer])
    for (let j = 0; j <= steps; j++)
      for (const p of outline) {
        const bore = Math.asin(g.bore / distance),
          polar = bore + ((p.polar - bore) * j) / steps;
        positions.push(
          distance * Math.sin(polar) * Math.cos(p.azimuth),
          distance * Math.sin(polar) * Math.sin(p.azimuth),
          distance * Math.cos(polar),
        );
      }
  const ring = (face: number, j: number, i: number) =>
    face * (steps + 1) * n + j * n + ((i + n) % n);
  const quad = (a: number, b: number, c: number, d: number, flip = false) => {
    indices.push(...(flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < steps; j++) {
      quad(ring(0, j, i), ring(0, j, i + 1), ring(0, j + 1, i + 1), ring(0, j + 1, i));
      quad(ring(1, j, i), ring(1, j, i + 1), ring(1, j + 1, i + 1), ring(1, j + 1, i), true);
    }
    quad(ring(0, steps, i), ring(0, steps, i + 1), ring(1, steps, i + 1), ring(1, steps, i));
    quad(ring(0, 0, i), ring(1, 0, i), ring(1, 0, i + 1), ring(0, 0, i + 1));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
function frameQuaternion(id: DifferentialGearId) {
  const a = new THREE.Vector3(...differentialFrame([1, 0, 0], id)),
    b = new THREE.Vector3(...differentialFrame([0, 1, 0], id)),
    c = new THREE.Vector3(...differentialFrame([0, 0, 1], id));
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(a, b, c));
}
export default function DifferentialStudio({
  motion,
  focus,
  progress,
}: {
  motion: DifferentialMotion;
  focus: string;
  progress: number;
}) {
  const film = useShowcase(),
    state = useRef({ motion, focus, progress, film });
  state.current = { motion, focus, progress, film };
  return (
    <Studio
      dark
      className="diff-studio"
      cameraPosition={[4, 4, 11]}
      target={[0, 1.9, 0]}
      span={9.6}
      fitHeight={5.1}
      label={t('开放式锥齿轮差速器剖面：壳体、十字轴、两只行星齿轮、半轴齿轮、轴承与两侧车轮相连')}
      fallback={<DifferentialMechanism motion={motion} />}
      create={({ root, camera, controls }) => {
        root.position.y = 1.85;
        const steel = material('#a9bec4', 0.83, 0.27),
          dark = material('#344b53', 0.65, 0.4),
          bronze = material('#c18a58', 0.73, 0.31),
          paint = material('#49737b', 0.68, 0.37),
          rubber = material('#1b272d', 0.03, 0.85),
          leftMat = material('#b88c68', 0.76, 0.32),
          rightMat = material('#86b2bc', 0.79, 0.3);
        const mesh = (
          parent: THREE.Object3D,
          geometry: THREE.BufferGeometry,
          mat: THREE.Material,
        ) => {
          const m = new THREE.Mesh(geometry, mat);
          parent.add(m);
          m.castShadow = true;
          m.receiveShadow = true;
          return m;
        };
        const cylinder = (
          parent: THREE.Object3D,
          r: number,
          length: number,
          x: number,
          y: number,
          z: number,
          mat: THREE.Material,
          axis: 'x' | 'y' = 'x',
        ) => {
          const m = mesh(parent, new THREE.CylinderGeometry(r, r, length, 48), mat);
          if (axis === 'x') m.rotation.z = -Math.PI / 2;
          m.position.set(x, y, z);
          return m;
        };
        const ring = (
          parent: THREE.Object3D,
          inner: number,
          outer: number,
          depth: number,
          x: number,
          mat: THREE.Material,
        ) => {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
          const hole = new THREE.Path();
          hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
          shape.holes.push(hole);
          const m = mesh(
            parent,
            new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }),
            mat,
          );
          m.rotation.y = Math.PI / 2;
          m.position.x = x - depth / 2;
          return m;
        };
        const stand = new THREE.Group();
        root.add(stand);
        box(stand, [8.3, 0.12, 1.45], [0, -1.76, 0], dark, 0.045);
        const carrier = new THREE.Group();
        root.add(carrier);
        for (const sign of [-1, 1]) {
          const x = sign * D.carrierHalfLength;
          ring(carrier, 0.26, 0.36, 0.2, x, paint);
          ring(carrier, 1.49, D.carrierRadius, 0.13, x, paint);
          for (let i = 0; i < 4; i++) {
            const a = Math.PI / 4 + (i * Math.PI) / 2,
              spoke = box(
                carrier,
                [0.11, 1.26, 0.14],
                [x, 0.9 * Math.cos(a), 0.9 * Math.sin(a)],
                paint,
                0.04,
              );
            spoke.rotation.x = a;
            cylinder(carrier, 0.045, 0.16, x, 1.575 * Math.cos(a), 1.575 * Math.sin(a), steel);
          }
          // Hollow carrier trunnion rotates inside a fixed two-ring bearing; the axle has its own bore.
          ring(carrier, 0.18, 0.3, 0.67, sign * 1.91, steel);
          ring(stand, 0.3, 0.38, 0.25, sign * 2.1, bronze);
          ring(stand, 0.38, 0.5, 0.27, sign * 2.1, dark);
          box(stand, [0.43, 1.23, 0.49], [sign * 2.1, -1.07, 0], paint, 0.075);
          box(stand, [0.8, 0.12, 0.8], [sign * 2.1, -1.64, 0], steel, 0.045);
          for (const z of [-0.27, 0.27])
            cylinder(stand, 0.048, 0.05, sign * 2.1, -1.545, z, steel, 'y');
          ring(stand, D.shaftRadius, 0.21, 0.22, sign * 3.05, steel);
          ring(stand, 0.21, 0.3, 0.24, sign * 3.05, paint);
          box(stand, [0.28, 1.45, 0.34], [sign * 3.05, -0.98, 0], dark, 0.055);
        }
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          box(
            carrier,
            [2 * D.carrierHalfLength, 0.13, 0.13],
            [0, 1.58 * Math.cos(a), 1.58 * Math.sin(a)],
            paint,
            0.035,
          );
        }
        // The central bridge ring carries the cross pin, and joins all four longitudinal bridges.
        ring(carrier, 1.5, 1.7, 0.12, 0, paint);
        cylinder(carrier, 0.14, 2 * D.pinEnd, 0, 0, 0, steel, 'y');
        for (const sign of [-1, 1]) cylinder(carrier, 0.07, 0.05, 0, sign * 1.715, 0, steel, 'y');
        const sideGeo = bevelGeometry(differentialBevel('side')),
          pinGeo = bevelGeometry(differentialBevel('pinion'));
        const gears = {} as Record<DifferentialGearId, THREE.Group>;
        const marks: THREE.Mesh[] = [];
        for (const id of ['left', 'right', 'upper', 'lower'] as const) {
          const mount = new THREE.Group();
          mount.quaternion.copy(frameQuaternion(id));
          carrier.add(mount);
          const spin = new THREE.Group();
          mount.add(spin);
          gears[id] = spin;
          const side = id === 'left' || id === 'right';
          mesh(spin, side ? sideGeo : pinGeo, side ? (id === 'left' ? leftMat : rightMat) : bronze);
          // A cylindrical bore and an integral rear hub share the same intersecting axis.
          const g = differentialBevel(side ? 'side' : 'pinion'),
            shape = new THREE.Shape();
          shape.absarc(0, 0, 0.235, 0, Math.PI * 2, false);
          const bore = new THREE.Path();
          bore.absarc(0, 0, D.bore, 0, Math.PI * 2, true);
          shape.holes.push(bore);
          const hub = mesh(
            spin,
            new THREE.ExtrudeGeometry(shape, {
              depth: side ? 0.27 : 0.2,
              bevelEnabled: false,
              curveSegments: 48,
            }),
            side ? steel : bronze,
          );
          hub.position.z = 1.22;
          if (!side) {
            const support = mesh(
              mount,
              new THREE.ExtrudeGeometry(shape, {
                depth: 0.27,
                bevelEnabled: false,
                curveSegments: 48,
              }),
              paint,
            );
            support.position.z = 1.42;
          }
          const mark = mesh(
            spin,
            new THREE.SphereGeometry(0.047, 14, 10),
            material('#f2d6a0', 0.3, 0.34),
          );
          mark.position.set(
            0.5 * Math.cos(0.5),
            0.5 * Math.sin(0.5),
            Math.sqrt(g.outer * g.outer - 0.5 * 0.5) + 0.015,
          );
          marks.push(mark);
        }
        const wheels: THREE.Group[] = [];
        for (const sign of [-1, 1]) {
          const wheel = new THREE.Group();
          root.add(wheel);
          wheel.position.x = sign * D.wheelX;
          wheels.push(wheel);
          ring(wheel, 0.45, 0.73, 0.37, 0, rubber);
          ring(wheel, 0.31, 0.45, 0.28, 0, steel);
          cylinder(wheel, 0.17, 0.43, 0, 0, 0, sign < 0 ? leftMat : rightMat);
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3,
              s = box(
                wheel,
                [0.12, 0.3, 0.035],
                [sign * 0.19, 0.27 * Math.cos(a), 0.27 * Math.sin(a)],
                steel,
                0.012,
              );
            s.rotation.x = a;
            cylinder(
              wheel,
              0.019,
              0.04,
              sign * 0.25,
              0.105 * Math.cos(a),
              0.105 * Math.sin(a),
              steel,
            );
          }
          const stripe = box(
            wheel,
            [0.38, 0.08, 0.1],
            [0, 0.69, 0],
            sign < 0 ? leftMat : rightMat,
            0.015,
          );
          stripe.rotation.x = 0;
          cylinder(
            wheel,
            D.shaftRadius,
            D.wheelX - D.axleStart,
            (-sign * (D.wheelX - D.axleStart)) / 2,
            0,
            0,
            steel,
          );
        }
        // Contact marks lie on actual conjugate flank rays; they are never snapped to cone tangency.
        const dots = Array.from({ length: 2 }, () =>
          mesh(root, new THREE.SphereGeometry(0.028, 12, 10), material('#f7d499', 0.3, 0.25)),
        );
        const cones = new THREE.Group();
        root.add(cones);
        for (const id of ['right', 'upper'] as const) {
          const g = differentialBevel(id === 'right' ? 'side' : 'pinion'),
            geo = new THREE.ConeGeometry(
              g.outer * Math.sin(g.pitch),
              g.outer * Math.cos(g.pitch),
              64,
              1,
              true,
            ),
            mat = new THREE.MeshBasicMaterial({
              color: '#d3b987',
              transparent: true,
              opacity: 0.08,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
          const m = mesh(cones, geo, mat);
          m.rotation.x = Math.PI / 2;
          const holder = new THREE.Group();
          holder.quaternion.copy(frameQuaternion(id));
          cones.add(holder);
          holder.add(m);
          m.position.z = (g.outer * Math.cos(g.pitch)) / 2;
          m.rotation.x = -Math.PI / 2;
        }
        const direction = new THREE.Vector3(),
          target = new THREE.Vector3();
        return {
          update() {
            const v = state.current,
              m = v.motion;
            carrier.rotation.x = m.carrierAngle;
            gears.left.rotation.z = gears.right.rotation.z = m.differenceAngle;
            gears.upper.rotation.z = gears.lower.rotation.z = m.pinionAngle;
            wheels[0].rotation.x = m.leftAngle;
            wheels[1].rotation.x = m.rightAngle;
            const contact = differentialContacts(m.differenceAngle);
            dots.forEach((dot, i) => {
              dot.visible = v.focus === 'spiders' && Boolean(contact[i]);
              if (contact[i]) {
                const p = differentialRotateX(contact[i].point, m.carrierAngle);
                dot.position.set(p[0] * 1.2, p[1] * 1.2, p[2] * 1.2);
              }
            });
            cones.visible = v.focus === 'spiders' && v.progress < 0.32;
            cones.rotation.x = m.carrierAngle;
            if (v.film.watch) {
              const compact = camera.aspect < 1.35,
                close = compact || v.focus === 'spiders',
                arc = Math.sin(Math.PI * v.progress) ** 2;
              target.set(0, 1.9, 0);
              controls.target.copy(target);
              const height = Math.max((close ? 5.6 : 9.7) / camera.aspect, close ? 4.6 : 4.8),
                distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
              direction.set(v.focus === 'spiders' ? 2.3 + arc : 3.5, 0.95, 11).normalize();
              camera.position.copy(target).addScaledVector(direction, distance);
            }
          },
        };
      }}
    />
  );
}
