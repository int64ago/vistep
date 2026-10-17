import { describe, expect, it } from 'vitest';
import {
  DIJKSTRA_NODES,
  dijkstraEdges,
  dijkstraPath,
  dijkstraTrace,
  localEdgeGreedy,
  type DijkstraEdge,
} from './dijkstra';
describe('Dijkstra finalization is a global distance decision', () => {
  const nodes = DIJKSTRA_NODES.map((n) => n.id);
  it('matches hand-computed distances and improves the discovered target twice before finalization', () => {
    const frames = dijkstraTrace(nodes, dijkstraEdges(), 'S');
    expect(frames.at(-1)?.distance).toEqual({ S: 0, A: 2, B: 5, C: 4, D: 6, T: 7 });
    expect(frames.slice(1).map((f) => f.current)).toEqual(['S', 'A', 'C', 'B', 'D', 'T']);
    expect(frames.map((f) => f.distance.T)).toEqual([Infinity, Infinity, 22, 13, 13, 7, 7]);
    expect(dijkstraPath(frames.at(-1)!, 'T')).toEqual(['S', 'B', 'D', 'T']);
    expect(localEdgeGreedy(dijkstraEdges())).toEqual({ path: ['S', 'A', 'C', 'D', 'T'], cost: 13 });
  });
  it('agrees with an independently implemented Floyd–Warshall reference on 32 varied directed graphs', () => {
    for (let seed = 1; seed <= 32; seed++) {
      const ids = ['0', '1', '2', '3', '4'],
        edges: DijkstraEdge[] = [];
      const ref = ids.map((_, i) => ids.map((_, j) => (i === j ? 0 : Infinity)));
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 5; j++)
          if (i !== j && (i * 7 + j * 3 + seed) % 4) {
            const w = (i * 3 + j * 7 + seed) % 11;
            edges.push({ from: ids[i], to: ids[j], weight: w });
            ref[i][j] = w;
          }
      for (let k = 0; k < 5; k++)
        for (let i = 0; i < 5; i++)
          for (let j = 0; j < 5; j++) ref[i][j] = Math.min(ref[i][j], ref[i][k] + ref[k][j]);
      for (let source = 0; source < 5; source++) {
        const result = dijkstraTrace(ids, edges, ids[source]).at(-1)!;
        expect(ids.map((id) => result.distance[id])).toEqual(ref[source]);
      }
    }
  });
  it('allows zero edges, leaves unreachable nodes infinite, and preserves older snapshots', () => {
    const frames = dijkstraTrace(['S', 'A', 'Z'], [{ from: 'S', to: 'A', weight: 0 }], 'S');
    expect(frames[0].settled).toEqual([]);
    expect(frames[0].distance.A).toBe(Infinity);
    expect(frames.at(-1)?.distance).toEqual({ S: 0, A: 0, Z: Infinity });
    expect(dijkstraPath(frames.at(-1)!, 'Z')).toEqual([]);
  });
  it('rejects the exact negative-edge counterexample rather than certifying a settled value', () => {
    expect(5 + -10).toBe(-5); // S→B→A beats the earlier S→A cost 2.
    expect(() =>
      dijkstraTrace(nodes, [...dijkstraEdges(), { from: 'B', to: 'A', weight: -10 }], 'S'),
    ).toThrow(/nonnegative/);
    expect(() => dijkstraTrace(nodes, [{ from: 'S', to: 'missing', weight: 2 }], 'S')).toThrow(
      RangeError,
    );
    expect(dijkstraTrace(nodes, dijkstraEdges(12), 'S').at(-1)?.distance.T).toBe(13);
  });
});
