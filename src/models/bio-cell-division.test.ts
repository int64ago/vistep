import { it, expect } from 'vitest';
import { mitoticState, cubeExchange, fixedRootField, stageCounts } from './bio-cell-division';
it('conserves replicated chromatid identity while each daughter receives one copy', () => {
  const before = mitoticState(2.9),
    after = mitoticState(4);
  expect(before.chromosomesPerCell).toBe(4);
  expect(after.chromosomesPerCell).toBe(8);
  expect(mitoticState(5.5).chromosomesPerCell).toBe(4);
  expect(after.dnaInWholeSystem).toBe(8);
  for (const side of [0, 1])
    expect(after.chromatids.filter((c) => c.sister === side).map((c) => c.chromosome)).toEqual([
      0, 1, 2, 3,
    ]);
  for (let p = 0; p < 5.99; p += 0.01) {
    const a = mitoticState(p),
      b = mitoticState(p + 0.01);
    for (let i = 0; i < 8; i++)
      expect(
        Math.hypot(a.chromatids[i].x - b.chromatids[i].x, a.chromatids[i].y - b.chromatids[i].y),
      ).toBeLessThan(1);
  }
});
it('matches independent cube surface/volume and shell-volume calculations', () => {
  expect(cubeExchange(2, 0.5)).toMatchObject({
    area: 24,
    volume: 8,
    areaPerVolume: 3,
    fraction: 0.875,
  });
  expect(cubeExchange(4, 0.5).fraction).toBeCloseTo(37 / 64);
  expect(cubeExchange(8, 0.5).fraction).toBeCloseTo(169 / 512);
  expect(cubeExchange(2, 0).fraction).toBe(0);
  expect(cubeExchange(2, 10).fraction).toBe(1);
});
it('fixed root preparations do not change with a playback clock and counting does not double-count cells', () => {
  expect(fixedRootField(0)).toEqual(fixedRootField(0));
  expect(new Set(fixedRootField(1).map((c) => c.id)).size).toBe(50);
  expect(Object.values(stageCounts()).reduce((a, b) => a + b, 0)).toBe(50);
  expect(stageCounts().interphase).toBe(34);
  expect(fixedRootField(0)[0].id).not.toBe(fixedRootField(1)[0].id);
});
