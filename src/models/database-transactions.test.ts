import { describe, expect, it } from 'vitest';
import {
  reservationInvariant,
  reservationLesson,
  reservationTrace,
  type ReservationEvent,
} from './database-transactions';
describe('atomic reservation and stale-read validation', () => {
  it('publishes remaining stock and order together, and discards all staged changes on rollback', () => {
    const q = reservationLesson('rollback');
    expect(q.frames[3].state.remaining).toBe(1);
    expect(q.frames[3].state.orders).toEqual([]);
    expect(q.frames[3].state.transactions.T1.proposed).toBe(0);
    expect(q.state.remaining).toBe(1);
    expect(q.state.orders).toEqual([]);
    expect(q.state.transactions.T1.status).toBe('rolled-back');
    expect(q.frames[3].state.transactions.T1.status).toBe('staged');
  });
  it('demonstrates two individually atomic commits that violate the reservation invariant', () => {
    const q = reservationLesson('overlap', 'unchecked');
    expect(q.state.orders).toEqual(['T1', 'T2']);
    expect(q.state.remaining).toBe(0);
    expect(reservationInvariant(q.state)).toBe(false);
    expect(reservationLesson('serial', 'unchecked').state.orders).toEqual(['T1']);
  });
  it('validates read version at commit, aborts stale write atomically, and retries from fresh stock', () => {
    const q = reservationLesson('overlap', 'validate', 1, true);
    expect(q.state.orders).toEqual(['T1']);
    expect(q.state.transactions.T2.status).toBe('aborted');
    expect(q.state.transactions['T2′'].status).toBe('rejected');
    expect(q.frames.every((f) => reservationInvariant(f.state))).toBe(true);
  });
  it('keeps the invariant for every70 interleavings of two four-operation transactions', () => {
    const actions = ['begin', 'read', 'stage', 'commit'] as const,
      all: ReservationEvent[][] = [];
    const visit = (a: number, b: number, p: ReservationEvent[]) => {
      if (a === 4 && b === 4) {
        all.push(p);
        return;
      }
      if (a < 4) visit(a + 1, b, [...p, { tx: 'A', action: actions[a] }]);
      if (b < 4) visit(a, b + 1, [...p, { tx: 'B', action: actions[b] }]);
    };
    visit(0, 0, []);
    expect(all).toHaveLength(70);
    for (const initial of [0, 1, 2, 3])
      for (const events of all) {
        const q = reservationTrace(events, 'validate', initial);
        expect(q.frames.every((f) => reservationInvariant(f.state))).toBe(true);
        expect(q.state.orders.length).toBeLessThanOrEqual(initial);
      }
    expect(() => reservationTrace([{ tx: 'T', action: 'commit' }])).toThrow();
    expect(() => reservationTrace([], 'validate', -1)).toThrow();
  });
});
