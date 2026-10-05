import * as THREE from 'three';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  JELLY_DEFAULT,
  jellyFrame,
  jellyRun,
  jellyShot,
  jellyVortices,
} from '../../models/jellyfish';
import { createJellyfish, type JellyVisual } from './JellyfishStudio';
import type { StudioContext } from './Studio';
import JellyfishFlat, { jellyVortexSection } from './JellyfishFlat';
describe('Jellyfish renderer model agreement', () => {
  it('uses finite connected meshes at extreme poses and restores the full bell after a cutaway', () => {
    const root = new THREE.Group(),
      scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1.1, 0.1, 100);
    camera.position.set(2, 3, 7);
    scene.add(root);
    const controls = { target: new THREE.Vector3(0, 1.3, 0) },
      reducedMotion = { matches: true };
    const trace = jellyRun({ ...JELLY_DEFAULT, amplitude: 0.35 });
    const live: { current: JellyVisual } = {
      current: { frame: jellyFrame(trace, 0), shot: jellyShot(0, 0), watch: true },
    };
    const object = createJellyfish(live, {
      root,
      scene,
      camera,
      controls,
      reducedMotion,
    } as unknown as StudioContext);
    const outer = root.children[0].children[0] as THREE.Mesh;
    const fullCount = outer.geometry.getIndex()!.count;
    for (const chapter of [1, 4, 2, 6, 0])
      for (const p of [0, 0.5, 1]) {
        const shot = jellyShot(chapter, p);
        live.current = { frame: jellyFrame(trace, shot.time), shot, watch: true };
        object.update(0.03, 0, true);
        root.traverse((part) => {
          if (part instanceof THREE.Mesh || part instanceof THREE.Line) {
            const positions = part.geometry.getAttribute('position');
            expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
            if (part.geometry.getIndex())
              expect(
                Math.max(...Array.from(part.geometry.getIndex()!.array as ArrayLike<number>)),
              ).toBeLessThan(positions.count);
          }
        });
        expect(outer.geometry.getIndex()!.count).toBe(shot.section ? fullCount / 2 : fullCount);
      }
    const before = camera.position.clone();
    for (let i = 0; i < 60; i++) object.update(0.03, 0, true);
    expect(camera.position.distanceTo(before)).toBeLessThan(1e-10);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
    object.dispose();
    expect(scene.children).toHaveLength(1);
  });
  it('shows opposite local circulation in the same radial/vertical section, without rotating the whole ring', () => {
    const root = new THREE.Group(),
      scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 0.85, 0.1, 100);
    camera.position.set(2, 3, 7);
    scene.add(root);
    const trace = jellyRun(JELLY_DEFAULT),
      shot = jellyShot(3, 0.4);
    const original = jellyFrame(trace, 0.9);
    const live: { current: JellyVisual } = { current: { frame: original, shot, watch: true } };
    const object = createJellyfish(live, {
      root,
      scene,
      camera,
      controls: { target: new THREE.Vector3(0, 1.3, 0) },
      reducedMotion: { matches: true },
    } as unknown as StudioContext);
    const ringOrientations = root.children
      .filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.TorusGeometry)
      .map((c) => c.quaternion.toArray());
    const markerPositions: number[][] = [];
    for (const v of jellyVortices(original))
      for (const side of [-1, 1] as const) {
        const cross = jellyVortexSection(v, side, original.phase);
        const group = root.getObjectByName(`vortex-section:${v.type}:${side}`)!;
        expect(group.visible).toBe(true);
        expect(group.userData.sense).toBe(v.rotation * side);
        expect(group.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
        const line = group.children[0] as THREE.Line;
        const positions = line.geometry.getAttribute('position');
        cross.arc.forEach((p, i) => {
          expect(positions.getX(i)).toBeCloseTo(p[0], 6);
          expect(positions.getY(i)).toBeCloseTo(p[1], 6);
          expect(positions.getZ(i)).toBeCloseTo(0.02, 6);
          expect(Math.hypot(p[0] - cross.center[0], p[1] - cross.center[1])).toBeCloseTo(
            cross.radius,
            12,
          );
        });
        const a = cross.arc.at(-2)!,
          b = cross.arc.at(-1)!;
        const orientation =
          (a[0] - cross.center[0]) * (b[1] - cross.center[1]) -
          (a[1] - cross.center[1]) * (b[0] - cross.center[0]);
        expect(Math.sign(orientation)).toBe(v.rotation * side);
        expect(Math.sign(cross.head[0][0] - cross.head[1][0])).toBe(-v.rotation * side);
        markerPositions.push(group.children[2].position.toArray());
      }
    // Independent renderer elapsed time does not advance a paused flow marker.
    object.update(10, 100, true);
    const markers = () =>
      root.children
        .filter((c) => c.name.startsWith('vortex-section:'))
        .map((c) => c.children[2].position.toArray());
    expect(markers()).toEqual(markerPositions);
    live.current = { ...live.current, frame: jellyFrame(trace, 1.12) };
    object.update(0.03, 1000, true);
    expect(markers()).not.toEqual(markerPositions);
    live.current = { ...live.current, frame: original };
    object.update(0, 0, true);
    expect(markers()).toEqual(markerPositions);
    expect(
      root.children
        .filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.TorusGeometry)
        .map((c) => c.quaternion.toArray()),
    ).toEqual(ringOrientations);
    const still = jellyRun({ ...JELLY_DEFAULT, amplitude: 0 });
    live.current = { ...live.current, frame: jellyFrame(still, 0.9) };
    object.update(0, 0, true);
    expect(
      root.children.filter((c) => c.name.startsWith('vortex-section:')).every((c) => !c.visible),
    ).toBe(true);
    object.dispose();
  });
  it('retains the same direction-bearing arrows and deterministic phase markers in the flat fallback', () => {
    const trace = jellyRun(JELLY_DEFAULT),
      frame = jellyFrame(trace, 0.9);
    const visual: JellyVisual = { frame, shot: jellyShot(3, 0.4), watch: true };
    const markup = renderToStaticMarkup(createElement(JellyfishFlat, { visual }));
    for (const v of jellyVortices(frame))
      for (const side of [-1, 1] as const) {
        const section = jellyVortexSection(v, side, frame.phase);
        const project = (p: number[]) => [200 + p[0] * 104, 112 - p[1] * 104];
        const points = section.arc
          .map(project)
          .map((p) => p.map((n) => n.toFixed(2)).join(','))
          .join(' L');
        expect(markup).toContain(
          `data-vortex-section="${v.type}:${side}" data-vortex-sense="${v.rotation * side}"`,
        );
        expect(markup).toContain(`d="M${points}"`);
      }
    expect(renderToStaticMarkup(createElement(JellyfishFlat, { visual }))).toBe(markup);
    const changed = { ...visual, frame: jellyFrame(trace, 1.12) };
    expect(renderToStaticMarkup(createElement(JellyfishFlat, { visual: changed }))).not.toBe(
      markup,
    );
    const rest = {
      ...visual,
      frame: jellyFrame(jellyRun({ ...JELLY_DEFAULT, amplitude: 0 }), 0.9),
    };
    expect(renderToStaticMarkup(createElement(JellyfishFlat, { visual: rest }))).not.toContain(
      'data-vortex-section',
    );
  });
});
