/** A single-area link-state teaching network, not a complete OSPF/IP/TCP stack.
 * SI seconds, bits/s, bytes. Full-duplex store-and-forward links; finite FIFO
 * waiting slots exclude the packet being serialized. A separate 64 kbit/s
 * control budget isolates flooding from data congestion. Only B–R changes.
 */
export const ROUTING_NODES = ['S', 'A', 'B', 'C', 'R'] as const;
export type RoutingNode = (typeof ROUTING_NODES)[number];
export const ROUTING_ROUTERS = ['A', 'B', 'C'] as const;
export type RoutingRouter = (typeof ROUTING_ROUTERS)[number];
export interface RoutingLink {
  id: string;
  a: RoutingNode;
  b: RoutingNode;
  rate: number;
  propagation: number;
  cost: number;
}
export interface RoutingConfig {
  count: number;
  bytes: number;
  interval: number;
  start: number;
  ttl: number;
  brRate: number;
  capacity: number;
  brCost: number;
  crPropagation: number;
  initialUp: boolean;
  change?: { at: number; up: boolean };
  controlProcessing: number;
}
export const routingDefaults = (): RoutingConfig => ({
  count: 8,
  bytes: 1200,
  interval: 0.016,
  start: 0,
  ttl: 8,
  brRate: 800000,
  capacity: 3,
  brCost: 1,
  crPropagation: 0.04,
  initialUp: true,
  controlProcessing: 0.04,
});
export function routingLinks(p: RoutingConfig): RoutingLink[] {
  return [
    { id: 'SA', a: 'S', b: 'A', rate: 4e6, propagation: 0.002, cost: 1 },
    { id: 'AB', a: 'A', b: 'B', rate: 2e6, propagation: 0.004, cost: 1 },
    { id: 'AC', a: 'A', b: 'C', rate: 2e6, propagation: 0.008, cost: 1.5 },
    { id: 'BC', a: 'B', b: 'C', rate: 2e6, propagation: 0.003, cost: 1 },
    { id: 'BR', a: 'B', b: 'R', rate: p.brRate, propagation: 0.008, cost: p.brCost },
    { id: 'CR', a: 'C', b: 'R', rate: 2e6, propagation: p.crPropagation, cost: 4 },
  ];
}
/** Dijkstra with deterministic lexical tie-breaks; positive administrative costs.
 * Cost is deliberately independent of queue occupancy and geometric distance. */
export function routingShortest(links: readonly RoutingLink[], from: RoutingNode, brUp: boolean) {
  if (!ROUTING_NODES.includes(from)) throw new RangeError('Unknown node');
  const distance = Object.fromEntries(
    ROUTING_NODES.map((n) => [n, n === from ? 0 : Infinity]),
  ) as Record<RoutingNode, number>;
  const paths = Object.fromEntries(
    ROUTING_NODES.map((n) => [n, n === from ? [from] : []]),
  ) as Record<RoutingNode, RoutingNode[]>;
  const remaining = new Set<RoutingNode>(ROUTING_NODES);
  while (remaining.size) {
    const node = [...remaining].sort((a, b) => distance[a] - distance[b] || a.localeCompare(b))[0];
    remaining.delete(node);
    if (!Number.isFinite(distance[node])) break;
    for (const link of links) {
      if (!(link.cost > 0 && Number.isFinite(link.cost)))
        throw new RangeError('Positive finite route cost required');
      if ((!brUp && link.id === 'BR') || (link.a !== node && link.b !== node)) continue;
      const other = link.a === node ? link.b : link.a;
      if (!remaining.has(other)) continue;
      const d = distance[node] + link.cost,
        path = [...paths[node], other];
      if (
        d < distance[other] ||
        (d === distance[other] && path.join('').localeCompare(paths[other].join('')) < 0)
      ) {
        distance[other] = d;
        paths[other] = path;
      }
    }
  }
  return { next: paths.R[1], cost: distance.R, path: paths.R };
}
export type RoutingPhaseKind =
  'unborn' | 'processing' | 'waiting' | 'transmitting' | 'propagating' | 'received' | 'dropped';
