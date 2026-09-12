import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HELICOPTER as H, helicopterSolve } from './helicopter';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  HELI_ART,
  helicopterAirfoil,
  helicopterSolids,
  helicopterWorldPoint,
} from './helicopter-geometry';
import { helicopterArtwork, HELICOPTER_COVER_VISUAL } from './helicopter-cover';
import {
  createHelicopter,
  fitHelicopterCamera,
  helicopterFramingPoints,
} from '../components/three/HelicopterStudio';

describe('shared helicopter surfaces and responsive projection', () => {
  it('has a closed symmetric airfoil and an actual full-radius blade beyond its grip', () => {
    const points = helicopterAirfoil(32);
    expect(points[0][0]).toBe(0);
    expect(Math.abs(points[32][1])).toBeLessThan(1e-12);
    expect(Math.max(...points.map((p) => p[1]))).toBeCloseTo(
      -Math.min(...points.map((p) => p[1])),
      12,
    );
    for (const s of helicopterSolids().filter(
      (s) => s.part === 'blade-a' || s.part === 'blade-b',
    )) {
      expect(Math.min(...s.vertices.map((p) => p[0]))).toBe(H.rootRadius);
      expect(Math.max(...s.vertices.map((p) => p[0]))).toBe(H.radius);
    }
    expect(Math.abs(HELI_ART.tail[0])).toBe(H.tailArm);
  });
  it('retains physical root and mast contacts for all pitch and azimuth states', () => {
    for (let j = 0; j < 36; j++)
      for (const collectiveDeg of [4, 13]) {
        const visual = {
          ...HELICOPTER_COVER_VISUAL,
          phase: (j * Math.PI) / 18,
          collectiveDeg,
          cyclicDeg: 3,
        };
        for (const frame of ['blade-a', 'blade-b'] as const) {
          const p = helicopterWorldPoint([0, 0, 0], frame, visual);
          expect(p).toEqual(HELI_ART.mast);
          const tip = helicopterWorldPoint([H.radius, 0, 0], frame, visual);
          expect(Math.hypot(...tip.map((v, i) => v - p[i]))).toBeCloseTo(H.radius, 12);
        }
      }
  });
  it('keeps static body pixels fixed during flat-renderer rotation', () => {
    const a = helicopterArtwork(320, 290),
      first = a.paths.find((p) => p.part === 'cabin-80')!;
    for (const phase of [0.7, 1.9, 3.2, 5.9]) {
      const b = helicopterArtwork(320, 290, { ...HELICOPTER_COVER_VISUAL, phase });
      expect(b.paths.find((p) => p.part === first.part)?.d).toBe(first.d);
    }
    expect(a.paths.length).toBeGreaterThan(700);
    expect(a.paths.every((p) => !/NaN|Infinity/.test(p.d))).toBe(true);
  });
  it('bounds the actual complete aircraft over camera angles, aspects and moving corners', () => {
    const envelope = helicopterFramingPoints(),
      solids = helicopterSolids();
    for (const aspect of [0.82, 1.09, 1.6, 2.5])
      for (const direction of [
        [4.8, 4.5, 12],
        [-5, 4, 12],
        [12, 5, 3],
      ]) {
        const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
          target = new THREE.Vector3(-0.4, 1.6, 0);
        camera.position.fromArray(direction);
        fitHelicopterCamera(camera, target, envelope);
        let maximumX = 0,
          maximumY = 0;
        for (let j = 0; j < 24; j++) {
          const visual = {
            ...HELICOPTER_COVER_VISUAL,
            phase: (j * Math.PI) / 12,
            collectiveDeg: 13,
            cyclicDeg: 3,
          };
          for (const s of solids)
            for (const p of s.vertices) {
              const projected = new THREE.Vector3(
                ...helicopterWorldPoint(p, s.frame, visual),
              ).project(camera);
              maximumX = Math.max(maximumX, Math.abs(projected.x));
              maximumY = Math.max(maximumY, Math.abs(projected.y));
            }
        }
        // Check every vertex, but avoid millions of assertion allocations in the full suite.
        const composition = `aspect=${aspect}, direction=${direction}`;
        expect(maximumX, composition).toBeLessThan(0.902);
        expect(maximumY, composition).toBeLessThan(0.902);
      }
  });
  it('keeps prescribed tip paths in one tilted plane with opposite connected roots', () => {
    for (const diskTiltDeg of [0, 10, 25])
      for (let j = 0; j < 96; j++) {
        const visual = { ...HELICOPTER_COVER_VISUAL, diskTiltDeg, phase: (j * Math.PI) / 48 };
        for (const frame of ['blade-a', 'blade-b'] as const) {
          const tip = helicopterWorldPoint([H.radius, 0, 0], frame, visual);
          expect(tip[1] - HELI_ART.mast[1]).toBeCloseTo(
            -tip[0] * Math.tan((diskTiltDeg * Math.PI) / 180),
            12,
          );
        }
      }
  });
  it('frames maximum actual thrust and tail-force endpoints through the renderer camera', () => {
    for (const aspect of [0.82, 1.2, 2.5])
      for (const view of ['aircraft', 'vector', 'torque']) {
        const state = helicopterSolve({
          collectiveDeg: 13,
          diskTiltDeg: view === 'vector' ? 25 : 0,
          tailBalance: 1.4,
        });
        const live = {
            current: {
              ...HELICOPTER_COVER_VISUAL,
              ...state,
              phase: 1.5,
              torque: view === 'torque',
              view,
            },
          },
          root = new THREE.Group(),
          camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
          controls = {
            target: new THREE.Vector3(-0.4, 1.6, 0),
            addEventListener() {},
            removeEventListener() {},
            minDistance: 0,
            maxDistance: 0,
          } as unknown as OrbitControls;
        camera.position.set(4.8, 4.5, 12);
        const object = createHelicopter(live, {
          root,
          camera,
          controls,
          scene: new THREE.Scene(),
          reducedMotion: { matches: false } as MediaQueryList,
        });
        object.update!();
        const angle = (state.diskTiltDeg * Math.PI) / 180,
          length = state.thrust * 0.0001,
          tip =
            view === 'torque'
              ? new THREE.Vector3(-4.7, 2.03, 0.25 + state.tailForce / 500)
              : new THREE.Vector3(
                  length * Math.sin(angle),
                  HELI_ART.mast[1] + length * Math.cos(angle),
                  0,
                ),
          projected = tip.project(camera);
        expect(Math.abs(projected.x)).toBeLessThan(0.93);
        expect(Math.abs(projected.y)).toBeLessThan(0.93);
        object.dispose!();
        root.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
            const m = node.material;
            (Array.isArray(m) ? m : [m]).forEach((mat) => mat.dispose());
          }
        });
      }
  });
  it('keeps normal fallback force arrows inside every supported composition at maximum inputs', () => {
    for (const [width, height] of [
      [254, 290],
      [324, 290],
      [800, 390],
    ])
      for (const diskTiltDeg of [0, 25]) {
        const state = helicopterSolve({ collectiveDeg: 13, diskTiltDeg, tailBalance: 1.4 });
        const art = helicopterArtwork(width, height, {
          ...HELICOPTER_COVER_VISUAL,
          ...state,
          view: 'vector',
          torque: true,
        });
        for (const point of [
          art.thrust.a,
          art.thrust.b,
          art.weight.a,
          art.weight.b,
          art.tail.a,
          art.tail.b,
        ]) {
          expect(point[0]).toBeGreaterThan(2);
          expect(point[0]).toBeLessThan(width - 2);
          expect(point[1]).toBeGreaterThan(2);
          expect(point[1]).toBeLessThan(height - 2);
        }
      }
  });
  it('protects the entire hub and tracked blade grip in the moving phone macro camera', () => {
    const protectedParts = helicopterSolids().filter((s) =>
      ['hub', 'teeter-bearing', 'mast-cap', 'blade-a-grip'].includes(s.part),
    );
    for (const aspect of [254 / 285, 324 / 285, 800 / 310])
      for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.3, Math.PI * 1.9]) {
        const live = {
            current: {
              ...HELICOPTER_COVER_VISUAL,
              view: 'cyclic',
              phase,
              collectiveDeg: 13,
              cyclicDeg: 3,
            },
          },
          root = new THREE.Group(),
          camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
          controls = {
            target: new THREE.Vector3(),
            addEventListener() {},
            removeEventListener() {},
            minDistance: 0,
            maxDistance: 0,
          } as unknown as OrbitControls;
        camera.position.set(4.8, 4.5, 12);
        const object = createHelicopter(live, {
          root,
          camera,
          controls,
          scene: new THREE.Scene(),
          reducedMotion: { matches: false } as MediaQueryList,
        });
        object.update!();
        for (const part of protectedParts)
          for (const p of part.vertices) {
            const projected = new THREE.Vector3(
              ...helicopterWorldPoint(p, part.frame, live.current),
            ).project(camera);
            expect(Math.abs(projected.x)).toBeLessThan(0.88);
            expect(Math.abs(projected.y)).toBeLessThan(0.88);
          }
        object.dispose!();
        root.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
            const m = node.material;
            (Array.isArray(m) ? m : [m]).forEach((mat) => mat.dispose());
          }
        });
      }
  });
});
