import { describe, it, expect } from 'vitest';
import { tcpSimulate, tcpDefaults, tcpAt } from './tcp-reliability';
describe('deterministic reliable byte stream', () => {
  it('delivers every byte range exactly once in original order with loss and reordering', () => {
    for (const window of [1, 2, 4, 6])
      for (const drop of [-1, 0, 1, 5])
        for (const reorder of [false, true]) {
          const r = tcpSimulate({ ...tcpDefaults(), window, drop, reorder }),
            s = tcpAt(r, r.end);
          expect(s.delivered).toEqual([0, 1, 2, 3, 4, 5]);
          expect(s.base).toBe(6);
          for (const frame of r.states)
            expect(frame.delivered).toEqual(Array.from({ length: frame.next }, (_, i) => i));
        }
  });
  it('holds out-of-order data without changing cumulative ACK', () => {
    const r = tcpSimulate({ ...tcpDefaults(), drop: 1 });
    const held = r.states.find((s) => s.kind === 'receive' && s.segment === 2)!;
    expect(held.next).toBe(1);
    expect(held.buffer).toContain(2);
    expect(held.delivered).toEqual([0]);
  });
  it('retransmits the missing sequence range rather than inventing a new stream position', () => {
    const r = tcpSimulate();
    const first = r.transmissions.find((t) => t.segment === 1)!,
      retry = r.transmissions.find((t) => t.segment === 1 && t.retransmit)!;
    expect(first.lost).toBe(true);
    expect(retry.seq).toBe(first.seq);
    expect(retry.endSeq).toBe(first.endSeq);
    expect(retry.sent).toBeGreaterThanOrEqual(first.sent + 2);
  });
  it('a lost ACK causes duplicate data but no duplicate delivery', () => {
    const r = tcpSimulate({ ...tcpDefaults(), count: 1, window: 1, drop: -1, loseAck: true });
    expect(r.acks[0].lost).toBe(true);
    expect(r.transmissions).toHaveLength(2);
    expect(r.states.some((s) => s.duplicate)).toBe(true);
    expect(tcpAt(r, r.end).delivered).toEqual([0]);
  });
  it('reconstructs arbitrary backward seeks and stays within the send window', () => {
    const r = tcpSimulate();
    for (const s of r.states) {
      expect(s.sent - s.base).toBeLessThanOrEqual(r.config.window);
      expect(tcpAt(r, s.at).next).toBeGreaterThanOrEqual(s.next);
    }
    expect(tcpAt(r, 0).delivered).toEqual([]);
    expect(() => tcpSimulate({ ...tcpDefaults(), rto: 0 })).toThrow();
  });
});
