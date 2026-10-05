import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { cameraPose } from '../../models/slr-mirrorless';
import { cameraAssembly } from './SlrMirrorlessStudio';

describe('camera cutaway framing', () => {
  it('exposes every sensor–processor–display connection to the actual desktop and phone camera', () => {
    for (const layout of [
      { dslr: false, both: false },
      { dslr: true, both: false },
      { dslr: false, both: true },
      { dslr: true, both: true },
    ]) {
      const { dslr, both } = layout;
      const root = new THREE.Group();
      const subject = new THREE.Group();
      root.add(subject);
      subject.position.x = both ? (dslr ? -3.1 : 3.1) : 0;
      const assembly = cameraAssembly(subject, dslr);
      assembly.update(cameraPose(dslr ? 'live-view' : 'mirrorless', 0), 1, 113);
      if (both) {
        const neighbor = new THREE.Group();
        root.add(neighbor);
        neighbor.position.x = -subject.position.x;
        cameraAssembly(neighbor, !dslr).update(
          cameraPose(dslr ? 'mirrorless' : 'live-view', 0),
          1,
          113,
        );
      }
      root.updateMatrixWorld(true);
      const occluders: THREE.Mesh[] = [];
      const wires: THREE.Mesh[] = [];
      root.traverseVisible((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        if (object.name.startsWith('signal-')) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        if (materials.every((m) => !m.transparent)) occluders.push(object);
      });
      subject.traverseVisible((object) => {
        if (object instanceof THREE.Mesh && /^signal-\d+-\d+$/.test(object.name))
          wires.push(object);
      });
      for (const aspect of both ? [850 / 390] : [850 / 390, 366 / 292, 296 / 292]) {
        const target = new THREE.Vector3(both ? -1.12 : -1.1, 1.62, 0);
        const direction = new THREE.Vector3(-3.5, 4.4, 10).sub(target).normalize();
        const height = Math.max((both ? 13.7 : 6.65) / aspect, both ? 5.2 : 4.2);
        const camera = target
          .clone()
          .addScaledVector(direction, height / (2 * Math.tan((34 * Math.PI) / 360)));
        const ray = new THREE.Raycaster();
        expect(wires.length).toBe(dslr ? 7 : 10);
        for (const wire of wires) {
          expect((wire.material as THREE.Material).depthTest).toBe(true);
          // Sample the actual rendered cylinder transform. A route table
          // cannot prove visibility if the renderer places it behind a wall.
          for (const progress of [0.1, 0.2, 0.4, 0.6, 0.8, 0.9]) {
            const point = new THREE.Vector3(0, progress - 0.5, 0).applyMatrix4(wire.matrixWorld);
            const distance = point.distanceTo(camera);
            ray.set(camera, point.clone().sub(camera).normalize());
            const blockers = ray
              .intersectObjects(occluders, false)
              .filter((hit) => hit.distance < distance - 0.035);
            expect(
              blockers.map((hit) => hit.object.name || hit.object.type),
              `hidden ${dslr ? 'DSLR' : 'mirrorless'} ${both ? 'pair' : 'single'} ${wire.name}, t=${progress}, aspect=${aspect}`,
            ).toEqual([]);
          }
        }
      }
    }
  });
  it('fits actual visible moving geometry at desktop and separately composed 320 px phone aspect ratios', () => {
    const root = new THREE.Group(),
      a = new THREE.Group(),
      b = new THREE.Group();
    root.add(a, b);
    const dslr = cameraAssembly(a, true),
      mirrorless = cameraAssembly(b, false);
    for (const layout of [
      { both: true, mirrorless: false, aspect: 850 / 390 },
      { both: false, mirrorless: false, aspect: 850 / 390 },
      { both: false, mirrorless: true, aspect: 850 / 390 },
      { both: false, mirrorless: false, aspect: 296 / 292 },
      { both: false, mirrorless: true, aspect: 296 / 292 },
    ]) {
      a.position.x = layout.both ? -3.1 : 0;
      b.position.x = layout.both ? 3.1 : 0;
      a.visible = layout.both || !layout.mirrorless;
      b.visible = layout.both || layout.mirrorless;
      const camera = new THREE.PerspectiveCamera(34, layout.aspect, 0.1, 100),
        target = new THREE.Vector3(-1.12, 1.62, 0);
      const direction = new THREE.Vector3(-3.5, 4.4, 10).sub(target).normalize();
      const height = Math.max((layout.both ? 13.7 : 6.65) / layout.aspect, layout.both ? 5.2 : 4.2);
      camera.position
        .copy(target)
        .addScaledVector(direction, height / (2 * Math.tan((34 * Math.PI) / 360)));
      camera.lookAt(target);
      camera.updateMatrixWorld();
      for (const phase of [0, 0.14, 0.22, 0.4, 0.7, 0.84, 1]) {
        dslr.update(cameraPose('dslr', phase), 1, 0);
        mirrorless.update(cameraPose('mirrorless', phase), 1, 0);
        root.updateMatrixWorld(true);
        let worstX = 0,
          worstY = 0;
        const point = new THREE.Vector3();
        root.traverseVisible((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const vertices = object.geometry.getAttribute('position');
          for (let i = 0; i < vertices.count; i++) {
            point.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).project(camera);
            worstX = Math.max(worstX, Math.abs(point.x));
            worstY = Math.max(worstY, Math.abs(point.y));
          }
        });
        expect(worstX, `horizontal framing ${JSON.stringify(layout)} phase ${phase}`).toBeLessThan(
          0.98,
        );
        expect(worstY, `vertical framing ${JSON.stringify(layout)} phase ${phase}`).toBeLessThan(
          0.98,
        );
      }
    }
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const mat of Array.isArray(object.material) ? object.material : [object.material])
          materials.add(mat);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  });
});
