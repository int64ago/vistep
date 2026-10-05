import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { bfsShot, bfsState, BFS_DEFAULT, type BfsShot } from '../../models/body-fat-scale';
import {
  BFS_GEOMETRY as G,
  bfsCameraFrame,
  bfsCurrentPath,
  bfsFramePoints,
  bfsMarkerFraction,
  bfsPathPoint,
  bfsSensePaths,
} from '../../models/body-fat-scale-geometry';
import { createBodyFatScale } from './BodyFatScaleStudio';
import BodyFatScaleFlat from './BodyFatScaleFlat';
import type { StudioContext } from './Studio';

const built: THREE.Group[] = [];
function assembly(shot: BfsShot, aspect = 334 / 320, watch = true) {
  const root = new THREE.Group(),
    scene = new THREE.Scene();
  scene.add(root);
  const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
  const controls = { target: new THREE.Vector3() };
  const live = { current: shot },
    directed = { current: watch };
  const object = createBodyFatScale(
    {
      root,
      scene,
      camera,
      controls,
      reducedMotion: { matches: false },
    } as unknown as StudioContext,
    live,
    directed,
  );
  built.push(root);
  const update = () => {
    object.update(0, 0, true);
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
  };
  update();
  return { root, camera, controls, live, directed, object, update };
}
function bounds(object: THREE.Object3D) {
  return new THREE.Box3().setFromObject(object);
}
function mesh(root: THREE.Object3D, name: string) {
  const result = root.getObjectByName(name);
  expect(result).toBeInstanceOf(THREE.Mesh);
  return result as THREE.Mesh;
}
afterEach(() => {
  for (const root of built) {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m));
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
  built.length = 0;
});

describe('body-fat scale real assembly', () => {
  it('keeps every bonded foil, beam and standoff in physical contact with the deck through the whole loading chapter', () => {
    const a = assembly(bfsShot(1, 0));
    for (const progress of [0, 0.2, 0.5, 1, 0.2]) {
      a.live.current = bfsShot(1, progress);
      a.update();
      const glass = bounds(mesh(a.root, 'glass-deck'));
      for (let i = 0; i < 4; i++) {
        const cell = a.root.getObjectByName(`load-cell-${i}`)!;
        const beam = bounds(mesh(cell, 'elastic-beam')),
          gauge = bounds(mesh(cell, 'bonded-strain-gauge')),
          standoff = bounds(mesh(cell, 'load-standoff'));
        expect(gauge.min.y).toBeCloseTo(beam.max.y, 6);
        expect(standoff.min.y).toBeCloseTo(beam.max.y, 6);
        expect(standoff.max.y).toBeGreaterThanOrEqual(glass.min.y);
        expect(standoff.max.y - glass.min.y).toBeLessThan(0.01);
        expect(standoff.min.x).toBeGreaterThan(gauge.max.x);
        expect(standoff.min.x).toBeGreaterThan(beam.min.x);
        expect(standoff.max.x).toBeLessThan(beam.max.x + 0.01);
        const foot = cell.children.find(
          (o) => o instanceof THREE.Mesh && o.geometry instanceof THREE.CylinderGeometry,
        )!;
        expect(bounds(foot).min.y).toBeCloseTo(0.005, 6);
      }
    }
  });

  it('terminates all four actual metal pins inside their packages and routes the source return internally', () => {
    const a = assembly(bfsShot(2, 0.8));
    const pins: THREE.Object3D[] = [];
    a.root.traverse((o) => {
      if (o.name === 'measurement-pin') pins.push(o);
    });
    expect(pins).toHaveLength(4);
    pins.forEach((pin, i) => {
      const chip = mesh(a.root, i < 2 ? 'ac-source' : 'voltage-amplifier');
      expect(bounds(pin).intersectsBox(bounds(chip))).toBe(true);
      const port = i < 2 ? G.sourcePorts[i] : G.voltagePorts[i - 2];
      expect(bounds(pin).containsPoint(new THREE.Vector3(...port))).toBe(true);
    });
    const closed = a.root.getObjectByName('closed-current-path')!;
    const internal = closed.children.at(-1)!;
    const chip = bounds(mesh(a.root, 'ac-source'));
    const inside = bounds(internal);
    // The connection reaches the two real package pins in x; y/z stay
    // within the source package rather than shorting the two body legs.
    expect(inside.min.y).toBeGreaterThan(chip.min.y);
    expect(inside.max.y).toBeLessThan(chip.max.y);
    expect(inside.min.z).toBeGreaterThan(chip.min.z);
    expect(inside.max.z).toBeLessThan(chip.max.z);
  });

  it('rebuilds the whole body/scale framing at narrow and desktop aspects on a paused seek', () => {
    for (const aspect of [264 / 320, 334 / 320, 980 / 342])
      for (const chapter of [0, 1, 2]) {
        const a = assembly(bfsShot(chapter, 0.7), aspect);
        const frame = bfsCameraFrame(aspect, a.live.current.view);
        expect(a.camera.position.distanceTo(new THREE.Vector3(...frame.position))).toBeLessThan(
          1e-10,
        );
        for (const p of bfsFramePoints(a.live.current.view)) {
          const projected = new THREE.Vector3(...p).project(a.camera);
          expect(Math.abs(projected.x)).toBeLessThan(0.861);
          expect(Math.abs(projected.y)).toBeLessThan(0.841);
          expect(projected.z).toBeGreaterThan(-1);
          expect(projected.z).toBeLessThan(1);
        }
        a.live.current = bfsShot(2, 0.9);
        a.update();
        a.live.current = bfsShot(chapter, 0.7);
        a.update();
        expect(a.camera.position.distanceTo(new THREE.Vector3(...frame.position))).toBeLessThan(
          1e-10,
        );
      }
  });

  it('fits exploration once then preserves a user Orbit pose while model inputs change', () => {
    const a = assembly(bfsShot(2, 0.7), 334 / 320, false);
    a.camera.position.set(4, 4, 5);
    a.controls.target.set(0.1, 1, 0.2);
    const camera = a.camera.position.clone(),
      target = a.controls.target.clone();
    a.live.current = {
      ...a.live.current,
      ...bfsState({ ...BFS_DEFAULT, waterDeltaL: 2, phaseCycles: 0.3 }),
    };
    a.object.update(0.016, 10, false);
    expect(a.camera.position).toEqual(camera);
    expect(a.controls.target).toEqual(target);
    a.live.current = bfsShot(0, 0.4);
    a.update();
    expect(a.camera.position).not.toEqual(camera);
    a.directed.current = true;
    a.live.current = bfsShot(2, 0.7);
    a.update();
    expect(
      a.camera.position.distanceTo(
        new THREE.Vector3(...bfsCameraFrame(a.camera.aspect, 'route').position),
      ),
    ).toBeLessThan(1e-10);
  });

  it('uses the real closed polyline and removes all current/sense render paths on lost contact', () => {
    const a = assembly(bfsShot(2, 0.8));
    const current = a.root.getObjectByName('closed-current-path')!;
    const points = bfsCurrentPath();
    expect(current.children).toHaveLength(points.length - 1);
    current.children.forEach((o, i) => {
      const m = o as THREE.Mesh<THREE.CylinderGeometry>;
      const p = points[i],
        q = points[i + 1];
      expect(m.geometry.parameters.height).toBeCloseTo(
        Math.hypot(...p.map((v, j) => q[j] - v)),
        10,
      );
      expect(
        m.position.distanceTo(
          new THREE.Vector3(...p).add(new THREE.Vector3(...q)).multiplyScalar(0.5),
        ),
      ).toBeLessThan(1e-10);
    });
    const markers = a.root.children.filter(
      (o) =>
        o instanceof THREE.Mesh &&
        o.geometry instanceof THREE.SphereGeometry &&
        o.geometry.parameters.radius === 0.043,
    );
    expect(markers).toHaveLength(12);
    markers.forEach((m, i) =>
      expect(
        m.position.distanceTo(
          new THREE.Vector3(
            ...bfsPathPoint(points, bfsMarkerFraction(i, 12, a.live.current.phaseCycles)),
          ),
        ),
      ).toBeLessThan(1e-10),
    );
    a.live.current = { ...a.live.current, ...bfsState({ ...BFS_DEFAULT, contact: false }) };
    a.update();
    expect(current.visible).toBe(false);
    expect(a.root.getObjectByName('voltage-sense-0')!.visible).toBe(false);
    expect(a.root.getObjectByName('voltage-sense-1')!.visible).toBe(false);
    expect(markers.every((m) => !m.visible)).toBe(true);
  });
});

