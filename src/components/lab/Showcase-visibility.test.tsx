import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Showcase, { useShowcase } from './Showcase';

function environment() {
  const doc = Object.assign(new EventTarget(), { hidden: false, documentElement: { lang: 'en' } });
  const observers = new Set<Observer>(),
    frames = new Map<number, FrameRequestCallback>();
  let serial = 0;
  class Observer {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {
      observers.add(this);
    }
    observe() {
      this.queue([true]);
    }
    disconnect() {
      observers.delete(this);
    }
    queue(states: boolean[]) {
      this.callback(states.map((isIntersecting) => ({ isIntersecting })));
    }
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('location', new URL('https://vistep.ai/explore/visibility-probe/'));
  vi.stubGlobal('history', { state: null, replaceState: vi.fn() });
  for (const key of ['localStorage', 'sessionStorage'])
    vi.stubGlobal(key, { getItem: () => 'off', setItem: vi.fn(), removeItem: vi.fn() });
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  return {
    queued: (states: boolean[]) => [...observers].forEach((o) => o.queue(states)),
    hidden: (hidden: boolean) => {
      doc.hidden = hidden;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    tick: (now: number) => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(now));
    },
  };
}
function Probe() {
  const state = useShowcase();
  return <output data-probe data-time={state.time} data-playing={state.playing} />;
}
let tree: ReactTestRenderer | undefined;
async function mount() {
  await act(() => {
    tree = create(
      <Showcase
        slug="visibility-probe"
        film={{
          duration: 100,
          chapters: [
            {
              id: 'one',
              at: 0,
              title: '一',
              titleEn: 'One',
              caption: '固定画面',
              captionEn: 'A fixed scene',
            },
          ],
        }}
      >
        <Probe />
      </Showcase>,
      { createNodeMock: () => ({}) },
    );
  });
}
const probe = () => tree!.root.findByProps({ 'data-probe': true }).props;
afterEach(async () => {
  await act(() => tree?.unmount());
  tree = undefined;
  vi.unstubAllGlobals();
});

describe('actual Showcase latest queued host visibility', () => {
  it('keeps the latest visible entry instead of a stale offscreen record', async () => {
    const env = environment();
    await mount();
    await act(() => env.queued([false, true]));
    expect(probe()['data-playing']).toBe(true);
    await act(() => {
      env.tick(1000);
      env.tick(1040);
    });
    expect(probe()['data-time']).toBeCloseTo(0.04);
  });
  it('still pauses when the final entry is offscreen and resumes without a hidden-time jump', async () => {
    const env = environment();
    await mount();
    await act(() => {
      env.tick(1000);
      env.tick(1040);
    });
    const before = probe()['data-time'];
    await act(() => env.queued([true, false]));
    expect(probe()['data-playing']).toBe(false);
    await act(() => env.tick(20000));
    expect(probe()['data-time']).toBe(before);
    await act(() => env.queued([false, true]));
    await act(() => env.tick(30000));
    expect(probe()['data-time']).toBe(before);
    await act(() => env.tick(30040));
    expect(probe()['data-time']).toBeCloseTo(before + 0.04);
  });
  it('respects document.hidden even when the latest queued host entry is visible', async () => {
    const env = environment();
    await mount();
    await act(() => {
      env.hidden(true);
      env.queued([false, true]);
    });
    expect(probe()['data-playing']).toBe(false);
    await act(() => env.tick(1000));
    expect(probe()['data-time']).toBe(0);
    await act(() => env.hidden(false));
    expect(probe()['data-playing']).toBe(true);
  });
});
