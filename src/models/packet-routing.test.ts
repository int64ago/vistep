import { describe, expect, it } from 'vitest';
import {
  ROUTING_NODES,
  ROUTING_ROUTERS,
  routingBudget,
  routingDefaults,
  routingLinks,
  routingReset,
  routingScenario,
  routingShortest,
  routingShot,
  routingSimulate,
  routingSnapshot,
  type RoutingConfig,
  type RoutingMode,
} from './packet-routing';

describe('packet identity, store-and-forward timing and local link state', () => {
  it('derives deterministic least-cost paths, independently of wire length or rate', () => {
    const p = routingDefaults(),
      links = routingLinks(p);
    expect(routingShortest(links, 'A', true)).toEqual({
      next: 'B',
      cost: 2,
      path: ['A', 'B', 'R'],
    });
    expect(routingShortest(links, 'C', true).path).toEqual(['C', 'B', 'R']);
    expect(routingShortest(links, 'A', false)).toEqual({
      next: 'C',
      cost: 5.5,
      path: ['A', 'C', 'R'],
    });
    expect(routingShortest(routingLinks({ ...p, brCost: 6 }), 'A', true).path).toEqual([
      'A',
      'C',
      'R',
    ]);
    expect(
      routingShortest(routingLinks({ ...p, brRate: 100, crPropagation: 3 }), 'A', true),
    ).toEqual(routingShortest(links, 'A', true));
    expect(routingShortest([...links].reverse(), 'A', true)).toEqual(
      routingShortest(links, 'A', true),
    );
  });
  it('agrees with an independent Bellman-Ford distance oracle', () => {
    for (const brCost of [0.5, 1, 2, 4, 6, 10])
      for (const up of [false, true])
        for (const source of ROUTING_NODES) {
          const links = routingLinks({ ...routingDefaults(), brCost });
          const d = new Map(ROUTING_NODES.map((n) => [n, n === source ? 0 : Infinity]));
          for (let i = 0; i < ROUTING_NODES.length - 1; i++)
            for (const l of links)
              if (up || l.id !== 'BR') {
                d.set(l.b, Math.min(d.get(l.b)!, d.get(l.a)! + l.cost));
                d.set(l.a, Math.min(d.get(l.a)!, d.get(l.b)! + l.cost));
              }
          expect(routingShortest(links, source, up).cost).toBe(d.get('R'));
        }
  });
  it('gets the first datagram delay from three serializations, propagation and two processing intervals', () => {
    const run = routingSimulate({ ...routingDefaults(), count: 1 }),
      packet = run.packets[0],
      b = routingBudget(packet, run.end);
    expect(packet.receivedAt).toBeCloseTo(0.0352, 12);
    expect(b).toEqual(expect.objectContaining({ waiting: 0 }));
    expect(b.transmitting).toBeCloseTo(0.0192, 12);
    expect(b.propagating).toBeCloseTo(0.014, 12);
    expect(b.processing).toBeCloseTo(0.002, 12);
    expect(Object.values(b).reduce((a, v) => a + v, 0)).toBeCloseTo(packet.receivedAt!, 12);
  });
  it('does not forward a packet before its last bit arrives', () => {
    const run = routingSimulate(routingDefaults());
    for (const packet of run.packets)
      for (let i = 1; i < packet.phases.length; i++) {
        const before = packet.phases[i - 1],
          after = packet.phases[i];
        expect(before.end).toBe(after.start);
        expect(before.end).toBeGreaterThanOrEqual(before.start);
        if (before.kind === 'transmitting') {
          const l = run.links.find((l) => l.id === before.link)!;
          expect(before.end - before.start).toBeCloseTo((run.config.bytes * 8) / l.rate, 12);
        }
        if (before.kind === 'propagating')
          expect(after.start - before.start).toBeCloseTo(
            run.links.find((l) => l.id === before.link)!.propagation,
            12,
          );
      }
  });
  it('derives FIFO waiting time and prevents overlap on a directed output', () => {
    const run = routingSimulate({
      ...routingDefaults(),
      count: 4,
      interval: 0.005,
      brRate: 400000,
      capacity: 8,
    });
    expect(routingBudget(run.packets[2], run.end).waiting).toBeCloseTo(0.038, 12);
    const tx = run.packets
      .flatMap((p) => p.phases.filter((s) => s.kind === 'transmitting' && s.link === 'BR'))
      .sort((a, b) => a.start - b.start);
    tx.slice(1).forEach((s, i) => expect(s.start).toBeGreaterThanOrEqual(tx[i].end - 1e-12));
    expect(run.packets.map((p) => p.receivedAt)).toEqual(
      [...run.packets.map((p) => p.receivedAt!)].sort((a, b) => a - b),
    );
  });
  it('uses zero waiting slots without preventing the first transmission', () => {
    const run = routingSimulate({
      ...routingDefaults(),
      count: 4,
      interval: 0.005,
      brRate: 400000,
      capacity: 0,
    });
    expect(run.packets[0].receivedAt).toBeDefined();
    expect(run.packets.slice(1).every((p) => p.phases.at(-1)?.reason === 'queue')).toBe(true);
  });
  it('compares identical inputs while larger buffers trade drops for waiting', () => {
    const p = { ...routingDefaults(), count: 10, interval: 0.005, brRate: 400000 };
    const small = routingSimulate({ ...p, capacity: 2 }),
      large = routingSimulate({ ...p, capacity: 8 });
    expect(small.packets.map((p) => [p.id, p.release])).toEqual(
      large.packets.map((p) => [p.id, p.release]),
    );
    expect(routingSnapshot(small, small.end).counts.dropped).toBe(6);
    expect(routingSnapshot(large, large.end).counts.received).toBe(10);
    expect(large.packets[4].receivedAt).toBeDefined();
    expect(small.packets[4].phases.at(-1)?.reason).toBe('queue');
    expect(routingBudget(large.packets[4], large.end).waiting).toBeCloseTo(0.076, 12);
  });
  it('decrements TTL once per router, never at source or destination, and discards zero', () => {
    for (const ttl of [1, 2, 3]) {
      const run = routingSimulate({ ...routingDefaults(), count: 1, ttl }),
        p = run.packets[0];
      expect(p.decisions.map((d) => [d.ttlBefore, d.ttlAfter])).toEqual(
        ttl === 1
          ? [[1, 0]]
          : [
              [ttl, ttl - 1],
              [ttl - 1, ttl - 2],
            ],
      );
      if (ttl <= 2) {
        expect(p.phases.at(-1)?.reason).toBe('ttl');
        expect(p.receivedAt).toBeUndefined();
      } else {
        expect(p.receivedAt).toBeDefined();
        expect(p.phases.at(-1)?.ttl).toBe(1);
      }
    }
  });
  it('propagates the changed advertisement before remote tables can update', () => {
    const run = routingSimulate(routingScenario('failure'));
    const before = routingSnapshot(run, 0.05);
    expect(before.tables.B.version).toBe(1);
    expect(before.tables.A.version).toBe(0);
    expect(before.tables.C.version).toBe(0);
    expect(run.tables.C[1].at).toBeCloseTo(0.093, 12);
    expect(run.tables.A[1].at).toBeCloseTo(0.094, 12);
    for (const r of ['A', 'C'] as const) {
      const m = run.controls.find((c) => c.to === r && c.accepted)!;
      expect(run.tables[r][1].at).toBe(m.applyAt);
      expect(m.applyAt - m.arrive).toBeCloseTo(0.04, 12);
    }
    for (const m of run.controls) {
      expect(m.txEnd - m.start).toBeCloseTo((80 * 8) / 64000, 12);
      expect(m.arrive).toBeGreaterThan(m.txEnd);
    }
  });
  it('ignores duplicate versions and converges to a common topology without omniscient forwarding', () => {
    const run = routingSimulate(routingScenario('failure'));
    expect(run.controls.some((c) => !c.accepted)).toBe(true);
    for (const r of ROUTING_ROUTERS) {
      expect(run.tables[r]).toHaveLength(2);
      expect(run.tables[r][1].up).toBe(false);
      expect(run.tables[r][1].path).toEqual(routingShortest(run.links, r, false).path);
    }
    const p = run.packets[1];
    expect(p.decisions.map((d) => d.node).join('')).toBe('ABCBCBC');
    expect(p.phases.at(-1)?.ttl).toBe(1);
    expect(p.decisions.some((d) => d.node === 'C' && d.version === 0 && d.next === 'B')).toBe(true);
  });
  it('aborts an in-flight packet at the link failure and never resurrects it', () => {
    const run = routingSimulate(routingScenario('failure')),
      p = run.packets[0];
    expect(p.phases.at(-2)?.kind).toBe('propagating');
    expect(p.phases.at(-1)?.reason).toBe('link');
    expect(p.phases.at(-1)?.start).toBe(0.04);
    expect(p.receivedAt).toBeUndefined();
    expect(routingSnapshot(run, 10).packets[0].phase.kind).toBe('dropped');
  });
  it('exposes genuine reordering and only releases a contiguous application prefix', () => {
    const run = routingSimulate(routingScenario('reorder'));
    expect([...run.packets].sort((a, b) => a.receivedAt! - b.receivedAt!).map((p) => p.id)).toEqual(
      [4, 1, 5, 2, 6, 3],
    );
    const early = routingSnapshot(run, 0.14);
    expect(early.packets[3].phase.kind).toBe('received');
    expect(early.packets[3].released).toBe(false);
    expect(run.packets[3].releasedAt).toBeCloseTo(0.208, 12);
    expect(run.packets[0].releasedAt).toBeCloseTo(0.144, 12);
    expect(routingSnapshot(run, 0.27).packets.every((p) => p.released)).toBe(true);
  });
  it('does not invent recovery across a missing application sequence number', () => {
    const run = routingSimulate(routingScenario('failure'));
    expect(run.packets[0].receivedAt).toBeUndefined();
    expect(
      run.packets.slice(1).every((p) => p.receivedAt !== undefined && p.releasedAt === undefined),
    ).toBe(true);
  });
  it('conserves every packet identity and bounds queues across 54 parameter corners', () => {
    for (const mode of ['normal', 'failure', 'reorder'] as const)
      for (const brRate of [200000, 2000000])
        for (const capacity of [0, 2, 8])
          for (const ttl of [1, 3, 8]) {
            const run = routingSimulate({ ...routingScenario(mode), brRate, capacity, ttl });
            for (let i = 0; i <= 25; i++) {
              const s = routingSnapshot(run, (run.end * i) / 25);
              expect(Object.values(s.counts).reduce((a, b) => a + b, 0)).toBe(run.config.count);
              expect(new Set(s.packets.map((p) => p.id)).size).toBe(run.config.count);
              for (const link of run.links)
                for (const from of [link.a, link.b]) {
                  expect(
                    s.packets.filter(
                      (p) =>
                        p.phase.kind === 'waiting' &&
                        p.phase.link === link.id &&
                        p.phase.from === from,
                    ).length,
                  ).toBeLessThanOrEqual(capacity);
                  expect(
                    s.packets.filter(
                      (p) =>
                        p.phase.kind === 'transmitting' &&
                        p.phase.link === link.id &&
                        p.phase.from === from,
                    ).length,
                  ).toBeLessThanOrEqual(1);
                }
            }
            expect(
              run.packets.every((p) => ['received', 'dropped'].includes(p.phases.at(-1)!.kind)),
            ).toBe(true);
          }
  });
  it('accounts for the whole residence time without queue time masquerading as propagation', () => {
    for (const mode of ['normal', 'failure', 'reorder'] as const) {
      const run = routingSimulate(routingScenario(mode));
      for (const p of run.packets) {
        const end = p.phases.at(-1)!.start;
        const b = routingBudget(p, end);
        expect(Object.values(b).reduce((a, v) => a + v, 0)).toBeCloseTo(end - p.release, 12);
      }
    }
  });
  it('reconstructs every chapter identically after arbitrary seek order', () => {
    const samples = Array.from({ length: 8 }, (_, c) =>
      [0.01, 0.31, 0.56, 1].map((u) => ({ c, u, state: routingShot(c, u).state })),
    ).flat();
    for (const s of samples.reverse()) expect(routingShot(s.c, s.u).state).toEqual(s.state);
    expect(routingShot(6, 0.2).run.packets.map((p) => p.release)).toEqual(
      routingShot(6, 0.7).run.packets.map((p) => p.release),
    );
  });
  it('fully resets configuration, time, selection, comparison and mode without shared references', () => {
    const s = routingReset();
    s.config = routingScenario('reorder');
    s.config.capacity = 9;
    s.time = 0.8;
    s.selected = 6;
    s.router = 'C';
    s.compare = true;
    s.mode = 'failure';
    expect(routingReset()).toEqual({
      config: routingDefaults(),
      time: 0,
      selected: 1,
      router: 'A',
      mode: 'normal',
      compare: false,
    });
    const fresh = routingReset();
    fresh.config.capacity = 0;
    expect(routingReset().config.capacity).toBe(3);
  });
  it('rejects invalid rates, queue bounds, TTL, event times and director inputs', () => {
    const p = routingDefaults();
    for (const bad of [
      { brRate: 0 },
      { bytes: 1501 },
      { count: 0 },
      { ttl: 0 },
      { ttl: 256 },
      { capacity: -1 },
      { interval: NaN },
      { change: { at: -1, up: false } },
    ])
      expect(() => routingSimulate({ ...p, ...bad } as RoutingConfig)).toThrow(RangeError);
    expect(() => routingSnapshot(routingSimulate(p), NaN)).toThrow(RangeError);
    expect(() => routingShot(0, NaN)).toThrow(RangeError);
    expect(() => routingScenario('bad' as RoutingMode)).toThrow(RangeError);
  });
});
