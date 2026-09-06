import { act, StrictMode } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Showcase, { useShowcase } from './Showcase';
import { manualLanguageClick } from '../../lib/film-language';
import { films } from '../../data/films';
import tracks from '../../data/audio-tracks.json';
import { t } from '../../i18n';

function store() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  };
}
function environment() {
  const local = store(),
    session = store(),
    windowEvents = new EventTarget();
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { lang: 'zh-CN' },
    body: { append: vi.fn() },
  });
  let reduced = false,
    visible = true,
    blocked = false,
    serial = 0;
  const frames = new Map<number, FrameRequestCallback>(),
    observers = new Set<Observer>(),
    audios: AudioDouble[] = [];
  class Observer {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {
      observers.add(this);
    }
    observe() {
      this.update();
    }
    update() {
      this.callback([{ isIntersecting: visible }]);
    }
    disconnect() {
      observers.delete(this);
    }
  }
  class AudioDouble {
    currentTime = 0;
    duration = 400;
    readyState = 4;
    paused = true;
    volume = 1;
    preload = '';
    hidden = false;
    dataset: Record<string, string> = {};
    seekable = { length: 1, start: () => 0, end: () => 400 };
    onplaying: (() => void) | null = null;
    onwaiting = null;
    oncanplay = null;
    onloadedmetadata = null;
    onended: (() => void) | null = null;
    onerror = null;
    error = null;
    play = vi.fn(() => {
      this.playTimes.push(this.currentTime);
      if (blocked) return Promise.reject(new DOMException('No activation', 'NotAllowedError'));
      this.paused = false;
      this.onplaying?.();
      return Promise.resolve();
    });
    playTimes: number[] = [];
    pause = vi.fn(() => {
      this.paused = true;
    });
    load = vi.fn();
    remove = vi.fn();
    removeAttribute = vi.fn();
    constructor(public src: string) {
      audios.push(this);
    }
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('window', windowEvents);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('Audio', AudioDouble);
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: reduced }));
  vi.stubGlobal('history', {
    state: { intact: true },
    replaceState: vi.fn((_state, _unused, href) => vi.stubGlobal('location', new URL(href))),
  });
  const navigate = (url: string) => {
    const parsed = new URL(url);
    vi.stubGlobal('location', parsed);
    doc.documentElement.lang = parsed.pathname.startsWith('/en/') ? 'en' : 'zh-CN';
  };
  navigate('https://vistep.ai/explore/rainbow/#t=121.75');
  return {
    local,
    session,
    audios,
    windowEvents,
    navigate,
    reduced: (value: boolean) => {
      reduced = value;
    },
    blocked: (value: boolean) => {
      blocked = value;
    },
    visibility: (value: boolean) => {
      visible = value;
      [...observers].forEach((observer) => observer.update());
    },
    tick: (now: number) => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    },
    pendingFrames: () => frames.size,
  };
}
function Probe() {
  const state = useShowcase();
  return (
    <output
      data-probe={true}
      data-time={state.time}
      data-chapter={state.chapter}
      data-playing={state.playing}
    />
  );
}
async function mount(slug = 'rainbow', strict = false) {
  let tree!: ReactTestRenderer;
  await act(async () => {
    const child = (
      <Showcase slug={slug}>
        <Probe />
      </Showcase>
    );
    tree = create(strict ? <StrictMode>{child}</StrictMode> : child, {
      createNodeMock: () => ({}),
    });
  });
  return tree;
}
const probe = (tree: ReactTestRenderer) => tree.root.findByProps({ 'data-probe': true }).props;
const button = (tree: ReactTestRenderer, name: string) =>
  tree.root.findByProps({ className: `film-${name}` });
const pause = (tree: ReactTestRenderer) =>
  expect(button(tree, 'play').props['aria-label']).toBe(t('播放演示'));
