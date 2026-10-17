import { describe, expect, it } from 'vitest';
import { QUICK_VALUES, quickItems, quickPartition, quickSortTrace } from './quicksort';
describe('three-way quicksort partition', () => {
  it('maintains all four partition regions and every identity at every step', () => {
    const q = quickPartition(quickItems(QUICK_VALUES), 3);
    for (const f of q.frames) {
      expect(f.items.slice(0, f.lt).every((x) => x.value < 3)).toBe(true);
      expect(f.items.slice(f.lt, f.scan).every((x) => x.value === 3)).toBe(true);
      expect(f.items.slice(f.gt + 1).every((x) => x.value > 3)).toBe(true);
      expect(new Set(f.items.map((x) => x.id)).size).toBe(8);
    }
    expect(q.result.map((x) => x.value)).toEqual([2, 3, 3, 3, 5, 7, 8, 6]);
    expect(q.classifications).toBe(8);
  });
  it('does not advance scan after a right swap, and explicitly exposes instability', () => {
    const q = quickPartition(quickItems(QUICK_VALUES), 3);
    expect(q.frames[1].action).toBe('greater');
    expect(q.frames[1].scan).toBe(0);
    expect(q.frames[1].items[0].value).toBe(3);
    expect(q.result.filter((x) => x.value === 3).map((x) => x.origin)).toEqual([1, 7, 3]);
  });
  it('matches independent numeric sorting for all strategies and duplicate-heavy inputs', () => {
    for (const mode of ['middle', 'minimum', 'median'] as const)
      for (let n = 0; n <= 40; n++)
        for (let seed = 0; seed < 4; seed++) {
          const values = Array.from({ length: n }, (_, i) => ((i * 13 + seed * 17) % 9) - 4),
            q = quickSortTrace(values, mode);
          expect(q.result.map((x) => x.value)).toEqual([...values].sort((a, b) => a - b));
          expect(new Set(q.result.map((x) => x.id)).size).toBe(n);
          expect(q.input.map((x) => x.value)).toEqual(values);
        }
  });
  it('counts measured partition work rather than claiming pivot selection is free', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8],
      bad = quickSortTrace(values, 'minimum'),
      balanced = quickSortTrace(values, 'median');
    expect(bad.classifications).toBe(35);
    expect(bad.maxDepth).toBe(7);
    expect(balanced.classifications).toBe(17);
    expect(balanced.maxDepth).toBe(3);
    expect(quickSortTrace(Array(8).fill(3)).classifications).toBe(8);
    expect(() => quickSortTrace([1, 2], 'middle', 9)).toThrow(RangeError);
    expect(() => quickPartition(quickItems([NaN]), 3)).toThrow(RangeError);
  });
});
