import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import React, { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import type { StudioContext } from './Studio';

// This is a Node event/RAF harness, not a DOM, browser, WebGL or visual review.
const live = vi.hoisted(() => ({
  film: {
    watch: false,
    playing: false,
    time: 35,
    duration: 192,
    chapter: 1,
    chapterProgress: 0.47,
  },
  env: null as any,
  contexts: [] as any[],
}));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => live.film }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
vi.mock('three', async () => ({
  ...(await vi.importActual('three')),
  WebGLRenderer: class {
    domElement = live.env.surface();
    shadowMap = {};
    frames: any[] = [];
    disposed = false;
    constructor() {
      live.env.rendererAttempts++;
      if (live.env.failRenderer) throw new Error('Runtime WebGL context creation failed');
      live.env.renderers.push(this);
    }
    setPixelRatio() {}
    setClearColor() {}
    setSize(w: number, h: number) {
      this.domElement.clientWidth = w;
      this.domElement.clientHeight = h;
    }
    render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
      camera.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);
      const ctx = live.contexts.at(-1);
      this.frames.push({
        position: camera.position.clone(),
        target: ctx.controls.target.clone(),
        quaternion: camera.quaternion.clone(),
        watch: live.film.watch,
        time: live.film.time,
        aspect: camera.aspect,
      });
    }
    dispose() {
      this.disposed = true;
    }
  },
  PMREMGenerator: class {
    fromScene() {
      return { texture: null, dispose() {} };
    }
    dispose() {}
  },
}));
// Instrument the create callback only. The unmodified (or proposed) Studio component,
// effect, private key tween, resize, tick, cleanup and real OrbitControls all execute.
vi.mock('./Studio', async () => {
  const actual: any = await vi.importActual('./Studio');
  const R: any = await vi.importActual('react');
  return {
    ...actual,
    default: (props: any) =>
      R.createElement(actual.default, {
        ...props,
        create: (context: any) => {
          live.contexts.push(context);
          return props.create(context);
        },
      }),
  };
});
import Studio from './Studio';
import Differential from './DifferentialStudio';
import Planetary from './PlanetaryStudio';
import Bearing from './BallBearingStudio';
import { differentialShot } from '../../models/differential';
import { planetaryShot } from '../../models/planetary';
import { bearingShot, bearingState } from '../../models/ball-bearing';

