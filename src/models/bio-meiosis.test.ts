import { expect, it } from 'vitest';
import {
  meiosisState,
  meioticGametes,
  exchangeGeometry,
  fixedMeioticCells,
  fixedMeioticSelection,
  restoredPloidy,
} from './bio-meiosis';
it('segregates homologs first and sisters second without an extra DNA replication', () => {
  const first = meiosisState(2.5, false);
  expect(first.cellCount).toBe(2);
  expect(first.totalDNAInC).toBe(4);
  for (const g of meioticGametes(false)) {
    expect(g).toHaveLength(2);
    expect(new Set(g.map((c) => c.pair)).size).toBe(2);
  }
  const final = meiosisState(4);
  expect(final.cellCount).toBe(4);
  expect(new Set(final.chromatids.map((c) => c.id)).size).toBe(8);
  expect(final.totalDNAInC).toBe(4);
  for (let t = 0; t < 4; t += 0.005) {
    const a = meiosisState(t),
      b = meiosisState(t + 0.005);
    expect(
      Math.max(
        ...a.chromatids.map((c, i) => Math.hypot(c.x - b.chromatids[i].x, c.y - b.chromatids[i].y)),
      ),
    ).toBeLessThan(3);
  }
});
it('exchanges only two non-sister chromatids while conserving each material segment', () => {
  const normal = meiosisState(4, false).chromatids,
    recombined = meiosisState(4, true).chromatids;
  expect(recombined.filter((c, i) => c.distalOrigin !== normal[i].distalOrigin)).toHaveLength(2);
  for (const origin of [0, 1])
    expect(recombined.filter((c) => c.distalOrigin === origin)).toHaveLength(4);
  const end = exchangeGeometry(1);
  expect(end[1].distalEndpoint.x).toBe(195);
  expect(end[2].distalEndpoint.x).toBe(155);
  expect(end[0].distal).toBeNull();
});
it('distinguishes the two reciprocal gamete classes of one meiosis from all four possibilities', () => {
  const code = (orientation: 0 | 1) =>
    meioticGametes(false, orientation).map((g) => g.map((c) => c.homolog).join(''));
  expect(new Set(code(0)).size).toBe(2);
  expect(new Set([...code(0), ...code(1)]).size).toBe(4);
  expect(restoredPloidy(2, 2)).toEqual({ maternal: 2, paternal: 2, total: 4, balanced: true });
  expect(restoredPloidy(2, 3).balanced).toBe(false);
  const snapshot = JSON.stringify(fixedMeioticCells);
  for (let i = 0; i < 20; i++) fixedMeioticSelection(i);
  expect(JSON.stringify(fixedMeioticCells)).toBe(snapshot);
});
