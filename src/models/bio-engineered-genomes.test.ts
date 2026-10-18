import { expect, it } from 'vitest';
import { fusedChromosomes, genomeAssembly, genomeViability } from './bio-engineered-genomes';
it('reduces chromosome number while conserving all representative gene blocks', () => {
  for (let f = 0; f <= 15; f++) {
    const groups = fusedChromosomes(f);
    expect(groups).toHaveLength(16 - f);
    expect(groups.flatMap((g) => g.blocks).toSorted((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i),
    );
    expect(groups.reduce((a, b) => a + b.centromeres, 0)).toBe(16 - f);
  }
});
it('does not equate DNA assembly with building an entire cell', () => {
  expect(genomeAssembly(1).complete).toBe(true);
  expect(genomeViability(true, false, true).supportsGrowth).toBe(false);
  expect(genomeViability(true, true, false).supportsGrowth).toBe(false);
  expect(genomeViability(true, true, true).supportsGrowth).toBe(true);
});

import {
  genomeSegmentPoints,
  continuousFusion,
  hypotheticalBudding,
  yeastBudOutline,
} from './bio-engineered-genomes';
it('assembles every identified DNA segment continuously and closes all joins', () => {
  for (let id = 0; id < 12; id++) {
    for (let p = 0; p < 1; p += 0.005) {
      const a = genomeSegmentPoints(id, p),
        b = genomeSegmentPoints(id, p + 0.005);
      expect(Math.max(...a.map((q, j) => Math.hypot(q.x - b[j].x, q.y - b[j].y)))).toBeLessThan(6);
    }
    const end = genomeSegmentPoints(id, 1).at(-1)!,
      next = genomeSegmentPoints((id + 1) % 12, 1)[0];
    expect(end.x).toBeCloseTo(next.x);
    expect(end.y).toBeCloseTo(next.y);
    expect(genomeSegmentPoints(id, 1, 0)).toEqual(genomeSegmentPoints(id, 1));
    const a = genomeSegmentPoints(id, 1, 0),
      b = genomeSegmentPoints(id, 1, 1);
    for (let j = 0; j < a.length; j++) {
      expect(b[j].x - a[j].x).toBeCloseTo(165);
      expect(b[j].y).toBe(a[j].y);
    }
  }
});
it('conserves all chromosome blocks across fractional fusion boundaries and keeps the final state', () => {
  for (let f = 0; f < 15; f += 0.05) {
    const a = continuousFusion(f),
      b = continuousFusion(f + 0.05);
    expect(a.blocks).toHaveLength(16);
    expect(Math.max(...a.blocks.map((q, i) => Math.abs(q.x - b.blocks[i].x)))).toBeLessThan(1);
  }
  const s = continuousFusion(15);
  expect(s.chromosomes).toBe(1);
  expect(s.blocks.filter((b) => b.centromereOpacity > 0)).toHaveLength(1);
});
it('makes conditional growth a distinct comparison without a numerical success prediction', () => {
  for (const p of [0, 0.65, 1]) {
    const a = hypotheticalBudding(p, { assembled: true, recipient: true, essential: true }),
      b = hypotheticalBudding(p, { assembled: true, recipient: true, essential: false }),
      c = hypotheticalBudding(p, { assembled: true, recipient: false, essential: true });
    expect(a.chromosomeCount).toBe(1);
    expect(a.realSuccessRate).toBeNull();
    expect(b.radius).toBe(0);
    expect(c.hasCell).toBe(false);
    expect(yeastBudOutline(a.radius, a.distance)).not.toContain('NaN');
  }
  expect(hypotheticalBudding(1, { assembled: true, recipient: true, essential: true }).radius).toBe(
    32,
  );
});
