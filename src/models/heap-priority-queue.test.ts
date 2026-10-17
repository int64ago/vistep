import { describe, expect, it } from 'vitest';
import {
  HEAP_PRIORITIES,
  heapChildChoice,
  heapDrainTrace,
  heapInsertTrace,
  heapItems,
  heapPopTrace,
  heapValid,
  type HeapItem,
} from './heap-priority-queue';
describe('max-heap priority queue', () => {
  it('shows heap order without implying a sorted array, then swims the same 10 to the root', () => {
    const initial = heapItems(HEAP_PRIORITIES);
    expect(heapValid(initial)).toBe(true);
    expect(initial[1].priority).toBeLessThan(initial[2].priority);
    const run = heapInsertTrace(initial, { id: 'new', priority: 10, order: 7 });
    expect(run.frames.map((f) => f.items.findIndex((x) => x.id === 'new'))).toEqual([
      7, 3, 1, 0, 0,
    ]);
    expect(run.result.map((x) => x.priority)).toEqual([10, 9, 8, 7, 5, 2, 6, 3]);
    expect(initial.map((x) => x.priority)).toEqual(HEAP_PRIORITIES);
  });
  it('chooses the larger child; swapping with the smaller one would leave a violation', () => {
    const full = heapInsertTrace(heapItems(HEAP_PRIORITIES), {
        id: 'new',
        priority: 10,
        order: 7,
      }).result,
      pop = heapPopTrace(full),
      replacement = pop.frames[0].items;
    expect(pop.removed?.priority).toBe(10);
    expect(replacement[0].priority).toBe(3);
    expect(heapChildChoice(replacement, 0).chosen).toBe(1);
    const wrong = [...replacement];
    [wrong[0], wrong[2]] = [wrong[2], wrong[0]];
    expect(heapValid(wrong)).toBe(false);
    expect(pop.result.map((x) => x.priority)).toEqual(HEAP_PRIORITIES);
    expect(heapValid(pop.result)).toBe(true);
  });
  it('matches an independent sorted-list queue through128 mixed insert/pop operations', () => {
    let heap: HeapItem[] = [],
      reference: HeapItem[] = [];
    for (let i = 0; i < 128; i++) {
      if (i % 3 !== 0 || !heap.length) {
        const item = { id: `id-${i}`, priority: ((i * 17) % 31) - 15, order: i };
        heap = heapInsertTrace(heap, item).result;
        reference.push(item);
      } else {
        reference.sort((a, b) => b.priority - a.priority || a.order - b.order);
        const q = heapPopTrace(heap);
        expect(q.removed).toEqual(reference.shift());
        heap = q.result;
      }
      expect(heapValid(heap)).toBe(true);
      expect(new Set(heap.map((x) => x.id)).size).toBe(heap.length);
      expect(heap.length).toBe(reference.length);
    }
    expect(heapDrainTrace(heap).output.map((x) => x.id)).toEqual(
      reference.sort((a, b) => b.priority - a.priority || a.order - b.order).map((x) => x.id),
    );
  });
  it('handles empty/singleton and makes equal-priority FIFO an explicit comparison key', () => {
    expect(heapPopTrace([]).removed).toBeUndefined();
    expect(heapPopTrace(heapItems([4])).result).toEqual([]);
    let q = heapInsertTrace([], { id: 'first', priority: 2, order: 0 }).result;
    q = heapInsertTrace(q, { id: 'second', priority: 2, order: 1 }).result;
    expect(heapDrainTrace(q).output.map((x) => x.id)).toEqual(['first', 'second']);
    expect(() => heapInsertTrace(q, { id: 'other', priority: NaN, order: 2 })).toThrow(RangeError);
    expect(() => heapPopTrace(heapItems([1, 9]))).toThrow(/heap/);
  });
});
