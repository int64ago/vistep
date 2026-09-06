import { describe, expect, it } from 'vitest';
import { routingBufferComparison } from './packetRoutingPresentation';
import {
  routingDefaults,
  routingScenario,
  routingSnapshot,
  type RoutingMode,
} from '../../models/packet-routing';

describe('buffer comparison physical-time ruler', () => {
  it('compares the congested twelve-packet case at 150 ms in both runs', () => {
    const pair = routingBufferComparison({
      ...routingDefaults(),
      count: 12,
      interval: 0.004,
      brRate: 200000,
      capacity: 3,
    });
    expect(pair.baseline.end).toBeCloseTo(0.2632, 12);
    expect(pair.expanded.end).toBeCloseTo(0.5032, 12);
    const fraction = 0.15 / pair.duration;
    const baseline = routingSnapshot(pair.baseline, fraction * pair.duration);
    const expanded = routingSnapshot(pair.expanded, fraction * pair.duration);
    expect(baseline.at).toBe(expanded.at);
    expect(baseline.counts).toEqual({ active: 3, received: 2, dropped: 7, unborn: 0 });
    expect(expanded.counts).toEqual({ active: 8, received: 2, dropped: 2, unborn: 0 });
  });

  it('keeps input, topology, release identities and classification rules across both capacities', () => {
    for (const mode of ['normal', 'failure', 'reorder'] as RoutingMode[])
      for (const count of [1, 12])
        for (const capacity of [0, 3, 8, 10])
          for (const brRate of [200000, 2000000])
            for (const ttl of [1, 8]) {
              const config = { ...routingScenario(mode), count, capacity, brRate, ttl };
              const before = structuredClone(config);
              const pair = routingBufferComparison(config);
              expect(config).toEqual(before);
              expect(pair.expanded.config).toEqual({ ...pair.baseline.config, capacity: 8 });
              expect(pair.expanded.links).toEqual(pair.baseline.links);
              const identity = (run: typeof pair.baseline) =>
                run.packets.map(({ id, release }) => ({ id, release }));
              expect(identity(pair.expanded)).toEqual(identity(pair.baseline));
              expect(pair.duration).toBeGreaterThanOrEqual(pair.baseline.end);
              expect(pair.duration).toBeGreaterThanOrEqual(pair.expanded.end);
              for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
                const samples = [pair.baseline, pair.expanded].map((run) =>
                  routingSnapshot(run, fraction * pair.duration),
                );
                expect(samples[0].at).toBe(samples[1].at);
                for (const sample of samples) {
                  expect(Object.values(sample.counts).reduce((a, b) => a + b, 0)).toBe(count);
                  expect(sample.counts.received).toBe(
                    sample.packets.filter((p) => p.phase.kind === 'received').length,
                  );
                  expect(sample.counts.dropped).toBe(
                    sample.packets.filter((p) => p.phase.kind === 'dropped').length,
                  );
                  if (fraction === 1) expect(sample.counts.active + sample.counts.unborn).toBe(0);
                }
              }
            }
  });

  it('preserves the larger baseline horizon when comparing ten waiting slots with eight', () => {
    const pair = routingBufferComparison({
      ...routingDefaults(),
      count: 12,
      interval: 0.004,
      brRate: 200000,
      capacity: 10,
    });
    expect(pair.baseline.end).toBeGreaterThan(pair.expanded.end);
    expect(pair.duration).toBe(pair.baseline.end);
  });
});