export type RoutingDrop = 'ttl' | 'queue' | 'link' | 'route';
export interface RoutingPhase {
  kind: RoutingPhaseKind;
  start: number;
  end: number;
  node: RoutingNode;
  ttl: number;
  from?: RoutingNode;
  to?: RoutingNode;
  link?: string;
  reason?: RoutingDrop;
}
export interface RoutingDecision {
  at: number;
  node: RoutingRouter;
  ttlBefore: number;
  ttlAfter: number;
  next?: RoutingNode;
  version: number;
}
export interface RoutingPacket {
  id: number;
  release: number;
  phases: RoutingPhase[];
  decisions: RoutingDecision[];
  receivedAt?: number;
  releasedAt?: number;
}
export interface RoutingTable {
  at: number;
  version: number;
  up: boolean;
  next?: RoutingNode;
  cost: number;
  path: RoutingNode[];
}
export interface RoutingControl {
  from: RoutingRouter;
  to: RoutingRouter;
  link: string;
  start: number;
  txEnd: number;
  arrive: number;
  applyAt: number;
  version: number;
  accepted: boolean;
}
export interface RoutingRun {
  config: RoutingConfig;
  links: RoutingLink[];
  packets: RoutingPacket[];
  tables: Record<RoutingRouter, RoutingTable[]>;
  controls: RoutingControl[];
  end: number;
}
function validate(p: RoutingConfig) {
  for (const k of ['bytes', 'brRate', 'brCost', 'crPropagation'] as const)
    if (!(Number.isFinite(p[k]) && p[k] > 0)) throw new RangeError(`Invalid ${k}`);
  for (const k of ['interval', 'start', 'controlProcessing'] as const)
    if (!(Number.isFinite(p[k]) && p[k] >= 0)) throw new RangeError(`Invalid ${k}`);
  if (
    !Number.isInteger(p.count) ||
    p.count < 1 ||
    p.count > 30 ||
    !Number.isInteger(p.ttl) ||
    p.ttl < 1 ||
    p.ttl > 255 ||
    !Number.isInteger(p.capacity) ||
    p.capacity < 0 ||
    p.capacity > 30 ||
    !Number.isInteger(p.bytes) ||
    p.bytes > 1500 ||
    typeof p.initialUp !== 'boolean'
  )
    throw new RangeError('Invalid packet or queue bounds');
  if (
    p.change &&
    (!(Number.isFinite(p.change.at) && p.change.at > 0) || typeof p.change.up !== 'boolean')
  )
    throw new RangeError('Invalid link event');
}
export function routingSimulate(parameters: RoutingConfig): RoutingRun {
  const p = { ...parameters, change: parameters.change ? { ...parameters.change } : undefined };
  validate(p);
  const links = routingLinks(p),
    packets: RoutingPacket[] = Array.from({ length: p.count }, (_, i) => ({
      id: i + 1,
      release: p.start + p.interval * i,
      phases: [{ kind: 'unborn', start: 0, end: Infinity, node: 'S', ttl: p.ttl }],
      decisions: [],
    }));
  const tables = Object.fromEntries(
    ROUTING_ROUTERS.map((r) => [
      r,
      [{ at: 0, version: 0, up: p.initialUp, ...routingShortest(links, r, p.initialUp) }],
    ]),
  ) as Record<RoutingRouter, RoutingTable[]>;
  const controls: RoutingControl[] = [],
    channels = new Map<string, { busy?: number; waiting: number[] }>(),
    controlUntil = new Map<string, number>();
  type Event = { at: number; priority: number; serial: number; action: () => void };
  const events: Event[] = [];
  let serial = 0,
    now = 0,
    physicalUp = p.initialUp,
    expected = 1,
    processed = 0;
  const schedule = (at: number, priority: number, action: () => void) => {
    events.push({ at, priority, serial: serial++, action });
  };
  const current = (packet: RoutingPacket) => packet.phases.at(-1)!;
  const phase = (packet: RoutingPacket, next: Omit<RoutingPhase, 'start' | 'end'>) => {
    current(packet).end = now;
    packet.phases.push({ ...next, start: now, end: Infinity });
  };
  const drop = (packet: RoutingPacket, reason: RoutingDrop) => {
    const last = current(packet);
    phase(packet, { ...last, kind: 'dropped', reason });
  };
  const channel = (link: string, from: RoutingNode) => {
    const key = `${link}:${from}`;
    if (!channels.has(key)) channels.set(key, { waiting: [] });
    return channels.get(key)!;
  };
  function start(packet: RoutingPacket, link: RoutingLink, from: RoutingNode, to: RoutingNode) {
    const q = channel(link.id, from);
    q.busy = packet.id;
    phase(packet, {
      kind: 'transmitting',
      node: from,
      from,
      to,
      link: link.id,
      ttl: current(packet).ttl,
    });
    const leg = current(packet),
      finish = now + (p.bytes * 8) / link.rate;
    schedule(finish, 2, () => {
      if (current(packet) !== leg) return; // Aborted output cannot resurrect later.
      q.busy = undefined;
      phase(packet, { ...leg, kind: 'propagating' });
      const flight = current(packet);
      schedule(now + link.propagation, 3, () => {
        if (current(packet) === flight) arrive(packet, to);
      });
      const next = q.waiting.shift();
      if (next !== undefined) start(packets[next - 1], link, from, to);
    });
  }
  function enqueue(packet: RoutingPacket, from: RoutingNode, to: RoutingNode) {
    const link = links.find((l) => (l.a === from && l.b === to) || (l.b === from && l.a === to));
    if (!link) {
      drop(packet, 'route');
      return;
    }
    if (link.id === 'BR' && !physicalUp) {
      drop(packet, 'link');
      return;
    }
    const q = channel(link.id, from);
    if (q.busy === undefined) start(packet, link, from, to);
    else if (q.waiting.length >= p.capacity) drop(packet, 'queue');
    else {
      q.waiting.push(packet.id);
      phase(packet, {
        kind: 'waiting',
        node: from,
        from,
        to,
        link: link.id,
        ttl: current(packet).ttl,
      });
    }
  }
  function arrive(packet: RoutingPacket, node: RoutingNode) {
    const ttl = current(packet).ttl;
    if (node === 'R') {
      phase(packet, { kind: 'received', node, ttl });
      packet.receivedAt = now;
      while (expected <= packets.length && packets[expected - 1].receivedAt !== undefined) {
        packets[expected - 1].releasedAt = now;
        expected++;
      }
      return;
    }
    if (node === 'S') {
      enqueue(packet, 'S', 'A');
      return;
    }
    phase(packet, { kind: 'processing', node, ttl });
    schedule(now + 0.001, 3, () => {
      const row = tables[node].at(-1)!;
      packet.decisions.push({
        at: now,
        node,
        ttlBefore: ttl,
        ttlAfter: ttl - 1,
        next: ttl > 1 ? row.next : undefined,
        version: row.version,
      });
      // Preserve the pre-decrement history up to this decision instant.
      phase(packet, { kind: 'processing', node, ttl: ttl - 1 });
      if (ttl <= 1) drop(packet, 'ttl');
      else if (!row.next) drop(packet, 'route');
      else enqueue(packet, node, row.next);
    });
  }
  function flood(from: RoutingRouter, up: boolean, except?: RoutingRouter) {
    for (const link of links) {
      if (link.a !== from && link.b !== from) continue;
      const other = link.a === from ? link.b : link.a;
      if (!ROUTING_ROUTERS.includes(other as RoutingRouter) || other === except) continue;
      const to = other as RoutingRouter,
        key = `${from}:${to}`;
      const startAt = Math.max(now, controlUntil.get(key) ?? 0),
        txEnd = startAt + (80 * 8) / 64000;
      controlUntil.set(key, txEnd);
      const message: RoutingControl = {
        from,
        to,
        link: link.id,
        start: startAt,
        txEnd,
        arrive: txEnd + link.propagation,
        applyAt: txEnd + link.propagation + p.controlProcessing,
        version: 1,
        accepted: false,
      };
      controls.push(message);
      schedule(message.applyAt, 1, () => {
        if (tables[to].at(-1)!.version >= 1) return;
        message.accepted = true;
        tables[to].push({ at: now, version: 1, up, ...routingShortest(links, to, up) });
        flood(to, up, from);
      });
    }
  }
  if (p.change)
    schedule(p.change.at, 0, () => {
      physicalUp = p.change!.up;
      if (!physicalUp) {
        for (const packet of packets) {
          const s = current(packet);
          if (s.link === 'BR' && ['waiting', 'transmitting', 'propagating'].includes(s.kind))
            drop(packet, 'link');
        }
        for (const from of ['B', 'R'] as const) {
          const q = channel('BR', from);
          q.busy = undefined;
          q.waiting = [];
        }
      }
      tables.B.push({
        at: now,
        version: 1,
        up: physicalUp,
        ...routingShortest(links, 'B', physicalUp),
      });
      flood('B', physicalUp);
    });
  packets.forEach((packet) => schedule(packet.release, 4, () => enqueue(packet, 'S', 'A')));
  while (events.length) {
    if (++processed > 20000) throw new Error('Event safety bound exceeded');
    events.sort((a, b) => a.at - b.at || a.priority - b.priority || a.serial - b.serial);
    const event = events.shift()!;
    now = event.at;
    event.action();
  }
  return { config: p, links, packets, tables, controls, end: now };
}
export function routingSnapshot(run: RoutingRun, time: number) {
  if (!Number.isFinite(time)) throw new RangeError('Finite sample time required');
  const at = Math.max(0, time);
  const packets = run.packets.map((packet) => ({
    ...packet,
    phase: packet.phases.findLast((s) => s.start <= at)!,
    released: packet.releasedAt !== undefined && packet.releasedAt <= at,
  }));
  const tables = Object.fromEntries(
    ROUTING_ROUTERS.map((r) => [r, run.tables[r].findLast((row) => row.at <= at)!]),
  ) as Record<RoutingRouter, RoutingTable>;
  const counts = { unborn: 0, active: 0, received: 0, dropped: 0 };
  packets.forEach((p) => {
    if (p.phase.kind === 'unborn' || p.phase.kind === 'received' || p.phase.kind === 'dropped')
      counts[p.phase.kind]++;
    else counts.active++;
  });
  const control = run.controls.filter((c) => c.start <= at && c.applyAt > at);
  return {
    at,
    packets,
    tables,
    counts,
    control,
    brUp:
      run.config.change && at >= run.config.change.at ? run.config.change.up : run.config.initialUp,
  };
}
export type RoutingSnapshot = ReturnType<typeof routingSnapshot>;
export function routingBudget(packet: RoutingPacket, until: number) {
  const sums = { processing: 0, waiting: 0, transmitting: 0, propagating: 0 };
  for (const s of packet.phases)
    if (s.kind in sums)
      sums[s.kind as keyof typeof sums] += Math.max(0, Math.min(until, s.end) - s.start);
  return sums;
}
export type RoutingMode = 'normal' | 'failure' | 'reorder';
export function routingScenario(mode: RoutingMode) {
  if (!['normal', 'failure', 'reorder'].includes(mode))
    throw new RangeError('Unknown routing scenario');
  const p = routingDefaults();
  if (mode === 'failure')
    return { ...p, count: 7, start: 0.012, interval: 0.026, change: { at: 0.04, up: false } };
  if (mode === 'reorder')
    return {
      ...p,
      count: 6,
      interval: 0.032,
      initialUp: false,
      change: { at: 0.04, up: true },
      crPropagation: 0.12,
    };
  return p;
}
const runs = new Map<string, RoutingRun>();
export function routingShot(chapter: number, progress: number) {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Finite director state required');
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    u = Math.max(0, Math.min(1, progress));
  const variant = (c === 1 || c === 6) && u >= 0.5 ? 1 : 0;
  const local = c === 1 || c === 6 ? (u - variant * 0.5) * 2 : u;
  let config = { ...routingDefaults(), count: 1 },
    duration = 0.04,
    time = local * duration,
    selected = 1;
  if (c === 1) {
    config.brCost = variant ? 6 : 1;
    duration = 0.072;
  }
  if (c === 2) {
    config = { ...config, count: 4, interval: 0.005, brRate: 400000, capacity: 8 };
    duration = 0.13;
    selected = 3;
  }
  if (c === 3) {
    config.ttl = 2;
    duration = 0.02;
  }
  if (c === 4 || c === 5) {
    config = routingScenario('failure');
    duration = c === 4 ? 0.105 : 0.15;
    selected = c === 4 ? 1 : 2;
  }
  if (c === 6) {
    config = { ...config, count: 10, interval: 0.005, brRate: 400000, capacity: variant ? 8 : 2 };
    duration = 0.18;
    selected = 5;
  }
  if (c === 7) {
    config = routingScenario('reorder');
    duration = 0.235;
    selected = 4;
  }
  time = local * duration;
  if (c === 5) time = 0.035 + 0.115 * u;
  const key = `${c}:${variant}`;
  if (!runs.has(key)) runs.set(key, routingSimulate(config));
  const run = runs.get(key)!;
  return { chapter: c, variant, duration, run, state: routingSnapshot(run, time), selected };
}
export type RoutingShot = ReturnType<typeof routingShot>;
export const routingReset = () => ({
  config: routingDefaults(),
  time: 0,
  selected: 1,
  router: 'A' as RoutingRouter,
  mode: 'normal' as RoutingMode,
  compare: false,
});
