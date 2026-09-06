import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ExcavatorStudio from './ExcavatorStudio';

const live = vi.hoisted(() => ({ ref: null as any, watch: true }));
vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useRef: (current: any) => (live.ref = { current }),
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => ({ watch: live.watch }) }));
vi.mock('./Studio', () => ({ default: () => null }));

// Real meshes, camera and OrbitControls; no browser or WebGL is involved.
class Surface extends EventTarget {
  style = { touchAction: '' };
  clientWidth = 600;
  clientHeight = 440;
  getRootNode() {
    return this;
  }
  setPointerCapture() {}
  releasePointerCapture() {}
}
function createView(aspect: number, reduced = false) {
  live.watch = true;
  const element = ExcavatorStudio({ boom: 0.75, stick: -1.55, curl: 0.6, closeup: true });
  const ref = live.ref,
    root = new THREE.Group(),
    camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100),
    controls = new OrbitControls(camera, new Surface() as unknown as HTMLElement),
    reducedMotion = { matches: reduced };
  camera.position.fromArray(element.props.cameraPosition);
  controls.target.fromArray(element.props.target);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.13;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.update();
  const object = element.props.create({ root, camera, controls, reducedMotion });
  const frame = (dt = 0.04, settle = false) => {
    object.update(dt, 0, settle);
    if (ref.current.watch) camera.lookAt(controls.target);
    else controls.update();
  };
  const resize = (nextAspect: number) => {
    // Studio owns resize: preserve the current reader direction, refit distance.
    camera.aspect = nextAspect;
    const height = Math.max(element.props.span / nextAspect, element.props.fitHeight);
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position
      .copy(controls.target)
      .addScaledVector(direction, height / (2 * Math.tan((camera.fov * Math.PI) / 360)));
    camera.updateProjectionMatrix();
    controls.update();
  };
  const peak = () => {
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    let maximum = 0;
    const point = new THREE.Vector3();
    root.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return;
      const positions = mesh.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
        maximum = Math.max(maximum, Math.abs(point.x), Math.abs(point.y));
      }
    });
    return maximum;
  };
  const dispose = () => {
    controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
        materials.add(material);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };
  return { ref, camera, controls, frame, resize, peak, dispose };
}

describe('excavator closeup-to-explore camera handoff', () => {
  it.each([1110 / 440, 270 / 320])(
    'returns the complete machine smoothly once at aspect %s, then preserves orbit and resize',
    (aspect) => {
      const v = createView(aspect);
      try {
        v.frame(0, true);
        const closePosition = v.camera.position.clone(),
          closeTarget = v.controls.target.clone();
        expect(v.peak()).toBeGreaterThan(1); // Whole machine cannot fit the bucket shot.
        Object.assign(v.ref.current, { watch: false, closeup: false });
        v.frame();
        expect(v.camera.position.distanceTo(closePosition)).toBeGreaterThan(0);
        expect(v.controls.target.distanceTo(new THREE.Vector3(1.5, 2, 0))).toBeGreaterThan(0.1);
        for (let i = 0; i < 20; i++) v.frame();
        expect(v.peak()).toBeLessThan(1);
        expect(v.controls.target.distanceTo(new THREE.Vector3(1.5, 2, 0))).toBeLessThan(1e-12);
        // A deliberate reader orbit must survive every subsequent model frame.
        const direction = new THREE.Vector3(-0.5, 0.4, 1).normalize(),
          radius = v.camera.position.distanceTo(v.controls.target);
        v.camera.position.copy(v.controls.target).addScaledVector(direction, radius);
        v.controls.update();
        const orbitPosition = v.camera.position.clone();
        for (let i = 0; i < 30; i++) v.frame();
        expect(v.camera.position.distanceTo(orbitPosition)).toBeLessThan(1e-10);
        v.resize(aspect * 0.7);
        const resizedPosition = v.camera.position.clone();
        for (let i = 0; i < 30; i++) v.frame();
        expect(v.camera.position.distanceTo(resizedPosition)).toBeLessThan(1e-10);
        expect(
          v.camera.position.clone().sub(v.controls.target).normalize().distanceTo(direction),
        ).toBeLessThan(1e-10);
        // Replay takes ownership again and exactly reconstructs the selected shot.
        v.resize(aspect);
        Object.assign(v.ref.current, { watch: true, closeup: true });
        v.frame(0, true);
        expect(v.camera.position.distanceTo(closePosition)).toBeLessThan(1e-10);
        expect(v.controls.target.distanceTo(closeTarget)).toBeLessThan(1e-10);
      } finally {
        v.dispose();
      }
    },
  );

  it('returns immediately with reduced motion and releases the camera on the next frame', () => {
    const v = createView(270 / 320, true);
    try {
      v.frame(0, true);
      Object.assign(v.ref.current, { watch: false, closeup: false });
      v.frame(0);
      expect(v.peak()).toBeLessThan(1);
      expect(v.controls.target.distanceTo(new THREE.Vector3(1.5, 2, 0))).toBeLessThan(1e-12);
      v.camera.position.add(new THREE.Vector3(-1, 0.2, 0.3));
      v.controls.update();
      const position = v.camera.position.clone();
      v.frame(0.04);
      expect(v.camera.position.distanceTo(position)).toBeLessThan(1e-10);
    } finally {
      v.dispose();
    }
  });
});
