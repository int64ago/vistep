import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { keyboardSwitchStateAtTravel } from '../../models/keyboard-switch';
import { keyboardSwitchSolids, type SwitchSolid } from '../../models/keyboard-switch-geometry';
import { createSwitchGeometry, updateSwitchGeometry } from './keyboard-switch-mesh';

const part = (variant: 'red' | 'brown', travel: number, id: string) =>
  keyboardSwitchSolids(keyboardSwitchStateAtTravel(variant, travel)).find(
    (solid) => solid.id === id,
  )!;
const point = (
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  index: number,
) => new THREE.Vector3().fromBufferAttribute(attribute, index);

describe('keyboard switch polygon rendering', () => {
  it('triangulates both actual concave Brown cam caps without overlap or reversed triangles', () => {
    const solid = part('brown', 1.5, 'tls-stem-leg'),
      geometry = createSwitchGeometry(solid),
      positions = geometry.getAttribute('position');
    for (const z of [
      Math.min(...solid.vertices.map((v) => v[2])),
      Math.max(...solid.vertices.map((v) => v[2])),
    ]) {
      const original = solid.faces.find(
        (f) => f.length > 4 && f.every((i) => Math.abs(solid.vertices[i][2] - z) < 1e-10),
      )!;
      expect(original).toBeDefined();
      const signedArea = original.reduce((sum, index, i) => {
        const a = solid.vertices[index],
          b = solid.vertices[original[(i + 1) % original.length]];
        return sum + (a[0] * b[1] - a[1] * b[0]) / 2;
      }, 0);
      let area = 0,
        triangles = 0;
      for (let i = 0; i < positions.count; i += 3) {
        const a = point(positions, i),
          b = point(positions, i + 1),
          c = point(positions, i + 2);
        if (![a, b, c].every((p) => Math.abs(p.z - z) < 1e-6)) continue;
        const cross = b.clone().sub(a).cross(c.clone().sub(a));
        expect(cross.z * signedArea).toBeGreaterThan(0);
        area += cross.length() / 2;
        triangles++;
      }
      expect(triangles).toBe(original.length - 2);
      // The old triangle fan overfilled one side by 28%, despite correct bounds.
      expect(area).toBeCloseTo(Math.abs(signedArea), 5);
    }
    geometry.dispose();
  });

  it('keeps the real board face exactly planar in its shading at every triangle corner', () => {
    const solid = part('red', 0, 'pcb'),
      geometry = createSwitchGeometry(solid);
    const positions = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal');
    const top = Math.max(...solid.vertices.map((v) => v[1]));
    let corners = 0;
    for (let i = 0; i < positions.count; i += 3) {
      if (![i, i + 1, i + 2].every((j) => Math.abs(positions.getY(j) - top) < 1e-6)) continue;
      for (const j of [i, i + 1, i + 2]) {
        expect([normals.getX(j), normals.getY(j), normals.getZ(j)]).toEqual([0, 1, 0]);
        corners++;
      }
    }
    expect(corners).toBeGreaterThan(6);
    expect(geometry.getAttribute('uv').count).toBe(positions.count);
    geometry.dispose();
  });

  it('smooths a cylinder radially while retaining hard planar end caps', () => {
    const count = 24;
    const vertices: SwitchSolid['vertices'] = [0, 2].flatMap((y) =>
      Array.from(
        { length: count },
        (_, i) =>
          [Math.cos((i / count) * Math.PI * 2), y, -Math.sin((i / count) * Math.PI * 2)] as [
            number,
            number,
            number,
          ],
      ),
    );
    const faces = [
      Array.from({ length: count }, (_, i) => count - 1 - i),
      Array.from({ length: count }, (_, i) => count + i),
    ];
    for (let i = 0; i < count; i++)
      faces.push([i, (i + 1) % count, count + ((i + 1) % count), count + i]);
    const geometry = createSwitchGeometry({
      id: 'reference-cylinder',
      material: 'steel',
      color: '#aaaaaa',
      vertices,
      faces,
      smooth: true,
    });
    const positions = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal');
    for (let i = 0; i < positions.count; i += 3) {
      const ys = [i, i + 1, i + 2].map((j) => positions.getY(j)),
        cap = ys.every((y) => y === ys[0]);
      for (const j of [i, i + 1, i + 2]) {
        const n = point(normals, j);
        if (cap) {
          expect(n.x).toBeCloseTo(0, 7);
          expect(n.z).toBeCloseTo(0, 7);
          expect(n.y).toBe(ys[0] === 0 ? -1 : 1);
        } else {
          const radial = point(positions, j);
          radial.y = 0;
          expect(n.dot(radial.normalize())).toBeCloseTo(1, 6);
          expect(n.y).toBeCloseTo(0, 7);
        }
      }
    }
    geometry.dispose();
  });

  it('does not curve a smooth molded crown cap across its shallow bevel', () => {
    const solid = part('red', 1.5, 'stem-central'),
      geometry = createSwitchGeometry(solid),
      positions = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal'),
      top = Math.max(...solid.vertices.map((p) => p[1]));
    let capCorners = 0;
    for (let i = 0; i < positions.count; i += 3) {
      if (![i, i + 1, i + 2].every((j) => Math.abs(positions.getY(j) - top) < 1e-6)) continue;
      for (const j of [i, i + 1, i + 2]) {
        expect(normals.getY(j)).toBeCloseTo(1, 7);
        expect(normals.getX(j)).toBeCloseTo(0, 7);
        expect(normals.getZ(j)).toBeCloseTo(0, 7);
        capCorners++;
      }
    }
    expect(capCorners).toBeGreaterThan(6);
    geometry.dispose();
  });

  it('reuses compiled topology and UV during real spring deformation and matches a fresh mesh', () => {
    const first = part('red', 0, 'return-spring'),
      compressed = part('red', 3.8, 'return-spring');
    const triangulate = vi.spyOn(THREE.ShapeUtils, 'triangulateShape');
    const geometry = createSwitchGeometry(first),
      position = geometry.getAttribute('position'),
      normal = geometry.getAttribute('normal'),
      uv = geometry.getAttribute('uv');
    const oldUv = Array.from(uv.array),
      calls = triangulate.mock.calls.length;
    updateSwitchGeometry(geometry, compressed);
    expect(triangulate).toHaveBeenCalledTimes(calls);
    expect(geometry.getAttribute('position')).toBe(position);
    expect(geometry.getAttribute('normal')).toBe(normal);
    expect(geometry.getAttribute('uv')).toBe(uv);
    expect(Array.from(uv.array)).toEqual(oldUv);
    const fresh = createSwitchGeometry(compressed),
      fp = fresh.getAttribute('position'),
      fn = fresh.getAttribute('normal');
    expect(position.count).toBe(fp.count);
    // Different valid diagonals on nonplanar quads need not share corner order.
    // Compare complete source bounds and the normals at each emitted position.
    expect(geometry.boundingBox?.min.toArray()).toEqual(fresh.boundingBox?.min.toArray());
    expect(geometry.boundingBox?.max.toArray()).toEqual(fresh.boundingBox?.max.toArray());
    const normalByPosition = new Map<string, THREE.Vector3[]>();
    for (let i = 0; i < fp.count; i++) {
      const key = point(fp, i).toArray().join(','),
        bucket = normalByPosition.get(key) ?? [];
      bucket.push(point(fn, i));
      normalByPosition.set(key, bucket);
    }
    for (let i = 0; i < position.count; i++) {
      const p = point(position, i),
        n = point(normal, i);
      expect([...p.toArray(), ...n.toArray()].every(Number.isFinite)).toBe(true);
      expect(n.length()).toBeCloseTo(1, 6);
      expect(
        normalByPosition.get(p.toArray().join(','))?.some((other) => other.distanceTo(n) < 1e-6),
      ).toBe(true);
    }
    expect(geometry.boundingSphere?.radius).toBeGreaterThan(0);
    triangulate.mockRestore();
    geometry.dispose();
    fresh.dispose();
  });
});
