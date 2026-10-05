import React, { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Node effect/allocation harness, not browser WebGL or a rendered visual audit.
const runtime = vi.hoisted(() => ({
  env: null as any,
  film: { watch: true, playing: false, time: 0, duration: 144 },
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => runtime.film }));
vi.mock('three', async () => {
  const actual = await vi.importActual<any>('three');
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = runtime.env.surface();
      shadowMap = {};
      dispose = vi.fn();
      constructor() {
        runtime.env.rendererAttempts++;
        if (runtime.env.failure === 'renderer') throw new Error('Renderer allocation failed');
        runtime.env.renderers.push(this);
      }
      setPixelRatio() {}
      setClearColor() {}
      setSize() {}
      render() {}
    },
    PMREMGenerator: class {
      dispose = vi.fn(() => {
        if (runtime.env.failure === 'pmremDispose') throw new Error('PMREM disposal failed');
      });
      constructor() {
        runtime.env.pmremAttempts++;
        if (runtime.env.failure === 'pmrem') throw new Error('PMREM allocation failed');
        runtime.env.generators.push(this);
      }
      fromScene() {
        if (runtime.env.failure === 'fromScene') throw new Error('Environment allocation failed');
        const target = { texture: new actual.Texture(), dispose: vi.fn() };
        runtime.env.environments.push(target);
        return target;
      }
    },
  };
});
vi.mock('three/examples/jsm/environments/RoomEnvironment.js', () => ({
  RoomEnvironment: class {
    dispose = vi.fn(() => {
      if (runtime.env.failure === 'roomDispose') throw new Error('Room disposal failed');
    });
    constructor() {
      runtime.env.roomAttempts++;
      if (runtime.env.failure === 'room') throw new Error('Room allocation failed');
      runtime.env.rooms.push(this);
    }
  },
}));
vi.mock('three/examples/jsm/controls/OrbitControls.js', async () => {
  const actual = await vi.importActual<any>('three');
  return {
    OrbitControls: class extends EventTarget {
      target = new actual.Vector3();
      dispose = vi.fn();
      update() {}
    },
  };
});
import Studio from './Studio';

