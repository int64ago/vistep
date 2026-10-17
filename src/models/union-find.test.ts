import { describe, expect, it } from 'vitest';
import { ufCreate, ufFind, ufLesson, ufUnion } from './union-find';
describe('weighted union and path compression', () => {
  it('joins smaller roots and compresses the known path without changing connectivity', () => {
    const q = ufLesson();
    expect(q.states[6].count).toBe(2);
    expect(q.states[7].parent).toEqual([0, 0, 0, 2, 0, 4, 4, 6]);
    expect(q.find.path).toEqual([7, 6, 4, 0]);
    expect(q.find.state.parent[7]).toBe(0);
    expect(q.find.state.parent[6]).toBe(0);
    expect(q.find.state.count).toBe(1);
    expect(q.states[7].parent[7]).toBe(6);
    expect(q.redundant.changed).toBe(false);
    expect(q.redundant.state.count).toBe(1);
  });
  it('matches independent undirected BFS connectivity after every deterministic union', () => {
    let s = ufCreate(12);
    const adj = Array.from({ length: 12 }, () => new Set<number>());
    for (let k = 0; k < 40; k++) {
      const a = (k * 7 + 1) % 12,
        b = (k * 11 + 4) % 12;
      adj[a].add(b);
      adj[b].add(a);
      s = ufUnion(s, a, b).state;
      for (let x = 0; x < 12; x++) {
        const seen = new Set([x]),
          queue = [x];
        for (const v of queue)
          for (const w of adj[v])
            if (!seen.has(w)) {
              seen.add(w);
              queue.push(w);
            }
        for (let y = 0; y < 12; y++)
          expect(ufFind(s, x, false).root === ufFind(s, y, false).root).toBe(seen.has(y));
      }
      const before = s;
      s = ufFind(s, k % 12).state;
      expect(s.count).toBe(before.count);
    }
  });
  it('preserves equivalence for every pair across compression and validates bad forests', () => {
    const { states } = ufLesson(),
      s = states[7];
    let next = s;
    for (let i = 0; i < 8; i++) next = ufFind(next, i).state;
    for (let a = 0; a < 8; a++)
      for (let b = 0; b < 8; b++)
        expect(ufFind(next, a, false).root === ufFind(next, b, false).root).toBe(
          ufFind(s, a, false).root === ufFind(s, b, false).root,
        );
    expect(() => ufFind({ parent: [1, 0], size: [1, 1], count: 0 }, 0)).toThrow(/Cyclic/);
    expect(() => ufCreate(0)).toThrow();
    expect(() => ufFind(s, 8)).toThrow();
    expect(() => ufUnion({ ...s, size: Array(8).fill(1) }, 0, 1)).toThrow(/size/);
  });
});
