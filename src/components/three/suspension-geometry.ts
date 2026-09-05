import * as THREE from 'three';
import { SUSPENSION_GEOMETRY, type suspensionPose } from '../../models/suspension';

/** Display hardware only. These dimensions do not alter the quarter-car equations. */
export const suspensionHardware = {
  guideX: 0.46,
  guideZ: -0.36,
  guideRadius: 0.018,
  bearingBore: 0.021,
  bearingWidth: 0.075,
  bearingDepth: 0.105,
  bearingHeight: 0.1,
  platenWidth: 1.06,
  platenDepth: 0.55,
  platenThickness: 0.065,
  platenZ: 0.02,
} as const;

export function suspensionGuideEnds(pose: ReturnType<typeof suspensionPose>) {
  return {
    top: pose.upperMountY + 0.02,
    bottom: pose.upperMountY + 0.02 - SUSPENSION_GEOMETRY.guideLength,
  };
}

/** The complete guide + bearing sweep lies behind the platen for every vertical state. */
export function suspensionGuideClearance() {
  return (
    suspensionHardware.platenZ -
    suspensionHardware.platenDepth / 2 -
    (suspensionHardware.guideZ + suspensionHardware.bearingDepth / 2)
  );
}

export function suspensionBearingGeometry() {
  const h = suspensionHardware,
    shape = new THREE.Shape(),
    hole = new THREE.Path();
  shape.moveTo(-h.bearingWidth / 2, -h.bearingDepth / 2);
  shape.lineTo(h.bearingWidth / 2, -h.bearingDepth / 2);
  shape.lineTo(h.bearingWidth / 2, h.bearingDepth / 2);
  shape.lineTo(-h.bearingWidth / 2, h.bearingDepth / 2);
  shape.closePath();
  hole.absarc(0, 0, h.bearingBore, 0, 2 * Math.PI, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: h.bearingHeight,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, h.bearingHeight / 2, 0);
  return geometry;
}

/** One orthographic mechanism drawing, retaining the complete guide ends and base. */
export function suspensionDiagramFrame(pose: ReturnType<typeof suspensionPose>) {
  const min = Math.min(-0.3, suspensionGuideEnds(pose).bottom - 0.025),
    max = Math.max(1.46, pose.upperMountY + 0.25),
    scale = 282 / (max - min);
  return { scale, y: (height: number) => 300 - (height - min) * scale };
}

/** Mesh-local corner bounds include thickness and are transformed before perspective fitting. */
export function suspensionMeshCorners(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const corners: THREE.Vector3[] = [];
  root.traverseVisible((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox!;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z])
          corners.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
  });
  return corners;
}

export function fitSuspensionCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  direction: THREE.Vector3,
  corners: THREE.Vector3[],
  orbit = false,
) {
  if (!corners.length) return;
  direction.normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize(),
    up = new THREE.Vector3().crossVectors(direction, right),
    center = (axis: THREE.Vector3) => {
      const values = corners.map((p) => p.dot(axis));
      return (Math.min(...values) + Math.max(...values)) / 2;
    };
  target
    .copy(right)
    .multiplyScalar(center(right))
    .addScaledVector(up, center(up))
    .addScaledVector(direction, center(direction));
  const tan = Math.tan((camera.fov * Math.PI) / 360),
    margin = 0.88;
  let distance = 1;
  for (const point of corners) {
    const q = point.clone().sub(target),
      near = q.dot(direction);
    distance = Math.max(
      distance,
      near + Math.abs(q.dot(right)) / (margin * tan * camera.aspect),
      near + Math.abs(q.dot(up)) / (margin * tan),
    );
  }
  if (orbit) {
    const radius = Math.max(...corners.map((p) => p.distanceTo(target)));
    distance = Math.max(
      distance,
      radius / (margin * Math.sin(Math.atan(tan * Math.min(1, camera.aspect)))),
    );
  }
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
}
