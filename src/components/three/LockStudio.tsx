import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  LOCK as L,
  lockKeyProfile,
  lockSpring,
  type LockPose,
  type LockKey,
} from '../../models/lock';
import { useShowcase } from '../lab/Showcase';
import Studio from './Studio';
import { box, material } from './parts';
import { LockSection } from './LockDiagram';
function solid(positions: number[], indices: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
/** Round bullet nose and cylindrical shear end, with no planar corner outside the plug envelope. */
function pinGeometry(length: number, driver: boolean) {
  const vertices: number[] = [],
    indices: number[] = [],
    n = 40,
    rings = 12;
  for (let j = 0; j <= rings; j++)
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      let r: number, y: number;
      if (driver) {
        if (j <= 6) {
          r = (L.pinRadius * j) / 6;
          y = Math.sqrt(L.radius ** 2 - (r * Math.sin(a)) ** 2) - L.radius;
        } else if (j === 7) {
          r = L.pinRadius;
          y = length;
        } else {
          r = (L.pinRadius * (rings - j)) / (rings - 7);
          y = length;
        }
      } else {
        if (j <= 5) {
          const b = ((j / 5) * Math.PI) / 2;
          r = L.pinRadius * Math.sin(b);
          y = L.pinRadius * (1 - Math.cos(b));
        } else {
          r = (L.pinRadius * (rings - j)) / (rings - 6);
          y = length + Math.sqrt(L.radius ** 2 - (r * Math.sin(a)) ** 2) - L.radius;
        }
      }
      vertices.push(r * Math.cos(a), y, r * Math.sin(a));
    }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i,
        b = a + n + 1;
      // Both halves use identical shear-face rings and triangle diagonals in opposite order.
      if (driver && j < 6) indices.push(a, b, b + 1, a, b + 1, a + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return solid(vertices, indices);
}
function sleeveGeometry(
  inner: number,
  outer: number,
  low: (z: number) => number,
  high: (z: number) => number,
) {
  const v: number[] = [],
    ix: number[] = [],
    n = 36;
  // Open front half exposes bore walls, rather than drawing solid tubes through the pins.
  for (const r of [inner, outer])
    for (const end of [low, high])
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI,
          z = r * Math.sin(a);
        v.push(r * Math.cos(a), end(z), z);
      }
  const row = n + 1;
  const quad = (a: number, b: number, c: number, d: number) => ix.push(a, b, c, a, c, d);
  for (let i = 0; i < n; i++) {
    quad(i, i + 1, row + i + 1, row + i);
    quad(2 * row + i, 3 * row + i, 3 * row + i + 1, 2 * row + i + 1);
    quad(i, 2 * row + i, 2 * row + i + 1, i + 1);
    quad(row + i, row + i + 1, 3 * row + i + 1, 3 * row + i);
  }
  quad(0, row, 3 * row, 2 * row);
  quad(n, 2 * row + n, 3 * row + n, row + n);
  return solid(v, ix);
}
function springGeometry() {
  const v: number[] = [],
    ix: number[] = [],
    n = 126,
    k = 8;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= k; i++) v.push(0, 0, 0);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < k; i++) {
      const a = j * (k + 1) + i,
        b = a + k + 1;
      ix.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return solid(v, ix);
}
function springUpdate(g: THREE.BufferGeometry, s: LockPose['stacks'][number]) {
  const a = g.getAttribute('position') as THREE.BufferAttribute,
    n = 126,
    k = 8;
  for (let j = 0; j <= n; j++) {
    const p = j / n,
      phase = p * L.coils * Math.PI * 2,
      c = lockSpring(s, p);
    for (let i = 0; i <= k; i++) {
      const v = (i / k) * Math.PI * 2,
        r = L.wireRadius * Math.cos(v);
      a.setXYZ(
        j * (k + 1) + i,
        c[0] + r * Math.cos(phase),
        c[1] + L.wireRadius * Math.sin(v),
        c[2] + r * Math.sin(phase),
      );
    }
  }
  a.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}
