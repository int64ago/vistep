import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../lab/Showcase';
import InstantCamera from '../experiments/InstantCamera';
import {
  IC,
  IC_CAMERA_GEOMETRY as hardware,
  IC_FEED_MAX,
  icShot,
  type IcShot,
} from '../../models/instant-camera';
import type { StudioContext, StudioObject } from './Studio';
import InstantCameraStudio from './InstantCameraStudio';

// Build the real scene graph through Studio's create contract. This replaces
// only the WebGL host, never the assembly geometry or model/shot state.
const built: { root: THREE.Group; camera: THREE.PerspectiveCamera; object: StudioObject }[] = [];
let aspect = 366 / 318;
vi.mock('./Studio', () => ({
  default: ({ create }: { create: (context: StudioContext) => StudioObject }) => {
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
    const scene = new THREE.Scene();
    scene.add(root);
    const context = {
      root,
      scene,
      camera,
      controls: { target: new THREE.Vector3() },
      reducedMotion: { matches: false },
    } as unknown as StudioContext;
    const object = create(context);
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    built.push({ root, camera, object });
    return <div data-test-three-assembly="true" />;
  },
}));

function film(shot: IcShot) {
  return {
    watch: true,
    playing: false,
    time: shot.chapter * 24 + shot.progress * 24,
    chapter: shot.chapter,
    chapterProgress: shot.progress,
    chapterTime: shot.progress * 24,
    run: 0,
    duration: 168,
    chapters: [],
  };
}
function assembly(shot: IcShot, width = 366) {
  aspect = width / 318;
  renderToStaticMarkup(
    <FilmContext.Provider value={film(shot)}>
      <InstantCameraStudio shot={shot} width={width} />
    </FilmContext.Provider>,
  );
  return built.at(-1)!;
}
function meshes(root: THREE.Object3D) {
  const list: THREE.Mesh[] = [];
  root.traverseVisible((o) => {
    if (o instanceof THREE.Mesh) list.push(o);
  });
  return list;
}
afterEach(() => {
  for (const { root, object } of built) {
    object.dispose?.();
    const geometry = new Set<THREE.BufferGeometry>(),
      material = new Set<THREE.Material>();
    root.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return;
      geometry.add(mesh.geometry);
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
        material.add(mat);
    });
    geometry.forEach((g) => g.dispose());
    material.forEach((m) => m.dispose());
  }
  built.length = 0;
});

