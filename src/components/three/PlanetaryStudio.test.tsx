import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Scene from './PlanetaryStudio';
import { planetaryShot } from '../../models/planetary';
const live = vi.hoisted(() => ({
  refs: [] as { current: any }[],
  film: { watch: false, chapter: 0, chapterProgress: 0 },
}));
vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useRef: (current: any) => {
    const ref = { current };
    live.refs.push(ref);
    return ref;
  },
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => live.film }));
vi.mock('./Studio', () => ({ default: () => null }));
// Real OrbitControls, without a browser or WebGL. DOM sizing and pointer events are controlled inputs.
class Surface extends EventTarget {
  style = { touchAction: '' };
  clientWidth = 643;
  clientHeight = 500;
  getRootNode() {
    return this;
  }
  setPointerCapture() {}
  releasePointerCapture() {}
}
function shot(chapter: number, progress: number) {
  const s = planetaryShot(chapter, progress);
  return { angle: s.inputAngle, mode: s.mode, assembly: s.assembly };
}
function create(aspect: number, watch = false) {
  live.refs = [];
  Object.assign(live.film, { watch, chapter: 0, chapterProgress: 0 });
  const element = Scene(shot(0, 0));
  const root = new THREE.Group(),
    camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
    surface = new Surface();
  camera.position.fromArray(element.props.cameraPosition);
  const controls = new OrbitControls(camera, surface as unknown as HTMLElement);
  controls.target.fromArray(element.props.target);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.13;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.update();
  const object = element.props.create({ root, camera, controls });
  const ref = live.refs[0];
  const resize = (next: number) => {
    camera.aspect = next;
    camera.updateProjectionMatrix();
    // Same distance overwrite as shared Studio.resize; the topic must correct it via the change event.
    const h = Math.max(element.props.span / next, element.props.fitHeight);
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position
      .copy(controls.target)
      .addScaledVector(direction, h / (2 * Math.tan((camera.fov * Math.PI) / 360)));
    controls.update();
  };
  const dispose = () => {
    object.dispose?.();
    controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };
  return {
    root,
    camera,
    controls,
    surface,
    object,
    ref,
    resize,
    dispose,
    build: element.props.create,
    cameraPosition: element.props.cameraPosition,
    initialTarget: element.props.target,
  };
}
function peak(view: ReturnType<typeof create>, subject: THREE.Object3D = view.root) {
  view.root.updateWorldMatrix(true, true);
  view.camera.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  let maximum = 0;
  subject.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const a = o.geometry.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      p.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld).project(view.camera);
      if (!Number.isFinite(p.x + p.y + p.z) || p.z < -1 || p.z > 1)
        throw new Error('Invalid projected geometry');
      maximum = Math.max(maximum, Math.abs(p.x), Math.abs(p.y));
    }
  });
  return maximum;
}
describe('Planetary exploration framing', () => {
  it('keeps the actual assembly in frame after creation, resize and permitted orbit directions', () => {
    const v = create([1090 / 460, 254 / 270][0]);
    try {
      // Equivalent to returning from 2D: new create followed by Studio.resize.
      Object.assign(v.ref.current, { angle: 7 * Math.PI, mode: 'carrier-fixed', assembly: 0 });
      v.object.update();
      for (const aspect of [1090 / 460, 254 / 270]) {
        v.resize(aspect);
        expect(peak(v)).toBeLessThanOrEqual(0.881);
        for (const theta of [-Math.PI, -2, -0.8, 0, 0.8, 2, Math.PI])
          for (const phi of [v.controls.minPolarAngle, 0.9, 1.3, v.controls.maxPolarAngle]) {
            const desired = new THREE.Vector3().setFromSpherical(
              new THREE.Spherical(1, phi, theta),
            );
            v.camera.position.copy(v.controls.target).addScaledVector(desired, 1);
            v.controls.update();
            expect(
              v.camera.position.clone().sub(v.controls.target).normalize().distanceTo(desired),
            ).toBeLessThan(1e-12);
            expect(peak(v)).toBeLessThanOrEqual(0.881);
          }
      }
    } finally {
      v.dispose();
    }
  }, 60000);
  it('fits the last actual drag update before render, and releases its control listener', () => {
    const v = create([1090 / 460, 254 / 270][0]);
    try {
      Object.assign(v.ref.current, { angle: 7 * Math.PI, mode: 'carrier-fixed', assembly: 0 });
      v.object.update();
      v.resize([1090 / 460, 254 / 270][0]);
      v.controls.enableDamping = true;
      v.controls.dampingFactor = 0.07;
      const direction = v.camera.position.clone().sub(v.controls.target).normalize();
      const pointer = (type: string, x: number, y: number) => {
        const event = new Event(type);
        Object.assign(event, {
          pointerId: 1,
          pointerType: 'mouse',
          button: 0,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
        });
        v.surface.dispatchEvent(event);
      };
      pointer('pointerdown', 100, 100);
      pointer('pointermove', 270, 135);
      pointer('pointerup', 270, 135);
      expect(
        v.camera.position.clone().sub(v.controls.target).normalize().distanceTo(direction),
      ).toBeGreaterThan(0.01);
      expect(peak(v)).toBeLessThanOrEqual(0.881);
      for (let frame = 0; frame < 40; frame++) {
        v.object.update();
        v.controls.update();
        expect(peak(v)).toBeLessThanOrEqual(0.881);
      }
      v.controls.enableDamping = false;
      v.controls.update();
      const remove = vi.spyOn(v.controls, 'removeEventListener');
      v.object.dispose?.();
      expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
      v.camera.position.copy(v.controls.target).addScaledVector(direction, 1);
      v.controls.update();
      expect(v.camera.position.distanceTo(v.controls.target)).toBeCloseTo(1, 10);
    } finally {
      v.dispose();
    }
  });
  it('restores the reader direction when the same topic returns from 2D to a fresh 3D renderer', () => {
    const v = create(1);
    v.object.update();
    const desired = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, 1.1, -1.7));
    v.camera.position.copy(v.controls.target).addScaledVector(desired, 1);
    v.controls.update();
    v.dispose();
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.fromArray(v.cameraPosition);
    const controls = new OrbitControls(camera, new Surface() as unknown as HTMLElement);
    controls.target.fromArray(v.initialTarget);
    const object = v.build({ root, camera, controls });
    try {
      object.update();
      controls.update();
      expect(
        camera.position.clone().sub(controls.target).normalize().distanceTo(desired),
      ).toBeLessThan(1e-12);
      expect(peak({ ...v, root, camera, controls })).toBeLessThanOrEqual(0.881);
    } finally {
      object.dispose?.();
      controls.dispose();
      root.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      });
    }
  });
  it('keeps every directed chapter and its transition endpoints within its declared frame', () => {
    const v = create(1, true);
    try {
      for (let chapter = 0; chapter < 8; chapter++)
        for (const progress of [0, 0.001, 0.2, 0.5, 0.8, 0.999, 1]) {
          Object.assign(live.film, { watch: true, chapter, chapterProgress: progress });
          Object.assign(v.ref.current, shot(chapter, progress));
          v.object.update();
          v.controls.update();
          const subject = v.root;
          expect(peak(v, subject)).toBeLessThanOrEqual(0.881);
        }
    } finally {
      v.dispose();
    }
  }, 60000);
  it('reconstructs directed camera state after exploring and seeking in a different order', () => {
    const v = create([1090 / 460, 254 / 270][0], true);
    const seek = (c: number, p: number) => {
      Object.assign(live.film, { watch: true, chapter: c, chapterProgress: p });
      Object.assign(v.ref.current, shot(c, p));
      v.object.update();
      v.controls.update();
    };
    try {
      seek(2, 0.47);
      const before = v.camera.position.toArray(),
        target = v.controls.target.toArray();
      live.film.watch = false;
      Object.assign(v.ref.current, { angle: 7 * Math.PI, mode: 'carrier-fixed', assembly: 0 });
      v.object.update();
      v.resize([1090 / 460, 254 / 270][1]);
      expect(peak(v)).toBeLessThanOrEqual(0.881);
      v.resize([1090 / 460, 254 / 270][0]);
      seek(7, 0.91);
      seek(0, 0);
      seek(2, 0.47);
      v.camera.position.toArray().forEach((x, i) => expect(x).toBeCloseTo(before[i], 10));
      v.controls.target.toArray().forEach((x, i) => expect(x).toBeCloseTo(target[i], 10));
    } finally {
      v.dispose();
    }
  });
});
