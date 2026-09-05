import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Owned by the generator, transformer and induction-motor apparatus renderers. */
export const ELECTRICAL_FRAME_MARGIN = 0.88;

export function electricalBoxCorners(box: THREE.Box3): THREE.Vector3[] {
  return [box.min.x, box.max.x].flatMap((x) =>
    [box.min.y, box.max.y].flatMap((y) =>
      [box.min.z, box.max.z].map((z) => new THREE.Vector3(x, y, z)),
    ),
  );
}

/** Include every instance and reserve hidden parts too, so visibility cannot pump the camera. */
function localGeometryBounds(object: THREE.Object3D, ignored: Set<THREE.Object3D>) {
  object.updateWorldMatrix(true, true);
  const inverse = object.matrixWorld.clone().invert(),
    box = new THREE.Box3(),
    instance = new THREE.Matrix4();
  const visit = (child: THREE.Object3D) => {
    if (ignored.has(child)) return;
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      const geometry = child.geometry;
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
        const matrix = inverse.clone().multiply(child.matrixWorld);
        for (let i = 0; i < (child instanceof THREE.InstancedMesh ? child.count : 1); i++) {
          const transform = matrix.clone();
          if (child instanceof THREE.InstancedMesh) {
            child.getMatrixAt(i, instance);
            transform.multiply(instance);
          }
          for (const p of electricalBoxCorners(geometry.boundingBox))
            box.expandByPoint(p.applyMatrix4(transform));
        }
      }
    }
    child.children.forEach(visit);
  };
  visit(object);
  return box;
}

/**
 * A fixed envelope of the constructed apparatus, including full axial rotor turns
 * and the director's complete yaw interval. No sampled animation history is used.
 * Local geometry boxes conservatively contain the actual buffer vertices.
 */
export function electricalMotionBounds(
  root: THREE.Group,
  rotors: THREE.Object3D[],
  yaw: readonly [number, number],
) {
  root.updateWorldMatrix(true, true);
  const bounds = localGeometryBounds(root, new Set(rotors)),
    inverse = root.matrixWorld.clone().invert();
  for (const rotor of rotors) {
    const local = localGeometryBounds(rotor, new Set());
    const radius = Math.max(...electricalBoxCorners(local).map((p) => Math.hypot(p.x, p.y)));
    const swept = new THREE.Box3(
      new THREE.Vector3(-radius, -radius, local.min.z),
      new THREE.Vector3(radius, radius, local.max.z),
    );
    // Remove the current rotor angle: the cylinder already covers all angles.
    const transform = inverse
      .clone()
      .multiply(rotor.parent!.matrixWorld)
      .multiply(new THREE.Matrix4().compose(rotor.position, new THREE.Quaternion(), rotor.scale));
    for (const p of electricalBoxCorners(swept)) bounds.expandByPoint(p.applyMatrix4(transform));
  }
  const world = new THREE.Box3();
  for (const point of electricalBoxCorners(bounds)) {
    const angles = [yaw[0], yaw[1]];
    // Exact extrema of x cos(a)+z sin(a) and -x sin(a)+z cos(a).
    for (const extremum of [Math.atan2(point.z, point.x), Math.atan2(-point.x, point.z)])
      for (let k = -2; k <= 2; k++) {
        const angle = extremum + k * Math.PI;
        if (angle > yaw[0] && angle < yaw[1]) angles.push(angle);
      }
    for (const angle of angles)
      world.expandByPoint(
        point
          .clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
          .add(root.position),
      );
  }
  // Arrowheads and moving switch tips stay within the apparatus envelope; a
  // small physical clearance also protects line widths at the silhouette.
  return world.expandByScalar(0.12);
}

/** Exact perspective inequality for every near/far corner, rather than fitHeight. */
export function fitElectricalCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  bounds: THREE.Box3,
  margin = ELECTRICAL_FRAME_MARGIN,
) {
  if (bounds.isEmpty() || !(camera.aspect > 0) || !(margin > 0 && margin < 1))
    throw new Error('Invalid electrical apparatus framing domain');
  const direction = camera.position.clone().sub(target).normalize();
  if (direction.lengthSq() < 0.5) direction.set(0, 0, 1);
  target.copy(bounds.getCenter(new THREE.Vector3()));
  camera.position.copy(target).add(direction);
  camera.lookAt(target);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
    up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
    tan = Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2);
  let distance = 0;
  for (const corner of electricalBoxCorners(bounds)) {
    const p = corner.sub(target),
      near = p.dot(direction);
    distance = Math.max(
      distance,
      near + Math.abs(p.dot(right)) / (tan * camera.aspect * margin),
      near + Math.abs(p.dot(up)) / (tan * margin),
      near + camera.near * 2,
    );
  }
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  return distance;
}

export function createElectricalFraming(
  root: THREE.Group,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  rotors: THREE.Object3D[],
  yaw: readonly [number, number],
) {
  const bounds = electricalMotionBounds(root, rotors, yaw);
  const update = () => {
    const distance = fitElectricalCamera(camera, controls.target, bounds);
    // OrbitControls updates after the topic update, including its keyboard
    // animation. Clamp that same-frame update to the newly fitted distance.
    controls.minDistance = controls.maxDistance = distance;
  };
  controls.addEventListener('change', update);
  update();
  return {
    update,
    dispose: () => controls.removeEventListener('change', update),
  };
}
