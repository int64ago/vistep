import { describe, expect, it } from 'vitest';
import {
  flowAugment,
  flowLessonNetwork,
  flowResidual,
  flowValid,
  flowValue,
  maxFlowTrace,
  type FlowNetwork,
} from './max-flow';
const exhaustiveCut = (n: FlowNetwork) => {
  let best = Infinity;
  for (let mask = 0; mask < 1 << n.vertices; mask++)
    if (mask & (1 << n.source) && !(mask & (1 << n.sink))) {
      const cap = n.edges
        .filter((e) => mask & (1 << e.from) && !(mask & (1 << e.to)))
        .reduce((sum, e) => sum + e.capacity, 0);
      best = Math.min(best, cap);
    }
  return best;
};
describe('residual maximum flow', () => {
  it('must cancel an earlier A→B unit to grow the chosen flow from3 to4', () => {
    const q = maxFlowTrace(flowLessonNetwork(), true);
    expect(q.frames.map((f) => flowValue(f.state))).toEqual([0, 1, 2, 3, 4]);
    expect(q.frames[3].state.flows).toEqual([2, 1, 1, 1, 2]);
    const final = q.frames[4];
    expect(final.path.map((a) => [a.from, a.to, a.direction])).toEqual([
      [0, 2, 1],
      [2, 1, -1],
      [1, 3, 1],
    ]);
    expect(final.state.flows[2]).toBe(0);
    expect(q.cutCapacity).toBe(4);
    expect(q.cutEdges).toEqual([0, 1]);
    for (const f of q.frames) expect(flowValid(f.state)).toBe(true);
  });
  it('matches independently enumerated cut capacities on sixty weighted directed networks', () => {
    for (let seed = 0; seed < 60; seed++) {
      const network: FlowNetwork = { vertices: 5, source: 0, sink: 4, edges: [] };
      for (let a = 0; a < 5; a++)
        for (let b = 0; b < 5; b++)
          if (a !== b && (a * 13 + b * 7 + seed) % 4 === 0)
            network.edges.push({
              id: `${a}-${b}`,
              from: a,
              to: b,
              capacity: (a * 7 + b * 5 + seed) % 5,
            });
      const q = maxFlowTrace(network, false);
      expect(q.value).toBe(exhaustiveCut(network));
      expect(q.cutCapacity).toBe(q.value);
      expect(flowValid(q.state)).toBe(true);
      expect(q.reachable).not.toContain(network.sink);
    }
  });
  it('changing the actual outlet changes the max-flow bound, preserving every vertex balance', () => {
    for (const capacity of [1, 2, 3]) {
      const q = maxFlowTrace(flowLessonNetwork(capacity));
      expect(q.value).toBe(Math.min(4, capacity + 2));
      expect(q.value).toBe(q.cutCapacity);
      for (const f of q.frames) {
        expect(flowValid(f.state)).toBe(true);
        for (const a of flowResidual(f.state)) expect(a.capacity).toBeGreaterThan(0);
      }
    }
  });
  it('rejects broken conservation, unavailable reverse arcs and malformed paths; handles zero capacity', () => {
    const network = flowLessonNetwork(),
      empty = { network, flows: [0, 0, 0, 0, 0] };
    expect(() => flowAugment(empty, [{ edge: 2, direction: -1 }])).toThrow();
    expect(() => flowAugment(empty, [{ edge: 0, direction: 1 }])).toThrow();
    expect(flowValid({ network, flows: [1, 0, 0, 0, 0] })).toBe(false);
    expect(
      maxFlowTrace(
        { vertices: 2, source: 0, sink: 1, edges: [{ id: 'z', from: 0, to: 1, capacity: 0 }] },
        false,
      ).value,
    ).toBe(0);
    expect(() => maxFlowTrace({ ...network, source: 3 })).toThrow();
  });
});