class Surface extends EventTarget {
  clientWidth = 640;
  clientHeight = 360;
  attached = new Set<Surface>();
  parent: Surface | undefined;
  remove = vi.fn(() => this.parent?.attached.delete(this));
  setAttribute() {}
  appendChild(child: Surface) {
    this.attached.add(child);
    child.parent = this;
  }
}
let tree: ReactTestRenderer | undefined;
let env: any;
beforeEach(() => {
  Object.assign(runtime.film, { watch: true, playing: false, time: 0, duration: 144 });
  env = runtime.env = {
    host: new Surface(),
    doc: Object.assign(new Surface(), { hidden: false }),
    failure: '',
    rendererAttempts: 0,
    pmremAttempts: 0,
    roomAttempts: 0,
    renderers: [],
    generators: [],
    rooms: [],
    environments: [],
    resizes: [],
    intersections: [],
    raf: new Map<number, FrameRequestCallback>(),
    surface: () => new Surface(),
  };
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', env.doc);
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: true }),
    devicePixelRatio: 1,
    innerWidth: 1280,
  });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    env.raf.set(1, cb);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => env.raf.delete(id));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor() {
        env.resizes.push(this);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor() {
        env.intersections.push(this);
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function lesson(time: number, createScene: any) {
  return (
    <Studio
      label="latest frame"
      fallback={<output data-fallback-time={time}>Frame {time}</output>}
      create={createScene}
    />
  );
}
async function mount(createScene: any) {
  await act(() => {
    tree = create(lesson(0, createScene), {
      createNodeMock: (node) =>
        (node.props as { className?: string }).className === 'studio-canvas' ? env.host : null,
    });
  });
}
async function unmount() {
  await act(() => tree!.unmount());
  tree = undefined;
}
function expectFailedSetup(createScene: any) {
  expect(createScene).not.toHaveBeenCalled();
  expect(env.resizes).toHaveLength(0);
  expect(env.intersections).toHaveLength(0);
  expect(env.raf.size).toBe(0);
  expect(env.host.attached.size).toBe(0);
  expect(tree!.root.findByProps({ className: 'studio-canvas' }).props.style.display).toBe('none');
  expect(tree!.root.findByProps({ className: 'studio-canvas' }).props.tabIndex).toBe(-1);
  expect(
    tree!.root.findByProps({ className: 'studio-fallback' }).findByType('output').props[
      'data-fallback-time'
    ],
  ).toBe(0);
}
describe('Studio environment initialization failure', () => {
  it.each(['pmrem', 'room', 'fromScene'])(
    'falls back after %s allocation failure and releases each acquired resource exactly once',
    async (failure) => {
      env.failure = failure;
      const createScene = vi.fn(() => ({}));
      await mount(createScene);
      expectFailedSetup(createScene);
      expect(env.rendererAttempts).toBe(1);
      const renderer = env.renderers[0];
      expect(renderer.dispose).toHaveBeenCalledOnce();
      expect(renderer.domElement.remove).toHaveBeenCalledOnce();
      expect(env.generators).toHaveLength(failure === 'pmrem' ? 0 : 1);
      expect(env.rooms).toHaveLength(failure === 'fromScene' ? 1 : 0);
      for (const temporary of [...env.generators, ...env.rooms])
        expect(temporary.dispose).toHaveBeenCalledOnce();
      expect(env.environments).toHaveLength(0);
      runtime.film.time = 128;
      await act(() => tree!.update(lesson(128, createScene)));
      expect(
        tree!.root.findByProps({ className: 'studio-fallback' }).findByType('output').props[
          'data-fallback-time'
        ],
      ).toBe(128);
      expect(env.rendererAttempts).toBe(1);
      await unmount();
      expect(renderer.dispose).toHaveBeenCalledOnce();
      expect(renderer.domElement.remove).toHaveBeenCalledOnce();
      for (const temporary of [...env.generators, ...env.rooms])
        expect(temporary.dispose).toHaveBeenCalledOnce();
    },
  );
  it.each(['roomDispose', 'pmremDispose'])(
    'releases the completed environment if temporary %s fails, without repeating disposal',
    async (failure) => {
      env.failure = failure;
      const createScene = vi.fn(() => ({}));
      await mount(createScene);
      expectFailedSetup(createScene);
      expect(env.environments).toHaveLength(1);
      for (const resource of [
        ...env.renderers,
        ...env.generators,
        ...env.rooms,
        ...env.environments,
      ])
        expect(resource.dispose).toHaveBeenCalledOnce();
      await unmount();
      for (const resource of [
        ...env.renderers,
        ...env.generators,
        ...env.rooms,
        ...env.environments,
      ])
        expect(resource.dispose).toHaveBeenCalledOnce();
    },
  );
  it('retains the original renderer-constructor failure path and latest fallback state', async () => {
    env.failure = 'renderer';
    const createScene = vi.fn(() => ({}));
    await mount(createScene);
    expectFailedSetup(createScene);
    expect(env.rendererAttempts).toBe(1);
    expect(env.pmremAttempts).toBe(0);
    expect(env.roomAttempts).toBe(0);
    expect(env.renderers).toHaveLength(0);
    await act(() => tree!.update(lesson(144, createScene)));
    expect(tree!.root.findByType('output').props['data-fallback-time']).toBe(144);
    expect(env.rendererAttempts).toBe(1);
  });
  it('keeps successful environment ownership until normal effect cleanup', async () => {
    const sceneDispose = vi.fn(),
      createScene = vi.fn(() => ({ dispose: sceneDispose }));
    await mount(createScene);
    expect(createScene).toHaveBeenCalledOnce();
    expect(tree!.root.findAllByProps({ className: 'studio-fallback' })).toHaveLength(0);
    expect(env.rooms[0].dispose).toHaveBeenCalledOnce();
    expect(env.generators[0].dispose).toHaveBeenCalledOnce();
    expect(env.environments[0].dispose).not.toHaveBeenCalled();
    expect(env.renderers[0].dispose).not.toHaveBeenCalled();
    expect(env.host.attached.size).toBe(1);
    await unmount();
    expect(sceneDispose).toHaveBeenCalledOnce();
    expect(env.rooms[0].dispose).toHaveBeenCalledOnce();
    expect(env.generators[0].dispose).toHaveBeenCalledOnce();
    expect(env.environments[0].dispose).toHaveBeenCalledOnce();
    expect(env.renderers[0].dispose).toHaveBeenCalledOnce();
    expect(env.renderers[0].domElement.remove).toHaveBeenCalledOnce();
    expect(env.host.attached.size).toBe(0);
  });
});