class Surface extends EventTarget {
  style = { touchAction: '' };
  clientWidth = 1150;
  clientHeight = 440;
  ownerDocument: any;
  listeners = new Map<string, Set<any>>();
  captured = new Set<number>();
  addEventListener(type: string, fn: any, options?: any) {
    super.addEventListener(type, fn, options);
    const list = this.listeners.get(type) ?? new Set();
    list.add(fn);
    this.listeners.set(type, list);
  }
  removeEventListener(type: string, fn: any, options?: any) {
    super.removeEventListener(type, fn, options);
    this.listeners.get(type)?.delete(fn);
  }
  getRootNode() {
    return this.ownerDocument ?? this;
  }
  setPointerCapture(id: number) {
    this.captured.add(id);
  }
  releasePointerCapture(id: number) {
    this.captured.delete(id);
  }
  setAttribute() {}
  appendChild() {}
  remove() {}
  getBoundingClientRect() {
    return { x: 0, y: 0, left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
  }
}
let tree: ReactTestRenderer | undefined;
let env: any;
const summaries: any[] = [];
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  live.contexts = [];
  Object.assign(live.film, {
    watch: false,
    playing: false,
    time: 35,
    duration: 192,
    chapter: 1,
    chapterProgress: 0.47,
  });
  const doc = Object.assign(new Surface(), { hidden: false });
  env = live.env = {
    doc,
    raf: new Map<number, FrameRequestCallback>(),
    seq: 0,
    now: 1000,
    renderers: [],
    rendererAttempts: 0,
    failRenderer: false,
    resize: [],
    intersection: [],
    media: { matches: false },
    surface() {
      const s = new Surface();
      s.ownerDocument = doc;
      return s;
    },
  };
  env.host = env.surface();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', { matchMedia: () => env.media, devicePixelRatio: 1, innerWidth: 1280 });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    const id = ++env.seq;
    env.raf.set(id, fn);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => env.raf.delete(id));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      active = true;
      constructor(public cb: any) {
        env.resize.push(this);
      }
      observe() {}
      disconnect() {
        this.active = false;
      }
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      active = true;
      constructor(public cb: any) {
        env.intersection.push(this);
      }
      observe() {}
      disconnect() {
        this.active = false;
      }
    },
  );
});
afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function mount(element: React.ReactElement, size: [number, number] = [1150, 440]) {
  [env.host.clientWidth, env.host.clientHeight] = size;
  await act(() => {
    tree = create(element, {
      createNodeMock: (e) =>
        (e.props as { className?: string }).className === 'studio-canvas' ? env.host : null,
    });
  });
  frame(300);
  return { ctx: live.contexts.at(-1) as StudioContext, renderer: env.renderers.at(-1) };
}
function frame(ms = 300) {
  env.now += ms;
  const callbacks = [...env.raf.values()];
  env.raf.clear();
  callbacks.forEach((fn) => fn(env.now));
}
function resize(w: number, h: number) {
  env.host.clientWidth = w;
  env.host.clientHeight = h;
  env.resize.filter((o: any) => o.active).forEach((o: any) => o.cb([]));
}
function pointer(type: string, x = 100, y = 100) {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  });
  env.renderers.at(-1).domElement.dispatchEvent(e);
}
function drag(cancel = false, held = false) {
  pointer('pointerdown');
  pointer('pointermove', 270, 135);
  if (!held) pointer(cancel ? 'pointercancel' : 'pointerup', 270, 135);
}
function key(key = 'ArrowRight') {
  const e = new Event('keydown', { cancelable: true });
  Object.assign(e, { key });
  env.host.dispatchEvent(e);
  expect(e.defaultPrevented).toBe(true);
}
function direction(ctx: StudioContext) {
  return ctx.camera.position.clone().sub(ctx.controls.target).normalize();
}
function assertFrame(actual: any, expected: any) {
  expect(actual.position.distanceTo(expected.position)).toBeLessThan(1e-10);
  expect(actual.target.distanceTo(expected.target)).toBeLessThan(1e-10);
  expect(1 - Math.abs(actual.quaternion.dot(expected.quaternion))).toBeLessThan(1e-12);
}
function aimed(frame: any) {
  const look = new THREE.Vector3(0, 0, -1).applyQuaternion(frame.quaternion);
  expect(look.distanceTo(frame.target.clone().sub(frame.position).normalize())).toBeLessThan(1e-12);
}
function director(settles: boolean[], stationary = false) {
  return (ctx: StudioContext) => ({
    update(_dt: number, _elapsed: number, settle: boolean) {
      settles.push(settle);
      if (!live.film.watch || stationary) return;
      const target = new THREE.Vector3(0.4, 1.3, -0.2);
      const position = new THREE.Vector3(4 + live.film.time / 100, 3, 11);
      if (settle) {
        ctx.controls.target.copy(target);
        ctx.camera.position.copy(position);
      } else {
        ctx.controls.target.lerp(target, 0.05);
        ctx.camera.position.lerp(position, 0.05);
      }
    },
  });
}
function simple(settles: boolean[] = [], stationary = false) {
  return <Studio label="test" fallback={<p>section</p>} create={director(settles, stationary)} />;
}

it('settles same-time mode entry before the first render and drains real residual drag', async () => {
  const settles: boolean[] = [],
    v = await mount(simple(settles));
  drag();
  const before = v.renderer.frames.length;
  live.film.watch = true;
  frame(17);
  expect(v.renderer.frames).toHaveLength(before + 1);
  expect(settles.at(-1)).toBe(true);
  const first = v.renderer.frames.at(-1);
  expect(first.position.distanceTo(new THREE.Vector3(4.35, 3, 11))).toBeLessThan(1e-12);
  aimed(first);
  for (let i = 0; i < 12; i++) {
    frame();
    assertFrame(v.renderer.frames.at(-1), first);
  }
});

it('cancels a real host arrow-key tween before the same-time paused watch director', async () => {
  const settles: boolean[] = [],
    v = await mount(simple(settles));
  key();
  frame(20);
  key('ArrowUp');
  frame(20);
  live.film.watch = true;
  frame(17);
  expect(settles.at(-1)).toBe(true);
  const first = v.renderer.frames.at(-1);
  expect(first.position.distanceTo(new THREE.Vector3(4.35, 3, 11))).toBeLessThan(1e-12);
  aimed(first);
  for (let i = 0; i < 12; i++) {
    frame();
    assertFrame(v.renderer.frames.at(-1), first);
  }
  live.film.watch = false;
  frame();
  assertFrame(v.renderer.frames.at(-1), first);
});

