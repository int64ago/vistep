import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export const material = (color: THREE.ColorRepresentation, metalness = 0, roughness = 0.45) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
export function box(
  parent: THREE.Object3D,
  size: number[],
  position: number[],
  mat: THREE.Material,
  radius = 0.025,
) {
  const mesh = new THREE.Mesh(
    radius
      ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius)
      : new THREE.BoxGeometry(...(size as [number, number, number])),
    mat,
  );
  mesh.position.fromArray(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function roller(
  parent: THREE.Object3D,
  radius: number,
  length: number,
  position: number[],
  mat: THREE.Material,
) {
  const group = new THREE.Group();
  group.position.fromArray(position);
  parent.add(group);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 64), mat);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  return group;
}
export function tube(
  parent: THREE.Object3D,
  points: number[][],
  radius: number,
  mat: THREE.Material,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(32, points.length * 8), radius, 8, false),
    mat,
  );
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
export function screw(parent: THREE.Object3D, p: number[], mat: THREE.Material, size = 0.055) {
  const head = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.035, 16), mat);
  head.position.fromArray(p);
  head.castShadow = true;
  parent.add(head);
  const slot = box(
    parent,
    [size * 1.2, 0.006, 0.014],
    [p[0], p[1] + 0.02, p[2]],
    material('#3b4046'),
    0,
  );
  return slot;
}
export function gear(
  parent: THREE.Object3D,
  radius: number,
  teeth: number,
  position: number[],
  mat: THREE.Material,
  depth = 0.1,
) {
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i / teeth / 4) * Math.PI * 2,
      r = radius * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.88);
    const x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.24, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.006,
      bevelSegments: 1,
      steps: 1,
    }),
    mat,
  );
  mesh.position.fromArray(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
