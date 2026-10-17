import { describe, expect, it } from 'vitest';
import { walInitial, walScenario, walStep } from './write-ahead-log';
describe('no-steal logical WAL teaching model', () => {
  it('acknowledges a durable commit before its data page, then recovers the acknowledged value', () => {
    const q = walScenario();
    expect(q.frames[4].state.acknowledged).toBe(true);
    expect(q.frames[4].state.page.value).toBe(7);
    expect(q.frames[4].state.durable).toBe(2);
    expect(q.frames[5].state.memory).toBeNull();
    expect(q.state.page.value).toBe(11);
    expect(q.state.page.lsn).toBe(1);
    expect(q.frames[4].state.page.value).toBe(7);
  });
  it('distinguishes a buffered change, durable uncommitted update and durable commit without acknowledgement', () => {
    expect(walScenario('buffer').state.page.value).toBe(7);
    expect(walScenario('update-only').state.page.value).toBe(7);
    const committed = walScenario('commit-no-ack');
    expect(committed.state.page.value).toBe(11);
    expect(committed.state.acknowledged).toBe(false);
  });
  it('enforces WAL-before-page, durable-before-ack and the explicit no-steal simplification', () => {
    const edited = walStep(walInitial(), 'edit');
    expect(() => walStep(edited, 'flush-page')).toThrow(/WAL before/);
    expect(() => walStep(edited, 'ack')).toThrow(/durable/);
    const logged = walStep(edited, 'flush-update');
    expect(() => walStep(logged, 'flush-page')).toThrow(/No-steal/);
    expect(() => walStep(walStep(edited, 'crash'), 'edit')).toThrow(/Recover/);
  });
  it('recovery is idempotent across every crash boundary and varied update values', () => {
    for (const value of [0, 8, 11, 31, 1000])
      for (const point of ['buffer', 'update-only', 'commit-no-ack', 'ack', 'page'] as const) {
        const q = walScenario(point, value),
          expected = ['buffer', 'update-only'].includes(point) ? 7 : value;
        expect(q.state.page.value).toBe(expected);
        const again = walStep(walStep(q.state, 'crash'), 'recover');
        expect(again.page).toEqual(q.state.page);
        if (q.state.acknowledged) expect(q.state.page.value).toBe(value);
      }
    expect(() => walStep(walInitial(), 'edit', NaN)).toThrow();
  });
});
