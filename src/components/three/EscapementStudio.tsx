import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import { box, material } from './parts';
import { useShowcase } from '../lab/Showcase';
import { t } from '../../i18n';
import {
  ESC,
  ESC_PALLETS,
  escapementWheelOutline,
  escapementTooth,
  escapementCamera,
  type EscPoint,
  type EscPose,
} from '../../models/escapement';
import { EscapementDiagram } from './EscapementDiagram';
function plate(points: EscPoint[], depth: number) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function ring(inside: number, outside: number, depth: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, outside, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inside, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 64 });
}
export default function EscapementStudio({
  pose,
  focus,
  progress,
}: {
  pose: EscPose;
  focus: string;
  progress: number;
}) {
  const film = useShowcase(),
    live = useRef({ pose, focus, progress, watch: film.watch });
  live.current = { pose, focus, progress, watch: film.watch };
  const create = ({ root, camera, controls }: StudioContext) => {
    const mechanism = new THREE.Group();
    mechanism.position.y = 2.21;
    root.add(mechanism);
    const brass = material('#bc985c', 0.73, 0.28),
      steel = material('#789298', 0.7, 0.28),
      dark = material('#314d54', 0.48, 0.4),
      wood = material('#635a4a', 0.12, 0.72),
      ruby = material('#9d594b', 0.22, 0.4),
      accent = material('#3d9188', 0.4, 0.32);
    const mesh = (
      g: THREE.BufferGeometry,
      m: THREE.Material,
      parent: THREE.Object3D = mechanism,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      parent.add(o);
      return o;
    };
    const cylinder = (
      r: number,
      h: number,
      m: THREE.Material,
      parent: THREE.Object3D = mechanism,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const o = mesh(new THREE.CylinderGeometry(r, r, h, 48), m, parent, x, y, z);
      o.rotation.x = Math.PI / 2;
      return o;
    };
    const line = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      r: number,
      m: THREE.Material,
      parent: THREE.Object3D,
    ) => {
      const o = mesh(new THREE.CylinderGeometry(r, r, 1, 16), m, parent);
      const v = b.clone().sub(a);
      o.position.copy(a).add(b).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      o.scale.y = v.length();
      return o;
    };
    box(mechanism, [3.8, 0.25, 2], [0, -2.085, -0.15], wood, 0.075);
    for (const x of [-1.72, 1.72]) {
      box(mechanism, [0.16, 4.42, 0.2], [x, 0.25, -0.85], dark, 0.035);
      cylinder(0.1, 0.12, brass, mechanism, x, -1.72, -0.69);
    }
    for (const y of [0, ESC.height, 2.48])
      box(mechanism, [3.5, 0.15, 0.18], [0, y, -0.85], dark, 0.025);
    // Two bored rear bearing seats; no shaft terminates in empty space.
    for (const y of [0, ESC.height]) {
      mesh(ring(0.095, 0.2, 0.3), brass, mechanism, 0, y, -0.82);
      cylinder(0.09, 0.96, steel, mechanism, 0, y, -0.33);
      cylinder(0.14, 0.06, brass, mechanism, 0, y, 0.15);
    }
    const wheel = new THREE.Group();
    mechanism.add(wheel);
    const shape = new THREE.Shape();
    escapementWheelOutline().forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.1,
        b = a + (Math.PI * 2) / 5 - 0.24,
        hole = new THREE.Path();
      hole.moveTo(0.28 * Math.cos(a), 0.28 * Math.sin(a));
      hole.lineTo(0.95 * Math.cos(a), 0.95 * Math.sin(a));
      hole.absarc(0, 0, 0.95, a, b, false);
      hole.lineTo(0.28 * Math.cos(b), 0.28 * Math.sin(b));
      hole.absarc(0, 0, 0.28, b, a, true);
      hole.closePath();
      shape.holes.push(hole);
    }
    mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 2 * ESC.wheelHalfDepth,
        bevelEnabled: false,
        curveSegments: 64,
      }),
      brass,
      wheel,
      0,
      0,
      -ESC.wheelHalfDepth,
    );
    cylinder(0.22, 0.23, brass, wheel);
    // One permanently marked tooth lets a viewer follow identity across a full cycle.
    const markedTooth = escapementTooth(0, 0);
    const centre: EscPoint = [
      markedTooth.reduce((s, p) => s + p[0], 0) / 3,
      markedTooth.reduce((s, p) => s + p[1], 0) / 3,
    ];
    const paint: EscPoint[] = markedTooth.map((p) => [
      centre[0] + 0.65 * (p[0] - centre[0]),
      centre[1] + 0.65 * (p[1] - centre[1]),
    ]);
    mesh(plate(paint, 0.002), accent, wheel, 0, 0, ESC.wheelHalfDepth);
    const drum = new THREE.Group();
    mechanism.add(drum);
    cylinder(ESC.drumRadius, 0.21, dark, drum, 0, 0, ESC.drumZ);
    for (const z of [ESC.drumZ - 0.14, ESC.drumZ + 0.14])
      cylinder(0.315, 0.05, brass, drum, 0, 0, z);
    for (let i = 0; i < 9; i++)
      mesh(
        new THREE.TorusGeometry(0.284, 0.006, 6, 64),
        wood,
        drum,
        0,
        0,
        ESC.drumZ - 0.09 + i * 0.022,
      );
    const weight = new THREE.Group();
    mechanism.add(weight);
    cylinder(0.14, 0.13, brass, weight, ESC.drumRadius, -0.38, ESC.drumZ);
    box(weight, [0.28, 0.57, 0.28], [ESC.drumRadius, -0.315, ESC.drumZ], brass, 0.07);
    const rope = mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 10), wood);
    const anchor = new THREE.Group();
    anchor.position.y = ESC.height;
    mechanism.add(anchor);
    cylinder(0.17, 0.22, steel, anchor, 0, 0, -0.18);
    for (const pallet of ESC_PALLETS) {
      const [x, y] = pallet.attachment;
      line(new THREE.Vector3(0, 0, -0.29), new THREE.Vector3(x, y, -0.29), 0.065, steel, anchor);
      cylinder(
        0.058,
        ESC.palletStudFront - ESC.palletStudBack,
        steel,
        anchor,
        x,
        y,
        (ESC.palletStudFront + ESC.palletStudBack) / 2,
      );
      mesh(
        plate(pallet.outline, 2 * ESC.palletHalfDepth),
        ruby,
        anchor,
        0,
        0,
        -ESC.palletHalfDepth,
      );
      // The actual lock arc / impulse edge are highlighted, not a detached contact proxy.
      const points = [...pallet.lock.map(([a, b]) => new THREE.Vector3(a, b, 0.127))];
      mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.004, 5, false),
        accent,
        anchor,
      );
      line(
        new THREE.Vector3(...pallet.corner, 0.128),
        new THREE.Vector3(...pallet.discharge, 0.128),
        0.005,
        brass,
        anchor,
      );
    }
    // The front pendulum and anchor share one arbor in this direct-coupled teaching movement.
    const pendulum = new THREE.Group();
    pendulum.position.set(0, ESC.height, 0.52);
    mechanism.add(pendulum);
    cylinder(0.105, 0.55, steel, mechanism, 0, ESC.height, 0.28);
    const rod = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 16), steel, pendulum);
    const bob = cylinder(0.3, 0.16, brass, pendulum);
    const boss = cylinder(0.065, 0.18, dark, pendulum);
    const nut = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.065, 24), steel, pendulum);
    const contact = mesh(new THREE.SphereGeometry(0.019, 16, 12), accent);
    let oldFocus = '',
      oldAspect = 0,
      manualInitialized = false;
    return {
      update: () => {
        const s = live.current,
          p = s.pose;
        wheel.rotation.z = -p.wheel;
        drum.rotation.z = -p.wheel;
        anchor.rotation.z = p.anchor;
        pendulum.rotation.z = p.anchor;
        rod.position.y = -1.5 * p.length;
        rod.scale.y = 3 * p.length;
        bob.position.y = -3 * p.length;
        boss.position.y = bob.position.y;
        nut.position.y = bob.position.y - 0.31;
        weight.position.y = p.weightTop;
        rope.position.set(ESC.drumRadius, p.weightTop / 2, ESC.drumZ);
        rope.scale.y = -p.weightTop;
        contact.visible = p.contact !== null;
        if (p.contact) contact.position.set(p.contact[0], p.contact[1], 0.145);
        const changed = oldFocus !== s.focus || Math.abs(oldAspect - camera.aspect) > 0.001;
        if (s.watch || !manualInitialized || changed) {
          const fit = escapementCamera(camera.aspect, s.focus, s.progress);
          controls.target.set(...fit.target).add(new THREE.Vector3(0, 2.21, 0));
          camera.position
            .copy(controls.target)
            .addScaledVector(new THREE.Vector3(...fit.direction), fit.distance);
          camera.lookAt(controls.target);
          manualInitialized = true;
          oldFocus = s.focus;
          oldAspect = camera.aspect;
        }
      },
    };
  };
  return (
    <Studio
      create={create}
      label={t('格雷厄姆静止式擒纵三维剖面')}
      fallback={<EscapementDiagram pose={pose} focus={focus} />}
      className="escapement-studio"
      span={4.6}
      fitHeight={5.5}
      exposure={1.05}
      cameraPosition={[1, 4, 13]}
      target={[0, 2.5, 0]}
    />
  );
}