it('keeps a camera without a topic director unchanged while publicly draining damping', async () => {
  const v = await mount(simple([], true));
  drag();
  const position = v.ctx.camera.position.clone();
  live.film.watch = true;
  frame();
  expect(v.ctx.camera.position.distanceTo(position)).toBeLessThan(1e-12);
  const first = v.renderer.frames.at(-1);
  frame();
  assertFrame(v.renderer.frames.at(-1), first);
  aimed(first);
});

it.each([false, true])(
  'retains smooth explore input and handles held-drag cancellation (reduced=%s)',
  async (reduced) => {
    env.media.matches = reduced;
    const v = await mount(simple());
    drag(false, true);
    const dragPosition = v.ctx.camera.position.clone();
    frame(20);
    if (!reduced) expect(v.ctx.camera.position.distanceTo(dragPosition)).toBeGreaterThan(0.01);
    live.film.watch = true;
    frame();
    const first = v.renderer.frames.at(-1);
    pointer('pointermove', 450, 200);
    pointer('pointercancel', 450, 200);
    frame();
    assertFrame(v.renderer.frames.at(-1), first);
    live.film.watch = false;
    frame();
    expect(v.ctx.controls.enableDamping).toBe(!reduced);
    const before = direction(v.ctx);
    drag(true);
    frame(20);
    expect(direction(v.ctx).distanceTo(before)).toBeGreaterThan(0.01);
    key();
    frame(20);
    const early = direction(v.ctx);
    frame(400);
    if (!reduced) expect(direction(v.ctx).distanceTo(early)).toBeGreaterThan(0.001);
    live.film.watch = true;
    frame();
    const clean = v.renderer.frames.at(-1);
    frame();
    assertFrame(v.renderer.frames.at(-1), clean);
  },
);

it('preserves exploration direction through resize, and watch targets through resize and reverse seek', async () => {
  const v = await mount(simple());
  drag();
  v.ctx.controls.enableDamping = false;
  v.ctx.controls.update();
  const before = direction(v.ctx);
  resize(278, 260);
  expect(direction(v.ctx).distanceTo(before)).toBeLessThan(1e-12);
  frame();
  live.film.watch = true;
  frame();
  for (const t of [100, 12, 35, 120, 35]) {
    live.film.time = t;
    frame(17);
    const f = v.renderer.frames.at(-1);
    expect(f.position.distanceTo(new THREE.Vector3(4 + t / 100, 3, 11))).toBeLessThan(1e-12);
    aimed(f);
  }
  resize(1150, 440);
  frame();
  const first = v.renderer.frames.at(-1);
  frame();
  assertFrame(v.renderer.frames.at(-1), first);
});

it('waits offscreen/background without consuming mode entry, then cancels pending key motion on return', async () => {
  const settles: boolean[] = [],
    v = await mount(simple(settles));
  key();
  frame(20);
  env.doc.hidden = true;
  live.film.watch = true;
  const n = v.renderer.frames.length;
  frame(500);
  expect(v.renderer.frames).toHaveLength(n);
  env.doc.hidden = false;
  frame(17);
  expect(settles.at(-1)).toBe(true);
  const first = v.renderer.frames.at(-1);
  expect(first.position.distanceTo(new THREE.Vector3(4.35, 3, 11))).toBeLessThan(1e-12);
  env.intersection[0].cb([{ isIntersecting: false }]);
  live.film.time = 82;
  frame(500);
  expect(v.renderer.frames).toHaveLength(n + 1);
  env.intersection[0].cb([{ isIntersecting: true }]);
  frame(17);
  expect(v.renderer.frames.at(-1).position.distanceTo(new THREE.Vector3(4.82, 3, 11))).toBeLessThan(
    1e-12,
  );
});

