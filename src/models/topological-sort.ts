export type TopoEdge = readonly [number, number];
export type TopoFrame = {
  indegree: number[];
  ready: number[];
  order: number[];
  active: number | null;
  removed: number[];
};
export const TOPO_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const TOPO_EDGES: TopoEdge[] = [
  [0, 3],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 5],
  [4, 5],
];
export const TOPO_POINTS = [
  { x: 40, y: 32 },
  { x: 180, y: 32 },
  { x: 320, y: 32 },
  { x: 100, y: 132 },
  { x: 260, y: 132 },
  { x: 180, y: 232 },
];
function validate(n: number, edges: readonly TopoEdge[]) {
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 64 ||
    edges.some((e) => e.length !== 2 || e.some((v) => !Number.isInteger(v) || v < 0 || v >= n)) ||
    new Set(edges.map((e) => e.join(','))).size !== edges.length
  )
    throw new RangeError('Invalid directed graph');
}
function findCycle(n: number, edges: readonly TopoEdge[]) {
  const color = Array(n).fill(0),
    stack: number[] = [];
  let cycle: number[] = [];
  const visit = (v: number): boolean => {
    color[v] = 1;
    stack.push(v);
    for (const [, w] of edges.filter((e) => e[0] === v)) {
      if (color[w] === 1) {
        cycle = [...stack.slice(stack.indexOf(w)), w];
        return true;
      }
      if (!color[w] && visit(w)) return true;
    }
    stack.pop();
    color[v] = 2;
    return false;
  };
  for (let v = 0; v < n && !cycle.length; v++) if (!color[v]) visit(v);
  return cycle;
}
export function topologicalTrace(n: number, edges: readonly TopoEdge[], reverse = false) {
  validate(n, edges);
  const indegree = Array(n).fill(0),
    order: number[] = [],
    removed: number[] = [],
    frames: TopoFrame[] = [];
  edges.forEach(([, v]) => indegree[v]++);
  const ready = () =>
    indegree
      .map((d, v) => (d === 0 && !order.includes(v) ? v : -1))
      .filter((v) => v >= 0)
      .sort((a, b) => (reverse ? b - a : a - b));
  const save = (active: number | null) =>
    frames.push({
      indegree: [...indegree],
      ready: ready(),
      order: [...order],
      active,
      removed: [...removed],
    });
  save(null);
  while (ready().length) {
    const v = ready()[0];
    order.push(v);
    edges.forEach(([from, to], i) => {
      if (from === v) {
        indegree[to]--;
        removed.push(i);
      }
    });
    save(v);
  }
  return {
    frames,
    order,
    complete: order.length === n,
    blocked: Array.from({ length: n }, (_, i) => i).filter((i) => !order.includes(i)),
    cycle: findCycle(n, edges),
  };
}
export function topologicalValid(order: readonly number[], n: number, edges: readonly TopoEdge[]) {
  validate(n, edges);
  return (
    order.length === n &&
    new Set(order).size === n &&
    order.every((v) => Number.isInteger(v) && v >= 0 && v < n) &&
    edges.every(([a, b]) => order.indexOf(a) < order.indexOf(b))
  );
}