export default function LockStudio({
  pose,
  selected,
  focus,
  progress,
}: {
  pose: LockPose;
  selected: number;
  focus: string;
  progress: number;
}) {
  const film = useShowcase(),
    state = useRef({ pose, selected, focus, progress, film });
  state.current = { pose, selected, focus, progress, film };
  return (
    <Studio
      className="lock-studio"
      exposure={1.12}
      cameraPosition={[-6, 5, 12]}
      target={[1.6, 2.2, 0]}
      span={14.8}
      fitHeight={6}
      label={t('弹子锁剖面：钥匙、六组弹子、弹簧、锁芯和固定外壳连成一个机构')}
      fallback={<LockSection pose={pose} selected={selected} />}
      create={({ root, camera, controls }) => {
        root.position.y = 1.5;
        const housing = material('#4a626b', 0.67, 0.35),
          brass = material('#c2a16d', 0.75, 0.28),
          nickel = material('#c2cdcd', 0.78, 0.27),
          keyMat = material('#c5bda7', 0.72, 0.26),
          accent = material('#b06848', 0.66, 0.33),
          base = material('#aeb7b3', 0.36, 0.48);
        for (const mat of [housing, brass, nickel, keyMat, accent, base])
          mat.side = THREE.DoubleSide;
        const mesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material) => {
          const obj = new THREE.Mesh(g, m);
          obj.castShadow = true;
          obj.receiveShadow = true;
          parent.add(obj);
          return obj;
        };
        const extrude = (
          parent: THREE.Object3D,
          shape: THREE.Shape,
          depth: number,
          x: number,
          m: THREE.Material,
        ) => {
          const obj = mesh(
            parent,
            new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }),
            m,
          );
          obj.rotation.y = Math.PI / 2;
          obj.position.x = x;
          return obj;
        };
        const circle = (r: number) => {
          const s = new THREE.Shape();
          s.absarc(0, 0, r, 0, Math.PI * 2, false);
          return s;
        };
        const annulus = (inner: number, outer: number) => {
          const s = circle(outer),
            h = new THREE.Path();
          h.absarc(0, 0, inner, 0, Math.PI * 2, true);
          s.holes.push(h);
          return s;
        };
        const rearSlice = (outer: number, inner: number, cut: number) => {
          const s = new THREE.Shape(),
            a = Math.acos(cut / outer),
            pts: THREE.Vector2[] = [];
          for (let i = 0; i <= 64; i++) {
            const b = -a + (2 * a * i) / 64;
            pts.push(new THREE.Vector2(outer * Math.cos(b), outer * Math.sin(b)));
          }
          if (inner > 0) {
            const b = Math.acos(cut / inner);
            for (let i = 0; i <= 64; i++) {
              const c = b - (2 * b * i) / 64;
              pts.push(new THREE.Vector2(inner * Math.cos(c), inner * Math.sin(c)));
            }
          }
          s.setFromPoints(pts);
          s.closePath();
          return s;
        };
        const fixed = new THREE.Group(),
          plug = new THREE.Group();
        root.add(fixed, plug);
        box(fixed, [6.7, 0.13, 2.05], [2.9, -1.4, 0], base, 0.045);
        for (const x of [0.32, 5.48]) {
          box(fixed, [0.45, 0.42, 1.05], [x, -1.22, 0], housing, 0.07);
          for (const z of [-0.4, 0.4]) {
            const b = mesh(fixed, new THREE.CylinderGeometry(0.047, 0.047, 0.08, 20), nickel);
            b.position.set(x, -1.31, z);
          }
        }
        extrude(
          fixed,
          rearSlice(L.housingRadius, L.radius + L.runningGap, 0.19),
          L.length,
          0,
          housing,
        );
        for (const x of [0, L.length - 0.22])
          extrude(fixed, annulus(L.radius + L.runningGap, L.housingRadius), 0.22, x, housing);
        // Bible back wall, bored semicircular channels, and a common fixed spring cap.
        box(fixed, [L.length, 1.99, 0.18], [L.length / 2, 2.105, -0.33], housing, 0.035);
        box(fixed, [L.length, 0.12, 0.72], [L.length / 2, L.springSeat + 0.06, 0], housing, 0.025);
        for (const x of [0.14, L.length - 0.14])
          box(fixed, [0.28, 1.89, 0.67], [x, 2.105, 0], housing, 0.025);
        for (const x of L.stations) {
          const tube = mesh(
            fixed,
            sleeveGeometry(
              L.boreRadius,
              0.245,
              (z) => Math.sqrt((L.radius + L.runningGap) ** 2 - z * z),
              () => L.springSeat,
            ),
            housing,
          );
          tube.position.x = x;
        }
        // Plug: true keyway in both end faces, a rear cutaway, keyway floor and bored radial guides.
        const front = circle(L.radius),
          hole = new THREE.Path();
        hole.moveTo(-L.keywayHalfWidth, L.keyFloor);
        hole.lineTo(-L.keywayHalfWidth, L.keywayTop);
        hole.lineTo(L.keywayHalfWidth, L.keywayTop);
        hole.lineTo(L.keywayHalfWidth, L.keyFloor);
        hole.closePath();
        front.holes.push(hole);
        extrude(plug, front, 0.3, 0, brass);
        extrude(plug, front, 0.3, L.length - 0.3, brass);
        extrude(plug, rearSlice(L.radius, 0, 0.19), L.length - 0.6, 0.3, brass);
        box(plug, [L.length, 0.12, 0.35], [L.length / 2, L.keyFloor - 0.06, 0], brass, 0.008);
        box(
          plug,
          [L.length, L.keywayTop - L.keyFloor, 0.05],
          [L.length / 2, (L.keywayTop + L.keyFloor) / 2, -0.165],
          brass,
          0.004,
        );
        for (const x of L.stations) {
          const guide = mesh(
            plug,
            sleeveGeometry(
              L.boreRadius,
              0.245,
              () => L.keywayTop,
              (z) => Math.sqrt(L.radius ** 2 - z * z),
            ),
            brass,
          );
          guide.position.x = x;
        }
        // Rear actuator is attached to the plug; a door latch is outside this cylinder model.
        extrude(plug, circle(0.22), 0.55, L.length, brass);
        box(plug, [0.8, 0.19, 0.12], [L.length + 0.6, 0, 0], nickel, 0.025);
        const lower: THREE.Mesh[] = [],
          upper: THREE.Mesh[] = [],
          springs: THREE.Mesh[] = [];
        L.stations.forEach((x, i) => {
          const pin = mesh(plug, pinGeometry(L.radius - L.cuts[i], false), brass);
          pin.position.x = x;
          lower.push(pin);
          const driver = mesh(fixed, pinGeometry(L.driverLength, true), nickel);
          driver.position.x = x;
          upper.push(driver);
          const spring = mesh(fixed, springGeometry(), nickel);
          springs.push(spring);
        });
        const keyGroup = new THREE.Group();
        plug.add(keyGroup);
        const keys = {} as Record<LockKey, THREE.Mesh>;
        for (const type of ['matching', 'high', 'low'] as const) {
          const profile = lockKeyProfile(type),
            shape = new THREE.Shape();
          shape.moveTo(0, L.keyBottom);
          shape.lineTo(L.keyTip, L.keyBottom);
          for (const [x, y] of [...profile].reverse()) shape.lineTo(x, y);
          shape.closePath();
          const blade = mesh(
            keyGroup,
            new THREE.ExtrudeGeometry(shape, {
              depth: 2 * L.keyHalfWidth,
              bevelEnabled: false,
              curveSegments: 32,
            }),
            keyMat,
          );
          blade.position.z = -L.keyHalfWidth;
          keys[type] = blade;
        }
        const bow = new THREE.Shape();
        bow.absellipse(-1.2, -0.05, 0.7, 0.66, 0, Math.PI * 2, false, 0);
        const eye = new THREE.Path();
        eye.absellipse(-1.2, 0.01, 0.39, 0.31, 0, Math.PI * 2, true, 0);
        bow.holes.push(eye);
        const head = mesh(
          keyGroup,
          new THREE.ExtrudeGeometry(bow, {
            depth: 0.22,
            bevelEnabled: true,
            bevelSize: 0.018,
            bevelThickness: 0.018,
            bevelSegments: 2,
            steps: 1,
            curveSegments: 32,
          }),
          keyMat,
        );
        head.position.z = -0.11;
        box(keyGroup, [0.84, 0.73, 0.2], [-0.42, -0.235, 0], keyMat, 0.018);
        const witness = mesh(keyGroup, new THREE.SphereGeometry(0.055, 18, 12), accent);
        witness.position.set(-1.2, 0.47, 0.14);
        const contact = mesh(root, new THREE.SphereGeometry(0.035, 16, 12), accent);
        const shear = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0.3, Math.sqrt(L.radius ** 2 - 0.27 ** 2), 0.27),
            new THREE.Vector3(L.length - 0.3, Math.sqrt(L.radius ** 2 - 0.27 ** 2), 0.27),
          ]),
          new THREE.LineBasicMaterial({ color: '#719b91', transparent: true, opacity: 0.8 }),
        );
        root.add(shear);
        const target = new THREE.Vector3(),
          direction = new THREE.Vector3();
        let lastSignature = '';
        return {
          update: () => {
            const v = state.current,
              m = v.pose;
            plug.rotation.x = m.angle;
            keyGroup.position.x = m.offset;
            for (const type of ['matching', 'high', 'low'] as const)
              keys[type].visible = m.key === type;
            const signature = m.stacks.map((s) => s.tip.toFixed(8)).join(',');
            m.stacks.forEach((s, i) => {
              lower[i].position.y = s.tip;
              upper[i].position.y = s.interfaceY;
              lower[i].material = i === v.selected ? accent : brass;
              if (signature !== lastSignature) springUpdate(springs[i].geometry, s);
            });
            lastSignature = signature;
            const s = m.stacks[v.selected];
            contact.position.set(s.contact[0], s.contact[1], 0);
            contact.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), m.angle);
            contact.visible =
              s.supportedByKey && (v.focus === 'contact' || v.focus === 'insertion');
            shear.visible = m.angle === 0;
            if (v.film.watch) {
              const compact = camera.aspect < 1.5,
                turning = v.focus === 'turn' || v.focus === 'return';
              let span = 14.8,
                height = 5.7;
              if (turning) {
                target.set(compact ? 0.2 : 2.1, 2.25, 0);
                direction.set(-10, 2.7, compact ? 2.8 : 8);
                span = compact ? 4.9 : 9.2;
                height = compact ? 5.2 : 7.2;
              } else if (v.focus === 'contact') {
                target.set(s.x, 2.65, 0);
                direction.set(-1.4, 1.7, 12);
                span = 5.1;
                height = 4.8;
              } else {
                target.set(v.focus === 'line' ? 2.75 : (4.95 + m.offset) / 2, 2.15, 0);
                direction.set(-3.8, 2.5, 13);
                span = v.focus === 'line' ? 9.2 : Math.max(9.5, (8.75 - m.offset) * 1.3);
              }
              controls.target.copy(target);
              const h = Math.max(span / camera.aspect, height),
                distance = h / (2 * Math.tan((camera.fov * Math.PI) / 360));
              camera.position.copy(target).addScaledVector(direction.normalize(), distance);
            }
          },
        };
      }}
    />
  );
}
