import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Noise from '../experiments/Noise';
import Traffic from '../experiments/Traffic';
import Transformer from '../experiments/Transformer';
import ExcavatorCircuit from './ExcavatorCircuit';
import { Range } from './Controls';
import { EXCAVATOR, excavatorHydraulics, excavatorPose } from '../../models/excavator';
import { TinyTransformer } from '../../models/transformer';

const film = vi.hoisted(() => ({
  watch: false,
  playing: false,
  narrating: false,
  time: 0,
  run: 0,
  chapter: 0,
  chapterProgress: 0,
  chapters: [{ at: 0 }, { at: 1 }, { at: 2 }],
}));
vi.mock('./Showcase', () => ({ useShowcase: () => film }));

const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const tree of mounted.splice(0)) await act(() => tree.unmount());
  vi.unstubAllGlobals();
  film.watch = false;
  film.playing = false;
  film.time = 0;
});

function environment(initialReduced = false) {
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { lang: 'zh-CN' },
  });
  const motion = Object.assign(new EventTarget(), { matches: initialReduced });
  let inView = true,
    serial = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const intersections = new Set<Observer>();
  const resizes = new Set<Resize>();
  class Observer {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {
      intersections.add(this);
    }
    observe() {
      this.update();
    }
    update() {
      this.callback([{ isIntersecting: inView }]);
    }
    disconnect() {
      intersections.delete(this);
    }
  }
  class Resize {
    constructor(public callback: () => void) {
      resizes.add(this);
    }
    observe() {}
    disconnect() {
      resizes.delete(this);
    }
  }
  const context = new Proxy({ clearRect: vi.fn() } as Record<string, any>, {
    get: (target, key) => {
      if (!(key in target)) target[key as string] = vi.fn();
      return target[key as string];
    },
  });
  const workers: WorkerDouble[] = [];
  class WorkerDouble {
    messages: Record<string, any>[] = [];
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    terminate = vi.fn();
    constructor() {
      workers.push(this);
    }
    postMessage(message: Record<string, any>) {
      this.messages.push(message);
    }
    emit(data: unknown) {
      this.onmessage?.({ data });
    }
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('matchMedia', () => motion);
  vi.stubGlobal('devicePixelRatio', 1);
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('ResizeObserver', Resize);
  vi.stubGlobal('Worker', WorkerDouble);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  return {
    context,
    workers,
    pending: () => frames.size,
    frame: (time: number) => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    },
    intersect: (visible: boolean) => {
      inView = visible;
      [...intersections].forEach((observer) => observer.update());
    },
    background: (hidden: boolean) => {
      doc.hidden = hidden;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    reduce: (reduced: boolean) => {
      motion.matches = reduced;
      motion.dispatchEvent(new Event('change'));
    },
    resize: () => [...resizes].forEach((observer) => observer.callback()),
    node: (element: { type: unknown }) =>
      element.type === 'canvas'
        ? {
            clientWidth: 400,
            clientHeight: 240,
            width: 400,
            height: 240,
            getContext: () => context,
          }
        : { querySelector: () => null, querySelectorAll: () => [] },
  };
}
async function mount(child: React.ReactElement, env: ReturnType<typeof environment>) {
  let tree!: ReactTestRenderer;
  await act(() => {
    tree = create(child, { createNodeMock: env.node });
  });
  mounted.push(tree);
  return tree;
}
const press = async (tree: ReactTestRenderer, label: string) =>
  act(() =>
    tree.root
      .findAllByType('button')
      .find((button) => button.children.join('') === label)!
      .props.onClick(),
  );

