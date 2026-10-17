import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SpatialCanvas from './SpatialCanvas';
import { FilmContext, type Director } from './FilmContext';

const runtime = vi.hoisted(() => ({ env: null as any }));
vi.mock('three', async () => ({
  ...(await vi.importActual<any>('three')),
  WebGLRenderer: class {
    domElement = runtime.env.surface();
    render = vi.fn();
    dispose = vi.fn();
    constructor() {
      runtime.env.renderers.push(this);
    }
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
  },
}));
function environment() {
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { lang: 'zh-CN' },
  });
  const frames = new Map<number, FrameRequestCallback>();
  const observers = new Set<any>();
  const motion = Object.assign(new EventTarget(), { matches: false });
  const renderers: any[] = [];
  let serial = 0;
  const surface = () =>
    Object.assign(new EventTarget(), {
      clientWidth: 600,
      clientHeight: 380,
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      remove: vi.fn(),
      setPointerCapture: vi.fn(),
    });
  const host = surface();
  class Observer {
    constructor(public callback: (entries: { isIntersecting: boolean }[]) => void) {
      observers.add(this);
    }
    observe() {}
    disconnect() {
      observers.delete(this);
    }
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', { matchMedia: () => motion });
  vi.stubGlobal('devicePixelRatio', 1);
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.set(++serial, cb);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const env = {
    host,
    surface,
    renderers,
    frames,
    show: (visible: boolean) =>
      [...observers].forEach((o) => o.callback([{ isIntersecting: visible }])),
    background: (hidden: boolean) => {
      doc.hidden = hidden;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    tick: (time: number) => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((cb) => cb(time));
    },
  };
  runtime.env = env;
  return env;
}
const director: Director = {
  watch: true,
  playing: false,
  time: 10,
  chapter: 0,
  run: 0,
  duration: 120,
  chapters: [],
  chapterTime: 10,
  chapterProgress: 0.1,
};
let tree: ReactTestRenderer | undefined;
afterEach(async () => {
  await act(() => tree?.unmount());
  tree = undefined;
  vi.unstubAllGlobals();
});

describe('SpatialCanvas demand drawing (controlled GPU and browser events)', () => {
  it('redraws paused seeks and inputs, cancels offscreen/background work, and releases the renderer', async () => {
    const env = environment();
    const build = vi.fn();
    const first = vi.fn(),
      second = vi.fn();
    const view = (frame = first, time = 10) => (
      <FilmContext.Provider value={{ ...director, time }}>
        <SpatialCanvas build={build} frame={frame} fallback={<p>2D</p>} label="shape" />
      </FilmContext.Provider>
    );
    await act(() => {
      tree = create(view(), { createNodeMock: () => env.host });
    });
    expect(env.frames.size).toBe(0);
    await act(() => env.show(true));
    await act(() => env.tick(100));
    expect(first).toHaveBeenCalledOnce();
    expect(env.frames.size).toBe(0);
    await act(() => tree!.update(view(second, 80)));
    expect(env.frames.size).toBe(1);
    await act(() => env.tick(140));
    expect(second).toHaveBeenCalledOnce();
    expect(env.frames.size).toBe(0);
    await act(() => env.show(false));
    await act(() => tree!.update(view(second, 90)));
    expect(env.frames.size).toBe(0);
    await act(() => env.show(true));
    expect(env.frames.size).toBe(1);
    await act(() => env.background(true));
    expect(env.frames.size).toBe(0);
    await act(() => env.background(false));
    expect(env.frames.size).toBe(1);
    const renderer = env.renderers[0];
    await act(() => tree!.unmount());
    tree = undefined;
    expect(env.frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });
  it('schedules exploration only while the keyboard camera is settling', async () => {
    const env = environment();
    const frame = vi.fn();
    await act(() => {
      tree = create(
        <FilmContext.Provider value={{ ...director, watch: false }}>
          <SpatialCanvas build={() => {}} frame={frame} fallback={<p>2D</p>} label="shape" />
        </FilmContext.Provider>,
        { createNodeMock: () => env.host },
      );
    });
    await act(() => env.show(true));
    await act(() => env.tick(100));
    expect(env.frames.size).toBe(0);
    const key = new Event('keydown', { cancelable: true });
    Object.assign(key, { key: 'ArrowLeft' });
    await act(() => env.host.dispatchEvent(key));
    expect(key.defaultPrevented).toBe(true);
    expect(env.frames.size).toBe(1);
    for (let n = 1; n <= 60 && env.frames.size; n++) await act(() => env.tick(100 + n * 20));
    expect(env.frames.size).toBe(0);
    expect(frame.mock.calls.length).toBeGreaterThan(2);
  });
});