async function setTime(tree: ReactTestRenderer, time: number) {
  await act(() =>
    tree.root.findByType('input').props.onChange({ target: { value: String(time) } }),
  );
}
function language(slug = 'rainbow') {
  const url = new URL(
    `https://vistep.ai${location.pathname.startsWith('/en/') ? '' : '/en'}/explore/${slug}/`,
  );
  const anchor = Object.assign(url, {
    dataset: { language: location.pathname.startsWith('/en/') ? 'zh' : 'en' },
    target: '',
    hasAttribute: () => false,
  }) as unknown as HTMLAnchorElement;
  manualLanguageClick.call(anchor, {
    button: 0,
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  } as MouseEvent);
  return anchor.href;
}
async function unmount(tree: ReactTestRenderer) {
  await act(() => tree.unmount());
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('actual Showcase + useNarration + narrationSource language lifecycle (controlled media/events)', () => {
  it('reproduces stale-hash rainbow seek and restores director149.5 and media149.5 paused', async () => {
    const env = environment();
    let tree = await mount();
    pause(tree);
    await setTime(tree, 149.5);
    expect(location.hash).toBe('#t=121.75');
    const href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(149.5);
    expect(probe(tree)['data-chapter']).toBe(
      films.rainbow.chapters.findLastIndex((c) => 149.5 >= c.at),
    );
    pause(tree);
    const audio = env.audios.at(-1)!;
    expect(audio.currentTime).toBe(149.5);
    expect(audio.play).not.toHaveBeenCalled();
    expect(audio.src).toBe(tracks.rainbow.en.src);
    expect(location.hash).toBe('#t=149.5');
    expect(location.search).toBe('');
    await unmount(tree);
  });
  it('restores airfoil after no-hash playback then pause, without restarting from0', async () => {
    const env = environment();
    env.navigate('https://vistep.ai/explore/airfoil/');
    let tree = await mount('airfoil');
    await act(() => {
      env.audios.at(-1)!.currentTime = 82.25;
      env.tick(20);
      env.tick(60);
    });
    expect(probe(tree)['data-time']).toBe(82.25);
    await act(() => button(tree, 'play').props.onClick());
    pause(tree);
    const href = language('airfoil');
    await unmount(tree);
    env.navigate(href);
    tree = await mount('airfoil');
    expect(probe(tree)['data-time']).toBe(82.25);
    expect(env.audios.at(-1)!.currentTime).toBe(82.25);
    pause(tree);
    expect(env.audios.at(-1)!.play).not.toHaveBeenCalled();
    await unmount(tree);
  });
  it('restores playing at the captured media/film time, with no initial play at0, then respects later ordinary hash seeks', async () => {
    const env = environment();
    let tree = await mount();
    await setTime(tree, 149.5);
    await act(() => button(tree, 'play').props.onClick());
    const href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-playing']).toBe(true);
    expect(env.audios.at(-1)!.playTimes).toEqual([149.5]);
    env.navigate('https://vistep.ai/en/explore/rainbow/#t=10');
    await act(() => env.windowEvents.dispatchEvent(new Event('hashchange')));
    expect(probe(tree)['data-time']).toBe(10);
    expect(env.audios.at(-1)!.currentTime).toBe(10);
    pause(tree);
    await unmount(tree);
  });
  it('transfers replay as playing0, and a completed film as paused at its final time', async () => {
    const env = environment();
    let tree = await mount();
    await act(() => button(tree, 'replay').props.onClick());
    let href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(0);
    expect(probe(tree)['data-playing']).toBe(true);
    await act(() => env.audios.at(-1)!.onended?.());
    expect(probe(tree)['data-time']).toBe(films.rainbow.duration);
    href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(films.rainbow.duration);
    expect(probe(tree)['data-playing']).toBe(false);
    expect(env.audios.at(-1)!.play).not.toHaveBeenCalled();
    await unmount(tree);
  });
  it('keeps fresh deep links paused and copied transition URLs cannot grant autoplay', async () => {
    const env = environment();
    let tree = await mount();
    expect(probe(tree)['data-time']).toBe(121.75);
    pause(tree);
    await act(() => button(tree, 'play').props.onClick());
    const href = language();
    await unmount(tree);
    env.session.removeItem('vistep:film-language-handoff');
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(121.75);
    pause(tree);
    expect(env.audios.at(-1)!.play).not.toHaveBeenCalled();
    await unmount(tree);
  });
  it('respects reduced motion on the receiving page even when the source was playing', async () => {
    const env = environment();
    let tree = await mount();
    await setTime(tree, 149.5);
    await act(() => button(tree, 'play').props.onClick());
    const href = language();
    await unmount(tree);
    env.reduced(true);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(149.5);
    pause(tree);
    expect(env.audios.at(-1)!.play).not.toHaveBeenCalled();
    await unmount(tree);
  });
  it('preserves narration-off and lets the existing autoplay rejection expose its manual voice entry', async () => {
    const env = environment();
    env.local.setItem('vistep:narration', 'off');
    let tree = await mount();
    await setTime(tree, 75);
    await act(() => button(tree, 'play').props.onClick());
    let href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(75);
    expect(probe(tree)['data-playing']).toBe(true);
    expect(env.audios).toHaveLength(0);
    expect(env.local.getItem('vistep:narration')).toBe('off');
    href = language();
    await unmount(tree);
    env.local.removeItem('vistep:narration');
    env.blocked(true);
    env.navigate(href);
    tree = await mount();
    expect(env.audios.at(-1)!.playTimes).toEqual([75]);
    expect(button(tree, 'voice').props['aria-pressed']).toBe(false);
    expect(tree.root.findByProps({ className: 'voice-status' }).children.join('')).toBe(
      t('点一下声音按钮，继续听讲解。'),
    );
    expect(env.local.getItem('vistep:narration')).toBeNull();
    await unmount(tree);
  });
  it('keeps playing intent through an offscreen language navigation, and waits for visibility', async () => {
    const env = environment();
    let tree = await mount();
    await setTime(tree, 149.5);
    await act(() => button(tree, 'play').props.onClick());
    await act(() => env.visibility(false));
    expect(probe(tree)['data-playing']).toBe(false);
    const href = language();
    await unmount(tree);
    env.navigate(href);
    tree = await mount();
    expect(probe(tree)['data-time']).toBe(149.5);
    expect(env.audios.at(-1)!.play).not.toHaveBeenCalled();
    await act(() => env.visibility(true));
    expect(probe(tree)['data-playing']).toBe(true);
    expect(env.audios.at(-1)!.playTimes).toEqual([149.5]);
    await unmount(tree);
    expect(env.pendingFrames()).toBe(0);
  });
  it('survives StrictMode effect replay without losing playing intent or resetting the audio target', async () => {
    const env = environment();
    let tree = await mount();
    await setTime(tree, 149.5);
    await act(() => button(tree, 'play').props.onClick());
    const href = language();
    await unmount(tree);
    const count = env.audios.length;
    env.navigate(href);
    tree = await mount('rainbow', true);
    expect(probe(tree)['data-time']).toBe(149.5);
    expect(probe(tree)['data-playing']).toBe(true);
    expect(env.audios.at(-1)!.currentTime).toBe(149.5);
    for (const audio of env.audios.slice(count))
      expect(audio.playTimes.every((time) => time === 149.5)).toBe(true);
    await unmount(tree);
  });
});
