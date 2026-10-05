import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CellHandoverRequests,
  type ChJob,
  type ChReply,
  type ChResult,
} from './cell-handover-requests';
import { type ChFieldSet } from '../../models/cell-handover';

function field(marker = 0, bytes = 16): ChFieldSet {
  return {
    field: {
      rect: { x: 0, y: 0, w: 1, h: 1 },
      cols: 1,
      rows: 1,
      step: 1,
      best: new Uint16Array([marker]),
      bestDbm: new Float32Array([marker]),
      marginDb: new Float32Array([1]),
    },
    cellEdges: new Float32Array(bytes / 4),
    taEdges: new Float32Array(),
  };
}
const job = (sigmaDb: number, step = 2): ChJob => ({
  kind: 'field',
  request: { isdM: 500, sigmaDb, step },
});
class WorkerDouble {
  onmessage: ((event: MessageEvent<ChReply>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  sent: { id: number; sigmaDb: number; step: number }[] = [];
  postMessage = vi.fn((value: { id: number; sigmaDb: number; step: number }) => {
    this.sent.push(value);
  });
  terminate = vi.fn();
  reply(id: number, marker = 0) {
    this.onmessage?.({ data: { id, set: field(marker) } } as MessageEvent<ChReply>);
  }
  fail() {
    this.onerror?.({ preventDefault: vi.fn() } as unknown as ErrorEvent);
  }
}
function fixture(options: ConstructorParameters<typeof CellHandoverRequests>[0] = {}) {
  const worker = new WorkerDouble();
  const queue = new CellHandoverRequests({
    createWorker: () => worker as unknown as Worker,
    ...options,
  });
  const release = queue.retain();
  return { worker, queue, release };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('cellular worker request lifecycle', () => {
  it('debounces field dragging and removes old subscriptions before they become native work', () => {
    const { queue, worker, release } = fixture();
    const receive = vi.fn();
    let cancel = queue.subscribe(job(0), receive);
    for (let sigma = 1; sigma <= 10; sigma++) {
      vi.advanceTimersByTime(20);
      cancel();
      cancel = queue.subscribe(job(sigma), receive);
    }
    expect(worker.sent).toHaveLength(0);
    vi.advanceTimersByTime(120);
    expect(worker.sent).toHaveLength(1);
    expect(worker.sent[0].sigmaDb).toBe(10);
    worker.reply(worker.sent[0].id, 10);
    expect(receive).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    cancel();
    release();
  });

  it('keeps only the latest input for one hook while preserving separate ideal and patch layers', () => {
    const { queue, worker, release } = fixture();
    const obsolete = vi.fn(),
      main = vi.fn(),
      ideal = vi.fn(),
      patch = vi.fn();
    const cancelOld = queue.subscribe(job(6), obsolete, undefined, 0);
    vi.runOnlyPendingTimers();
    expect(worker.sent).toHaveLength(1);
    cancelOld();
    const cancelIntermediate = queue.subscribe(job(7), obsolete, undefined, 0);
    const cancelIdeal = queue.subscribe(job(0), ideal, undefined, 0);
    const cancelPatch = queue.subscribe(job(6, 0.5), patch, undefined, 0);
    vi.runOnlyPendingTimers();
    cancelIntermediate();
    const cancelMain = queue.subscribe(job(10), main, undefined, 0);
    vi.runOnlyPendingTimers();
    expect(worker.sent).toHaveLength(1); // even ready changes cannot queue another native job
    worker.reply(worker.sent[0].id, 6);
    expect(obsolete).not.toHaveBeenCalled();
    expect(worker.sent).toHaveLength(2);
    expect(worker.sent[1].sigmaDb).toBe(0);
    worker.reply(worker.sent[1].id, 0);
    expect(ideal).toHaveBeenCalledOnce();
    expect(worker.sent[2].step).toBe(0.5);
    worker.reply(worker.sent[2].id, 6);
    expect(patch).toHaveBeenCalledOnce();
    expect(worker.sent[3].sigmaDb).toBe(10);
    worker.reply(worker.sent[3].id, 10);
    expect(main).toHaveBeenCalledOnce();
    cancelIdeal();
    cancelPatch();
    cancelMain();
    release();
  });

  it('shares identical inputs and ignores unrelated or duplicated worker replies', () => {
    const { queue, worker, release } = fixture();
    const first = vi.fn(),
      second = vi.fn();
    const stop1 = queue.subscribe(job(3), first, undefined, 0);
    const stop2 = queue.subscribe(job(3), second, undefined, 0);
    vi.runAllTimers();
    expect(worker.sent).toHaveLength(1);
    worker.reply(999, 9);
    expect(first).not.toHaveBeenCalled();
    worker.reply(worker.sent[0].id, 3);
    worker.reply(worker.sent[0].id, 4);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(queue.peek(job(3))).toBeDefined();
    stop1();
    stop2();
    release();
  });

  it('fails over only live jobs and yields local batches so pending input and navigation can cancel them', () => {
    const computed: number[] = [],
      chunks: number[] = [];
    function* compute(input: ChJob): Generator<void, ChResult, void> {
      const sigma = input.kind === 'field' ? input.request.sigmaDb : -1;
      computed.push(sigma);
      for (let i = 0; i < 12; i++) {
        chunks.push(sigma);
        yield;
      }
      return field(sigma);
    }
    const { queue, worker, release } = fixture({ compute });
    const receive = vi.fn();
    const cancelOld = queue.subscribe(job(1), receive, undefined, 0);
    vi.runOnlyPendingTimers();
    cancelOld();
    const cancelNext = queue.subscribe(job(2), receive, undefined, 0);
    const cancelDropped = queue.subscribe(job(3), receive, undefined, 0);
    vi.runOnlyPendingTimers();
    cancelDropped();
    worker.fail();
    expect(computed).toEqual([]); // no synchronous queue drain on the error event
    vi.runOnlyPendingTimers();
    expect(computed).toEqual([2]);
    expect(chunks.length).toBeLessThan(12);
    expect(receive).not.toHaveBeenCalled();
    cancelNext();
    vi.runAllTimers();
    expect(computed).toEqual([2]);
    expect(receive).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
    release();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('delivers a bounded fallback result after Worker construction fails', () => {
    function* compute(): Generator<void, ChResult, void> {
      for (let i = 0; i < 9; i++) yield;
      return field(4);
    }
    const { queue, release } = fixture({
      createWorker: () => {
        throw Error('Worker blocked');
      },
      compute,
    });
    const receive = vi.fn();
    queue.subscribe(job(4), receive, undefined, 0);
    vi.runOnlyPendingTimers();
    expect(receive).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(receive).toHaveBeenCalledOnce();
    release();
  });

  it('reports model failures without retrying them or leaving the native slot blocked', () => {
    const { queue, worker, release } = fixture();
    const failed = vi.fn(),
      next = vi.fn();
    queue.subscribe(job(-1), vi.fn(), failed, 0);
    queue.subscribe(job(6), next, undefined, 0);
    vi.runAllTimers();
    worker.onmessage?.({
      data: { id: worker.sent[0].id, error: 'Invalid shadowing' },
    } as MessageEvent<ChReply>);
    expect(failed).toHaveBeenCalledWith('Invalid shadowing');
    expect(worker.sent).toHaveLength(2);
    worker.reply(worker.sent[1].id, 6);
    expect(next).toHaveBeenCalledOnce();
    release();
  });

  it('releases timers/listeners on navigation and rejects callbacks from the preceding page session', () => {
    const workers = [new WorkerDouble(), new WorkerDouble()];
    const queue = new CellHandoverRequests({
      createWorker: () => workers.shift()! as unknown as Worker,
    });
    const first = workers[0],
      second = workers[1],
      receive = vi.fn();
    const leave = queue.retain();
    queue.subscribe(job(1), receive, undefined, 0);
    vi.runOnlyPendingTimers();
    const lateMessage = first.onmessage!,
      lateError = first.onerror!;
    queue.subscribe(job(2), receive); // pending debounce timer
    leave();
    expect(vi.getTimerCount()).toBe(0);
    expect(first.terminate).toHaveBeenCalledOnce();
    expect(first.onmessage).toBeNull();
    const leaveAgain = queue.retain();
    queue.subscribe(job(3), receive, undefined, 0);
    vi.runOnlyPendingTimers();
    lateMessage({ data: { id: first.sent[0].id, set: field(1) } } as MessageEvent<ChReply>);
    lateError({ preventDefault: vi.fn() } as unknown as ErrorEvent);
    expect(receive).not.toHaveBeenCalled();
    expect(second.terminate).not.toHaveBeenCalled();
    second.reply(second.sent[0].id, 3);
    expect(receive).toHaveBeenCalledOnce();
    leaveAgain();
  });

  it('applies the main-thread cache budget to actual field buffers', () => {
    const { queue, worker, release } = fixture({ budgetBytes: 300 });
    for (const sigma of [1, 2]) {
      const cancel = queue.subscribe(job(sigma), vi.fn(), undefined, 0);
      vi.runOnlyPendingTimers();
      worker.reply(worker.sent.at(-1)!.id, sigma); // 154 retained bytes, so two cannot fit
      cancel();
    }
    expect(queue.peek(job(1))).toBeUndefined();
    expect(queue.peek(job(2))).toBeDefined();
    release();
    expect(queue.peek(job(2))).toBeUndefined();
  });
});
