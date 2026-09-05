import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  tidesSurface,
  tidesDirection,
  tidesGrid,
  tidesCamera,
  tidesGlyphs,
  tidesDot,
  type TidesState,
  type TidesVector,
} from '../../models/tides';
import { TidesFlat } from '../lab/TidesInstruments';

export default function TidesGlobe({
  state,
  compact,
  flat,
  onFlat,
}: {
  state: TidesState;
  compact: boolean;
  flat: boolean;
  onFlat: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef({ state, compact }),
    refresh = useRef<() => void>(() => {}),
    [failed, setFailed] = useState(false);
  current.current = { state, compact };
  useEffect(() => refresh.current(), [state, compact]);
  useEffect(() => {
    if (flat || failed || !host.current) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor('#183445', 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    scene.add(new THREE.HemisphereLight('#dce9e4', '#223c55', 1.5));
    const key = new THREE.DirectionalLight('#f2e9d7', 1.7);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#78bac9', 1.4);
    rim.position.set(4, 1, -3);
    scene.add(rim);
    const geometries: THREE.BufferGeometry[] = [],
      materials: THREE.Material[] = [];
    const keepG = <T extends THREE.BufferGeometry>(g: T) => {
      geometries.push(g);
      return g;
    };
    const keepM = <T extends THREE.Material>(m: T) => {
      materials.push(m);
      return m;
    };
    const geometry = keepG(new THREE.SphereGeometry(1, 80, 40)),
      positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const units = Array.from({ length: positions.count }, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(positions, i).normalize(),
    );
    const colors = new Float32Array(positions.count * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const ocean = new THREE.Mesh(
      geometry,
      keepM(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.33,
          metalness: 0.05,
          transparent: true,
          opacity: 0.72,
          side: THREE.FrontSide,
          depthWrite: false,
        }),
      ),
    );
    scene.add(ocean);
    const reference = new THREE.Mesh(
      keepG(new THREE.SphereGeometry(1, 48, 24)),
      keepM(
        new THREE.MeshBasicMaterial({
          color: '#668ea6',
          transparent: true,
          opacity: 0.055,
          depthWrite: false,
        }),
      ),
    );
    scene.add(reference);
    const lineMaterial = keepM(
      new THREE.LineBasicMaterial({
        color: '#bad4d4',
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    );
    const globeLines = new THREE.LineSegments(keepG(new THREE.BufferGeometry()), lineMaterial);
    globeLines.renderOrder = 2;
    scene.add(globeLines);
    const meanLine = new THREE.Line(
      keepG(new THREE.BufferGeometry()),
      keepM(
        new THREE.LineDashedMaterial({
          color: '#dbd0af',
          dashSize: 0.035,
          gapSize: 0.045,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );
    meanLine.renderOrder = 3;
    scene.add(meanLine);
    const siteLine = new THREE.Line(
      keepG(new THREE.BufferGeometry()),
      keepM(
        new THREE.LineBasicMaterial({
          color: '#edd19a',
          transparent: true,
          opacity: 0.76,
          depthWrite: false,
        }),
      ),
    );
    scene.add(siteLine);
    const moon = new THREE.Mesh(
      keepG(new THREE.SphereGeometry(1, 32, 20)),
      keepM(new THREE.MeshStandardMaterial({ color: '#aab4b9', roughness: 0.9 })),
    );
    scene.add(moon);
    const axisLine = new THREE.Line(
      keepG(new THREE.BufferGeometry()),
      keepM(
        new THREE.LineDashedMaterial({
          color: '#becac7',
          dashSize: 0.045,
          gapSize: 0.065,
          transparent: true,
          opacity: 0.3,
        }),
      ),
    );
    scene.add(axisLine);
    const markerMaterial = keepM(
      new THREE.MeshBasicMaterial({ color: '#f0ca84', transparent: true, depthTest: false }),
    );
    const marker = new THREE.Mesh(keepG(new THREE.SphereGeometry(0.035, 16, 12)), markerMaterial);
    marker.renderOrder = 5;
    scene.add(marker);
    const arrows = Array.from({ length: 12 }, () => {
      const line = new THREE.Line(
        keepG(new THREE.BufferGeometry()),
        keepM(new THREE.LineBasicMaterial({ color: '#a6dece', depthTest: false })),
      );
      const cone = new THREE.Mesh(
        keepG(new THREE.ConeGeometry(0.026, 0.085, 8)),
        keepM(new THREE.MeshBasicMaterial({ color: '#a6dece', depthTest: false })),
      );
      line.renderOrder = 6;
      cone.renderOrder = 6;
      scene.add(line, cone);
      return { line, cone };
    });
    const vector = (p: TidesVector) => new THREE.Vector3(p.x, p.y, p.z);
    const setPoints = (g: THREE.BufferGeometry, points: TidesVector[]) => {
      g.setFromPoints(points.map(vector));
    };
    const low = new THREE.Color('#334d6e'),
      neutral = new THREE.Color('#426379'),
      high = new THREE.Color('#78aea6');
    let disposed = false;
    const draw = () => {
      if (disposed || document.hidden) return;
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth)
        return;
      const { state: s, compact } = current.current,
        { width, height } = element.getBoundingClientRect();
      const cameraState = tidesCamera(s, Math.max(1, width), Math.max(1, height), compact),
        glyph = tidesGlyphs(s, compact);
      camera.aspect = cameraState.aspect;
      camera.position.set(cameraState.position.x, cameraState.position.y, cameraState.position.z);
      camera.lookAt(cameraState.target.x, cameraState.target.y, cameraState.target.z);
      camera.updateProjectionMatrix();
      const color = new THREE.Color();
      for (let i = 0; i < units.length; i++) {
        const u = units[i],
          point = tidesSurface(u, s.bodies, s.gain);
        positions.setXYZ(i, point.position.x, point.position.y, point.position.z);
        color
          .copy(neutral)
          .lerp(point.height >= 0 ? high : low, Math.min(1, Math.abs(point.height) / 0.55));
        color.toArray(colors, i * 3);
      }
      positions.needsUpdate = true;
      geometry.getAttribute('color').needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const rings = tidesGrid(s.bodies, s.gain, s.config.rotation),
        segments: TidesVector[] = [];
      for (const ring of rings)
        for (let i = 1; i < ring.points.length; i++)
          segments.push(ring.points[i - 1].position, ring.points[i].position);
      setPoints(globeLines.geometry, segments);
      setPoints(
        meanLine.geometry,
        Array.from({ length: 145 }, (_, i) => ({
          x: Math.cos((i * Math.PI) / 72),
          y: Math.sin((i * Math.PI) / 72),
          z: 0,
        })),
      );
      meanLine.computeLineDistances();
      setPoints(
        siteLine.geometry,
        Array.from(
          { length: 145 },
          (_, i) =>
            tidesSurface(tidesDirection(s.config.latitude, i * 2.5), s.bodies, s.gain).position,
        ),
      );
      siteLine.visible = ['rotation', 'latitude'].includes(s.focus);
      moon.position.copy(vector(glyph.moon));
      moon.scale.setScalar(glyph.moonRadius);
      setPoints(axisLine.geometry, [{ x: 0, y: 0, z: 0 }, glyph.moon]);
      axisLine.computeLineDistances();
      marker.position.copy(vector(glyph.marker));
      markerMaterial.opacity = tidesDot(s.pointDirection, cameraState.view) >= 0 ? 1 : 0.28;
      for (let i = 0; i < arrows.length; i++) {
        const arrow = arrows[i],
          a = glyph.arrows[i];
        arrow.line.visible = arrow.cone.visible = !!a;
        if (!a) continue;
        const direction = vector(a.tip).sub(vector(a.origin)),
          length = direction.length();
        setPoints(arrow.line.geometry, [a.origin, a.tip]);
        arrow.cone.visible = length > 0.012;
        if (length > 0) {
          direction.normalize();
          arrow.cone.position.copy(
            vector(a.tip).addScaledVector(direction, -Math.min(0.04, length / 2)),
          );
          arrow.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
          arrow.cone.scale.setScalar(Math.min(1, length / 0.08));
        }
        const color = s.frame === 'absolute' ? '#e9c689' : '#a6dece';
        (arrow.line.material as THREE.LineBasicMaterial).color.set(color);
        (arrow.cone.material as THREE.MeshBasicMaterial).color.set(color);
      }
      renderer.render(scene, camera);
      element.dataset.renderedFocus = s.focus;
      element.dataset.renderedProgress = String(s.progress);
    };
    // The director owns animation timing; render each delivered state synchronously.
    const schedule = () => {
      if (!disposed) draw();
    };
    refresh.current = schedule;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      schedule();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(() => schedule());
    observer.observe(element);
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
      disposed = true;
      refresh.current = () => {};
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      canvas.removeEventListener('webglcontextlost', lost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [flat, failed]);
  const useFlat = flat || failed;
  return (
    <div className="tides-globe" data-renderer={useFlat ? 'svg' : 'webgl'}>
      <div
        className="tides-globe-surface"
        ref={host}
        role="img"
        aria-label={t('全球海洋平衡模型：参考地球、形变海面与月球方向')}
      >
        {useFlat && <TidesFlat state={state} compact={compact} />}
      </div>
      {!failed && !['gravity', 'subtract'].includes(state.focus) && (
        <span className="tides-globe-note">{t('虚线：未形变参考圈')}</span>
      )}
      <button
        type="button"
        className="tides-flat-toggle"
        disabled={failed}
        aria-pressed={useFlat}
        onClick={onFlat}
      >
        {useFlat ? t('二维视图') : t('切换二维')}
      </button>
      {failed && (
        <span className="tides-fallback-note">{t('图形不可用，已使用同一模型的二维图')}</span>
      )}
    </div>
  );
}
