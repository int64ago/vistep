import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function worker() {
  const messages: Record<string, any>[] = [];
  const scope = {
    postMessage: (message: Record<string, any>) => messages.push(structuredClone(message)),
    onmessage: null as ((event: MessageEvent) => Promise<void>) | null,
  };
  vi.stubGlobal('self', scope);
  await import('./transformer.worker');
  return {
    messages,
    send: (data: Record<string, unknown>) => scope.onmessage!({ data } as MessageEvent),
    last: () => messages.at(-1)!,
  };
}

describe('manual training lifecycle', () => {
  it('halts weight updates while suspended and finishes exactly the remaining steps on return', async () => {
    vi.useFakeTimers();
    const paused = await worker();
    await paused.send({ type: 'train', steps: 50, rate: 0.015, context: '猫爱吃' });
    await vi.advanceTimersToNextTimerAsync();
    const boundary = structuredClone(paused.last());
    expect(boundary.step).toBeGreaterThan(0);
    expect(boundary.step).toBeLessThan(50);
    await paused.send({ type: 'suspend' });
    expect(vi.getTimerCount()).toBe(0);
    const count = paused.messages.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(paused.messages).toHaveLength(count);
    await paused.send({ type: 'inspect', context: '猫爱吃' });
    expect(paused.last().step).toBe(boundary.step);
    expect(paused.last().weights).toEqual(boundary.weights);

    await paused.send({ type: 'resume' });
    await vi.runAllTimersAsync();
    const result = paused.last();
    expect(result).toMatchObject({ type: 'progress', step: 50, remaining: 0, running: false });
    expect(vi.getTimerCount()).toBe(0);

    // Compare with a fresh uninterrupted execution, rather than recomputing the worker's loop.
    vi.resetModules();
    const continuous = await worker();
    await continuous.send({ type: 'train', steps: 50, rate: 0.015, context: '猫爱吃' });
    await vi.runAllTimersAsync();
    expect(result.weights).toEqual(continuous.last().weights);
    expect(result.probabilities).toEqual(continuous.last().probabilities);
  });

  it('does not start a hidden job, and stop/reset cannot revive a suspended remainder', async () => {
    vi.useFakeTimers();
    const instance = await worker();
    await instance.send({ type: 'suspend' });
    await instance.send({ type: 'train', steps: 50, context: '猫爱吃' });
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(instance.last().step).toBe(0);
    await instance.send({ type: 'resume' });
    await vi.advanceTimersToNextTimerAsync();
    const step = instance.last().step;
    await instance.send({ type: 'suspend' });
    await instance.send({ type: 'stop' });
    await instance.send({ type: 'resume' });
    await vi.runAllTimersAsync();
    expect(instance.last()).toMatchObject({ type: 'stopped', step, running: false });
    await instance.send({ type: 'reset' });
    await instance.send({ type: 'resume' });
    await vi.runAllTimersAsync();
    expect(instance.last()).toMatchObject({ type: 'ready', step: 0, running: false });
  });
});
