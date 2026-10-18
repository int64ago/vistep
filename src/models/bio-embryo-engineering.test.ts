import { it, expect } from 'vitest';
import {
  fertilizationFrame,
  cleavageState,
  embryoBatch,
  cycleMatch,
  transferPoint,
  transferFrame,
  embryoSplit,
  blastocystCells,
} from './bio-embryo-engineering';
it('requires two independent preparations and contact before sperm entry', () => {
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000,
      a = fertilizationFrame(p);
    if (a.x < 55) expect(a.fused).toBe(true);
    if (a.pronuclei > 0) expect(a.fused).toBe(true);
    expect(fertilizationFrame(p, false, true).x).toBeGreaterThan(55);
    expect(fertilizationFrame(p, true, false).fused).toBe(false);
  }
  expect(fertilizationFrame(0.36).x).toBe(60);
});
it('cleavage increases cell count while preserving total volume in this model', () => {
  for (const p of [0, 0.25, 0.5, 1]) {
    const a = cleavageState(p);
    expect(a.count * a.relativeCellVolume).toBe(1);
  }
  expect(cleavageState(1).count).toBe(8);
});
it('keeps morphology selection distinct from pregnancy outcomes', () => {
  expect(embryoBatch.filter((a) => a.quality === 'suitable')).toHaveLength(4);
  expect(new Set(embryoBatch.map((a) => a.id)).size).toBe(6);
  expect(cycleMatch(7, 7).exact).toBe(true);
  expect(cycleMatch(7, 10).difference).toBe(3);
  expect(cycleMatch(7, 10)).not.toHaveProperty('pregnancyRate');
});
it('transfers embryo inside the same catheter trajectory and only releases beyond the tip', () => {
  for (const w of [240, 320, 800])
    for (let i = 0; i <= 1000; i++) {
      const a = transferFrame(i / 1000, w);
      expect(a.embryo).toEqual(transferPoint(a.embryoT, w));
      expect(a.released).toBe(a.embryoT > a.tipT);
      expect(a.embryo.x).toBeGreaterThanOrEqual(w / 2);
      expect(a.embryo.x).toBeLessThanOrEqual(w / 2 + 73);
    }
  expect(transferFrame(1, 240).released).toBe(true);
});
it('retains all40cell identities and makes ICM allocation depend on the actual cut', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = embryoSplit(i / 1000);
    expect(new Set(a.cells.map((a) => a.id)).size).toBe(40);
    expect(a.counts.map((a) => a.icm)).toEqual([4, 4]);
    expect(a.counts.map((a) => a.te)).toEqual([16, 16]);
    if (a.bladeX < a.reach) expect(a.separation).toBe(0);
  }
  expect(embryoSplit(1, 33).counts.map((a) => a.icm)).toEqual([8, 0]);
  expect(embryoSplit(1, 33).hasBoth).toBe(false);
  expect(blastocystCells().every((a) => Math.hypot(a.x, a.y) + a.r < 55)).toBe(true);
});
