import { act, StrictMode } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSimulation } from './useSimulation';

function environment() {
  const document = Object.assign(new EventTarget(), { hidden: false });
  const frames = new Map<number, FrameRequestCallback>();
  const observers = new Set<Observer>();
  let serial = 0;
  class Observer {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {
      observers.add(this);
    }
    observe() {}
    disconnect() {
      observers.delete(this);
    }
    show(visible: boolean) {
      this.callback([{ isIntersecting: visible }]);
    }
    queue(states: boolean[]) {
      this.callback(states.map((isIntersecting) => ({ isIntersecting })));
    }
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  return {
    frames,
    observers,
    show: (visible: boolean) => [...observers].forEach((observer) => observer.show(visible)),
    hideTab: (hidden: boolean) => {
      document.hidden = hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    },
    tick: (now: number) => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
}
function Probe({
  frame,
  running = true,
}: {
  frame: (dt: number, time: number) => void;
  running?: boolean;
}) {
  const host = useSimulation(frame, running);
  return <div ref={host} />;
}
let tree: ReactTestRenderer | undefined;
async function mount(frame: (dt: number, time: number) => void, strict = false) {
  await act(async () => {
    const probe = <Probe frame={frame} />;
    tree = create(strict ? <StrictMode>{probe}</StrictMode> : probe, {
      createNodeMock: () => ({}),
    });
  });
}
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = undefined;
  vi.unstubAllGlobals();
});
describe('scene scheduling while hidden', () => {
  it('schedules only one frame after visibility is known, then cancels all offscreen work', async () => {
    const env = environment(),
      frame = vi.fn();
    await mount(frame);
    expect(env.frames.size).toBe(0);
    env.show(true);
    env.show(true);
    expect(env.frames.size).toBe(1);
    env.tick(1000);
    env.tick(1020);
    expect(frame).toHaveBeenLastCalledWith(0.02, 0.02);
    env.show(false);
    expect(env.frames.size).toBe(0);
    env.tick(10000);
    expect(frame).toHaveBeenCalledTimes(2);
    env.show(true);
    env.tick(12000);
    expect(frame).toHaveBeenLastCalledWith(0, 0.02);
  });
  it('does not resume an offscreen scene when a background tab becomes active', async () => {
    const env = environment(),
      frame = vi.fn();
    await mount(frame);
    env.show(true);
    env.tick(1000);
    env.tick(1020);
    env.hideTab(true);
    expect(env.frames.size).toBe(0);
    env.show(false);
    env.hideTab(false);
    expect(env.frames.size).toBe(0);
    env.show(true);
    env.tick(30000);
    expect(frame).toHaveBeenLastCalledWith(0, 0.02);
  });
  it('keeps current callbacks and cancels the clock when manually paused', async () => {
    const env = environment(),
      first = vi.fn(),
      second = vi.fn();
    await mount(first);
    env.show(true);
    env.tick(1000);
    await act(async () => tree!.update(<Probe frame={second} />));
    env.tick(1020);
    expect(second).toHaveBeenLastCalledWith(0.02, 0.02);
    await act(async () => tree!.update(<Probe frame={second} running={false} />));
    expect(env.frames.size).toBe(0);
    env.show(true);
    env.hideTab(false);
    expect(env.frames.size).toBe(0);
    expect(env.observers.size).toBe(0);
  });
  it('releases observers and ignores a late frame after StrictMode teardown', async () => {
    const env = environment(),
      frame = vi.fn();
    await mount(frame, true);
    expect(env.observers.size).toBe(1);
    env.show(true);
    const late = [...env.frames.values()][0];
    await act(async () => tree!.unmount());
    tree = undefined;
    expect(env.frames.size).toBe(0);
    expect(env.observers.size).toBe(0);
    late(1000);
    env.hideTab(false);
    expect(frame).not.toHaveBeenCalled();
    expect(env.frames.size).toBe(0);
  });
});

describe('queued visibility transitions for one simulation host', () => {
  it('uses the latest in/out event and does not integrate hidden wall time', async () => {
    const env = environment(),
      frame = vi.fn();
    await mount(frame);
    const observer = [...env.observers][0];
    observer.queue([false, true]);
    expect(env.frames.size).toBe(1);
    env.tick(1000);
    env.tick(1020);
    expect(frame).toHaveBeenLastCalledWith(0.02, 0.02);
    observer.queue([true, false]);
    expect(env.frames.size).toBe(0);
    env.tick(20000);
    expect(frame).toHaveBeenCalledTimes(2);
    observer.queue([false, true]);
    env.tick(30000);
    expect(frame).toHaveBeenLastCalledWith(0, 0.02);
    env.tick(30020);
    expect(frame).toHaveBeenLastCalledWith(0.02, 0.04);
  });
  it('does not bypass document hidden state when the latest target entry is visible', async () => {
    const env = environment(),
      frame = vi.fn();
    await mount(frame);
    env.hideTab(true);
    [...env.observers][0].queue([false, true]);
    expect(env.frames.size).toBe(0);
    env.hideTab(false);
    expect(env.frames.size).toBe(1);
    env.tick(30000);
    expect(frame).toHaveBeenLastCalledWith(0, 0);
    [...env.observers][0].queue([]);
    expect(env.frames.size).toBe(1);
  });
});
