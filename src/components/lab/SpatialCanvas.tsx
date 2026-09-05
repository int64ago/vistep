import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { useShowcase } from './Showcase';
export { THREE };
export type SpatialContext = {
  scene: THREE.Scene;
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};
export default function SpatialCanvas({
  build,
  frame,
  fallback,
  label,
  dark = false,
  fitWidth,
  fitHeight,
}: {
  build: (c: SpatialContext) => void | (() => void);
  frame?: (c: SpatialContext, dt: number) => void;
  fallback: ReactNode;
  label: string;
  dark?: boolean;
  fitWidth?: number;
  fitHeight?: number;
}) {
  const demo = useShowcase(),
    director = useRef(demo);
  director.current = demo;
  const host = useRef<HTMLDivElement>(null),
    frameRef = useRef(frame),
    [failed, setFailed] = useState(false),
    [flat, setFlat] = useState(false);
  frameRef.current = frame;
  useEffect(() => {
    const el = host.current;
    if (!el || failed || flat) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: THREE.WebGLRenderer | undefined,
      id = 0,
      cleanup: void | (() => void),
      last = 0,
      visible = true;
    let down = false,
      px = 0,
      py = 0;
    const scene = new THREE.Scene(),
      group = new THREE.Group();
    scene.add(group);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.3, 7.5);
    camera.lookAt(0, 0, 0);
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(dark ? 0x111b2d : 0xf6f8fb, 1);
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      scene.add(new THREE.HemisphereLight(0xffffff, 0x617699, 2.2));
      const light = new THREE.DirectionalLight(0xffffff, 2.8);
      light.position.set(-3, 5, 5);
      scene.add(light);
      cleanup = build({ scene, group, camera, renderer });
    } catch {
      renderer?.dispose();
      setFailed(true);
      return;
    }
    const context = { scene, group, camera, renderer };
    let targetX = group.rotation.x,
      targetY = group.rotation.y;
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (w && h) {
        renderer!.setSize(w, h);
        camera.aspect = w / h;
        if (fitWidth && fitHeight) {
          const tangent = Math.tan((camera.fov * Math.PI) / 360);
          const distance = Math.max(
            fitHeight / (2 * tangent),
            fitWidth / (2 * tangent * camera.aspect),
          );
          camera.position.normalize().multiplyScalar(distance);
        }
        camera.updateProjectionMatrix();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      last = 0;
    });
    io.observe(el);
    const tick = (t: number) => {
      if (visible && !document.hidden) {
        const dt = last ? Math.min(0.04, (t - last) / 1000) : 0;
        if (!director.current.watch) {
          group.rotation.x = reducedMotion.matches
            ? targetX
            : THREE.MathUtils.damp(group.rotation.x, targetX, 18, dt);
          group.rotation.y = reducedMotion.matches
            ? targetY
            : THREE.MathUtils.damp(group.rotation.y, targetY, 18, dt);
        } else {
          targetX = group.rotation.x;
          targetY = group.rotation.y;
        }
        frameRef.current?.(context, dt);
        renderer!.render(scene, camera);
      }
      last = visible && !document.hidden ? t : 0;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const onDown = (e: PointerEvent) => {
      if (director.current.watch) return;
      down = true;
      px = e.clientX;
      py = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      targetY += (e.clientX - px) * 0.005;
      targetX = Math.max(-1, Math.min(1, targetX + (e.clientY - py) * 0.004));
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = () => {
      down = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!director.current.watch && e.key.startsWith('Arrow')) {
        e.preventDefault();
        targetY += e.key === 'ArrowLeft' ? -0.12 : e.key === 'ArrowRight' ? 0.12 : 0;
        targetX = Math.max(
          -1,
          Math.min(1, targetX + (e.key === 'ArrowUp' ? -0.1 : e.key === 'ArrowDown' ? 0.1 : 0)),
        );
      }
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
      cancelAnimationFrame(id);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('keydown', onKey);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('keydown', onKey);
      cleanup?.();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer!.domElement.removeEventListener('webglcontextlost', lost);
      renderer!.dispose();
      renderer!.domElement.remove();
    };
  }, [build, dark, failed, flat, fitWidth, fitHeight]);
  return (
    <div className="canvas-host" style={{ height: '100%', position: 'relative' }}>
      <div
        ref={host}
        tabIndex={demo.watch ? -1 : 0}
        role="img"
        aria-label={demo.watch ? label : label + '；拖动或使用方向键旋转'}
        style={{
          position: 'absolute',
          inset: 0,
          touchAction: demo.watch ? 'pan-y' : 'none',
          display: failed || flat ? 'none' : undefined,
        }}
      />
      {(failed || flat) && (
        <>
          <div style={{ height: '100%' }}>{fallback}</div>
          <span className="dimension-fallback">二维交互模式 · 空间运算保持不变</span>
        </>
      )}
      {!failed && (
        <button className="btn spatial-mode" onClick={() => setFlat(!flat)} aria-pressed={flat}>
          {flat ? '返回三维视图' : '二维视图'}
        </button>
      )}
    </div>
  );
}
