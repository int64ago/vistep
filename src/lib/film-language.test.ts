import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consumeFilmLanguageState,
  manualLanguageClick,
  registerFilmLanguageState,
} from './film-language';

const key = 'vistep:film-language-handoff';
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, value: string) => data.set(k, value)),
    removeItem: vi.fn((k: string) => data.delete(k)),
    data,
  };
}
function page(url = 'https://vistep.ai/explore/rainbow/#t=121.75') {
  const win = new EventTarget(),
    session = storage(),
    local = storage();
  vi.stubGlobal('window', win);
  vi.stubGlobal('location', new URL(url));
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('history', {
    state: { unrelated: 3 },
    replaceState: vi.fn((_state, _unused, href) => vi.stubGlobal('location', new URL(href))),
  });
  return { win, session, local };
}
function link(href = 'https://vistep.ai/en/explore/rainbow/') {
  const url = new URL(href);
  return Object.assign(url, {
    dataset: { language: 'en' },
    target: '',
    hasAttribute: () => false,
  }) as unknown as HTMLAnchorElement;
}
const click = (anchor: HTMLAnchorElement, overrides: Partial<MouseEvent> = {}) =>
  manualLanguageClick.call(anchor, {
    button: 0,
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as MouseEvent);
const navigate = (anchor: HTMLAnchorElement) => vi.stubGlobal('location', new URL(anchor.href));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('one-navigation film/language bridge', () => {
  it.each([false, true])(
    'takes the live149.5 frame instead of stale121.75 hash and restores playing=%s once',
    (playing) => {
      const env = page();
      const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing }));
      const anchor = link();
      click(anchor);
      expect(new URL(anchor.href).hash).toBe('#t=149.5');
      expect(env.local.getItem('vistep:language')).toBe('en');
      navigate(anchor);
      expect(consumeFilmLanguageState('rainbow', 188)).toEqual({ time: 149.5, playing });
      expect(location.href).toBe('https://vistep.ai/en/explore/rainbow/#t=149.5');
      expect(history.state).toEqual({ unrelated: 3 });
      expect(consumeFilmLanguageState('rainbow', 188)).toBeNull();
      expect(env.session.getItem(key)).toBeNull();
      stop();
    },
  );
  it('adds current time when there was no hash, and carries replay0 as playing rather than an ordinary pause link', () => {
    page('https://vistep.ai/explore/airfoil/');
    let current = { time: 93.25, playing: false };
    const stop = registerFilmLanguageState('airfoil', () => current);
    const anchor = link('https://vistep.ai/en/explore/airfoil/');
    click(anchor);
    expect(anchor.hash).toBe('#t=93.25');
    current = { time: 0, playing: true };
    click(anchor);
    navigate(anchor);
    expect(consumeFilmLanguageState('airfoil', 188)).toEqual(current);
    stop();
  });
  it('retains named reading anchors and target query parameters while restoring the film separately', () => {
    page('https://vistep.ai/en/explore/airfoil/#understand');
    const stop = registerFilmLanguageState('airfoil', () => ({ time: 92, playing: false }));
    const anchor = link('https://vistep.ai/explore/airfoil/?ref=lesson');
    anchor.dataset.language = 'zh';
    click(anchor);
    expect(anchor.hash).toBe('#understand');
    navigate(anchor);
    expect(consumeFilmLanguageState('airfoil', 188)).toEqual({ time: 92, playing: false });
    expect(location.href).toBe('https://vistep.ai/explore/airfoil/?ref=lesson#understand');
    stop();
  });
  it('does not transfer into another topic, another origin, or a non-topic destination', () => {
    const env = page();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    for (const href of [
      'https://vistep.ai/en/explore/airfoil/',
      'https://example.com/en/explore/rainbow/',
      'https://vistep.ai/en/',
    ]) {
      const anchor = link(href);
      click(anchor);
      expect(anchor.href).toBe(href);
    }
    expect(env.session.setItem).not.toHaveBeenCalled();
    stop();
  });
  it('reads the final discovery href after capture-phase search flushing without adding film state', () => {
    const env = page('https://vistep.ai/zh/?q=电&age=10&length=short#collection');
    const anchor = link('https://vistep.ai/en/?q=电%20motor&age=10&length=short');
    click(anchor);
    expect(anchor.href).toBe(
      'https://vistep.ai/en/?q=%E7%94%B5%20motor&age=10&length=short#collection',
    );
    expect(env.local.getItem('vistep:language')).toBe('en');
    expect(env.session.setItem).not.toHaveBeenCalled();
  });
  it('leaves unhydrated lessons and modified/new-tab clicks under ordinary link behavior', () => {
    const env = page();
    const anchor = link();
    click(anchor);
    expect(anchor.hash).toBe('#t=121.75');
    expect(env.session.setItem).not.toHaveBeenCalled();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    for (const modifier of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
    ])
      click(link(), modifier);
    const blank = link();
    blank.target = '_blank';
    click(blank);
    expect(env.session.setItem).not.toHaveBeenCalled();
    stop();
  });
  it('does not reuse a canceled normal-click token on a later new-tab activation', () => {
    page();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    const anchor = link();
    click(anchor);
    expect(anchor.search).toContain('__vistepFilm');
    anchor.target = '_blank';
    click(anchor);
    expect(anchor.search).toBe('');
    navigate(anchor);
    expect(consumeFilmLanguageState('rainbow', 188)).toBeNull();
    stop();
  });
  it('removes the publisher on unmount', () => {
    const env = page();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    stop();
    click(link());
    expect(env.session.setItem).not.toHaveBeenCalled();
  });
  it('degrades denied storage to a current-time paused deep link without changing voice preference', () => {
    const env = page();
    env.local.setItem('vistep:narration', 'off');
    env.session.setItem.mockImplementation(() => {
      throw Error('denied');
    });
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    const anchor = link();
    expect(() => click(anchor)).not.toThrow();
    expect(anchor.hash).toBe('#t=149.5');
    expect(anchor.search).toBe('');
    expect(env.local.getItem('vistep:narration')).toBe('off');
    stop();
  });
  it.each([
    'missing',
    'corrupt',
    'expired',
    'future',
    'wrong-token',
    'wrong-topic',
    'wrong-query',
    'invalid-state',
  ])('rejects %s handoffs and keeps copied URLs ordinary', (kind) => {
    const env = page();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    const anchor = link();
    click(anchor);
    const handoff = JSON.parse(env.session.getItem(key)!);
    if (kind === 'missing') env.session.removeItem(key);
    else if (kind === 'corrupt') env.session.setItem(key, '{');
    else {
      if (kind === 'expired') handoff.createdAt -= 300001;
      if (kind === 'future') handoff.createdAt += 1000;
      if (kind === 'wrong-token') handoff.token = 'bad';
      if (kind === 'wrong-topic') handoff.slug = 'airfoil';
      if (kind === 'invalid-state') handoff.time = -1;
      env.session.setItem(key, JSON.stringify(handoff));
    }
    if (kind === 'wrong-query') {
      const changed = new URL(anchor.href);
      changed.searchParams.set('unexpected', '1');
      anchor.href = changed.href;
    }
    navigate(anchor);
    expect(consumeFilmLanguageState('rainbow', 188)).toBeNull();
    expect(location.search).not.toContain('__vistepFilm');
    stop();
  });
  it('allows the static host to normalize a trailing slash without dropping playing intent', () => {
    page('https://vistep.ai/explore/rainbow');
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 149.5, playing: true }));
    const anchor = link('https://vistep.ai/en/explore/rainbow');
    click(anchor);
    const normalized = new URL(anchor.href);
    normalized.pathname += '/';
    vi.stubGlobal('location', normalized);
    expect(consumeFilmLanguageState('rainbow', 188)).toEqual({ time: 149.5, playing: true });
    stop();
  });
  it('clamps completion to the destination duration and leaves it paused', () => {
    page();
    const stop = registerFilmLanguageState('rainbow', () => ({ time: 200, playing: true }));
    const anchor = link();
    click(anchor);
    navigate(anchor);
    expect(consumeFilmLanguageState('rainbow', 188)).toEqual({ time: 188, playing: false });
    stop();
  });
});
