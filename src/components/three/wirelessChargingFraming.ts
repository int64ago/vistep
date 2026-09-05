import * as THREE from 'three';

/** Fit actual local geometry bounds after their world transforms, including near corners.
 * The margin is in projected NDC, so perspective depth cannot consume it.
 */
export function wirelessFramingPoints(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const points: THREE.Vector3[] = [];
  const corners = (box: THREE.Box3, matrix: THREE.Matrix4) => {
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z])
          points.push(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
  };
  root.traverse((object) => {
    if (object instanceof THREE.ArrowHelper) {
      // Both AC directions must fit without breathing as the field changes sign.
      corners(
        new THREE.Box3(new THREE.Vector3(-0.36, -0.36, -0.36), new THREE.Vector3(0.36, 0.36, 0.36)),
        new THREE.Matrix4().makeTranslation(
          ...object.getWorldPosition(new THREE.Vector3()).toArray(),
        ),
      );
      return;
    }
    if (object.parent instanceof THREE.ArrowHelper) return;
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.computeBoundingBox();
      if (object.geometry.boundingBox) corners(object.geometry.boundingBox, object.matrixWorld);
    }
  });
  return points;
}

export function fitWirelessCamera(
  camera: THREE.PerspectiveCamera,
  orbitTarget: THREE.Vector3,
  points: THREE.Vector3[],
  margin = 0.84,
) {
  const direction = camera.position.clone().sub(orbitTarget).normalize();
  const target = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
  const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const relative = new THREE.Vector3();
  let distance = 1;
  for (const point of points) {
    relative.copy(point).sub(target);
    const depth = relative.dot(direction);
    distance = Math.max(
      distance,
      depth + Math.abs(relative.dot(right)) / (tangent * camera.aspect * margin),
      depth + Math.abs(relative.dot(up)) / (tangent * margin),
    );
  }
  orbitTarget.copy(target);
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
}
