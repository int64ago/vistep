import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { dot3, lunarShadowOnDisk, phaseDiskPath, type LunarState } from '../../models/moon';

const vertex = `
varying vec3 localPoint;
varying vec3 observerPoint;
varying mat3 surfaceFrame;
void main() {
  localPoint = position;
  observerPoint = (modelMatrix * vec4(position, 1.0)).xyz;
  surfaceFrame = mat3(modelMatrix);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragment = `
precision highp float;
uniform sampler2D albedo;
uniform sampler2D heightMap;
uniform vec3 sunlight;
uniform vec3 shadow;
uniform float showShadow;
uniform float showMarker;
varying vec3 localPoint;
varying vec3 observerPoint;
varying mat3 surfaceFrame;
const float PI = 3.141592653589793;
void main() {
  vec3 n = normalize(localPoint);
  vec2 uv = vec2(0.5 + atan(n.x,n.z)/(2.0*PI),0.5+asin(n.y)/PI);
  vec3 base = pow(texture2D(albedo,uv).rgb,vec3(2.2));
  // A qualitative relief treatment; the 8-bit preview is not metric terrain.
  float du = texture2D(heightMap,uv+vec2(0.001,0.0)).r-texture2D(heightMap,uv-vec2(0.001,0.0)).r;
  float dv = texture2D(heightMap,uv+vec2(0.0,0.002)).r-texture2D(heightMap,uv-vec2(0.0,0.002)).r;
  vec3 east = normalize(vec3(n.z,0.00001,-n.x));
  vec3 north = normalize(cross(n,east));
  vec3 detailed = normalize(surfaceFrame*(n-0.42*du*east-0.42*dv*north));
  vec3 perfect = normalize(surfaceFrame*n);
  float incidence = dot(perfect,sunlight);
  float mu = max(0.0,dot(detailed,sunlight));
  float emission = max(0.0,detailed.z);
  float direct = 0.32*mu+0.68*mu/max(0.015,mu+emission);
  // The geometric normal controls the terminator; bump detail cannot light the night side.
  float lit = smoothstep(0.0,0.008,incidence);
  float distanceFromAxis = length(observerPoint.xy-shadow.xy);
  float occulted = showShadow*(1.0-smoothstep(shadow.z-0.003,shadow.z+0.003,distanceFromAxis));
  vec3 color = base*2.05*direct*lit*(1.0-occulted);
  // Small surface fiducial: a teaching mark, not a lunar landmark.
  float ring = 1.0-smoothstep(0.004,0.012,abs(length(n.xy)-0.17));
  float mark = ring*step(0.9,n.z)*showMarker;
  color = mix(color,vec3(0.77,0.43,0.15),mark);
  gl_FragColor = vec4(pow(max(color,vec3(0.0)),vec3(1.0/2.2)),1.0);
}`;

export default function LunarPortrait({
  state,
  marker = false,
}: {
  state: LunarState;
  marker?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef({ state, marker }),
    refresh = useRef<() => void>(() => {}),
    [flat, setFlat] = useState(false),
    [failed, setFailed] = useState(false);
  current.current = { state, marker };
  useEffect(() => refresh.current(), [state, marker]);
  useEffect(() => {
    if (!host.current || flat || failed) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x0c1525, 0);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-1.16, 1.16, 1.16, -1.16, 0.1, 10);
    camera.position.z = 4;
    const placeholder = new THREE.DataTexture(new Uint8Array([154, 149, 140, 255]), 1, 1);
    placeholder.needsUpdate = true;
    const uniforms = {
      albedo: { value: placeholder as THREE.Texture },
      heightMap: { value: placeholder as THREE.Texture },
      sunlight: { value: new THREE.Vector3() },
      shadow: { value: new THREE.Vector3() },
      showShadow: { value: 0 },
      showMarker: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    const geometry = new THREE.SphereGeometry(1, 144, 72),
      mesh = new THREE.Mesh(geometry, material);
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    let disposed = false,
      visible = true,
      request = 0;
    const draw = () => {
      request = 0;
      if (disposed || !visible || document.hidden) return;
      const s = current.current.state,
        axes = [s.lockedRight, s.lockedUp, s.lockedFront];
      const basis = axes.map(
        (a) => new THREE.Vector3(dot3(a, s.right), dot3(a, s.up), dot3(a, s.view)),
      );
      mesh.matrix.makeBasis(basis[0], basis[1], basis[2]);
      mesh.matrixWorldNeedsUpdate = true;
      uniforms.sunlight.value.set(s.sunOnDisk.x, s.sunOnDisk.y, s.sunOnDisk.z);
      const sh = lunarShadowOnDisk(s);
      uniforms.shadow.value.set(sh.x, sh.y, sh.radius);
      uniforms.showShadow.value = sh.enabled ? 1 : 0;
      uniforms.showMarker.value = current.current.marker ? 1 : 0;
      renderer.render(scene, camera);
    };
    const schedule = () => {
      if (!disposed && !request) request = requestAnimationFrame(draw);
    };
    refresh.current = schedule;
    const textures: THREE.Texture[] = [];
    const load = (url: string, uniform: 'albedo' | 'heightMap') => {
      const texture = new THREE.TextureLoader().load(
        url,
        (loaded) => {
          if (disposed) {
            loaded.dispose();
            return;
          }
          loaded.wrapS = THREE.RepeatWrapping;
          loaded.colorSpace = THREE.NoColorSpace;
          uniforms[uniform].value = loaded;
          schedule();
        },
        undefined,
        () => {
          if (!disposed) setFailed(true);
        },
      );
      textures.push(texture);
    };
    load('/textures/moon/lroc-color-2k.jpg', 'albedo');
    load('/textures/moon/lola-height-1k.jpg', 'heightMap');
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      const aspect = width / Math.max(1, height);
      camera.left = -1.16 * Math.max(1, aspect);
      camera.right = -camera.left;
      camera.top = 1.16 / Math.min(1, aspect);
      camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
      schedule();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
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
      cancelAnimationFrame(request);
      refresh.current = () => {};
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      canvas.removeEventListener('webglcontextlost', lost);
      textures.forEach((texture) => texture.dispose());
      placeholder.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [flat, failed]);
  const shadow = lunarShadowOnDisk(state);
  return (
    <div className="lunar-portrait">
      <div
        className="lunar-globe"
        ref={host}
        role="img"
        aria-label={t('地球视角的月面，日照比例 {0}%', (state.illuminated * 100).toFixed(1))}
      >
        {(flat || failed) && (
          <svg viewBox="-1.17 -1.17 2.34 2.34" aria-hidden="true">
            <defs>
              <clipPath id="lunar-disk-clip">
                <circle r="1" />
              </clipPath>
            </defs>
            <circle r="1" fill="#080e19" stroke="#74849b" strokeOpacity=".35" strokeWidth=".006" />
            <path
              d={phaseDiskPath(state.phaseCosine)}
              transform={`rotate(${(-Math.atan2(state.sunOnDisk.y, state.sunOnDisk.x) * 180) / Math.PI})`}
              fill="#d5d4c9"
            />
            {shadow.enabled && (
              <circle
                cx={shadow.x}
                cy={-shadow.y}
                r={shadow.radius}
                fill="#080e19"
                clipPath="url(#lunar-disk-clip)"
              />
            )}
            {marker && <circle r=".17" stroke="#e5b978" strokeWidth=".013" fill="none" />}
          </svg>
        )}
      </div>
      <span className="lunar-view-label">
        {t('从地球看')}
        <i>{t('黄道北向上')}</i>
      </span>
      <button
        className="lunar-render-mode"
        aria-pressed={flat || failed}
        onClick={() => {
          setFailed(false);
          setFlat(!(flat || failed));
        }}
      >
        {flat || failed ? t('返回月面细节') : t('二维几何')}
      </button>
      {failed && (
        <span className="lunar-asset-status" role="status">
          {t('月面资源暂不可用，已显示相同几何。')}
        </span>
      )}
    </div>
  );
}
