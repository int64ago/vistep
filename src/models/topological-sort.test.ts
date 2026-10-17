import { describe, expect, it } from 'vitest';
import { TOPO_EDGES, topologicalTrace, topologicalValid, type TopoEdge } from './topological-sort';
describe('dependency removal topological order', () => {
  it('unlocks a node only after every prerequisite, and accepts more than one order', () => {
    const a = topologicalTrace(6, TOPO_EDGES),
      b = topologicalTrace(6, TOPO_EDGES, true);
    expect(a.order).toEqual([0, 1, 2, 3, 4, 5]);
    expect(a.frames[1].indegree[3]).toBe(1);
    expect(a.frames[1].ready).not.toContain(3);
    expect(a.frames[2].ready).toContain(3);
    expect(a.frames[3].ready).toEqual([3, 4]);
    expect(a.order).not.toEqual(b.order);
    expect(topologicalValid(a.order, 6, TOPO_EDGES)).toBe(true);
    expect(topologicalValid(b.order, 6, TOPO_EDGES)).toBe(true);
  });
  it('separates the actual cycle from downstream blocked vertices', () => {
    const edges: TopoEdge[] = [...TOPO_EDGES, [4, 1]],
      q = topologicalTrace(6, edges);
    expect(q.complete).toBe(false);
    expect(q.order).toEqual([0, 2]);
    expect(q.blocked).toEqual([1, 3, 4, 5]);
    expect(q.cycle).toEqual([1, 4, 1]);
    expect(q.frames.at(-1)?.ready).toEqual([]);
    expect(
      q.cycle.slice(1).every((v, i) => edges.some(([a, b]) => a === q.cycle[i] && b === v)),
    ).toBe(true);
  });
  it('agrees with exhaustive permutation existence for all64 directed three-node graphs', () => {
    const possible: TopoEdge[] = [
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 1],
      ],
      perms = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
      ];
    for (let bits = 0; bits < 64; bits++) {
      const edges = possible.filter((_, i) => bits & (1 << i)),
        q = topologicalTrace(3, edges);
      const exists = perms.some((p) => edges.every(([a, b]) => p.indexOf(a) < p.indexOf(b)));
      expect(q.complete).toBe(exists);
      if (exists) expect(topologicalValid(q.order, 3, edges)).toBe(true);
      else expect(q.cycle.length).toBeGreaterThan(1);
    }
  });
  it('tracks remaining indegrees exactly, rejecting duplicate edges and malformed endpoints', () => {
    const q = topologicalTrace(6, TOPO_EDGES);
    for (const f of q.frames)
      for (let v = 0; v < 6; v++)
        expect(f.indegree[v]).toBe(
          TOPO_EDGES.filter(([a, b]) => b === v && !f.order.includes(a)).length,
        );
    expect(topologicalTrace(1, [[0, 0]]).cycle).toEqual([0, 0]);
    expect(() =>
      topologicalTrace(2, [
        [0, 1],
        [0, 1],
      ]),
    ).toThrow();
    expect(() => topologicalTrace(2, [[0, 2]])).toThrow();
  });
});