it('keeps real control listeners/RAF lifecycle balanced across fallback recreation and disposal', async () => {
  const v = await mount(simple());
  key();
  drag(false, true);
  const dispose = vi.spyOn(v.ctx.controls, 'dispose');
  await act(() => tree!.root.findByType('button').props.onClick());
  expect(dispose).toHaveBeenCalledOnce();
  expect(v.renderer.disposed).toBe(true);
  expect(env.raf.size).toBe(0);
  expect(env.host.listeners.get('keydown')?.size).toBe(0);
  expect(v.renderer.domElement.listeners.get('pointerdown')?.size).toBe(0);
  await act(() => tree!.root.findByType('button').props.onClick());
  frame();
  const newRenderer = env.renderers.at(-1);
  expect(newRenderer).not.toBe(v.renderer);
  expect(live.contexts.at(-1).controls).toBeInstanceOf(OrbitControls);
  await act(() => tree!.unmount());
  tree = undefined;
  expect(env.raf.size).toBe(0);
  expect(newRenderer.disposed).toBe(true);
});

it('shows the runtime fallback if renderer construction fails after the caller has admitted Studio', async () => {
  // Studio is actually mounted, as it is after a successful capability gate.
  // Fail its renderer constructor, rather than bypassing Studio at the gate or
  // selecting the reader's optional 2D mode.
  env.failRenderer = true;
  const createScene = vi.fn(director([]));
  await mount(<Studio label="runtime failure" fallback={<p>section</p>} create={createScene} />);
  expect(env.rendererAttempts).toBe(1);
  expect(createScene).not.toHaveBeenCalled();
  expect(live.contexts).toHaveLength(0);
  expect(env.renderers).toHaveLength(0);
  expect(env.raf.size).toBe(0);
  expect(env.resize).toHaveLength(0);
  expect(env.intersection).toHaveLength(0);
  expect(tree!.root.findByProps({ className: 'studio-fallback' }).findByType('p').children).toEqual(
    ['section'],
  );
  const canvasHost = tree!.root.findByProps({ className: 'studio-canvas' });
  expect(canvasHost.props.style.display).toBe('none');
  expect(canvasHost.props.tabIndex).toBe(-1);
  expect(tree!.root.findAllByProps({ className: 'btn studio-mode' })).toHaveLength(0);
  frame(1000);
  expect(env.rendererAttempts).toBe(1);
  expect(env.raf.size).toBe(0);
});

it('handles a real canvas context-lost event by showing fallback and disposing the active scene', async () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1),
    material = new THREE.MeshBasicMaterial(),
    geometryDispose = vi.spyOn(geometry, 'dispose'),
    materialDispose = vi.spyOn(material, 'dispose'),
    sceneDispose = vi.fn(),
    sceneUpdate = vi.fn();
  const v = await mount(
    <Studio
      label="context loss"
      fallback={<p>section</p>}
      create={({ root }) => {
        root.add(new THREE.Mesh(geometry, material));
        return { update: sceneUpdate, dispose: sceneDispose };
      }}
    />,
  );
  key();
  drag(false, true);
  const controlsDispose = vi.spyOn(v.ctx.controls, 'dispose'),
    rendererDispose = vi.spyOn(v.renderer, 'dispose'),
    removeCanvas = vi.spyOn(v.renderer.domElement, 'remove'),
    rendered = v.renderer.frames.length,
    updates = sceneUpdate.mock.calls.length;
  expect(env.raf.size).toBe(1);
  expect(v.renderer.domElement.listeners.get('webglcontextlost')?.size).toBe(1);
  const lost = new Event('webglcontextlost', { cancelable: true });
  await act(() => v.renderer.domElement.dispatchEvent(lost));
  expect(lost.defaultPrevented).toBe(true);
  expect(tree!.root.findByProps({ className: 'studio-fallback' }).findByType('p').children).toEqual(
    ['section'],
  );
  expect(tree!.root.findByProps({ className: 'studio-canvas' }).props.style.display).toBe('none');
  expect(tree!.root.findAllByProps({ className: 'btn studio-mode' })).toHaveLength(0);
  expect(controlsDispose).toHaveBeenCalledOnce();
  expect(rendererDispose).toHaveBeenCalledOnce();
  expect(sceneDispose).toHaveBeenCalledOnce();
  expect(geometryDispose).toHaveBeenCalledOnce();
  expect(materialDispose).toHaveBeenCalledOnce();
  expect(removeCanvas).toHaveBeenCalledOnce();
  expect(env.raf.size).toBe(0);
  expect(env.resize.every((observer: any) => !observer.active)).toBe(true);
  expect(env.intersection.every((observer: any) => !observer.active)).toBe(true);
  expect(env.host.listeners.get('keydown')?.size).toBe(0);
  for (const type of [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'wheel',
    'webglcontextlost',
  ])
    expect(v.renderer.domElement.listeners.get(type)?.size ?? 0).toBe(0);
  frame(1000);
  resize(278, 260);
  expect(sceneUpdate).toHaveBeenCalledTimes(updates);
  expect(v.renderer.frames).toHaveLength(rendered);
  expect(env.rendererAttempts).toBe(1);
  await act(() => tree!.unmount());
  tree = undefined;
  expect(controlsDispose).toHaveBeenCalledOnce();
  expect(rendererDispose).toHaveBeenCalledOnce();
});

