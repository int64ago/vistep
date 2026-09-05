import * as THREE from 'three';

// Ease the presentation, never the physical state being measured by the experiment.
export const softEase = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function scalarTransition(initial: number, duration = 1) {
  let value = initial,
    from = initial,
    target = initial,
    elapsed = duration;
  return (next: number, dt: number, reduced: boolean) => {
    if (next !== target) {
      from = value;
      target = next;
      elapsed = 0;
    }
    elapsed = reduced ? duration : Math.min(duration, elapsed + dt);
    value = reduced ? target : THREE.MathUtils.lerp(from, target, softEase(elapsed / duration));
    return value;
  };
}

// Each removable cover owns its fading materials; interior surfaces retain their opacity.
export function fadingCover(group: THREE.Group) {
  const originals = new Set<THREE.Material>();
  const copies = new Map<THREE.Material, THREE.Material>();
  const meshes: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes.push(object);
    const own = (material: THREE.Material) => {
      originals.add(material);
      if (!copies.has(material)) {
        const copy = material.clone();
        copy.transparent = true;
        copies.set(material, copy);
      }
      return copies.get(material)!;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(own)
      : own(object.material);
  });
  let previous = -1;
  return {
    opacity(value: number) {
      if (value === previous) return;
      previous = value;
      group.visible = value > 0.001;
      copies.forEach((copy) => {
        copy.opacity = value;
        copy.depthWrite = value > 0.99;
      });
      meshes.forEach((mesh) => {
        mesh.castShadow = value > 0.98;
      });
    },
    // Studio disposes the attached copies. Include detached source materials here.
    dispose() {
      originals.forEach((material) => material.dispose());
    },
  };
}
