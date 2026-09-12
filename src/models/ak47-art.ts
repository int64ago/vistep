import * as THREE from 'three';
import { AK47_ART } from './ak47-geometry';
/** Artist's relative coordinates only, with an intentionally incomplete internal assembly.
 * No dimensions, contact geometry, locking, trigger or feed system are modeled. */
export type Ak47ArtPoint = [number, number, number];
export const AK47_ASSEMBLY = Object.freeze({
  rear: -2.22,
  carrier: -0.79,
  carrierLength: 0.68,
  rodEnd: 1.55,
  travel: 0.81,
  axisY: 2.165,
});
export function ak47ArtPosition(relative: number) {
  return -Math.max(0, Math.min(1, relative)) * AK47_ASSEMBLY.travel;
}
export function ak47SpringPoint(q: number, relative: number): Ak47ArtPoint {
  const a = AK47_ASSEMBLY,
    start = a.rear,
    end = a.carrier - a.carrierLength / 2 + ak47ArtPosition(relative);
  const p = Math.max(0, Math.min(1, q)),
    angle = p * Math.PI * 2 * 11;
  const taper = Math.min(1, p * 30, (1 - p) * 30);
  return [
    start + (end - start) * p,
    a.axisY + Math.cos(angle) * 0.088 * taper,
    Math.sin(angle) * 0.088 * taper,
  ];
}
export function ak47Shape(kind: keyof typeof AK47_ART) {
  const values = AK47_ART[kind].match(/[MLQZ]|-?\d+(?:\.\d+)?/g)!;
  const shape = new THREE.Shape();
  let i = 0;
  const x = () => (Number(values[i++]) - 500) / 100,
    y = () => (365 - Number(values[i++])) / 100;
  while (i < values.length) {
    const command = values[i++];
    if (command === 'M') shape.moveTo(x(), y());
    else if (command === 'L') shape.lineTo(x(), y());
    else if (command === 'Q') shape.quadraticCurveTo(x(), y(), x(), y());
    else if (command === 'Z') shape.closePath();
    else throw new Error('Unsupported art contour command');
  }
  return shape;
}
export const AK47_SURFACES: {
  key: keyof typeof AK47_ART;
  depth: number;
  material: 'wood' | 'steel' | 'cover';
}[] = [
  { key: 'stock', depth: 0.39, material: 'wood' },
  { key: 'grip', depth: 0.31, material: 'wood' },
  { key: 'magazine', depth: 0.27, material: 'steel' },
  { key: 'body', depth: 0.46, material: 'steel' },
  { key: 'cover', depth: 0.45, material: 'cover' },
  { key: 'wood', depth: 0.47, material: 'wood' },
  { key: 'upperWood', depth: 0.35, material: 'wood' },
];
export function ak47SurfaceGeometry(key: keyof typeof AK47_ART, depth: number, segments = 10) {
  const g = new THREE.ExtrudeGeometry(ak47Shape(key), {
    depth,
    curveSegments: segments,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelThickness: 0.028,
    bevelSize: 0.035,
    steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
export const AK47_ROUND_SURFACES = [
  { name: 'barrel', radius: 0.059, length: 3.87, position: [2.25, 1.785, 0] as Ak47ArtPoint },
  {
    name: 'muzzle-exterior',
    radius: 0.075,
    length: 0.32,
    position: [4.05, 1.785, 0] as Ak47ArtPoint,
  },
  {
    name: 'gas-tube-exterior',
    radius: 0.095,
    length: 1.29,
    position: [2.02, 2.165, 0] as Ak47ArtPoint,
  },
];
export function ak47RoundGeometry(
  radius: number,
  length: number,
  position: Ak47ArtPoint,
  segments = 32,
) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(...position);
  return geometry;
}

export const AK47_BOX_SURFACES = [
  {
    name: 'front-sight-base',
    size: [0.095, 0.43, 0.16] as Ak47ArtPoint,
    position: [3.56, 1.995, 0] as Ak47ArtPoint,
  },
  {
    name: 'rear-sight-base',
    size: [0.24, 0.1, 0.41] as Ak47ArtPoint,
    position: [-1.7, 2.33, 0] as Ak47ArtPoint,
  },
  {
    name: 'buttplate',
    size: [0.09, 0.71, 0.4] as Ak47ArtPoint,
    position: [-4.24, 1.36, 0] as Ak47ArtPoint,
  },
];