it('uses drain → director → lookAt/render order, never a controller update after a watch director', async () => {
  const order: string[] = [];
  const createScene = (ctx: StudioContext) => ({
    update() {
      order.push('director');
      if (live.film.watch) {
        ctx.controls.target.set(1, 2, 3);
        ctx.camera.position.set(4, 5, 10);
      }
    },
  });
  const v = await mount(<Studio label="order" create={createScene} />);
  drag();
  key();
  frame(20);
  const original = v.ctx.controls.update.bind(v.ctx.controls);
  vi.spyOn(v.ctx.controls, 'update').mockImplementation((dt) => {
    order.push(`controls:${v.ctx.controls.enabled}:${v.ctx.controls.enableDamping}`);
    return original(dt);
  });
  const originalRender = v.renderer.render.bind(v.renderer);
  vi.spyOn(v.renderer, 'render').mockImplementation((scene, camera) => {
    order.push('render');
    originalRender(scene, camera);
  });
  order.length = 0;
  live.film.watch = true;
  frame(17);
  expect(order).toEqual(['controls:false:false', 'director', 'render']);
  aimed(v.renderer.frames.at(-1));
  order.length = 0;
  frame();
  expect(order).toEqual(['director', 'render']);
  order.length = 0;
  resize(278, 260);
  frame(17);
  expect(order).toEqual(['director', 'render']);
  aimed(v.renderer.frames.at(-1));
  order.length = 0;
  live.film.watch = false;
  frame(17);
  expect(order).toEqual(['director', 'controls:true:true', 'render']);
});

it('settles forward/reverse seeking during playback without making normal film ticks hard cuts', async () => {
  const settles: boolean[] = [],
    v = await mount(simple(settles));
  key();
  frame(20);
  live.film.watch = true;
  live.film.playing = true;
  frame(20);
  expect(settles.at(-1)).toBe(true);
  live.film.time += 0.02;
  frame(20);
  expect(settles.at(-1)).toBe(false);
  aimed(v.renderer.frames.at(-1));
  for (const time of [91, 1, 145, 35]) {
    live.film.time = time;
    frame(20);
    expect(settles.at(-1)).toBe(true);
    expect(
      v.renderer.frames.at(-1).position.distanceTo(new THREE.Vector3(4 + time / 100, 3, 11)),
    ).toBeLessThan(1e-12);
  }
  live.film.playing = false;
  frame();
  const first = v.renderer.frames.at(-1);
  frame();
  // A deliberately smoothing director can continue easing while paused. The scene
  // contract is to use settle on seek; input controllers must not add any motion.
  assertFrame(v.renderer.frames.at(-1), first);
});

it('preserves public control reset and pointer-start cancellation of an unfinished key tween', async () => {
  const v = await mount(simple([], true));
  v.ctx.controls.saveState();
  const initial = v.ctx.camera.position.clone();
  key();
  frame(20);
  pointer('pointerdown');
  pointer('pointercancel');
  const cancelled = v.ctx.camera.position.clone();
  for (let n = 0; n < 14; n++) frame(20);
  expect(v.ctx.camera.position.distanceTo(cancelled)).toBeLessThan(1e-10);
  drag();
  v.ctx.controls.enableDamping = false;
  v.ctx.controls.update();
  v.ctx.controls.reset();
  expect(v.ctx.camera.position.distanceTo(initial)).toBeLessThan(1e-10);
  live.film.watch = true;
  frame();
  const first = v.renderer.frames.at(-1);
  frame();
  assertFrame(v.renderer.frames.at(-1), first);
});

