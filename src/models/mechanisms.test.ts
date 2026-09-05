import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  chainLoop,
  involuteOutline,
  meshedAngle,
  printerDrive,
  printerMotion,
  pulleyLoop,
  TAU,
  type Point2,
} from './mechanisms';
import { driveBelt } from '../components/three/parts';

const distance = (a: Point2, b: Point2) => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (p: Point2, poly: Point2[]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      hit = !hit;
  }
  return hit;
};
describe('Closed transmission geometry', () => {
  it('keeps pulley tangent joins and the seam continuous', () => {
    const loop = pulleyLoop({ x: -0.65, y: 1.29 }, { x: 2.14, y: 0.94 }, 0.24, 0.105);
    let sum = 0;
    for (const length of loop.lengths) {
      sum += length;
      const left = loop.sample(sum - 1e-7),
        right = loop.sample(sum + 1e-7);
      expect(distance(left, right)).toBeLessThan(3e-7);
      expect(Math.hypot(left.tx - right.tx, left.ty - right.ty)).toBeLessThan(3e-6);
    }
    expect(distance(loop.sample(0), loop.sample(loop.length))).toBeLessThan(1e-12);
  });
  it('makes the belt a watertight solid with outward-facing triangles', () => {
    const loop = pulleyLoop({ x: -0.65, y: 1.29 }, { x: 2.14, y: 0.94 }, 0.24, 0.105);
    const mesh = driveBelt(
      new THREE.Group(),
      loop,
      2.075,
      0.108,
      0.027,
      new THREE.MeshBasicMaterial(),
    );
    const points = mesh.geometry.getAttribute('position'),
      indices = mesh.geometry.index!;
    const edges = new Map<string, number>();
    let volume = 0;
    const p = (i: number) => new THREE.Vector3().fromBufferAttribute(points, i);
    for (let i = 0; i < indices.count; i += 3) {
      const a = indices.getX(i),
        b = indices.getX(i + 1),
        c = indices.getX(i + 2);
      volume += p(a).dot(p(b).cross(p(c))) / 6;
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        const key = [u, v].sort((x, y) => x - y).join(':');
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    expect([...edges.values()].every((n) => n === 2)).toBe(true);
    expect(volume).toBeGreaterThan(0);
    expect(volume / (loop.length * 0.108 * 0.027)).toBeCloseTo(1, 2);
    mesh.geometry.dispose();
  });
  it('closes an even chain at every supported gear combination and phase', () => {
    for (const front of [34, 50])
      for (let rear = 11; rear <= 34; rear++) {
        const chain = chainLoop(front, rear);
        expect(chain.count % 2).toBe(0);
        expect(chain.length).toBeCloseTo(chain.count, 10);
        for (let phase = 0; phase < 1; phase += 0.125)
          for (let i = 0; i < chain.count; i++) {
            const a = chain.sample(i + phase),
              b = chain.sample(((i + 1) % chain.count) + phase);
            expect(Math.abs(distance(a, b) / chain.pitch - 1)).toBeLessThan(0.015);
          }
      }
  });
  it('keeps chain rollers seated on sprocket pitch points', () => {
    const chain = chainLoop(34, 24);
    for (const phase of [0, 0.137, 0.7, 7.12])
      for (let i = 0; i < chain.count; i++) {
        const a = chain.sample(i + phase),
          position = (i + phase) % chain.length;
        if (position > chain.lengths[0] + 1 && position < chain.lengths[0] + chain.lengths[1] - 1) {
          const angle = chain.alpha + ((chain.lengths[0] - phase) * TAU) / 24;
          const toothPhase = ((Math.atan2(a.y, a.x - chain.distance / 2) - angle) * 24) / TAU;
          expect(toothPhase).toBeCloseTo(Math.round(toothPhase), 10);
        }
      }
  });
  it('meshes real involute profiles without intersecting throughout a tooth cycle', () => {
    const a = printerDrive.drum;
    for (const b of [printerDrive.charge, printerDrive.developer]) {
      expect(distance(a, b)).toBeCloseTo((printerDrive.module * (a.teeth + b.teeth)) / 2, 10);
      const bearing = Math.atan2(b.y - a.y, b.x - a.x);
      const originalA = involuteOutline(printerDrive.module, a.teeth),
        originalB = involuteOutline(printerDrive.module, b.teeth);
      const rotate = (poly: Point2[], theta: number, c: Point2) =>
        poly.map((p) => ({
          x: c.x + p.x * Math.cos(theta) - p.y * Math.sin(theta),
          y: c.y + p.x * Math.sin(theta) + p.y * Math.cos(theta),
        }));
      for (let sample = 0; sample < 40; sample++) {
        const angle = (sample * TAU) / a.teeth / 40;
        const pa = rotate(originalA, angle, a),
          pb = rotate(originalB, meshedAngle(angle, a.teeth, b.teeth, bearing), b);
        expect(pa.some((p) => inside(p, pb)) || pb.some((p) => inside(p, pa))).toBe(false);
      }
    }
  });
  it('keeps the tracked pixel and paper continuous at every printing stage', () => {
    for (const selected of [0, 11, 63])
      for (let stage = 1; stage <= 5; stage++) {
        const a = printerMotion(stage - 1e-7, selected),
          b = printerMotion(stage + 1e-7, selected);
        expect(Math.abs(a.paperX - b.paperX)).toBeLessThan(1e-6);
        expect(Math.abs(a.theta - b.theta)).toBeLessThan(1e-6);
      }
    const a = printerMotion(3, 11),
      b = printerMotion(4, 11);
    expect(a.paperX + (a.selectedRow - 3.5) * 0.18).toBeCloseTo(printerDrive.drum.x, 12);
    expect(b.paperX + (b.selectedRow - 3.5) * 0.18).toBeCloseTo(printerDrive.fuser.x, 12);
    expect(b.paperX - a.paperX).toBeCloseTo(
      -(b.rotation - a.rotation) * printerDrive.drum.radius,
      12,
    );
  });
});
