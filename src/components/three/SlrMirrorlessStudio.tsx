import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  cameraGeometry as g,
  cameraPathPoint,
  cameraPrism,
  type CameraPose,
} from '../../models/slr-mirrorless';
import {
  cameraElectronics as e,
  cameraSignalPoint,
  cameraSignalRoutes,
  type CameraSignalPoint,
} from '../../models/slr-mirrorless-render-geometry';
import { useShowcase } from '../lab/Showcase';
import Studio from './Studio';
import { box, material } from './parts';
import SlrMirrorlessDiagram from './SlrMirrorlessDiagram';
type Props = {
  dslr: CameraPose;
  mirrorless: CameraPose;
  active: 'dslr' | 'mirrorless' | 'both';
  trace: number;
  compact: boolean;
};
const axis = new THREE.Vector3(0, 1, 0);
function segment(parent: THREE.Object3D, mat: THREE.Material, radius = 0.025) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), mat);
  parent.add(mesh);
  return mesh;
}
function placeSegment(
  mesh: THREE.Mesh,
  a: { x: number; y: number },
  b: { x: number; y: number },
  z = 0,
) {
  const direction = new THREE.Vector3(b.x - a.x, b.y - a.y, 0);
  mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
  mesh.scale.y = direction.length();
  if (direction.lengthSq() > 1e-12) mesh.quaternion.setFromUnitVectors(axis, direction.normalize());
  mesh.visible = mesh.scale.y > 1e-6;
}
function placeSignalSegment(mesh: THREE.Mesh, a: CameraSignalPoint, b: CameraSignalPoint) {
  const direction = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
  mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  mesh.scale.y = direction.length();
  mesh.quaternion.setFromUnitVectors(axis, direction.normalize());
}
export function cameraAssembly(parent: THREE.Group, dslr: boolean) {
  const dark = material('#2e4147', 0.4, 0.4),
    alloy = material('#a0acaf', 0.72, 0.24),
    brass = material('#b69c72', 0.7, 0.32);
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#aacbd4',
    roughness: 0.08,
    transmission: 0.75,
    thickness: 0.18,
    ior: 1.5,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shell = new THREE.Group();
  parent.add(shell);
  box(shell, [2.7, 0.14, 1.6], [0.2, 0.14, -0.05], dark, 0.06);
  box(shell, [2.7, 1.57, 0.12], [0.2, 0.97, -0.78], dark, 0.06);
  // Remove the near half of the side wall, not its depth test. The open
  // section exposes the side PCB and flex without drawing a signal through it.
  const sideDepth = e.cutZ + 0.83;
  box(shell, [0.15, 1.7, sideDepth], [1.55, 0.97, (e.cutZ - 0.83) / 2], dark, 0.035).name =
    'cut-side-wall';
  box(shell, [0.16, 1.68, 0.035], [1.55, 0.97, e.cutZ], brass, 0.01);
  box(shell, [0.17, 0.38, 1.48], [-1.1, 0.39, -0.08], dark, 0.035);
  box(shell, [0.17, 0.38, 1.48], [-1.1, 1.58, -0.08], dark, 0.035);
  box(shell, [0.32, 1.2, 0.5], [1.77, 0.85, -0.46], dark, 0.13);
  box(shell, [0.2, 0.08, 0.32], [1.64, 1.51, -0.46], alloy, 0.04);
  // Half barrels expose their continuous coaxial optical assembly.
  const halfBarrel = (x: number, length: number, radius: number, mat: THREE.Material) => {
    const shape = new THREE.Shape();
    for (let i = 0; i <= 40; i++) {
      const a = (Math.PI * i) / 40;
      const y = Math.cos(a) * radius,
        z = -Math.sin(a) * radius;
      i ? shape.lineTo(y, z) : shape.moveTo(y, z);
    }
    for (let i = 40; i >= 0; i--) {
      const a = (Math.PI * i) / 40;
      shape.lineTo(Math.cos(a) * (radius - 0.065), -Math.sin(a) * (radius - 0.065));
    }
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false }),
      mat,
    );
    mesh.rotation.y = Math.PI / 2;
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, 1, 0);
    parent.add(mesh);
  };
  halfBarrel(-3.45, 2.31, 0.72, dark);
  for (const x of [-3.44, -3.2, -2.88, -2.06, -1.45, -1.15]) halfBarrel(x, 0.06, 0.77, alloy);
  for (let i = 0; i < 30; i++)
    box(parent, [0.027, 0.052, 0.09], [-2.82 + i * 0.023, 1.75, -0.06], dark, 0.006);
  for (const [x, radius, thick] of [
    [-3.24, 0.62, 0.16],
    [-2.32, 0.64, 0.22],
    [-1.44, 0.55, 0.13],
  ]) {
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const r = (i / 24) * radius;
      profile.push(new THREE.Vector2(r, (thick * (1 - (r / radius) ** 2)) / 2 + 0.015));
    }
    for (let i = 24; i >= 0; i--) {
      const r = (i / 24) * radius;
      profile.push(new THREE.Vector2(r, (-thick * (1 - (r / radius) ** 2)) / 2 - 0.015));
    }
    const lens = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), glass);
    lens.rotation.z = -Math.PI / 2;
    lens.position.set(x, 1, 0);
    parent.add(lens);
  }
  // A shared flange and aperture support, not disconnected floating glass.
  halfBarrel(-1.22, 0.12, 0.84, brass);
  const aperture = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.57, 48), alloy);
  aperture.rotation.y = Math.PI / 2;
  aperture.position.set(-1.86, 1, 0);
  parent.add(aperture);
  box(parent, [0.11, 1.43, 1.2], [1.24, 1, -0.02], brass, 0.025);
  const pixels = Array.from({ length: 16 }, (_, row) =>
    box(
      parent,
      [0.018, 1.3 / 16 - 0.007, 1.03],
      [1.17, 1.65 - ((row + 0.5) * 1.3) / 16, 0],
      new THREE.MeshStandardMaterial({
        color: '#6eb1bd',
        emissive: '#7da99d',
        emissiveIntensity: 0,
        metalness: 0.35,
        roughness: 0.25,
      }),
      0.003,
    ),
  );
  const curtainFirst = box(parent, [0.025, 1, 1.11], [1.02, 1, 0], dark, 0),
    curtainSecond = box(parent, [0.025, 1, 1.11], [0.97, 1, 0], alloy, 0);
  const blades = Array.from({ length: 6 }, (_, i) =>
    box(parent, [0.016, 0.011, 1.11], [0.953, 1.65 - i * 0.217, 0], dark, 0),
  );
  // A hollow finder with its near cover removed. The display and its flex
  // terminate inside this opening; the opaque solid box used to hide both.
  const eyepiece = new THREE.Group();
  eyepiece.name = 'cut-finder-housing';
  parent.add(eyepiece);
  box(eyepiece, [0.48, 0.39, 0.07], [1.51, 2.35, -0.245], dark, 0.03);
  for (const y of [2.18, 2.52]) box(eyepiece, [0.48, 0.05, 0.28], [1.51, y, -0.105], dark, 0.018);
  box(eyepiece, [0.06, 0.32, 0.28], [1.72, 2.35, -0.105], dark, 0.02);
  const finderMat = new THREE.MeshStandardMaterial({
    color: '#80b7c2',
    emissive: '#74acb8',
    emissiveIntensity: 0,
    roughness: 0.3,
  });
  box(parent, [0.02, 0.22, 0.34], [1.26, 2.35, 0], finderMat, 0.009).name = 'finder-display';
  const rearMat = new THREE.MeshStandardMaterial({
    color: '#75afb8',
    emissive: '#74acb8',
    emissiveIntensity: 0,
    roughness: 0.3,
  });
  box(parent, [0.07, 0.88, 0.85], [1.69, 1, 0.17], dark, 0.055);
  box(parent, [0.012, 0.69, 0.66], [1.642, 1, 0.17], rearMat, 0.005).name = 'rear-display';
  const eyeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.07, 40), glass);
  eyeLens.rotation.z = Math.PI / 2;
  eyeLens.position.set(1.78, 2.35, 0);
  parent.add(eyeLens);
  // Representative side electronics are physically mounted inside the
  // removed cover. Stand-offs connect the board back to the remaining wall.
  const pcb = material('#5b8472', 0.25, 0.6);
  box(
    parent,
    [e.board.width, e.board.height, e.board.depth],
    [e.board.x, e.board.y, e.board.z],
    pcb,
    0.01,
  ).name = 'exposed-pcb';
  for (const y of [0.29, 0.86])
    box(
      parent,
      [0.075, 0.075, e.board.z - e.cutZ],
      [1.55, y, (e.board.z + e.cutZ) / 2],
      alloy,
      0.01,
    );
  const processorMat = new THREE.MeshStandardMaterial({
    color: '#30484a',
    emissive: '#68bfc6',
    emissiveIntensity: 0,
    metalness: 0.35,
    roughness: 0.4,
  });
  box(
    parent,
    [e.processor.width, e.processor.height, e.processor.depth],
    [e.processor.x, e.processor.y, e.processor.z],
    processorMat,
    0.015,
  ).name = 'processor-package';
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 0.037;
    for (const y of [0.408, 0.662])
      box(parent, [0.023, 0.045, 0.025], [e.processor.x + offset, y, 0.72], brass, 0.004);
    for (const x of [1.328, 1.602])
      box(parent, [0.045, 0.023, 0.025], [x, e.processor.y + offset, 0.72], brass, 0.004);
  }
  box(
    parent,
    [0.095, 0.08, 0.07],
    [e.sensorTerminal.x, e.sensorTerminal.y, e.sensorTerminal.z],
    brass,
    0.009,
  ).name = 'sensor-connector';
  for (const terminal of [e.rearTerminal, ...(!dslr ? [e.finderTerminal] : [])])
    box(parent, [0.045, 0.085, 0.065], [terminal.x, terminal.y, terminal.z], brass, 0.006);
  const signalRoutes = cameraSignalRoutes(dslr);
  const flex = new THREE.Group();
  flex.name = 'exposed-flex';
  parent.add(flex);
  const signal = new THREE.Group();
  signal.name = 'electronic-signal';
  parent.add(signal);
  const signalMat = new THREE.MeshBasicMaterial({
    color: '#278b96',
  });
  const connections = new Set<string>();
  for (const [routeIndex, route] of signalRoutes.entries()) {
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1],
        b = route[i];
      const connection = JSON.stringify([a, b]);
      if (connections.has(connection)) continue;
      connections.add(connection);
      if (a.z === b.z) {
        const strip = box(
          flex,
          [0.074, Math.hypot(b.x - a.x, b.y - a.y), 0.022],
          [(a.x + b.x) / 2, (a.y + b.y) / 2, e.traceZ - 0.026],
          brass,
          0.006,
        );
        strip.rotation.z = -Math.atan2(b.x - a.x, b.y - a.y);
      } else {
        // A short bent connector enters the sensor/display at the cut edge.
        box(
          flex,
          [0.022, 0.074, Math.abs(b.z - a.z)],
          [a.x + 0.026, a.y, (a.z + b.z) / 2],
          brass,
          0.006,
        );
      }
      const wire = segment(signal, signalMat, 0.03);
      wire.name = `signal-${routeIndex}-${i - 1}`;
      wire.userData.ends = [a, b];
      placeSignalSegment(wire, a, b);
    }
  }
  const signalDots = signalRoutes.map((_, i) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: '#e0ffff' }),
    );
    signal.add(dot);
    dot.name = `signal-dot-${i}`;
    return dot;
  });
  const mirror = new THREE.Group();
  mirror.position.set(g.mirrorPivot.x, g.mirrorPivot.y, 0);
  parent.add(mirror);
  box(mirror, [g.mirrorLength, 0.065, 1.02], [-g.mirrorLength / 2, 0, 0], alloy, 0.01);
  const mirrored = new THREE.MeshStandardMaterial({
    color: '#c7e0e7',
    metalness: 0.98,
    roughness: 0.08,
  });
  box(mirror, [g.mirrorLength, 0.012, 0.94], [-g.mirrorLength / 2, 0.04, 0], mirrored, 0.002);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.21, 20), brass);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(g.mirrorPivot.x, g.mirrorPivot.y, 0);
  parent.add(hinge);
  const crank = segment(parent, brass, 0.035),
    link = segment(parent, alloy, 0.023);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.053, 16, 12), brass);
  parent.add(joint);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 24), dark);
  motor.rotation.x = Math.PI / 2;
  motor.position.set(g.drivePivot.x, g.drivePivot.y, -0.53);
  parent.add(motor);
  if (dslr) {
    box(parent, [1.34, 0.045, 1.08], [0, g.screen, 0], material('#c4c9bd', 0.1, 0.8), 0.018);
    const shape = new THREE.Shape();
    cameraPrism.forEach((p, i) => (i ? shape.lineTo(p.x, p.y) : shape.moveTo(p.x, p.y)));
    shape.closePath();
    const prism = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.84, bevelEnabled: false }),
      glass,
    );
    prism.position.z = -0.42;
    parent.add(prism);
    for (const [a, b] of [
      [cameraPrism[2], cameraPrism[3]],
      [cameraPrism[3], cameraPrism[4]],
    ]) {
      const coating = box(
        parent,
        [Math.hypot(b.x - a.x, b.y - a.y), 0.026, 0.88],
        [(a.x + b.x) / 2, (a.y + b.y) / 2, 0],
        alloy,
        0,
      );
      coating.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    }
  } else {
    mirror.visible = false;
    hinge.visible = false;
    crank.visible = false;
    link.visible = false;
    joint.visible = false;
    motor.visible = false;
    box(parent, [0.6, 0.08, 0.58], [1.46, 2.12, -0.02], dark, 0.04);
  }
  const rays = new THREE.Group();
  parent.add(rays);
  const rayMat = new THREE.MeshBasicMaterial({ color: '#d8b575', transparent: true, opacity: 0.8 });
  const raySegments = Array.from({ length: 8 }, () => segment(rays, rayMat, 0.015));
  const photon = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#fff1b8' }),
  );
  rays.add(photon);
  return {
    update(pose: CameraPose, trace: number, time: number) {
      mirror.rotation.z = pose.mirror.angle;
      if (dslr) {
        placeSegment(crank, pose.mirror.drive, pose.mirror.joint, 0.57);
        placeSegment(link, pose.mirror.joint, pose.mirror.attachment, 0.57);
        joint.position.set(pose.mirror.joint.x, pose.mirror.joint.y, 0.57);
      }
      for (const [mesh, a, b] of [
        [curtainFirst, pose.curtains.first, 1],
        [curtainSecond, 0, pose.curtains.second],
      ] as const) {
        mesh.visible = b - a > 1e-4;
        mesh.scale.y = 1.3 * (b - a);
        mesh.position.y = 1.65 - (1.3 * (a + b)) / 2;
      }
      blades.forEach((blade, i) => {
        const row = i / 6;
        blade.visible = row > pose.curtains.first || row < pose.curtains.second;
      });
      pixels.forEach((pixel, i) => {
        const mat = pixel.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = pose.live ? 0.3 : pose.rows[i] * 0.65;
        mat.color.set(pose.live ? '#7eb8be' : '#c5a16c');
      });
      finderMat.emissiveIntensity = pose.optical
        ? 0.35
        : !dslr && pose.live
          ? Math.min(1.5, pose.brightness * 0.4)
          : 0;
      finderMat.color.set(pose.optical ? '#abc4c5' : !dslr && pose.live ? '#75afb8' : '#233942');
      rearMat.emissiveIntensity = pose.live ? Math.min(1.5, pose.brightness * 0.4) : 0;
      rearMat.color.set(pose.live ? '#75afb8' : '#233942');
      signal.visible = pose.live;
      // Shared film time reconstructs the same teaching pulse on pause/seek.
      // Its pacing illustrates routing, not electronic transport latency.
      const pulse = ((time % 3.6) + 3.6) % 3.6;
      signalDots.forEach((dot, i) => {
        const progress = i === 0 ? pulse / 1.2 : (pulse - 1.5) / 2.1;
        dot.visible = progress >= 0 && progress <= 1;
        const p = cameraSignalPoint(signalRoutes[i], progress);
        dot.position.set(p.x, p.y, p.z);
      });
      processorMat.emissiveIntensity = pose.live ? (pulse >= 1.1 && pulse <= 1.6 ? 0.65 : 0.18) : 0;
      raySegments.forEach((line, i) => {
        line.visible = i < pose.path.length - 1;
        if (line.visible) placeSegment(line, pose.path[i], pose.path[i + 1], 0.025);
      });
      const p = cameraPathPoint(pose.path, trace < 1 ? trace : (time * 0.15) % 1);
      photon.position.set(p.x, p.y, 0.025);
      eyepiece.userData.optical = pose.optical;
    },
  };
}
export default function SlrMirrorlessStudio(props: Props) {
  const film = useShowcase(),
    current = useRef({ props, film });
  current.current = { props, film };
  const both = props.active === 'both';
  const fallback = (
    <div className={'slr-fallback ' + (both ? 'is-pair' : '')}>
      {(both || props.active === 'dslr') && (
        <SlrMirrorlessDiagram pose={props.dslr} trace={props.trace} time={film.time} />
      )}{' '}
      {(both || props.active === 'mirrorless') && (
        <SlrMirrorlessDiagram pose={props.mirrorless} time={film.time} />
      )}
    </div>
  );
  return (
    <Studio
      className="slr-studio"
      label={t('两种相机的实体切开模型；反光镜、快门帘、传感器与取景光路')}
      cameraPosition={[-3.5, 4.4, 10]}
      target={[both ? -1.12 : -1.1, 1.62, 0]}
      span={both ? 13.7 : 6.65}
      fitHeight={both ? 5.2 : 4.2}
      exposure={1.18}
      fallback={fallback}
      create={({ root }) => {
        const a = new THREE.Group(),
          b = new THREE.Group();
        root.add(a, b);
        if (both) {
          a.position.x = -3.1;
          b.position.x = 3.1;
        } else {
          a.visible = props.active === 'dslr';
          b.visible = props.active === 'mirrorless';
        }
        const optical = cameraAssembly(a, true),
          electronic = cameraAssembly(b, false);
        return {
          update() {
            const { props: p, film: f } = current.current;
            optical.update(p.dslr, p.trace, f.time);
            electronic.update(p.mirrorless, 1, f.time);
          },
        };
      }}
    />
  );
}
