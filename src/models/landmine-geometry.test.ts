import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createLandmineExterior, type LandmineVisual } from '../components/three/LandmineStudio';
import type { StudioContext } from '../components/three/Studio';
import { landmineShot, landmineWeather } from './landmine';
import {
  LANDMINE_SHELL_PROFILE,
  LANDMINE_GROUND,
  LANDMINE_DIRT_COUNT,
  landmineShellTop,
  landminePlant,
} from './landmine-geometry';

describe('landmine exterior projection and contact', () => {
  it('fits the actual closed meshes and handle throughout each camera transition', () => {
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100),
      target = new THREE.Vector3();
    camera.position.set(5, 4.5, 6);
    const live = {
      current: { reveal: 1, season: 0.1, closeup: 0, angle: 0.35, watch: true } as LandmineVisual,
    };
    const object = createLandmineExterior(live, {
      root,
      camera,
      controls: { target },
      scene: new THREE.Scene(),
    } as unknown as StudioContext);
    const body = root.getObjectByName('sealed-exterior')!;
    const bounds: THREE.Vector3[] = [];
    body.updateMatrixWorld(true);
    body.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      let b: THREE.Box3 | null;
      if (node instanceof THREE.InstancedMesh) {
        node.computeBoundingBox();
        b = node.boundingBox;
      } else {
        node.geometry.computeBoundingBox();
        b = node.geometry.boundingBox;
      }
      if (!b) return;
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z])
            bounds.push(new THREE.Vector3(x, y, z).applyMatrix4(node.matrixWorld));
    });
    for (const [w, h] of [
      [244, 320],
      [314, 320],
      [640, 380],
      [1100, 380],
    ])
      for (let chapter = 0; chapter < 7; chapter++)
        for (const p of [0, 0.08, 0.2, 0.45, 0.8, 1]) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          const s = landmineShot(chapter, p);
          live.current = {
            reveal: s.reveal,
            season: s.season,
            closeup: s.closeup,
            angle: s.angle,
            watch: true,
          };
          object.update();
          for (const vertex of bounds) {
            const q = vertex.clone().project(camera);
            expect(Math.abs(q.x)).toBeLessThan(0.87);
            expect(Math.abs(q.y)).toBeLessThan(0.87);
            expect(q.z).toBeGreaterThan(-1);
            expect(q.z).toBeLessThan(1);
          }
        }
    const earth = root.getObjectByName('opaque-earth-base') as THREE.Mesh;
    earth.geometry.computeBoundingBox();
    const top = earth.geometry.boundingBox!.max.y + earth.position.y;
    expect(top).toBeCloseTo(LANDMINE_SHELL_PROFILE[0][1], 7);
    expect((earth.material as THREE.MeshStandardMaterial).clippingPlanes?.length ?? 0).toBe(0);
    expect(earth.geometry.boundingBox!.max.x).toBeCloseTo(LANDMINE_GROUND.halfWidth, 6);
    object.dispose();
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        for (const m of Array.isArray(node.material) ? node.material : [node.material]) m.dispose();
      }
    });
  });
  it('keeps the authored camera continuous across all adjacent chapter boundaries', () => {
    for (let c = 0; c < 6; c++) {
      const end = landmineShot(c, 1),
        next = landmineShot(c + 1, 0);
      expect(end.closeup).toBeCloseTo(next.closeup, 12);
      expect(end.angle).toBeCloseTo(next.angle, 12);
    }
  });
  it('keeps dirt partly embedded in the actual shell surface and uses shared cover states', () => {
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100),
      live = {
        current: { reveal: 1, season: 0, closeup: 0, angle: 0.35, watch: true } as LandmineVisual,
      };
    camera.position.set(5, 4.5, 6);
    const object = createLandmineExterior(live, {
      root,
      camera,
      controls: { target: new THREE.Vector3() },
      scene: new THREE.Scene(),
    } as unknown as StudioContext);
    const dirt = root.getObjectByName('fixed-casing-dirt') as THREE.InstancedMesh,
      grass = root.getObjectByName('persistent-grass') as THREE.InstancedMesh,
      leaves = root.getObjectByName('persistent-leaf-litter') as THREE.InstancedMesh,
      m = new THREE.Matrix4(),
      point = new THREE.Vector3(),
      positions = dirt.geometry.attributes.position;
    expect(dirt.count).toBe(LANDMINE_DIRT_COUNT);
    for (let i = 0; i < dirt.count; i++) {
      dirt.getMatrixAt(i, m);
      const clearance: number[] = [];
      for (let j = 0; j < positions.count; j++) {
        point.fromBufferAttribute(positions, j).applyMatrix4(m);
        clearance.push(point.y - landmineShellTop(Math.hypot(point.x, point.z)).height);
      }
      // Inspect rendered sphere vertices, not only a proposed attachment height.
      // Every fleck must cross the shell; none can hover or remain hidden beneath it.
      expect(Math.min(...clearance)).toBeLessThan(0);
      expect(Math.min(...clearance)).toBeGreaterThan(-0.003);
      expect(Math.max(...clearance)).toBeGreaterThan(0.0025);
      expect(Math.max(...clearance)).toBeLessThan(0.0045);
    }
    const p = new THREE.Vector3(),
      scale = new THREE.Vector3(),
      rotation = new THREE.Quaternion();
    for (const season of [0, 0.07, 0.2, 0.5, 0.91, 1]) {
      live.current.season = season;
      object.update();
      const weather = landmineWeather(season);
      for (let i = 0; i < grass.count; i++) {
        grass.getMatrixAt(i, m);
        m.decompose(p, rotation, scale);
        const plant = landminePlant(Math.floor(i / 3));
        expect(p.x).toBeCloseTo(plant.x, 6);
        expect(p.y).toBeCloseTo(plant.y, 6);
        expect(p.z).toBeCloseTo(plant.z, 6);
        expect(scale.y).toBeCloseTo(plant.height * weather.grass, 6);
      }
      for (let i = 0; i < leaves.count; i++) {
        leaves.getMatrixAt(i, m);
        m.decompose(p, rotation, scale);
        const plant = landminePlant(i + 1200);
        expect(p.x).toBeCloseTo(plant.x, 6);
        expect(p.y).toBeCloseTo(plant.y + 0.012, 6);
        expect(p.z).toBeCloseTo(plant.z, 6);
        expect(scale.x).toBeCloseTo(weather.leafSize, 6);
        expect(scale.z).toBeCloseTo(weather.leafSize * 0.46, 6);
      }
    }
    object.dispose();
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material])
        material.dispose();
    });
  });
});
