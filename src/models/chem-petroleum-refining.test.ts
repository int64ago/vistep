import { describe, it, expect } from 'vitest';
import {
  petroleumSpecies,
  columnState,
  fractionationFrame,
  crackingProducts,
  crackingFrame,
  oilPath,
  alongOilPath,
} from './chem-petroleum-refining';
describe('petroleum sorting and net cracking', () => {
  it('sorts independently sourced boiling points and preserves gas/residue boundaries', () => {
    expect(columnState(-0.5).type).toBe('gas');
    expect(columnState(391.4).type).toBe('residue');
    expect(columnState(287, 250).type).toBe('residue');
    expect(columnState(68.8, 350, 100).type).toBe('gas');
    expect(columnState(174.2).y).toBeLessThan(columnState(287).y);
    expect(oilPath(3, 250).at(-1)?.y).toBe(oilPath(4, 250).at(-1)?.y);
    expect(oilPath(1, 350, 100).at(-1)?.y).toBe(oilPath(0, 350, 100).at(-1)?.y);
    expect(oilPath(Infinity).at(-1)?.x).toBe(264);
  });
  it('retains every parcel and carbon inventory at every seek', () => {
    const total = 8 * petroleumSpecies.reduce((s, v) => s + v.n, 0);
    for (const p of [0, 0.1, 0.4, 0.7, 1]) {
      const a = fractionationFrame(p);
      expect(new Set(a.map((v) => v.id)).size).toBe(40);
      expect(a.reduce((s, v) => s + v.n, 0)).toBe(total);
      expect(a.every((v) => Number.isFinite(v.x + v.y))).toBe(true);
    }
    expect(fractionationFrame(1).filter((v) => v.arrived)).toHaveLength(40);
  });
  it('uses continuous connected paths instead of relocating condensation marks', () => {
    for (let s = 0; s < 5; s++) {
      const path = oilPath(s);
      expect(alongOilPath(path, 0)).toEqual(path[0]);
      expect(alongOilPath(path, 1).x).toBeCloseTo(path.at(-1)!.x);
      let last = alongOilPath(path, 0);
      for (let i = 1; i <= 1000; i++) {
        const next = alongOilPath(path, i / 1000);
        expect(Math.hypot(next.x - last.x, next.y - last.y)).toBeLessThan(0.6);
        last = next;
      }
    }
  });
  it('matches all four textbook equations and atomic valence independently', () => {
    for (const [n, cut, leftH, rightH] of [
      [16, 8, 18, 16],
      [8, 4, 10, 8],
      [4, 1, 4, 6],
      [4, 2, 6, 4],
    ]) {
      const s = crackingProducts(n, cut);
      expect(s.products[0].h).toBe(leftH);
      expect(s.products[1].h).toBe(rightH);
      expect(s.hydrogenTotal).toBe(2 * n + 2);
      expect(s.bonds.filter((b) => b.order === 2)).toHaveLength(1);
      for (let id = 0; id < n; id++)
        expect(
          s.hydrogen[id] +
            s.bonds.reduce((sum, b) => sum + (b.a === id || b.b === id ? b.order : 0), 0),
        ).toBe(4);
    }
  });
  it('clamps invalid bounds and holds the finished products before chapter reset', () => {
    expect(crackingProducts(NaN, Infinity).hydrogenTotal).toBe(10);
    expect(crackingFrame(16, 8, 0.95).atoms).toEqual(crackingFrame(16, 8, 1).atoms);
    expect(crackingFrame(16, 8, 0.95).breakOpacity).toBe(0);
    expect(crackingFrame(16, 8, 0.95).doubleOpacity).toBe(1);
  });
});
