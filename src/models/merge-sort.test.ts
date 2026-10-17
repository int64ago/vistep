import { describe, expect, it } from 'vitest';
import {
  MERGE_VALUES,
  mergeItems,
  mergeRuns,
  mergeSortTrace,
  mergeUnsortedWitness,
} from './merge-sort';
describe('stable bottom-up mergesort', () => {
  it('matches the hand trace and preserves the two 3 identities in original order', () => {
    const q = mergeSortTrace(MERGE_VALUES);
    expect(q.passes.map((p) => p.width)).toEqual([1, 2, 4]);
    expect(q.result.map((x) => x.value)).toEqual([1, 2, 3, 3, 5, 6, 7, 8]);
    expect(q.result.filter((x) => x.value === 3).map((x) => x.origin)).toEqual([1, 3]);
    expect(q.passes[1].merges[0].frames[1].picked).toBe('merge-1');
    expect(q.passes[2].merges[0].comparisons).toBe(7);
  });
  it('agrees with independent numeric-and-origin sorting for varied odd/even arrays', () => {
    for (let length = 0; length <= 64; length++)
      for (let seed = 0; seed < 8; seed++) {
        const values = Array.from({ length }, (_, i) => ((i * 17 + seed * 7) % 11) - 5),
          q = mergeSortTrace(values),
          reference = mergeItems(values).sort((a, b) => a.value - b.value || a.origin - b.origin);
        expect(q.result).toEqual(reference);
        expect(new Set(q.result.map((x) => x.id)).size).toBe(length);
      }
  });
  it('keeps every local merge identity exactly once across output and remaining inputs', () => {
    const q = mergeSortTrace(MERGE_VALUES);
    for (const pass of q.passes)
      for (const run of pass.merges)
        for (const frame of run.frames) {
          const ids = [...frame.left, ...frame.right, ...frame.output].map((x) => x.id);
          expect(new Set(ids).size).toBe(ids.length);
          expect(ids.length).toBe(run.left.length + run.right.length);
          expect(
            frame.output.every((x, i) => i === 0 || x.value >= frame.output[i - 1].value),
          ).toBe(true);
        }
    expect(q.input.map((x) => x.value)).toEqual(MERGE_VALUES);
    expect(mergeRuns([], []).frames).toHaveLength(1);
  });
  it('exposes the hidden smaller value when the sorted-run contract is broken', () => {
    const witness = mergeUnsortedWitness();
    expect(witness.result.map((x) => x.value)).toEqual([1, 3, 4, 2, 5]);
    expect(() => mergeRuns(witness.left, witness.right)).toThrow(/sorted/);
    expect(() => mergeRuns(mergeItems([1]), mergeItems([2]))).toThrow(/identities/);
    expect(() => mergeSortTrace([NaN])).toThrow(RangeError);
  });
});