describe('actual instant-camera assembly', () => {
  it('mounts the finite pod profile on the same transported sheet and exactly tangent rollers', () => {
    for (const feedMm of [0, 14, 19, 20, 23, 35.4, 58, IC_FEED_MAX]) {
      const shot = icShot(2, 0, { feedMm, seconds: 0, dirty: false });
      const { root } = assembly(shot);
      const all = meshes(root);
      const image = all.find(
        (m) => (m.material as THREE.MeshStandardMaterial).map instanceof THREE.DataTexture,
      )!;
      const moving = image.parent!;
      const pod = moving.children.find(
        (m) =>
          m instanceof THREE.Mesh &&
          m.geometry.getAttribute('position').count === shot.transport.podProfile.length * 4,
      ) as THREE.Mesh;
      const sheet = moving.children.find(
        (m) =>
          m instanceof THREE.Mesh &&
          (m.material as THREE.MeshStandardMaterial).color.getHexString() === 'f6efdd',
      ) as THREE.Mesh;
      expect(sheet).toBeDefined();
      expect(pod).toBeDefined();
      const sheetBounds = new THREE.Box3().setFromObject(sheet);
      expect(sheetBounds.max.x * 50).toBeCloseTo(shot.transport.lead, 5);
      expect(sheetBounds.min.x * 50).toBeCloseTo(shot.transport.trail, 5);
      expect(sheetBounds.max.z * 50 - sheetBounds.min.z * 50).toBeCloseTo(IC.width, 5);
      // A rendering bias belongs in the material, not in physical thickness
      // that would introduce a new bump through the roller nip.
      const imagePositions = image.geometry.getAttribute('position');
      for (let i = 0; i < imagePositions.count; i++) {
        const p = new THREE.Vector3()
          .fromBufferAttribute(imagePositions, i)
          .applyMatrix4(image.matrixWorld);
        expect(p.y).toBeCloseTo(sheetBounds.max.y, 7);
      }
      const positions = pod.geometry.getAttribute('position');
      for (const [i, profile] of shot.transport.podProfile.entries()) {
        const bottom = new THREE.Vector3()
          .fromBufferAttribute(positions, i * 4)
          .applyMatrix4(pod.matrixWorld);
        const top = new THREE.Vector3()
          .fromBufferAttribute(positions, i * 4 + 2)
          .applyMatrix4(pod.matrixWorld);
        expect(bottom.x * 50).toBeCloseTo(profile.x, 5);
        expect(bottom.y * 50).toBeCloseTo(IC.plane + IC.thickness / 2, 5);
        expect(top.y * 50).toBeCloseTo(IC.plane + IC.thickness / 2 + profile.height, 5);
        expect(bottom.z * 50).toBeCloseTo(-IC.imageWidth / 2, 5);
      }
      const rollers = all.filter(
        (m) =>
          m.geometry instanceof THREE.CylinderGeometry &&
          Math.abs(m.geometry.parameters.radiusTop - IC.rollerRadius / 50) < 1e-10,
      );
      expect(rollers).toHaveLength(2);
      const centers = rollers
        .map((r) => r.getWorldPosition(new THREE.Vector3()).y)
        .sort((a, b) => a - b);
      expect(centers[0] + IC.rollerRadius / 50).toBeCloseTo(sheetBounds.min.y, 7);
      expect(centers[1] - IC.rollerRadius / 50).toBeCloseTo(sheetBounds.max.y, 7);
    }
  });

  it('keeps the cut rear bridge above the actual upper roller and away from the exposed nip', () => {
    const { root } = assembly(icShot(2, 0));
    const all = meshes(root);
    const bridge = all.find(
      (m) => m.position.distanceTo(new THREE.Vector3(0.15, 1.06, -0.74)) < 1e-8,
    )!;
    expect(bridge).toBeDefined();
    const bounds = new THREE.Box3().setFromObject(bridge, true);
    const top = all.find(
      (m) =>
        m.geometry instanceof THREE.CylinderGeometry &&
        m.geometry.parameters.radiusTop === IC.rollerRadius / 50 &&
        m.getWorldPosition(new THREE.Vector3()).y > IC.plane / 50,
    )!;
    // Precise vertices avoid rotating a square cylinder bounding box, which
    // would invent protruding corners as the circular roller spins.
    const rollerBounds = new THREE.Box3().setFromObject(top, true);
    expect(bounds.intersectsBox(rollerBounds)).toBe(false);
    expect(bounds.min.y - rollerBounds.max.y).toBeGreaterThan(0.1);
    expect(bounds.max.z).toBeLessThan(-0.05);
  });

  it('joins thick optical barrels to their actual mount and exposes real inward-facing walls', () => {
    const { root } = assembly(icShot(0, 0.25));
    const all = meshes(root);
    function section(mesh: THREE.Mesh) {
      const bounds = new THREE.Box3().setFromObject(mesh, true);
      const center = mesh.getWorldPosition(new THREE.Vector3());
      const positions = mesh.geometry.getAttribute('position');
      let inner = Infinity,
        outer = 0;
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .applyMatrix4(mesh.matrixWorld);
        const radius = Math.hypot(p.y - center.y, p.z - center.z);
        inner = Math.min(inner, radius);
        outer = Math.max(outer, radius);
        expect(p.z).toBeLessThanOrEqual(1e-7);
      }
      expect(outer - inner).toBeGreaterThan(0.05);
      expect(center.y).toBeCloseTo(IC.lens.y / 50, 8);
      expect(center.z).toBeCloseTo(0, 8);
      const inside = new THREE.Raycaster(center, new THREE.Vector3(0, 0, -1));
      const hit = inside.intersectObject(mesh);
      expect(hit.length, 'inside camera must see an inward-facing physical wall').toBeGreaterThan(
        0,
      );
      expect(hit[0].distance).toBeCloseTo(inner, 6);
      return { mesh, bounds, center, inner, outer };
    }
    const barrels = all
      .filter((m) => m.name === 'optical-barrel')
      .map(section)
      .sort((a, b) => a.bounds.min.x - b.bounds.min.x);
    expect(barrels).toHaveLength(3);
    for (let i = 1; i < barrels.length; i++) {
      const a = barrels[i - 1],
        b = barrels[i];
      expect(
        Math.min(a.bounds.max.x, b.bounds.max.x) - Math.max(a.bounds.min.x, b.bounds.min.x),
      ).toBeGreaterThan(0.001);
      expect(Math.min(a.outer, b.outer) - Math.max(a.inner, b.inner)).toBeGreaterThan(0.001);
    }
    const mount = section(all.find((m) => m.name === 'lens-mount')!);
    const barrel = barrels[0];
    expect(
      Math.min(mount.bounds.max.x, barrel.bounds.max.x) -
        Math.max(mount.bounds.min.x, barrel.bounds.min.x),
    ).toBeGreaterThan(0.001);
    expect(
      Math.min(mount.outer, barrel.outer) - Math.max(mount.inner, barrel.inner),
    ).toBeGreaterThan(0.001);
    const shell = all.filter(
      (m) =>
        m !== mount.mesh &&
        (m.material as THREE.MeshStandardMaterial).color.getHexString() === 'e2d8c0',
    );
    const connection = new THREE.Raycaster(
      mount.center,
      new THREE.Vector3(0, 0, -1),
    ).intersectObjects(shell, false);
    expect(connection.length, 'mount reaches the retained body structure').toBeGreaterThan(0);
    expect(connection[0].distance).toBeLessThan(mount.outer - 0.01);
  });

  it('blocks the folded chief ray only with the closed shutter and clears it during exposure', () => {
    for (const progress of [0, 0.25, 0.7]) {
      const shot = icShot(0, progress),
        { root } = assembly(shot);
      const opaque = meshes(root).filter((m) => !(m.material as THREE.Material).transparent);
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0.9, IC.lens.y / 50, 0),
        new THREE.Vector3(-1, 0, 0),
        0,
        0.9 - IC.mirror.x / 50 - 0.04,
      );
      const hit = ray.intersectObjects(opaque, false);
      if (shot.shutterOpen)
        expect(hit, 'open optical axis must not cross a solid barrel or shell').toEqual([]);
      else {
        expect(hit.length).toBeGreaterThan(0);
        expect(hit[0].point.x, 'first opaque stop is the shutter at x=.02').toBeCloseTo(0.03, 5);
      }
      const rays = root.getObjectByName('chief-ray')!;
      expect(rays.visible).toBe(shot.shutterOpen);
      expect(rays.children).toHaveLength(2);
      const endpoints = [
        new THREE.Vector3(0.9, IC.lens.y / 50, 0),
        new THREE.Vector3(IC.mirror.x / 50, IC.mirror.y / 50, 0),
        new THREE.Vector3(IC.mirror.x / 50, IC.plane / 50, 0),
      ];
      for (const [i, object] of rays.children.entries()) {
        const tube = object as THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
        expect(tube.material.color.getHexString()).toBe('b67d2d');
        expect(tube.geometry.parameters.radiusTop).toBe(0.016);
        const half = tube.geometry.parameters.height / 2;
        const a = new THREE.Vector3(0, -half, 0).applyMatrix4(tube.matrixWorld);
        const b = new THREE.Vector3(0, half, 0).applyMatrix4(tube.matrixWorld);
        expect(a.distanceTo(endpoints[i])).toBeLessThan(1e-8);
        expect(b.distanceTo(endpoints[i + 1])).toBeLessThan(1e-8);
      }
    }
  });

  it('closes the real half-barrel cut faces with outward normals while preserving the open pupil', () => {
    const { root } = assembly(icShot(0, 0.25));
    const caps = meshes(root).filter((m) =>
      ['optical-barrel-cut', 'lens-mount-cut'].includes(m.name),
    );
    expect(caps).toHaveLength(8);
    const sections = [
      ...hardware.barrels.map((b) => ({
        x: b.x,
        length: b.length,
        inner: b.radius - hardware.wallThickness,
        outer: b.radius,
      })),
      {
        x: hardware.mount.x,
        length: hardware.mount.length,
        inner: hardware.mount.innerRadius,
        outer: hardware.mount.outerRadius,
      },
    ];
    for (const cap of caps) {
      const bounds = new THREE.Box3().setFromObject(cap, true);
      const section = sections.find((s) => Math.abs(cap.position.x * 50 - s.x) < 1e-6)!;
      expect(bounds.max.z).toBeCloseTo(0, 10);
      expect(bounds.min.z).toBeCloseTo(0, 10);
      expect((bounds.max.x - bounds.min.x) * 50).toBeCloseTo(section.length, 5);
      expect((bounds.max.y - bounds.min.y) * 50).toBeCloseTo(section.outer - section.inner, 5);
      expect(
        Math.min(Math.abs(bounds.min.y * 50 - IC.lens.y), Math.abs(bounds.max.y * 50 - IC.lens.y)),
      ).toBeCloseTo(section.inner, 5);
      const normals = cap.geometry.getAttribute('normal');
      for (let i = 0; i < normals.count; i++) {
        const normal = new THREE.Vector3()
          .fromBufferAttribute(normals, i)
          .transformDirection(cap.matrixWorld);
        expect(normal.distanceTo(new THREE.Vector3(0, 0, 1))).toBeLessThan(1e-8);
      }
    }
  });

  it('directs the roller chapter to the actual side profile while retaining 3D for exposure and transport', () => {
    for (const chapter of [0, 1, 2]) {
      const shot = icShot(chapter, 0.35);
      const markup = renderToStaticMarkup(
        <FilmContext.Provider value={film(shot)}>
          <InstantCamera />
        </FilmContext.Provider>,
      );
      expect(markup.includes('data-test-three-assembly="true"')).toBe(chapter !== 2);
      if (chapter === 2) {
        expect(markup).toContain('同一张相纸连续经过两根相切滚轮');
        expect(markup).toContain(`data-instant-feed="${shot.feedMm.toFixed(3)}"`);
        expect(markup).not.toMatch(/NaN|Infinity/);
      }
    }
  });
});
