import React, { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import Showcase, { useShowcase } from './Showcase';
import { films } from '../../data/films';
import CpuGpuNpu from '../experiments/CpuGpuNpu';
import Esim from '../experiments/Esim';
import MyopiaLens from '../experiments/MyopiaLens';
import SlrMirrorless from '../experiments/SlrMirrorless';
import InstantCamera from '../experiments/InstantCamera';
import Jellyfish from '../experiments/Jellyfish';

// Actual Showcase, topic components, models, Studio effects and OrbitControls run.
// Only GPU allocation and narration are doubled. Existing Showcase-language and
// narration-source tests cover the real narration hook and its media clock.
// This is Node event/RAF evidence, not browser rendering or visual acceptance.
const runtime = vi.hoisted(() => ({ env: null as any }));
vi.mock('./useNarration', () => ({
  useNarration: () => ({
    enabled: false,
    waiting: false,
    error: false,
    blocked: false,
    enable() {},
    disable() {},
    seek() {},
    currentTime: () => 0,
  }),
}));
vi.mock('three', async () => ({
  ...(await vi.importActual('three')),
  WebGLRenderer: class {
    domElement = runtime.env.surface();
    shadowMap = {};
    disposed = false;
    scene: THREE.Scene | undefined;
    camera: THREE.Camera | undefined;
    constructor() {
      runtime.env.attempts++;
      if (runtime.env.failRenderer) throw new Error('Runtime WebGL allocation failed');
      runtime.env.renderers.push(this);
    }
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
    render(scene: THREE.Scene, camera: THREE.Camera) {
      this.scene = scene;
      this.camera = camera;
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
    }
    dispose() {
      this.disposed = true;
    }
  },
  PMREMGenerator: class {
    fromScene() {
      if (runtime.env.failEnvironment) throw new Error('Runtime environment allocation failed');
      return { texture: null, dispose() {} };
    }
    dispose() {}
  },
}));

class Surface extends EventTarget {
  style = { touchAction: '' };
  clientWidth = 850;
  clientHeight = 390;
  ownerDocument: any;
  listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  addEventListener(type: string, listener: any, options?: any) {
    super.addEventListener(type, listener, options);
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: any, options?: any) {
    super.removeEventListener(type, listener, options);
    this.listeners.get(type)?.delete(listener);
  }
  getRootNode() {
    return this.ownerDocument ?? this;
  }
  setPointerCapture() {}
  releasePointerCapture() {}
  setAttribute() {}
  appendChild() {}
  remove() {}
  getBoundingClientRect() {
    return { x: 0, y: 0, left: 0, top: 0, width: 850, height: 390 };
  }
}
let tree: ReactTestRenderer | undefined;
let env: any;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const doc = Object.assign(new Surface(), {
    hidden: false,
    documentElement: { lang: 'zh-CN' },
  });
  const motion = Object.assign(new Surface(), { matches: false });
  const compact = Object.assign(new Surface(), { matches: false });
  env = runtime.env = {
    doc,
    motion,
    compact,
    window: new Surface(),
    frames: new Map<number, FrameRequestCallback>(),
    serial: 0,
    now: 1000,
    visible: true,
    failRenderer: true,
    failEnvironment: false,
    attempts: 0,
    renderers: [],
    intersections: new Set<any>(),
    resizes: new Set<any>(),
    surface() {
      return Object.assign(new Surface(), { ownerDocument: doc });
    },
  };
  const media = (query: string) => (query.includes('reduced-motion') ? motion : compact);
  Object.assign(env.window, { matchMedia: media, devicePixelRatio: 1, innerWidth: 1280 });
  vi.stubGlobal('window', env.window);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('matchMedia', media);
  vi.stubGlobal('location', new URL('https://vistep.ai/explore/test/'));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++env.serial;
    env.frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => env.frames.delete(id));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(public callback: any) {
        env.intersections.add(this);
      }
      observe() {
        this.callback([{ isIntersecting: env.visible }]);
      }
      disconnect() {
        env.intersections.delete(this);
      }
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(public callback: any) {
        env.resizes.add(this);
      }
      observe() {
        this.callback([{ contentRect: { width: 850 } }]);
      }
      disconnect() {
        env.resizes.delete(this);
      }
    },
  );
});
afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  expect(env.frames.size).toBe(0);
  expect(env.intersections.size).toBe(0);
  expect(env.resizes.size).toBe(0);
  for (const surface of [env.doc, env.window, env.motion, env.compact])
    expect([...surface.listeners.values()].every((set: Set<any>) => set.size === 0)).toBe(true);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function Probe() {
  const film = useShowcase();
  return (
    <output data-film-probe data-time={film.time} data-playing={film.playing} data-run={film.run} />
  );
}
const scenes = [
  { slug: 'cpu-gpu-npu', Scene: CpuGpuNpu },
  { slug: 'esim', Scene: Esim },
  { slug: 'myopia-lens', Scene: MyopiaLens },
  { slug: 'slr-mirrorless', Scene: SlrMirrorless },
  { slug: 'instant-camera', Scene: InstantCamera },
  { slug: 'jellyfish', Scene: Jellyfish },
];
async function mount(slug: string, Scene: React.ComponentType) {
  await act(() => {
    tree = create(
      <Showcase slug={slug}>
        <Scene />
        <Probe />
      </Showcase>,
      { createNodeMock: (node) => (node.type === 'canvas' ? null : env.surface()) },
    );
  });
}
const probe = () => {
  const props = tree!.root.findByProps({ 'data-film-probe': true }).props;
  return { time: props['data-time'], playing: props['data-playing'], run: props['data-run'] };
};
const button = (kind: string) => tree!.root.findByProps({ className: `film-${kind}` });
async function seek(time: number) {
  await act(() =>
    tree!.root
      .findByProps({ 'aria-label': '自动演示进度' })
      .props.onChange({ target: { value: String(time) } }),
  );
}
async function tick(ms: number) {
  env.now += ms;
  await act(() => {
    const pending = [...env.frames.values()] as FrameRequestCallback[];
    env.frames.clear();
    pending.forEach((callback) => callback(env.now));
  });
}
async function visibility(visible: boolean) {
  env.visible = visible;
  await act(() => {
    [...env.intersections].forEach((observer: any) =>
      observer.callback([{ isIntersecting: visible }]),
    );
  });
}
const snapshot = () => JSON.stringify(tree!.toJSON()).replace(/_r_[a-z0-9]+_/g, 'stable-id');
function renderedObservation(renderer: any) {
  const round = (value: number) => Number(value.toFixed(8));
  const objects: any[] = [];
  renderer.scene.traverse((object: THREE.Object3D) => {
    const node: any = {
      type: object.type,
      visible: object.visible,
      transform: object.matrixWorld.elements.map(round),
    };
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points
    ) {
      node.vertices = Array.from(object.geometry.getAttribute('position').array);
      node.materials = (Array.isArray(object.material) ? object.material : [object.material]).map(
        (material) => ({
          opacity: material.opacity,
          color: 'color' in material ? (material.color as THREE.Color).toArray() : undefined,
          pixels:
            'map' in material && material.map instanceof THREE.DataTexture
              ? Array.from(material.map.image.data)
              : undefined,
        }),
      );
    }
    objects.push(node);
  });
  return JSON.stringify({ objects, camera: renderer.camera.matrixWorld.elements.map(round) });
}
const threeScenes = scenes.filter(({ slug }) =>
  ['slr-mirrorless', 'instant-camera', 'jellyfish'].includes(slug),
);

