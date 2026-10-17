export type FlowEdge = { id: string; from: number; to: number; capacity: number };
export type FlowNetwork = { vertices: number; source: number; sink: number; edges: FlowEdge[] };
export type FlowState = { network: FlowNetwork; flows: number[] };
export type ResidualArc = {
  edge: number;
  from: number;
  to: number;
  direction: 1 | -1;
  capacity: number;
};
export const FLOW_POINTS = [
  { x: 38, y: 140 },
  { x: 180, y: 38 },
  { x: 180, y: 242 },
  { x: 322, y: 140 },
];
export const FLOW_LABELS = ['S', 'A', 'B', 'T'];
export function flowLessonNetwork(outlet = 2): FlowNetwork {
  return {
    vertices: 4,
    source: 0,
    sink: 3,
    edges: [
      { id: 'SA', from: 0, to: 1, capacity: 2 },
      { id: 'SB', from: 0, to: 2, capacity: 2 },
      { id: 'AB', from: 1, to: 2, capacity: 1 },
      { id: 'AT', from: 1, to: 3, capacity: outlet },
      { id: 'BT', from: 2, to: 3, capacity: 2 },
    ],
  };
}
function validateNetwork(n: FlowNetwork) {
  if (
    !Number.isInteger(n.vertices) ||
    n.vertices < 2 ||
    n.vertices > 32 ||
    !Number.isInteger(n.source) ||
    !Number.isInteger(n.sink) ||
    n.source === n.sink ||
    n.source < 0 ||
    n.sink < 0 ||
    n.source >= n.vertices ||
    n.sink >= n.vertices ||
    n.edges.length > 128 ||
    new Set(n.edges.map((e) => e.id)).size !== n.edges.length ||
    n.edges.some(
      (e) =>
        ![e.from, e.to].every((v) => Number.isInteger(v) && v >= 0 && v < n.vertices) ||
        e.from === e.to ||
        !Number.isSafeInteger(e.capacity) ||
        e.capacity < 0 ||
        e.capacity > 1e6,
    )
  )
    throw new RangeError('Invalid flow network');
}
export function flowValue(s: FlowState) {
  return s.network.edges.reduce(
    (sum, e, i) =>
      sum +
      (e.from === s.network.source ? s.flows[i] : 0) -
      (e.to === s.network.source ? s.flows[i] : 0),
    0,
  );
}
export function flowValid(s: FlowState) {
  try {
    validateNetwork(s.network);
  } catch {
    return false;
  }
  if (
    s.flows.length !== s.network.edges.length ||
    s.flows.some((f, i) => !Number.isSafeInteger(f) || f < 0 || f > s.network.edges[i].capacity)
  )
    return false;
  const balance = Array(s.network.vertices).fill(0);
  s.network.edges.forEach((e, i) => {
    balance[e.from] -= s.flows[i];
    balance[e.to] += s.flows[i];
  });
  return balance.every((b, v) =>
    v === s.network.source ? b <= 0 : v === s.network.sink ? b === flowValue(s) : b === 0,
  );
}
export function flowResidual(s: FlowState) {
  if (!flowValid(s)) throw new RangeError('Infeasible flow');
  const arcs: ResidualArc[] = [];
  s.network.edges.forEach((e, i) => {
    if (e.capacity > s.flows[i])
      arcs.push({
        edge: i,
        from: e.from,
        to: e.to,
        direction: 1,
        capacity: e.capacity - s.flows[i],
      });
    if (s.flows[i] > 0)
      arcs.push({ edge: i, from: e.to, to: e.from, direction: -1, capacity: s.flows[i] });
  });
  return arcs;
}
export function flowAugment(
  s: FlowState,
  path: readonly Pick<ResidualArc, 'edge' | 'direction'>[],
) {
  const residual = flowResidual(s),
    arcs = path.map((p) => {
      const arc = residual.find((a) => a.edge === p.edge && a.direction === p.direction);
      if (!arc) throw new RangeError('Unavailable residual arc');
      return arc;
    });
  if (
    !arcs.length ||
    arcs[0].from !== s.network.source ||
    arcs[arcs.length - 1].to !== s.network.sink ||
    arcs.slice(1).some((a, i) => arcs[i].to !== a.from) ||
    new Set([arcs[0].from, ...arcs.map((a) => a.to)]).size !== arcs.length + 1
  )
    throw new RangeError('Invalid augmenting path');
  const delta = Math.min(...arcs.map((a) => a.capacity)),
    flows = [...s.flows];
  arcs.forEach((a) => (flows[a.edge] += a.direction * delta));
  const state = { network: s.network, flows };
  if (!flowValid(state)) throw new Error('Augment violated conservation');
  return { state, delta, path: arcs };
}
function bfs(s: FlowState) {
  const arcs = flowResidual(s),
    parents = new Map<number, ResidualArc>(),
    seen = new Set([s.network.source]),
    queue = [s.network.source];
  for (const v of queue) {
    for (const arc of arcs.filter((a) => a.from === v))
      if (!seen.has(arc.to)) {
        seen.add(arc.to);
        parents.set(arc.to, arc);
        queue.push(arc.to);
      }
  }
  const path: ResidualArc[] = [];
  if (seen.has(s.network.sink)) {
    let v = s.network.sink;
    while (v !== s.network.source) {
      const arc = parents.get(v)!;
      path.unshift(arc);
      v = arc.from;
    }
  }
  return { path, reachable: [...seen] };
}
export function maxFlowTrace(network: FlowNetwork, detour = false) {
  validateNetwork(network);
  let state: FlowState = { network, flows: network.edges.map(() => 0) };
  const frames: { state: FlowState; delta: number; path: ResidualArc[] }[] = [
    { state, delta: 0, path: [] },
  ];
  if (detour) {
    const ids = ['SA', 'AB', 'BT'],
      path = ids.map((id) => ({
        edge: network.edges.findIndex((e) => e.id === id),
        direction: 1 as const,
      }));
    if (path.every((a) => a.edge >= 0)) {
      const next = flowAugment(state, path);
      state = next.state;
      frames.push(next);
    }
  }
  let found = bfs(state);
  while (found.path.length) {
    const next = flowAugment(state, found.path);
    state = next.state;
    frames.push(next);
    found = bfs(state);
  }
  const cutEdges = network.edges
      .map((e, i) => (found.reachable.includes(e.from) && !found.reachable.includes(e.to) ? i : -1))
      .filter((i) => i >= 0),
    cutCapacity = cutEdges.reduce((sum, i) => sum + network.edges[i].capacity, 0);
  return {
    frames,
    state,
    value: flowValue(state),
    reachable: found.reachable,
    cutEdges,
    cutCapacity,
  };
}
