import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { softEase } from './motion';

export type StudioContext = {
  scene: THREE.Scene;
  root: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  reducedMotion: MediaQueryList;
};
export type StudioObject = {
  update?: (dt: number, elapsed: number) => void;
  dispose?: () => void;
};
export default function Studio({
  create,
  label,
  fallback,
  dark = false,
  className = '',
  cameraPosition = [8, 6, 10],
  target = [0, 1, 0],
  span = 9,
  fitHeight,
}: {
  create: (context: StudioContext) => StudioObject;
  label: string;
  fallback?: ReactNode;
  dark?: boolean;
  className?: string;
  cameraPosition?: number[];
  target?: number[];
  span?: number;
  fitHeight?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const createRef = useRef(create);
  createRef.current = create;
  const initial = useRef({ cameraPosition, target, span, fitHeight });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dark ? 1.2 : 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene(),
      root = new THREE.Group();
    scene.add(root);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.fromArray(initial.current.cameraPosition);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.fromArray(initial.current.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.55;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.13;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();
    scene.add(new THREE.HemisphereLight(0xf1f3f1, 0x918578, 2.6));
    const key = new THREE.DirectionalLight(0xfffaf3, 3.6);
    key.position.set(-3, 9, 5);
    key.castShadow = true;
    const shadowSize = window.innerWidth < 760 ? 512 : 1024;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 5;
    key.shadow.blurSamples = 8;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd6e4ec, 1.6);
    rim.position.set(4, 5, -6);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: dark ? 0.3 : 0.095 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.06;
    floor.receiveShadow = true;
    scene.add(floor);
    let object: StudioObject = {};
    try {
      object = createRef.current({ scene, root, camera, controls, reducedMotion });
    } catch (error) {
      console.error('Unable to construct scene', error);
      setFailed(true);
    }
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const viewHeight = Math.max(
        initial.current.span / camera.aspect,
        initial.current.fitHeight ?? initial.current.span * 0.64,
      );
      const distance = viewHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      camera.updateProjectionMatrix();
      controls.update();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);
    let visible = true,
      previous = 0,
      elapsed = 0,
      animation = 0;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      previous = 0;
    });
    intersection.observe(el);
    const frameBudget = window.innerWidth < 760 ? 1000 / 30 : 1000 / 60;
    let keyElapsed = 1;
    const keyFrom = new THREE.Spherical(),
      keyTo = new THREE.Spherical();
    const keyOffset = new THREE.Vector3();
    const stopKeyMotion = () => {
      keyElapsed = 1;
    };
    controls.addEventListener('start', stopKeyMotion);
    const tick = (time: number) => {
      animation = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        previous = 0;
        return;
      }
      if (previous && time - previous < frameBudget - 1) return;
      const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 0;
      previous = time;
      elapsed += dt;
      object.update?.(dt, elapsed);
      if (keyElapsed < 1) {
        keyElapsed = Math.min(1, keyElapsed + dt / 0.38);
        const amount = reducedMotion.matches ? 1 : softEase(keyElapsed);
        keyOffset.setFromSpherical(
          new THREE.Spherical(
            keyTo.radius,
            THREE.MathUtils.lerp(keyFrom.phi, keyTo.phi, amount),
            THREE.MathUtils.lerp(keyFrom.theta, keyTo.theta, amount),
          ),
        );
        camera.position.copy(controls.target).add(keyOffset);
      }
      controls.enableDamping = !reducedMotion.matches;
      controls.update();
      renderer.render(scene, camera);
    };
    animation = requestAnimationFrame(tick);
    const keys = (event: KeyboardEvent) => {
      if (!event.key.startsWith('Arrow')) return;
      event.preventDefault();
      keyFrom.setFromVector3(keyOffset.copy(camera.position).sub(controls.target));
      const spherical = keyElapsed < 1 ? keyTo.clone() : keyFrom.clone();
      spherical.theta += event.key === 'ArrowLeft' ? -0.12 : event.key === 'ArrowRight' ? 0.12 : 0;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + (event.key === 'ArrowUp' ? -0.08 : event.key === 'ArrowDown' ? 0.08 : 0),
        Math.PI * 0.13,
        Math.PI * 0.48,
      );
      controls.dispatchEvent({ type: 'start' });
      keyTo.copy(spherical);
      keyElapsed = 0;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(animation);
      setFailed(true);
    };
    el.addEventListener('keydown', keys);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      intersection.disconnect();
      controls.removeEventListener('start', stopKeyMotion);
      controls.dispose();
      el.removeEventListener('keydown', keys);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      object.dispose?.();
      const materials = new Set<THREE.Material>(),
        geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Points
        ) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      environment.dispose();
      key.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dark]);
  return (
    <div className={`studio ${className}`}>
      <div
        className="studio-canvas"
        ref={host}
        role="img"
        aria-label={`${label}。拖动或用方向键旋转。`}
        tabIndex={failed ? -1 : 0}
        style={{ display: failed ? 'none' : undefined }}
      />
      {failed && (
        <div className="studio-fallback">
          {fallback || <p>三维视图暂不可用，下方仍可逐步探索原理。</p>}
        </div>
      )}
    </div>
  );
}
