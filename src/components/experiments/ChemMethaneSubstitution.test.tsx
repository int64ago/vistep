import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemMethaneSubstitution';
const env = vi.hoisted(() => ({ locale: 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => env.locale }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 272, compact: true }),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe('methane actual React state', () => {
  it('fresh Explore preserves a partially completed fixed population', async () => {
    let film = {
      watch: true,
      playing: false,
      chapter: 4,
      chapterTime: 4,
      chapterProgress: 4 / 50,
      time: 149,
      duration: 195,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const before = r!.root.findByProps({ className: 'mcs17-carbon-grid' }).props['data-completed'];
    expect(before).toBeGreaterThan(0);
    expect(before).toBeLessThan(8);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ className: 'mcs17-carbon-grid' }).props['data-completed']).toBe(
      before,
    );
    await act(() => r!.unmount());
  });
  it('fresh Explore follows the current chain, while explicit choices persist and watch stays independent', async () => {
    let film = {
      watch: true,
      playing: false,
      chapter: 3,
      chapterTime: 24,
      chapterProgress: 24 / 52,
      time: 117,
      duration: 195,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const section = () => r!.root.findByType('section');
    expect(section().props['data-mode']).toBe(3);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(section().props['data-mode']).toBe(3);
    expect(r!.root.findAll((x) => x.props['data-atom-id'] !== undefined)).toHaveLength(11);
    const click = async (name: string) => {
      const b = r!.root.findAllByType('button').find((x) => x.children.join('') === name);
      expect(b).toBeDefined();
      await act(() => b!.props.onClick());
    };
    await click('Distribution');
    await click('Fresh dark sample');
    expect(section().props['data-mode']).toBe(4);
    expect(
      r!.root
        .findAll((x) => x.props['data-substitutions'] !== undefined)
        .every((x) => x.props['data-substitutions'] === 0),
    ).toBe(true);
    film = { ...film, watch: true, chapter: 1, chapterTime: 18 };
    await act(() => r!.update(node()));
    expect(section().props['data-mode']).toBe(1);
    expect(section().props['data-light']).toBe('light');
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(section().props['data-mode']).toBe(4);
    expect(section().props['data-light']).toBe('dark');
    await act(() => r!.unmount());
  });
  it('keeps the comparative numeric answer hidden while predicting', async () => {
    let film = {
      watch: true,
      playing: false,
      chapter: 4,
      chapterTime: 22,
      chapterProgress: 0.5,
      time: 145,
      duration: 195,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    expect(r!.root.findAll((x) => x.props['data-multiple'] === 'hidden')).toHaveLength(2);
    film = { ...film, chapterTime: 34 };
    await act(() => r!.update(node()));
    expect(r!.root.findAll((x) => x.props['data-multiple'] === 'hidden')).toHaveLength(0);
    await act(() => r!.unmount());
  });
  it('fresh dark initiation labels the actual unchanged state', async () => {
    const film = {
      watch: false,
      playing: false,
      chapter: 1,
      chapterTime: 18,
      chapterProgress: 0.5,
      time: 45,
      duration: 195,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
    });
    const b = r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === 'Fresh dark sample')!;
    await act(() => b.props.onClick());
    expect(r!.root.findAll((x) => x.props['data-radical'] === true)).toHaveLength(0);
    expect(r!.root.findByProps({ className: 'mcs17-title' }).children).toContain('Before reaction');
    await act(() => r!.unmount());
  });
});

describe('measured methane visible state', () => {
  it('labels the separate dark control without deleting the initiated sample radical identities', async () => {
    for (const locale of ['zh', 'en'] as const) {
      env.locale = locale;
      let film = {
        watch: true,
        playing: false,
        chapter: 1,
        chapterTime: 16,
        chapterProgress: 16 / 35,
        time: 43,
        duration: 195,
        chapters: [],
        run: 0,
      };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      expect(r!.root.findAll((x) => x.props['data-control-sample'] === 'fresh-dark')).toHaveLength(
        1,
      );
      const ids = r!.root
        .findAll((x) => x.props['data-radical'] === true)
        .map((x) => x.props['data-atom-id']);
      expect(ids).toEqual(['Cl0', 'Cl1']);
      film = { ...film, chapterTime: 25, time: 52 };
      await act(() => r!.update(node()));
      expect(r!.root.findAll((x) => x.props['data-control-sample'] === 'fresh-dark')).toHaveLength(
        0,
      );
      expect(r!.root.findByProps({ 'data-lamp-on': false })).toBeDefined();
      expect(
        r!.root
          .findAll((x) => x.props['data-radical'] === true)
          .map((x) => x.props['data-atom-id']),
      ).toEqual(ids);
      await act(() => r!.unmount());
    }
  });
});