const topicNames = ['differential', 'planetary-gears', 'ball-bearing'] as const;
type Topic = (typeof topicNames)[number];
function topic(kind: Topic) {
  const { chapter, chapterProgress: p } = live.film;
  if (kind === 'differential') {
    const s = differentialShot(chapter, p);
    return <Differential motion={s.motion} focus={s.focus} progress={p} />;
  }
  if (kind === 'planetary-gears') {
    const s = planetaryShot(chapter, p);
    return <Planetary angle={s.inputAngle} mode={s.mode} assembly={s.assembly} />;
  }
  const s = bearingShot(chapter, p);
  return <Bearing state={bearingState(s.innerAngle, s.loadAngle, s.load)} shot={s} />;
}
async function updateTopic(
  kind: Topic,
  watch: boolean,
  chapter = live.film.chapter,
  p = live.film.chapterProgress,
  time = live.film.time,
) {
  Object.assign(live.film, { watch, chapter, chapterProgress: p, time });
  await act(() => tree!.update(topic(kind)));
}
for (const kind of topicNames)
  describe(kind, () => {
    it('retains exploration resize / 2D→3D direction through the actual Studio lifecycle', async () => {
      const v = await mount(topic(kind));
      drag();
      v.ctx.controls.enableDamping = false;
      v.ctx.controls.update();
      const before = direction(v.ctx);
      resize(246, 310);
      frame();
      expect(direction(v.ctx).distanceTo(before)).toBeLessThan(1e-12);
      const oldCanvas = v.renderer.domElement;
      await act(() => tree!.root.findByProps({ className: 'btn studio-mode' }).props.onClick());
      expect(v.renderer.disposed).toBe(true);
      expect(env.raf.size).toBe(0);
      expect(oldCanvas.listeners.get('pointerdown')?.size).toBe(0);
      await act(() => tree!.root.findByProps({ className: 'btn studio-mode' }).props.onClick());
      frame();
      const next = live.contexts.at(-1);
      expect(next.controls).not.toBe(v.ctx.controls);
      expect(direction(next).distanceTo(before)).toBeLessThan(1e-12);
      expect(next.controls.enableDamping).toBe(true);
      key();
      frame(20);
      await updateTopic(kind, true);
      frame();
      aimed(env.renderers.at(-1).frames.at(-1));
    });
    it.each(
      (
        [
          [1150, 440],
          [246, 310],
        ] as [number, number][]
      ).flatMap(([w, h]) =>
        (['drag', 'key', 'cancel', 'held'] as const).map((input) => ({ w, h, input })),
      ),
    )('renders the exact directed frame after $input at $w×$h', async ({ w, h, input }) => {
      // Phone bearing contact unmounts 3D; overview chapter 8 remains mounted.
      if (kind === 'ball-bearing' && w < 400) live.film.chapter = 7;
      live.film.watch = true;
      const v = await mount(topic(kind), [w, h]);
      const baseline = v.renderer.frames.at(-1),
        chapter = live.film.chapter;
      {
        await updateTopic(kind, false, chapter, 0.47, 35);
        frame();
        if (input === 'key') {
          key();
          frame(20);
          key('ArrowUp');
          frame(20);
        } else drag(input === 'cancel', input === 'held');
        await updateTopic(kind, true, chapter, 0.47, 35);
        const beforeRender = v.renderer.frames.length;
        frame(300);
        expect(v.renderer.frames).toHaveLength(beforeRender + 1);
        const start = v.renderer.frames.length - 1;
        assertFrame(v.renderer.frames.at(-1), baseline);
        aimed(v.renderer.frames.at(-1));
        if (input === 'held') {
          pointer('pointermove', 320, 210);
          pointer('pointercancel', 320, 210);
        }
        for (let n = 0; n < 8; n++) {
          frame();
          assertFrame(v.renderer.frames.at(-1), baseline);
        }
        summaries.push({
          kind,
          width: w,
          height: h,
          input,
          renderedFrames: v.renderer.frames.length - start,
          maxPositionError: Math.max(
            ...v.renderer.frames
              .slice(start)
              .map((f: any) => f.position.distanceTo(baseline.position)),
          ),
        });
      }
      // All chapter endpoints and reverse seeks use current model directors.
      for (const ch of [7, 0, 4, 2, 6, 1, chapter]) {
        await updateTopic(kind, true, ch, 0.47, 10 + ch * 22);
        frame(17);
        aimed(v.renderer.frames.at(-1));
      }
      await updateTopic(kind, true, chapter, 0.47, 35);
      frame(17);
      assertFrame(v.renderer.frames.at(-1), baseline);
    });
  });
