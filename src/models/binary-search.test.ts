import { describe, expect, it } from 'vitest';
import { BINARY_VALUES, binarySearchTrace } from './binary-search';
describe('binary-search candidate exclusion', () => {
  it('matches the hand-computed 29,46,37 sequence and preserves the target through every exclusion', () => {
    const q = binarySearchTrace(BINARY_VALUES, 37);
    expect(q.frames.map((f) => f.value)).toEqual([29, 46, 37]);
    expect(q.found).toBe(9);
    expect(q.comparisons).toBe(3);
    for (const frame of q.frames)
      expect(q.found! >= frame.low && q.found! <= frame.high).toBe(true);
  });
  it('agrees with independent linear membership across lengths, duplicates and absent values', () => {
    for (let length = 0; length <= 64; length++) {
      const values = Array.from({ length }, (_, i) => Math.floor((i * 3) / 2) - 20);
      for (let target = -23; target <= 80; target++) {
        const q = binarySearchTrace(values, target);
        expect(q.found === null).toBe(!values.includes(target));
        if (q.found !== null) expect(values[q.found]).toBe(target);
        for (const f of q.frames.filter((f) => f.mid !== null))
          expect(f.nextHigh - f.nextLow + 1).toBeLessThanOrEqual(
            f.relation === 'equal' ? f.high - f.low + 1 : Math.floor((f.high - f.low + 1) / 2),
          );
      }
    }
  });
  it('finishes an absent search with a genuinely empty inclusive interval', () => {
    const q = binarySearchTrace(BINARY_VALUES, 38);
    expect(q.found).toBeNull();
    expect(q.frames.at(-1)?.relation).toBe('absent');
    expect(q.frames.at(-1)!.low).toBeGreaterThan(q.frames.at(-1)!.high);
    expect(binarySearchTrace([], 1).comparisons).toBe(0);
    expect(binarySearchTrace([3], 3).found).toBe(0);
  });
  it('rejects the unsorted counterexample that would discard a present target', () => {
    const values = [...BINARY_VALUES];
    values[1] = 37;
    values[9] = 39;
    expect(values[7]).toBeLessThan(37);
    expect(values.slice(0, 8)).toContain(37);
    expect(() => binarySearchTrace(values, 37)).toThrow(/sorted/);
    expect(() => binarySearchTrace([1, Infinity], 1)).toThrow(RangeError);
  });
});
