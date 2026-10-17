import { describe, it, expect } from 'vitest';
import {
  bloomBuild,
  bloomQuery,
  bloomFind,
  bloomPositions,
  bloomDeleteWitness,
  bloomApprox,
  BLOOM_WORDS,
} from './bloom-filter';
describe('basic Bloom membership', () => {
  it('has no false negatives for inserted Unicode keys over supported dimensions', () => {
    const words = [
      'apple',
      'pear',
      'plum',
      '中文',
      '😀',
      '',
      ...Array.from({ length: 30 }, (_, i) => `key${i}`),
    ];
    for (const m of [8, 16, 32, 64, 256])
      for (const k of [1, 3, 8]) {
        const f = bloomBuild(words, m, k);
        for (const word of words) expect(bloomQuery(f, word).maybe).toBe(true);
      }
  });
  it('finds a real absent positive and a real definite negative', () => {
    const f = bloomBuild(BLOOM_WORDS);
    const fp = bloomQuery(f, bloomFind(f, true)),
      negative = bloomQuery(f, bloomFind(f, false));
    expect(fp.maybe).toBe(true);
    expect(fp.actual).toBe(false);
    expect(negative.maybe).toBe(false);
    expect(negative.actual).toBe(false);
  });
  it('sets bits monotonically, including hash collisions and duplicate inserts', () => {
    const f = bloomBuild(['apple', 'apple', 'pear']);
    expect(f.snapshots[1]).toEqual(f.snapshots[2]);
    f.snapshots.forEach((s, i) =>
      s.forEach((b, j) => {
        if (i && f.snapshots[i - 1][j]) expect(b).toBe(1);
      }),
    );
    expect(bloomPositions('apple')).toHaveLength(3);
  });
  it('shows naive deletion can break another inserted key', () => {
    const f = bloomBuild([...BLOOM_WORDS, ...Array.from({ length: 5 }, (_, i) => `fruit${i}`)]),
      w = bloomDeleteWitness(f)!;
    expect(w).toBeDefined();
    expect(bloomQuery(f, w.victim).maybe).toBe(true);
    expect(bloomQuery(w.broken, w.victim).maybe).toBe(false);
  });
  it('labels an approximation with correct boundary and bounds', () => {
    expect(bloomApprox(32, 3, 0)).toBe(0);
    expect(bloomApprox(32, 3, 50)).toBeGreaterThan(bloomApprox(32, 3, 3));
    expect(() => bloomPositions('a', 0)).toThrow();
  });
});
