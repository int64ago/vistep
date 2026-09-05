import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { involuteOutline, pulleyLoop } from '../../models/mechanisms';
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
  const closed =
    points.length > 2 &&
    points[0].every((v, i) => Math.abs(v - points[points.length - 1][i]) < 1e-8);
  const curve = new THREE.CatmullRomCurve3(
    (closed ? points.slice(0, -1) : points).map(
      (p) => new THREE.Vector3(...(p as [number, number, number])),
    ),
    closed,
    'centripetal',
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(32, points.length * 8), radius, 10, closed),
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
  const module = (2 * radius) / teeth;
  involuteOutline(module, teeth).forEach(({ x, y }, i) =>
    i ? shape.lineTo(x, y) : shape.moveTo(x, y),
  );
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.24, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: module * 0.04,
      bevelThickness: module * 0.04,
      bevelSegments: 2,
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

/** A flat, indexed belt with a welded seam and exact tangent joins. */
export function driveBelt(
  parent: THREE.Object3D,
  loop: ReturnType<typeof pulleyLoop>,
  z: number,
  width: number,
  thickness: number,
  mat: THREE.Material,
) {
  const count = 384,
    positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const p = loop.sample((loop.length * i) / count);
    for (const [out, side] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      positions.push(
        p.x - (p.ty * out * thickness) / 2,
        p.y + (p.tx * out * thickness) / 2,
        z + (side * width) / 2,
      );
    }
    for (let side = 0; side < 4; side++) {
      const a = i * 4 + side,
        b = i * 4 + ((side + 1) % 4),
        c = ((i + 1) % count) * 4 + ((side + 1) % 4),
        d = ((i + 1) % count) * 4 + side;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
