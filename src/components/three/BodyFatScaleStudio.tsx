import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import type { BfsShot } from '../../models/body-fat-scale';
import {
  BFS_GEOMETRY as G,
  bfsCameraFrame,
  bfsCurrentPath,
  bfsFootEllipsoids,
  bfsPathPoint,
  bfsMarkerFraction,
  bfsSensePaths,
  type BfsPoint,
} from '../../models/body-fat-scale-geometry';
import Studio, { type StudioContext } from './Studio';
import { box as partBox, material } from './parts';
import BodyFatScaleFlat from './BodyFatScaleFlat';
function box(
  parent: THREE.Object3D,
  size: readonly number[],
  position: readonly number[],
  mat: THREE.Material,
  radius = 0.025,
) {
  return partBox(parent, [...size], [...position], mat, radius);
}

function pipe(parent: THREE.Object3D, points: BfsPoint[], radius: number, mat: THREE.Material) {
  const group = new THREE.Group();
  for (let i = 1; i < points.length; i++) {
    const a = new THREE.Vector3(...points[i - 1]),
      b = new THREE.Vector3(...points[i]),
      vector = b.clone().sub(a);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, vector.length(), 10),
      mat,
    );
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
    group.add(mesh);
  }
  parent.add(group);
  return group;
}
export function createBodyFatScale(
  { root, camera, controls, reducedMotion }: StudioContext,
  live: { current: BfsShot },
  directed: { current: boolean } = { current: true },
) {
  const porcelain = material('#dce2de', 0.1, 0.36),
    steel = material('#8fa49d', 0.65, 0.36),
    rubber = material('#344541', 0.1, 0.75),
    copper = material('#be8b45', 0.35, 0.38);
  const base = box(root, G.base.size, G.base.at, porcelain, 0.18);
  base.name = 'scale-base';
  // A transparent inspection view reveals the separate measurement board
  // under the tempered-glass deck. No solid shell is claimed to be removed.
  base.material = new THREE.MeshStandardMaterial({
    color: '#dce2de',
    roughness: 0.42,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  porcelain.dispose();
  const deckGroup = new THREE.Group();
  root.add(deckGroup);
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#cfdfd9',
    roughness: 0.12,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    transmission: 0.12,
    thickness: 0.08,
    clearcoat: 1,
  });
  const deck = box(deckGroup, G.deck.size, G.deck.at, glass, 0.14);
  deck.name = 'glass-deck';
  G.electrodes.forEach((e) => {
    const pad = box(
      deckGroup,
      G.padSize,
      [e.at[0], e.at[1] - G.padSize[1] / 2, e.at[2]],
      steel,
      0.08,
    );
    pad.name = `electrode-${e.id}`;
    // A short contact/via passes through the glass thickness to its pad.
    pipe(
      deckGroup,
      [
        [e.at[0], 0.28, e.at[2]],
        [e.at[0], e.at[1], e.at[2]],
      ],
      0.024,
      copper,
    );
  });
  const display = box(deckGroup, [0.72, 0.018, 0.26], [0, 0.443, -1.02], rubber, 0.025);
  display.name = 'scale-display';
  const board = box(root, G.board.size, G.board.at, material('#3d675b', 0.1, 0.64), 0.04);
  board.name = 'measurement-board';
  [G.source, G.amplifier].forEach((chip, i) => {
    const part = box(root, chip.size, chip.at, rubber, 0.015);
    part.name = i ? 'voltage-amplifier' : 'ac-source';
  });
  [...G.sourcePorts, ...G.voltagePorts].forEach((p) => {
    const pin = box(root, G.pinSize, p, steel, 0.005);
    pin.name = 'measurement-pin';
  });
  const gauges: THREE.Mesh[] = [];
  const loadCells = live.current.cells.map((cell, i) => {
    const group = new THREE.Group();
    root.add(group);
    group.position.set(cell.x, 0.11, cell.z);
    group.name = `load-cell-${i}`;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.15, 20), rubber);
    foot.position.y = -0.03;
    group.add(foot);
    // A retained frame and an elastic central beam connect the ground foot
    // to the glass standoff. The foil is bonded to the beam's upper surface.
    box(group, [0.44, 0.06, 0.1], [0, 0.075, -0.14], steel, 0.02);
    box(group, [0.44, 0.06, 0.1], [0, 0.075, 0.14], steel, 0.02);
    box(group, [0.08, 0.06, 0.34], [-0.18, 0.075, 0], steel, 0.02);
    box(group, [0.08, 0.06, 0.34], [0.18, 0.075, 0], steel, 0.02);
    const beam = box(group, [0.3, 0.032, 0.1], [0, 0.09, 0], steel, 0.012);
    beam.name = 'elastic-beam';
    const gauge = box(group, [0.11, 0.009, 0.067], [-0.05, 0.1105, 0], copper.clone(), 0.005);
    gauge.name = 'bonded-strain-gauge';
    gauges.push(gauge);
    const beamTop = 0.09 + 0.032 / 2,
      deckContact = 0.245;
    const standoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, deckContact - beamTop, 16),
      steel,
    );
    standoff.position.set(0.1, (deckContact + beamTop) / 2, 0);
    standoff.name = 'load-standoff';
    group.add(standoff);
    pipe(
      root,
      [
        [cell.x, 0.225, cell.z],
        [cell.x * 0.75, 0.2, cell.z * 0.75],
        [0, 0.18, 0.5],
      ],
      0.012,
      material('#967d56', 0.15, 0.5),
    );
    return group;
  });
  const person = new THREE.Group();
  root.add(person);
  const skin = new THREE.MeshStandardMaterial({
    color: '#ba9283',
    roughness: 0.73,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  });
  const feet = ([-1, 1] as const).map((s) => {
    const group = new THREE.Group();
    group.position.x = s * 0.82;
    person.add(group);
    const ellipsoid = (at: number[], size: number[]) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), skin);
      mesh.position.fromArray(at);
      mesh.scale.fromArray(size);
      group.add(mesh);
      return mesh;
    };
    bfsFootEllipsoids(s).forEach((p) => ellipsoid(p.at, p.size));
    return group;
  });
  const body = new THREE.Group();
  root.add(body);
  const tissue = new THREE.MeshStandardMaterial({
    color: '#abc7c0',
    roughness: 0.6,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  for (const s of [-1, 1])
    pipe(
      body,
      [
        [s * 0.82, 0.9, 0.6],
        [s * 0.68, 2.1, 0.5],
        [s * 0.6, 3.05, 0.35],
      ],
      0.25,
      tissue,
    );
  const pelvis = box(body, [1.75, 0.55, 0.65], [0, 3.15, 0.3], tissue, 0.26);
  pelvis.name = 'equivalent-lower-trunk';
  const currentMat = new THREE.MeshBasicMaterial({
    color: '#b77b32',
    transparent: true,
    opacity: 0.88,
  });
  const currentPoints = bfsCurrentPath(),
    current = pipe(root, currentPoints, 0.027, currentMat);
  current.name = 'closed-current-path';
  const senseMat = new THREE.MeshBasicMaterial({
    color: '#467f8a',
    transparent: true,
    opacity: 0.92,
  });
  const sense = bfsSensePaths().map((p, i) => {
    const route = pipe(root, p, 0.023, senseMat);
    route.name = `voltage-sense-${i}`;
    return route;
  });
  const markers = Array.from({ length: 12 }, () => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.043, 12, 8),
      new THREE.MeshBasicMaterial({ color: '#e0b574' }),
    );
    root.add(m);
    return m;
  });
  const arrows = loadCells.map((cell) => {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(cell.position.x, 1.14, cell.position.z),
      0.45,
      0xb77b32,
      0.11,
      0.08,
    );
    root.add(arrow);
    return arrow;
  });
  let previousView = '',
    previousAspect = 0,
    previousExplode = -1;
  const cameraFrom = new THREE.Vector3(),
    cameraTo = new THREE.Vector3(),
    targetFrom = new THREE.Vector3(),
    targetTo = new THREE.Vector3();
  let blend = 1;
  const update = (dt: number, _elapsed: number, settle: boolean) => {
    const s = live.current;
    deckGroup.position.y = s.explode;
    person.visible = s.view !== 'weight';
    body.visible = s.view === 'route';
    feet[1].position.y = s.contact ? 0 : 0.4;
    skin.opacity = s.view === 'route' ? 0.24 : 0.94;
    (base.material as THREE.MeshStandardMaterial).opacity = s.view === 'object' ? 0.55 : 0.12;
    current.visible = s.view === 'route' && s.contact;
    sense.forEach((route) => {
      route.visible = s.view === 'route' && s.contact && s.routeReveal > 0.45;
    });
    markers.forEach((m, i) => {
      m.visible = current.visible && i / markers.length < s.routeReveal;
      // Markers oscillate about fixed path locations with the common phase.
      // They do not circulate one way and imply a DC body current.
      m.position.fromArray(
        bfsPathPoint(currentPoints, bfsMarkerFraction(i, markers.length, s.phaseCycles)),
      );
    });
    arrows.forEach((a, i) => {
      a.visible = s.view === 'weight';
      a.setLength(0.3 + s.cells[i].forceN / 1000, 0.1, 0.08);
    });
    gauges.forEach((g, i) =>
      (g.material as THREE.MeshStandardMaterial).emissive.setRGB(
        s.cells[i].strain * 90,
        s.cells[i].strain * 20,
        0,
      ),
    );
    const changed =
      previousView !== s.view ||
      previousAspect !== camera.aspect ||
      Math.abs(previousExplode - s.explode) > 0.02;
    if (changed) {
      const frame = bfsCameraFrame(camera.aspect, s.view, s.explode);
      cameraFrom.copy(camera.position);
      targetFrom.copy(controls.target);
      cameraTo.fromArray(frame.position);
      targetTo.fromArray(frame.target);
      blend = 0;
      previousView = s.view;
      previousAspect = camera.aspect;
      previousExplode = s.explode;
    }
    if (directed.current || changed) {
      blend =
        settle || reducedMotion.matches || !directed.current ? 1 : Math.min(1, blend + dt / 0.55);
      const ease = blend * blend * (3 - 2 * blend);
      camera.position.lerpVectors(cameraFrom, cameraTo, ease);
      controls.target.lerpVectors(targetFrom, targetTo, ease);
      camera.lookAt(controls.target);
    }
  };
  update(0, 0, true);
  return { update };
}
export default function BodyFatScaleStudio({ shot, width }: { shot: BfsShot; width: number }) {
  const live = useRef(shot);
  live.current = shot;
  const film = useShowcase(),
    directed = useRef(film.watch);
  directed.current = film.watch;
  return (
    <Studio
      create={(context) => createBodyFatScale(context, live, directed)}
      label={t('四电极体脂秤、双脚接触与两条独立测量链')}
      fallback={<BodyFatScaleFlat shot={shot} width={width} />}
      className="bfs-studio"
      cameraPosition={[5, 7, 8]}
      target={[0, 0.5, 0]}
      span={4.2}
      fitHeight={3.5}
      exposure={0.78}
    />
  );
}
