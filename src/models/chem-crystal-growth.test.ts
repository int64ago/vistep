import { describe, it, expect } from 'vitest';
import {
  alumGrowth,
  iodineParcels,
  iodineLid,
  liftedTransfer,
  octahedron,
  saltEquilibrium,
  shellState,
  sulfurState,
} from './chem-crystal-growth';
describe('crystallization routes', () => {
  it('retains total sulfur across powder, melt and cooling', () => {
    for (let i = 0; i <= 200; i++) {
      const s = sulfurState(i / 200);
      expect(s.powder + s.melted + s.crystallized).toBeCloseTo(1, 12);
    }
    expect(sulfurState(0.5).melted).toBe(1);
    expect(sulfurState(1).crystallized).toBe(1);
  });
  it('keeps 48 iodine identities inside the covered vessel on continuous paths', () => {
    // Visit every original sample without constructing 576,000 assertion objects.
    // Keep the first offending state for a useful failure report on slower CI CPUs.
    const violations: unknown[] = [];
    for (const cool of [false, true]) {
      let old = iodineParcels(0, cool);
      for (let i = 1; i <= 1000; i++) {
        const now = iodineParcels(i / 1000, cool);
        for (let j = 0; j < 48; j++) {
          const a = now[j],
            b = old[j];
          const step = Math.hypot(a.point.x - b.point.x, a.point.y - b.point.y);
          if (
            !(
              a.id === j &&
              a.point.x > 88 &&
              a.point.x < 232 &&
              a.point.y >= iodineLid(a.point.x) - 0.5 &&
              a.point.y <= 190 &&
              step < 1
            ) &&
            violations.length < 5
          )
            violations.push({ cool, frame: i, id: j, state: a, step });
        }
        old = now;
      }
      expect(old.filter((x) => x.phase === 'deposit')).toHaveLength(cool ? 48 : 0);
    }
    expect(violations).toEqual([]);
  });
  it('balances both ions and redissolves the precipitate on dilution', () => {
    for (let a = 0; a <= 0.4; a += 0.02)
      for (let w = 0; w <= 1; w += 0.05) {
        const s = saltEquilibrium(a, w);
        expect(s.dissolvedNa + s.precipitate).toBeCloseTo(1, 12);
        expect(s.dissolvedCl + s.precipitate).toBeCloseTo(1 + 4 * a, 12);
        if (s.precipitate > 1e-9) expect(s.quotient).toBeCloseTo(1, 12);
        else expect(s.quotient).toBeLessThanOrEqual(1 + 1e-9);
      }
    expect(saltEquilibrium(0.3, 0).precipitate).toBeGreaterThan(0.16);
    expect(saltEquilibrium(0.3, 0.6).precipitate).toBe(0);
    expect(saltEquilibrium(0, 0.3).precipitate).toBe(0);
  });
  it('growth draws material from solution; undersaturation dissolves the seed', () => {
    for (const cap of [0.3, 0.65, 0.94, 1.2])
      for (let i = 0; i <= 100; i++) {
        const s = alumGrowth(cap, i / 100);
        expect(s.crystal + s.solution).toBeCloseTo(s.total, 14);
        expect(s.relativeRadius ** 3 * 0.06).toBeCloseTo(s.crystal, 12);
      }
    expect(alumGrowth(0.65, 1).crystal).toBeGreaterThan(0.34);
    expect(alumGrowth(1.2, 1).crystal).toBeLessThan(0.001);
    expect(alumGrowth(0.94, 1).crystal).toBeCloseTo(0.06);
  });
  it('retains core and adds shell volumes only while immersed, transfer clears rims', () => {
    let old = shellState(0);
    for (let i = 1; i <= 2000; i++) {
      const s = shellState(i / 2000);
      expect(s.coreVolume).toBe(1);
      expect(s.outerRadius ** 3).toBeCloseTo(1 + s.purpleVolume + s.clearVolume, 12);
      if (s.bath === -1 && old.bath === -1) {
        expect(s.purpleVolume).toBeCloseTo(old.purpleVolume, 8);
        expect(s.clearVolume).toBeCloseTo(old.clearVolume, 8);
      }
      expect(Math.hypot(s.point.x - old.point.x, s.point.y - old.point.y)).toBeLessThan(1.2);
      old = s;
    }
    for (let i = 26; i < 75; i++) expect(liftedTransfer(58, 160, i / 100).y).toBe(115);
  });
  it('uses six equal-radius vertices and eight triangular faces for the octahedron', () => {
    const o = octahedron(1, 0);
    expect(o.vertices).toHaveLength(6);
    for (const v of o.vertices) expect(v.x * v.x + v.y * v.y + v.z * v.z).toBeCloseTo(1, 12);
    expect(o.faces).toHaveLength(8);
    expect(
      new Set(
        o.faces.map((f) =>
          f.points
            .map((p) => o.vertices.indexOf(p))
            .sort()
            .join(','),
        ),
      ).size,
    ).toBe(8);
  });
});
