import { afterEach, describe, expect, it, vi } from 'vitest';
import { CH_DEFAULT, type ChFieldSet, type ChRun } from '../models/cell-handover';

type Reply = {
  id: number;
  set?: ChFieldSet;
  run?: Omit<ChRun, 'layout' | 'route'>;
  error?: string;
};
afterEach(() => vi.unstubAllGlobals());

describe('cellular Worker transfer protocol', () => {
  it('transfers wide cell IDs and preserves the cached route buffers for a repeated request', async () => {
    const replies: Reply[] = [];
    const scope = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      postMessage: (data: Reply, transfer: Transferable[]) => {
        replies.push(structuredClone(data, { transfer }));
      },
    };
    vi.stubGlobal('self', scope);
    await import('./cell-handover.worker');
    scope.onmessage!({
      data: { kind: 'field', id: 1, isdM: 150, sigmaDb: 0, step: 50 },
    } as MessageEvent);
    const field = replies[0].set!.field;
    expect(field.best).toBeInstanceOf(Uint16Array);
    expect(field.best[14 * field.cols + 11]).toBe(257);
    const params = { ...CH_DEFAULT, speedKmh: 200 };
    scope.onmessage!({ data: { kind: 'run', id: 2, params } } as MessageEvent);
    scope.onmessage!({ data: { kind: 'run', id: 3, params } } as MessageEvent);
    expect(replies.map((reply) => reply.id)).toEqual([1, 2, 3]);
    expect(replies.every((reply) => !reply.error)).toBe(true);
    const first = replies[1].run!,
      second = replies[2].run!;
    expect(second.truth.length).toBe(first.count * first.cells);
    expect(second.filtered.length).toBe(first.count * first.cells);
    expect(second.serving.length).toBe(first.count);
    expect([...second.truth.slice(0, 100)]).toEqual([...first.truth.slice(0, 100)]);
    expect(second.handovers).toBe(first.handovers);
  });
});