describe('six actual scenes use the shared film transport, including runtime fallbacks', () => {
  it.each(scenes)(
    '$slug pauses, reconstructs every chapter, stops at the end and replays',
    async ({ slug, Scene }) => {
      await mount(slug, Scene);
      await tick(20);
      await tick(40);
      if (['slr-mirrorless', 'instant-camera', 'jellyfish'].includes(slug))
        expect(
          tree!.root.findByProps({ className: 'studio-fallback' }).findAllByType('svg').length,
        ).toBeGreaterThan(0);
      expect(probe().time).toBeGreaterThan(0);
      await act(() => button('play').props.onClick());
      const paused = snapshot();
      const pausedTime = probe().time;
      await tick(1000);
      expect(probe().time).toBe(pausedTime);
      expect(snapshot()).toBe(paused);

      const film = films[slug];
      for (let chapter = film.chapters.length - 1; chapter >= 0; chapter--) {
        const start = film.chapters[chapter].at;
        const end = film.chapters[chapter + 1]?.at ?? film.duration;
        const target = (start + end) / 2;
        await seek(target);
        expect(tree!.root.findByProps({ 'data-slug': slug }).props['data-chapter']).toBe(chapter);
        expect(probe().playing).toBe(false);
        const observed = snapshot();
        expect(observed).not.toMatch(/NaN|Infinity/);
        await seek(0);
        await seek(target);
        expect(snapshot()).toBe(observed);
      }

      // Walk the complete silent film through the actual shared RAF clock.
      // The 40 ms cap is the player's own public scheduling boundary.
      await seek(0);
      await act(() => button('play').props.onClick());
      await tick(40);
      const visited = new Set<number>();
      for (let frame = 0; frame <= Math.ceil(film.duration / 0.04) + 1; frame++) {
        await tick(40);
        visited.add(tree!.root.findByProps({ 'data-slug': slug }).props['data-chapter']);
      }
      expect(visited.size).toBe(film.chapters.length);
      expect(probe().time).toBe(film.duration);
      expect(probe().playing).toBe(false);
      expect(button('play').props['aria-label']).toBe('重播演示');
      const completed = snapshot();
      await tick(1000);
      expect(snapshot()).toBe(completed);
      await act(() => button('replay').props.onClick());
      expect(probe().time).toBe(0);
      expect(probe().run).toBe(1);
      expect(probe().playing).toBe(true);
      expect(tree!.root.findByProps({ 'data-slug': slug }).props['data-chapter']).toBe(0);

      await tick(20);
      await tick(40);
      const beforeHide = probe().time;
      await visibility(false);
      expect(env.frames.size).toBe(0);
      await tick(10000);
      expect(probe().time).toBe(beforeHide);
      await visibility(true);
      await tick(10000);
      expect(probe().time).toBe(beforeHide);
      await tick(40);
      expect(probe().time).toBeGreaterThan(beforeHide);
      const beforeBackground = probe().time;
      await act(() => {
        env.doc.hidden = true;
        env.doc.dispatchEvent(new Event('visibilitychange'));
      });
      expect(env.frames.size).toBe(0);
      await tick(10000);
      expect(probe().time).toBe(beforeBackground);
      await visibility(false);
      await act(() => {
        env.doc.hidden = false;
        env.doc.dispatchEvent(new Event('visibilitychange'));
      });
      expect(env.frames.size).toBe(0);
      await visibility(true);
      await tick(10000);
      expect(probe().time).toBe(beforeBackground);
      await act(() => {
        env.motion.matches = true;
        env.motion.dispatchEvent(new Event('change'));
      });
      expect(probe().playing).toBe(false);
      const reduced = probe().time;
      await tick(1000);
      expect(probe().time).toBe(reduced);
    },
    30_000,
  );

  it('falls back and releases the renderer when environment allocation fails after WebGL was created', async () => {
    env.failRenderer = false;
    env.failEnvironment = true;
    env.motion.matches = true;
    await mount('slr-mirrorless', SlrMirrorless);
    expect(
      tree!.root.findByProps({ className: 'studio-fallback' }).findAllByType('svg').length,
    ).toBeGreaterThan(0);
    expect(env.renderers).toHaveLength(1);
    expect(env.renderers[0].disposed).toBe(true);
    await seek(films['slr-mirrorless'].duration);
    expect(probe().time).toBe(films['slr-mirrorless'].duration);
    expect(probe().playing).toBe(false);
  });

  it.each(threeScenes)(
    '$slug settles its actual geometry, texture and camera on a paused forward/reverse seek',
    async ({ slug, Scene }) => {
      env.failRenderer = false;
      env.motion.matches = true;
      await mount(slug, Scene);
      await tick(300);
      const film = films[slug],
        chapter = slug === 'slr-mirrorless' ? 2 : slug === 'instant-camera' ? 1 : 4,
        target =
          (film.chapters[chapter].at + (film.chapters[chapter + 1]?.at ?? film.duration)) / 2;
      await seek(target);
      await tick(20);
      const observed = renderedObservation(env.renderers.at(-1));
      expect(observed).not.toMatch(/NaN|Infinity/);
      await tick(1000);
      expect(renderedObservation(env.renderers.at(-1))).toBe(observed);
      await seek(film.duration);
      await tick(20);
      await seek(0);
      await tick(20);
      await seek(target);
      await tick(20);
      expect(renderedObservation(env.renderers.at(-1))).toBe(observed);
      expect(probe().playing).toBe(false);
    },
  );

  it.each(threeScenes)(
    '$slug keeps the latest paused observation after real context loss and disposes its resources',
    async ({ slug, Scene }) => {
      env.failRenderer = false;
      env.motion.matches = true;
      await mount(slug, Scene);
      await tick(300);
      const renderer = env.renderers.at(-1);
      expect(renderer.scene).toBeInstanceOf(THREE.Scene);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      renderer.scene.traverse((object: THREE.Object3D) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Points
        ) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            materials.add(material);
            if ('map' in material && material.map instanceof THREE.Texture)
              textures.add(material.map);
          }
        }
      });
      const disposeSpies = [...geometries, ...materials, ...textures].map((resource) =>
        vi.spyOn(resource, 'dispose'),
      );
      await act(() => button('play').props.onClick());
      const lost = new Event('webglcontextlost', { cancelable: true });
      await act(() => renderer.domElement.dispatchEvent(lost));
      expect(lost.defaultPrevented).toBe(true);
      expect(renderer.disposed).toBe(true);
      disposeSpies.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
      const fallback = () => tree!.root.findByProps({ className: 'studio-fallback' });
      expect(fallback().findAllByType('svg').length).toBeGreaterThan(0);
      expect(probe().playing).toBe(true);
      await tick(20);
      await tick(40);
      expect(probe().time).toBeGreaterThan(0);
      const fallbackObservation = () =>
        JSON.stringify(
          fallback()
            .findAll((node) => typeof node.type === 'string')
            .map((node) => {
              const { children: _children, ref: _ref, ...props } = node.props;
              return { type: node.type, props };
            }),
        ).replace(/_r_[a-z0-9]+_/g, 'stable-id');
      const initial = fallbackObservation();
      const chapter = slug === 'slr-mirrorless' ? 6 : slug === 'instant-camera' ? 1 : 4;
      const film = films[slug];
      const target =
        (film.chapters[chapter].at + (film.chapters[chapter + 1]?.at ?? film.duration)) / 2;
      await seek(target);
      expect(probe().time).toBe(target);
      expect(probe().playing).toBe(false);
      expect(fallback().findAllByType('svg').length).toBeGreaterThan(0);
      expect(fallbackObservation()).not.toBe(initial);
      const held = snapshot();
      await tick(1000);
      expect(snapshot()).toBe(held);
      expect(env.renderers).toHaveLength(1);
    },
  );
});