describe('same-state two-dimensional measurement path', () => {
  it('uses exact shared electrical endpoints and the same AC markers without an independent clock', () => {
    for (const width of [264, 334]) {
      const shot = bfsShot(2, 0.8),
        scale = Math.min(72, (width - 32) / 3.7);
      const project = (p: readonly number[]) => [
        width / 2 + p[0] * scale,
        287 - p[1] * 65 - p[2] * 28,
      ];
      const html = renderToStaticMarkup(<BodyFatScaleFlat shot={shot} width={width} />);
      const points = bfsCurrentPath().map(project);
      expect(html).toContain(`d="M${points.map((p) => p.join(',')).join(' L')}"`);
      for (const line of bfsSensePaths())
        expect(html).toContain(
          `d="M${line
            .map(project)
            .map((p) => p.join(','))
            .join(' L')}"`,
        );
      expect((html.match(/r="3.3"/g) ?? []).length).toBe(Math.ceil(shot.routeReveal * 12));
      expect(html).not.toMatch(/NaN|Infinity|font-size="(?:[0-9]|1[0-5])"/);
      const open = { ...shot, ...bfsState({ ...BFS_DEFAULT, contact: false }) };
      const openHtml = renderToStaticMarkup(<BodyFatScaleFlat shot={open} width={width} />);
      expect(openHtml).not.toContain('data-bfs-current');
      expect(openHtml).not.toContain('data-bfs-sense');
      expect(openHtml).not.toContain('r="3.3"');
    }
  });

  it('shows voltage paths only at the same chapter reveal as the physical renderer', () => {
    for (const progress of [0.1, 0.7]) {
      const s = bfsShot(2, progress);
      const html = renderToStaticMarkup(<BodyFatScaleFlat shot={s} width={334} />);
      expect(html.includes('data-bfs-sense')).toBe(s.routeReveal > 0.45);
    }
  });
});
