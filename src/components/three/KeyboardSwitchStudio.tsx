import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import Studio, { type StudioContext } from './Studio';
import KeyboardSwitchFlat from './KeyboardSwitchFlat';
import { createSwitchGeometry, updateSwitchGeometry } from './keyboard-switch-mesh';
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
      exposure={0.72}
      label={t('机械键盘轴体剖面：键帽、十字轴心、弹簧与触点')}
      fallback={<KeyboardSwitchFlat {...props} />}
      create={(context) => createKeyboardSwitch(live, context)}
    />
  );
}
/** Deterministic, subtle mould texture. It changes the surface response only;
 * dimensions and motion always come from the original solid geometry. */
function mouldGrain() {
  const size = 128,
    data = new Uint8Array(size * size * 4);
  let seed = 1977;
  for (let i = 0; i < size * size; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 110 + (seed % 37);
    data.set([value, value, value, 255], i * 4);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function material(s: SwitchSolid, grain: THREE.Texture) {
  const metal = ['steel', 'gold', 'copper'].includes(s.material),
    plastic = ['stem', 'cap', 'base'].includes(s.material),
    housing = s.material === 'housing';
  return new THREE.MeshPhysicalMaterial({
    color: housing ? '#e2ece6' : s.color,
    metalness: metal ? 0.91 : s.material === 'magnet' ? 0.55 : 0,
    roughness: housing ? 0.09 : metal ? 0.27 : s.material === 'stem' ? 0.32 : 0.46,
    clearcoat: housing ? 0.25 : plastic ? 0.12 : 0,
    clearcoatRoughness: housing ? 0.18 : 0.42,
    transparent: s.opacity !== undefined,
    opacity: s.opacity ?? 1,
    transmission: housing ? 0.86 : 0,
    thickness: housing ? 0.55 : 0,
    ior: housing ? 1.58 : 1.5,
    depthWrite: true,
    side: THREE.DoubleSide,
    envMapIntensity: metal ? 1.1 : housing ? 0.85 : 0.6,
    bumpMap: plastic ? grain : null,
    bumpScale: s.material === 'cap' ? 0.028 : 0.012,
    emissive: s.material === 'light' ? s.color : '#000000',
    emissiveIntensity: s.material === 'light' ? 0.7 : 0,
  });
}

/** Studio defaults fit tabletop models in another unit scale. Fit this light to
 * the switch's complete motion envelope so the seats and recesses cast shadows. */
function lightKeyboardSwitch(scene: THREE.Scene) {
  for (const object of scene.children) {
    if (object instanceof THREE.Mesh && object.material instanceof THREE.ShadowMaterial)
      object.material.opacity = 0.055;
    if (object instanceof THREE.HemisphereLight) {
      object.intensity = 1.05;
      object.color.set('#f2f5f7');
      object.groundColor.set('#71695e');
    }
    if (!(object instanceof THREE.DirectionalLight)) continue;
    if (object.castShadow) {
      object.intensity = 3.8;
      object.position.set(-21, 38, 29);
      object.target.position.set(0, 8, 0);
      scene.add(object.target);
      const shadowSize = typeof window !== 'undefined' && window.innerWidth < 760 ? 1024 : 2048;
      object.shadow.mapSize.set(shadowSize, shadowSize);
      Object.assign(object.shadow.camera, {
        left: -18,
        right: 18,
        top: 19,
        bottom: -19,
        near: 1,
        far: 85,
      });
      object.shadow.camera.updateProjectionMatrix();
      object.shadow.normalBias = 0.012;
      object.shadow.bias = -0.00012;
      object.shadow.radius = 8;
      object.shadow.blurSamples = 8;
    } else {
      object.intensity = 1.7;
      object.position.set(16, 18, -20);
      object.color.set('#e5edf7');
    }
  }
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
    distance = 0;
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
              depth + Math.abs(p.dot(right)) / (tangent * camera.aspect * 0.9),
              depth + Math.abs(p.dot(up)) / (tangent * 0.9),
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
  { scene, root, camera, controls }: StudioContext,
) {
  root.position.y = 1.1;
  lightKeyboardSwitch(scene);
  camera.far = 180;
  camera.updateProjectionMatrix();
  const grain = mouldGrain(),
    materials = new Map<string, THREE.MeshPhysicalMaterial>(),
    parts = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>>();
  const previousVertices = new Map<string, SwitchSolid['vertices']>();
  const referenceVertices = new Map<string, SwitchSolid['vertices']>();
  const referenceFaces = new Map<string, SwitchSolid['faces']>();
  const translation = new THREE.Vector3();
  const getMaterial = (part: SwitchSolid) => {
    const key = [part.material, part.color, part.opacity === undefined ? 'opaque' : part.id].join(
      '|',
    );
    let result = materials.get(key);
    if (!result) {
      result = material(part, grain);
      materials.set(key, result);
    }
    if (part.material !== 'housing') result.opacity = part.opacity ?? 1;
    return result;
  };
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
            mesh = new THREE.Mesh(createSwitchGeometry(part), getMaterial(part));
            mesh.name = part.id;
            mesh.castShadow = mesh.receiveShadow =
              part.material !== 'housing' && part.material !== 'light';
            root.add(mesh);
            parts.set(part.id, mesh);
            referenceVertices.set(part.id, part.vertices);
            referenceFaces.set(part.id, part.faces);
          } else {
            mesh.visible = true;
            mesh.material = getMaterial(part);
            if (previousVertices.get(part.id) === part.vertices) continue;
            const reference = referenceVertices.get(part.id)!;
            const faces = referenceFaces.get(part.id)!;
            translation.set(
              part.vertices[0][0] - reference[0][0],
              part.vertices[0][1] - reference[0][1],
              part.vertices[0][2] - reference[0][2],
            );
            // Rigid cap/stem/jacket parts move by one matrix. Only genuinely
            // deforming leaves, cushions and spring rebuild vertex attributes.
            const rigid =
              reference.length === part.vertices.length &&
              faces.length === part.faces.length &&
              part.faces.every(
                (face, i) =>
                  face.length === faces[i].length &&
                  face.every((index, j) => index === faces[i][j]),
              ) &&
              part.vertices.every(
                (p, i) =>
                  Math.abs(p[0] - reference[i][0] - translation.x) < 1e-8 &&
                  Math.abs(p[1] - reference[i][1] - translation.y) < 1e-8 &&
                  Math.abs(p[2] - reference[i][2] - translation.z) < 1e-8,
              );
            if (rigid) mesh.position.copy(translation);
            else {
              updateSwitchGeometry(mesh.geometry, part);
              mesh.position.set(0, 0, 0);
              referenceVertices.set(part.id, part.vertices);
              referenceFaces.set(part.id, part.faces);
            }
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
    dispose() {
      grain.dispose();
      // A changed variant can leave cached materials unused by current meshes.
      // Studio disposes attached resources; dispose detached entries here too.
      const attached = new Set([...parts.values()].map((mesh) => mesh.material));
      for (const material of materials.values()) if (!attached.has(material)) material.dispose();
    },
  };
}