describe('exploration activity', () => {
  it('freezes and resumes the actual oil dash positions without integrating hidden time', async () => {
    const env = environment();
    const pose = excavatorPose({ boom: 0.6, stick: -1.6, curl: 1.4 });
    const h = excavatorHydraulics(pose, 1200, EXCAVATOR.limits.flow[1], 'lift', false, 1);
    const props: ComponentProps<typeof ExcavatorCircuit> = {
      h,
      joystick: 1,
      valve: 'lift',
      flow: EXCAVATOR.limits.flow[1],
      stroke: pose.cylinders.boom.stroke,
      pascal: false,
      running: true,
      variant: 'stacked',
    };
    const tree = await mount(<ExcavatorCircuit {...props} />, env);
    const offset = () =>
      tree.root.findAllByType('path').find((path) => path.props.strokeDashoffset !== undefined)!
        .props.strokeDashoffset;
    await act(() => env.frame(100));
    await act(() => env.frame(120));
    const before = offset();
    expect(before).toBeLessThan(0);
    await act(() => env.intersect(false));
    expect(env.pending()).toBe(0);
    await act(() => env.frame(60_000));
    expect(offset()).toBe(before);
    await act(() => env.intersect(true));
    await act(() => env.frame(60_100));
    expect(offset()).toBe(before);
    await act(() => env.frame(60_120));
    expect(offset()).toBeLessThan(before);
    const resumed = offset();
    await act(() => env.background(true));
    expect(env.pending()).toBe(0);
    await act(() => env.frame(120_000));
    expect(offset()).toBe(resumed);
    await act(() => env.background(false));
    expect(env.pending()).toBe(1);
    await act(() => env.reduce(true));
    expect(env.pending()).toBe(0);
    // A film that was explicitly played follows the shared player, including under reduced motion.
    await act(() => tree.update(<ExcavatorCircuit {...props} respectReducedMotion={false} />));
    expect(env.pending()).toBe(1);
  });

  it('suspends manual training automatically and resumes without sending another 50-step job', async () => {
    const env = environment();
    const tree = await mount(<Transformer />, env);
    const worker = env.workers[0];
    await act(() => worker.emit({ ...new TinyTransformer().inspect('猫爱吃'), type: 'ready' }));
    await press(tree, '训练 50 步 →');
    expect(worker.messages.filter((message) => message.type === 'train')).toHaveLength(1);
    await act(() => env.intersect(false));
    expect(worker.messages.at(-1)).toEqual({ type: 'suspend' });
    await act(() => env.intersect(true));
    expect(worker.messages.at(-1)).toEqual({ type: 'resume' });
    await act(() => env.background(true));
    expect(worker.messages.at(-1)).toEqual({ type: 'suspend' });
    await act(() => env.background(false));
    expect(worker.messages.at(-1)).toEqual({ type: 'resume' });
    expect(worker.messages.filter((message) => message.type === 'train')).toHaveLength(1);
    await act(() => tree.unmount());
    expect(worker.terminate).toHaveBeenCalledOnce();
    mounted.splice(mounted.indexOf(tree), 1);
  });

  for (const [Scene, start, pause] of [
    [Noise, '▷ 慢放波形', 'Ⅱ 停住波形'],
    [Traffic, '▷ 运行', 'Ⅱ 暂停'],
  ] as const)
    it(`${Scene.name} redraws only when animation or a static observation changes`, async () => {
      const env = environment(true);
      const tree = await mount(<Scene />, env);
      const initial = env.context.clearRect.mock.calls.length;
      expect(env.pending()).toBe(0);
      await act(() => env.frame(100));
      await act(() => env.frame(120));
      expect(env.context.clearRect).toHaveBeenCalledTimes(initial);
      const input = tree.root.findAllByType(Range)[0];
      await act(() => input.props.onChange(input.props.value + 1));
      expect(env.context.clearRect.mock.calls.length).toBeGreaterThan(initial);
      const changed = env.context.clearRect.mock.calls.length;
      await act(() => env.resize());
      expect(env.context.clearRect.mock.calls.length).toBeGreaterThan(changed);
      expect(env.pending()).toBe(0);
      // Explicit play is allowed after the reduced-motion initial pause.
      await press(tree, start);
      expect(env.pending()).toBe(1);
      await act(() => env.frame(200));
      await act(() => env.frame(220));
      const animated = env.context.clearRect.mock.calls.length;
      await press(tree, pause);
      expect(env.pending()).toBe(0);
      await act(() => env.frame(240));
      expect(env.context.clearRect).toHaveBeenCalledTimes(animated);
      await press(tree, '↻ 重置');
      expect(env.context.clearRect.mock.calls.length).toBeGreaterThan(animated);
      expect(env.pending()).toBe(0);
      await press(tree, start);
      await act(() => env.reduce(false));
      await act(() => env.reduce(true));
      expect(env.pending()).toBe(0);
    });

  for (const Scene of [Noise, Traffic])
    it(`${Scene.name} paints film seeks without starting a second animation clock`, async () => {
      const env = environment();
      film.watch = true;
      film.time = 1;
      const tree = await mount(<Scene />, env);
      const before = env.context.clearRect.mock.calls.length;
      expect(env.pending()).toBe(0);
      film.time = 2;
      await act(() => tree.update(<Scene />));
      expect(env.context.clearRect.mock.calls.length).toBeGreaterThan(before);
      expect(env.pending()).toBe(0);
    });
});
