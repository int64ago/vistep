import { describe, it, expect } from 'vitest';
import {
  tetra,
  reflected,
  axisRotate,
  handedness,
  matches,
  length,
  sub,
  crystal,
  crystalAt,
  optical,
  selectiveConsumption,
} from './chem-chirality-evidence';
describe('chirality and optical evidence', () => {
  it('proper rotation keeps handedness and lengths; reflection reverses it', () => {
    const h = handedness(tetra);
    for (let i = 0; i <= 100; i++) {
      const r = reflected((i * Math.PI) / 50);
      expect(handedness(r)).toBeCloseTo(-h, 8);
      for (let k = 0; k < 4; k++)
        for (let j = k + 1; j < 4; j++)
          expect(length(sub(r[k], r[j]))).toBeCloseTo(length(sub(tetra[k], tetra[j])), 8);
      expect(matches(r).every(Boolean)).toBe(false);
    }
    expect(matches(reflected(Math.PI)).filter(Boolean)).toHaveLength(2);
  });
  it('two identical substituents allow a proper superposition without reflecting back', () => {
    expect(matches(reflected(Math.PI), true)).toEqual([true, true, true, true]);
    expect(handedness(reflected(Math.PI))).toBeCloseTo(-handedness(tetra), 8);
  });
  it('constructs mirror crystal facets rather than changing a color', () => {
    const a = crystal(1),
      b = crystal(-1);
    expect(a.filter((f) => f.cap)).toHaveLength(4);
    expect(a).toHaveLength(10);
    a.forEach((f, i) =>
      f.points.forEach((p, j) => {
        expect(b[i].points[j].x).toBe(-p.x);
        expect(b[i].points[j].y).toBe(p.y);
        expect(b[i].points[j].z).toBe(p.z);
      }),
    );
    const vertices = a
      .flatMap((f) => f.points)
      .filter((p, i, all) => all.findIndex((q) => length(sub(p, q)) < 1e-8) === i);
    for (const signs of [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ]) {
      const rot = vertices.map((v) => ({
        x: v.x * signs[0],
        y: v.y * signs[1],
        z: v.z * signs[2],
      }));
      const mir = vertices.map((v) => ({ ...v, x: -v.x }));
      expect(rot.every((p) => mir.some((q) => length(sub(p, q)) < 1e-8))).toBe(false);
    }
    for (const [a, b] of [
      ['x', 'y'],
      ['x', 'z'],
      ['y', 'z'],
    ] as const)
      expect(vertices.reduce((s, v) => s + v[a] * v[b], 0)).toBeCloseTo(0, 8);
    const axes = tetra.map((v) => ({ x: v.x * 0.72, y: v.y * 1.55, z: v.z * 0.95 }));
    expect(handedness(axes)).not.toBe(0);
  });
  it('moves all eight crystals continuously into matching dishes without changing identity', () => {
    for (let i = 0; i < 8; i++) {
      const first = crystalAt(i, 0),
        last = crystalAt(i, 1);
      expect(first.id).toBe(last.id);
      expect(first.hand).toBe(last.hand);
      expect(last.sorted).toBe(true);
      for (let j = 1; j <= 1000; j++) {
        const a = crystalAt(i, (j - 1) / 1000),
          b = crystalAt(i, j / 1000);
        expect(length(sub(a.point, b.point))).toBeLessThan(4);
      }
    }
    expect(
      Array.from({ length: 8 }, (_, i) => crystalAt(i, 1)).filter((c) => c.hand === 1),
    ).toHaveLength(4);
  });
  it('equal enantiomer amounts cancel rotation but retain both compounds', () => {
    expect(optical(1, 0).angle).toBe(30);
    expect(optical(0, 1).angle).toBe(-30);
    expect(optical(0.5, 0.5).angle).toBe(0);
    expect(optical(0.5, 0.5).total).toBe(1);
    expect(optical(1, 0, 30).transmission).toBe(1);
    expect(optical(1, 0, 120).transmission).toBeCloseTo(0, 8);
    expect(optical(1, 0).transmission).not.toBeCloseTo(optical(0, 1).transmission);
  });
  it('separates remaining concentration from enantiomeric excess in a consumption model', () => {
    for (let i = 0; i <= 100; i++) {
      const a = selectiveConsumption(i / 100, 0.8);
      expect(a.plus + a.usedPlus).toBe(1);
      expect(a.minus + a.usedMinus).toBe(1);
    }
    const a = selectiveConsumption(0.8, 1),
      b = selectiveConsumption(0.8, 0);
    expect(optical(a.plus, a.minus).angle).toBeCloseTo(-24);
    expect(optical(b.plus, b.minus).angle).toBe(0);
    expect(optical(0.01, 0).ee).toBe(1);
    expect(optical(0.01, 0).angle).toBeCloseTo(0.3);
  });
});
