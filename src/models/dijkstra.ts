export type DijkstraNode = { id: string; x: number; y: number };
export type DijkstraEdge = { from: string; to: string; weight: number };
export type DijkstraFrame = {
  current: string | null;
  distance: Record<string, number>;
  previous: Record<string, string | null>;
  settled: string[];
  relaxed: { from: string; to: string; before: number; after: number }[];
};
export const DIJKSTRA_NODES: DijkstraNode[] = [
  { id: 'S', x: 32, y: 150 },
  { id: 'A', x: 100, y: 50 },
  { id: 'B', x: 100, y: 250 },
  { id: 'C', x: 210, y: 50 },
  { id: 'D', x: 210, y: 250 },
  { id: 'T', x: 290, y: 150 },
];
export function dijkstraEdges(branch = 5): DijkstraEdge[] {
  if (!Number.isFinite(branch) || branch < 0)
    throw new RangeError('Nonnegative finite branch required');
  return [
    { from: 'S', to: 'A', weight: 2 },
    { from: 'S', to: 'B', weight: branch },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'A', to: 'T', weight: 20 },
    { from: 'C', to: 'D', weight: 8 },
    { from: 'C', to: 'T', weight: 9 },
    { from: 'B', to: 'D', weight: 1 },
    { from: 'D', to: 'T', weight: 1 },
  ];
}
/** Full immutable snapshots, reconstructed from input on every seek; finite nonnegative edges only. */
export function dijkstraTrace(
  nodes: readonly string[],
  edges: readonly DijkstraEdge[],
  source: string,
): DijkstraFrame[] {
  if (!nodes.includes(source) || new Set(nodes).size !== nodes.length)
    throw new RangeError('Invalid graph vertices');
  if (
    edges.some(
      (e) =>
        !nodes.includes(e.from) ||
        !nodes.includes(e.to) ||
        !Number.isFinite(e.weight) ||
        e.weight < 0,
    )
  )
    throw new RangeError('Dijkstra requires finite nonnegative weights');
  const distance = Object.fromEntries(nodes.map((n) => [n, n === source ? 0 : Infinity]));
  const previous: Record<string, string | null> = Object.fromEntries(nodes.map((n) => [n, null]));
  const settled: string[] = [],
    frames: DijkstraFrame[] = [];
  const save = (current: string | null, relaxed: DijkstraFrame['relaxed']) =>
    frames.push({
      current,
      relaxed,
      distance: { ...distance },
      previous: { ...previous },
      settled: [...settled],
    });
  save(null, []);
  while (settled.length < nodes.length) {
    const next = nodes
      .filter((n) => !settled.includes(n))
      .sort((a, b) => distance[a] - distance[b] || a.localeCompare(b))[0];
    if (!next || !Number.isFinite(distance[next])) break;
    settled.push(next);
    const relaxed: DijkstraFrame['relaxed'] = [];
    for (const edge of edges.filter((e) => e.from === next && !settled.includes(e.to))) {
      const candidate = distance[next] + edge.weight;
      if (candidate < distance[edge.to]) {
        relaxed.push({ from: next, to: edge.to, before: distance[edge.to], after: candidate });
        distance[edge.to] = candidate;
        previous[edge.to] = next;
      }
    }
    save(next, relaxed);
  }
  return frames;
}
export function dijkstraPath(frame: DijkstraFrame, target: string) {
  if (!Number.isFinite(frame.distance[target])) return [];
  const path: string[] = [],
    seen = new Set<string>();
  let node: string | null = target;
  while (node !== null && !seen.has(node)) {
    path.unshift(node);
    seen.add(node);
    node = frame.previous[node];
  }
  return path;
}
/** A deliberately different heuristic: take the cheapest outgoing edge, ignoring accumulated frontier costs. */
export function localEdgeGreedy(edges: readonly DijkstraEdge[], source = 'S', target = 'T') {
  const path = [source];
  let cost = 0;
  while (path.at(-1) !== target) {
    const next = edges
      .filter((e) => e.from === path.at(-1) && !path.includes(e.to))
      .sort((a, b) => a.weight - b.weight || a.to.localeCompare(b.to))[0];
    if (!next) return { path, cost: Infinity };
    path.push(next.to);
    cost += next.weight;
  }
  return { path, cost };
}
