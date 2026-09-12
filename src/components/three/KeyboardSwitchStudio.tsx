import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import Studio, { type StudioContext } from './Studio';
import KeyboardSwitchFlat from './KeyboardSwitchFlat';
import {
  keyboardSwitchSolids,
  keyboardSwitchView,
  type KeyboardSwitchVisual,
  type SwitchSolid,
} from '../../models/keyboard-switch-geometry';

export type { KeyboardSwitchVisual } from '../../models/keyboard-switch-geometry';
export default function KeyboardSwitchStudio(props: KeyboardSwitchVisual) {
  const live = useRef(props);
  live.current = props;
  return (
    <Studio
      className="keyboard-switch-studio"
      cameraPosition={[20, 25, 42]}
      target={[0, 9, 0]}
      span={24}
      fitHeight={25}
      exposure={0.67}
      label={t('机械键盘轴体剖面：键帽、十字轴心、弹簧与触点')}
      fallback={<KeyboardSwitchFlat {...props} />}
      create={(context) => createKeyboardSwitch(live, context)}
    />
  );
}
function indices(s: SwitchSolid) {
  const result: number[] = [];
  for (const f of s.faces) for (let j = 1; j < f.length - 1; j++) result.push(f[0], f[j], f[j + 1]);
  return result;
}
function material(s: SwitchSolid) {
  const metal = s.material === 'steel' || s.material === 'gold' || s.material === 'copper';
  return new THREE.MeshStandardMaterial({
    color: s.color,
    metalness: metal ? 0.7 : s.material === 'magnet' ? 0.38 : 0,
    roughness: s.material === 'housing' ? 0.42 : metal ? 0.35 : 0.61,
    transparent: s.material === 'housing' || s.opacity !== undefined,
    opacity: s.material === 'housing' ? 0.78 : (s.opacity ?? 1),
    depthWrite: s.material !== 'housing',
    side: THREE.DoubleSide,
    emissive: s.material === 'light' ? s.color : '#000000',
    emissiveIntensity: s.material === 'light' ? 0.5 : 0,
  });
}
/** Chapter fits are fixed against a complete travel envelope. Macro views are
 * deliberate local observations, with the relevant original connected parts. */
export function fitKeyboardSwitchCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  chapter: number,
  progress: number,
  settle = true,
  variant?: KeyboardSwitchVisual['state']['variant'],
) {
  const v = keyboardSwitchView(chapter, camera.aspect < 1.25, variant),
    focus = new THREE.Vector3(...v.focus).add(new THREE.Vector3(0, 1.1, 0)),
    direction = new THREE.Vector3(...v.direction),
    tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance =
    Math.max(v.height / (2 * tangent), v.span / (2 * tangent * camera.aspect)) +
    (v.detail ? 1.8 : 4.6);
  if (!v.detail) {
    const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
      up = new THREE.Vector3().crossVectors(direction, right).normalize();
    // Fixed complete swept bounds: board near corners, housing and keycap at
    // both ends of travel. Perspective depth is included in the fit.
    for (const [xs, ys, zs] of [
      [
        [-10.75, 10.75],
        [-1.1, 0],
        [-9.3, 9.3],
      ],
      [
        [-7.5, 7.5],
        [0, 12.6],
        [-7, 7],
      ],
      [
        [-8.6, 8.6],
        [10.7, 19],
        [-8.7, -0.3],
      ],
    ])
      for (const x of xs)
        for (const y of ys)
          for (const z of zs) {
            const p = new THREE.Vector3(x, y + 1.1, z).sub(focus),
              depth = p.dot(direction);
            distance = Math.max(
              distance,
              depth + Math.abs(p.dot(right)) / (tangent * camera.aspect * 0.89),
              depth + Math.abs(p.dot(up)) / (tangent * 0.89),
            );
          }
  }
  const desired = focus.clone().addScaledVector(direction, distance);
  if (settle) {
    target.copy(focus);
    camera.position.copy(desired);
  } else {
    target.lerp(focus, 0.13);
    camera.position.lerp(desired, 0.13);
  }
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  void progress;
  return { focus, distance };
}
export function createKeyboardSwitch(
  live: { current: KeyboardSwitchVisual },
  { root, camera, controls }: StudioContext,
) {
  root.position.y = 1.1;
  const parts = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>();
  const previousVertices = new Map<string, SwitchSolid['vertices']>();
  let oldChapter = -1,
    oldAspect = 0,
    oldVariant = '',
    lastSignature = '';
  return {
    update(_dt: number, _elapsed: number, settle: boolean) {
      const v = live.current,
        s = v.state,
        signature = [
          s.variant,
          s.stemOffsetMm,
          s.springLengthMm,
          s.contact.gapMm,
          s.contact.leafDeflectionMm,
          s.click.sleeveOffsetMm,
          s.silent.bottomCompressionMm,
          s.silent.topCompressionMm,
          s.hall.magnetYmm,
          s.hall.sensorYmm,
          s.optical.transmission,
          s.optical.apertureCenterMm,
          s.optical.apertureHalfHeightMm,
        ].join('|');
      if (signature !== lastSignature) {
        const solids = keyboardSwitchSolids(s),
          visible = new Set(solids.map((p) => p.id));
        for (const [id, mesh] of parts) mesh.visible = visible.has(id);
        for (const part of solids) {
          let mesh = parts.get(part.id);
          if (!mesh) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
              'position',
              new THREE.Float32BufferAttribute(part.vertices.flat(), 3),
            );
            geometry.setIndex(indices(part));
            geometry.computeVertexNormals();
            mesh = new THREE.Mesh(geometry, material(part));
            mesh.name = part.id;
            mesh.castShadow = mesh.receiveShadow =
              part.material !== 'housing' && part.material !== 'light';
            root.add(mesh);
            parts.set(part.id, mesh);
          } else {
            mesh.visible = true;
            if (previousVertices.get(part.id) === part.vertices) continue;
            let positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
            if (positions.count !== part.vertices.length) {
              mesh.geometry.dispose();
              mesh.geometry = new THREE.BufferGeometry();
              positions = new THREE.Float32BufferAttribute(part.vertices.flat(), 3);
              mesh.geometry.setAttribute('position', positions);
              mesh.geometry.setIndex(indices(part));
            } else
              for (let i = 0; i < part.vertices.length; i++)
                positions.setXYZ(i, ...part.vertices[i]);
            positions.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeBoundingSphere();
            mesh.material.color.set(part.color);
            mesh.material.opacity = part.material === 'housing' ? 0.78 : (part.opacity ?? 1);
            mesh.visible = true;
          }
          previousVertices.set(part.id, part.vertices);
        }
        lastSignature = signature;
      }
      if (!v.allowOrbit) {
        controls.enabled = false;
        fitKeyboardSwitchCamera(
          camera,
          controls.target,
          v.chapter,
          v.chapterProgress,
          settle || oldChapter < 0 || camera.aspect !== oldAspect,
          s.variant,
        );
      } else {
        controls.enabled = true;
        if (oldChapter !== v.chapter || oldAspect !== camera.aspect || oldVariant !== s.variant)
          fitKeyboardSwitchCamera(
            camera,
            controls.target,
            v.chapter,
            v.chapterProgress,
            true,
            s.variant,
          );
      }
      oldChapter = v.chapter;
      oldAspect = camera.aspect;
      oldVariant = s.variant;
    },
  };
}
