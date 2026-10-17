import { describe, it, expect } from 'vitest';
import { congestionRun, congestionDefaults } from './congestion-control';
describe('ACK-clocked RTT-bin congestion model', () => {
  it('preserves packet identity, FIFO order, buffer bound and complete accounting', () => {
    for (const capacity of [1, 2, 4, 8])
      for (const buffer of [8, 16]) {
        const run = congestionRun({ ...congestionDefaults(), capacity, buffer }),
          seen = new Set<number>();
        for (const r of run.history) {
          expect(r.queue.length).toBeLessThanOrEqual(buffer);
          expect(r.served.length).toBeLessThanOrEqual(capacity);
          expect(r.sent.length + r.queueBefore.length).toBe(
            r.served.length + r.queue.length + r.dropped.length,
          );
          for (const id of [...r.served, ...r.dropped]) {
            expect(seen.has(id)).toBe(false);
            seen.add(id);
          }
          expect(r.served).toEqual([...r.served].sort((a, b) => a - b));
        }
        expect(run.sent).toBe(run.delivered + run.dropped + run.history.at(-1)!.queue.length);
      }
  });
  it('starts 1,2,4,8 with unconstrained ACK slow start', () => {
    expect(
      congestionRun()
        .history.slice(0, 4)
        .map((r) => r.before),
    ).toEqual([1, 2, 4, 8]);
  });
  it('halves flight on loss and uses per-ACK reciprocal growth afterward', () => {
    const r = congestionRun(),
      loss = r.history.find((x) => x.phase === 'loss')!;
    expect(loss.after).toBe(Math.max(loss.flight / 2, 2));
    const ca = r.history.find((x) => x.phase === 'avoidance' && !x.dropped.length)!;
    let expected = ca.before;
    for (const _ of ca.served) expected += 1 / expected;
    expect(ca.after).toBeCloseTo(expected, 12);
  });
  it('keeps the same bottleneck when comparing an unresponsive sender', () => {
    const a = congestionRun(),
      b = congestionRun({ ...congestionDefaults(), initial: 12, responsive: false });
    expect(b.dropped).toBeGreaterThan(a.dropped);
    expect(b.history.every((r) => r.before === 12 && r.after === 12)).toBe(true);
    expect(b.config.capacity).toBe(a.config.capacity);
  });
  it('rejects nonphysical dimensions and reconstructs immutable rounds', () => {
    const run = congestionRun();
    expect(run.history[0].queue).toEqual([]);
    expect(() => congestionRun({ ...congestionDefaults(), buffer: 0 })).toThrow();
  });
});
