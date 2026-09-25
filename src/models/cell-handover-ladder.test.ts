import { describe, expect, it } from 'vitest';
import { CH_LADDER, chLadder, chPacketAt } from './cell-handover-ladder';

describe('handover ladder', () => {
  const ladder = chLadder();
  it('orders the X2/Xn messages as TS 36.300 describes', () => {
    const order = ladder.messages.map((m) => m.id);
    const at = (id: string) => order.indexOf(id);
    expect(at('report')).toBeLessThan(at('request'));
    expect(at('request')).toBeLessThan(at('ack'));
    expect(at('ack')).toBeLessThan(at('command'));
    expect(at('command')).toBeLessThan(at('access'));
    expect(at('complete')).toBeLessThan(at('path'));
    expect(at('path')).toBeLessThan(at('marker'));
    for (const m of ladder.messages) expect(m.arrive).toBeGreaterThan(m.send);
    for (let k = 1; k < ladder.messages.length; k++)
      expect(ladder.messages[k].send).toBeGreaterThanOrEqual(ladder.messages[k - 1].send);
  });
  it('keeps the interruption within the TS 36.133 known-cell bound', () => {
    expect(ladder.interruptMs).toBe(20 + CH_LADDER.tiuMs);
    expect(chLadder(30).interruptMs).toBe(50);
    expect(ladder.gapMs).toBeGreaterThan(ladder.interruptMs);
    expect(ladder.gapMs).toBeLessThan(60);
    expect(() => chLadder(31)).toThrow(RangeError);
  });
  it('delivers every packet exactly once, in order, with nothing lost', () => {
    const ids = ladder.packets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const byTime = [...ladder.packets].sort((a, b) => a.delivered - b.delivered);
    expect(byTime.map((p) => p.id)).toEqual(ids);
    for (const p of ladder.packets) expect(p.delivered).toBeGreaterThan(p.created);
    expect(ladder.packets.some((p) => p.path === 'forwarded')).toBe(true);
    expect(ladder.packets.some((p) => p.path === 'direct')).toBe(true);
    // Nothing reaches the handset over the air while it is between cells.
    for (const p of ladder.packets)
      expect(p.delivered <= ladder.detachAt || p.delivered > ladder.attachAt).toBe(true);
  });
  it('locates each packet consistently in time', () => {
    for (const p of ladder.packets) {
      expect(chPacketAt(ladder, p, p.created - 1).state).toBe('waiting');
      expect(chPacketAt(ladder, p, p.delivered).state).toBe('delivered');
    }
    const fwd = ladder.packets.find((p) => p.path === 'forwarded')!;
    const held = chPacketAt(ladder, fwd, fwd.atStation + 0.5);
    expect(held).toEqual({ state: 'held', at: 2 });
    expect(() => chPacketAt(ladder, fwd, NaN)).toThrow(RangeError);
  });
});
