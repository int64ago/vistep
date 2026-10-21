import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioBodyFluidBalance';
import { extracellularTracer, fluidDirector } from '../../models/bio-body-fluid-balance';
const testLocale = vi.hoisted(() => ({ value: 'en' as 'zh' | 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => testLocale.value }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 278 }),
}));
const initial: Director = {
  watch: true,
  playing: false,
  time: 130,
  chapter: 5,
  run: 0,
  duration: 209,
  chapters: [],
  chapterTime: 19,
  chapterProgress: 0.45,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
describe('renal exploration actual React state', () => {
  it('draws equal-area density samples from concentration, not compartment amount', async () => {
    const film = { ...initial, chapter: 0, chapterTime: 20 };
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
    });
    const f = extracellularTracer(10);
    for (let i = 0; i < 3; i++)
      expect(r!.root.findByProps({ 'data-tracer-region': i }).findAllByType('circle')).toHaveLength(
        Math.round(f.concentration[i] * 144),
      );
    await act(() => r!.unmount());
  });

  it('inherits the current chapter and local shot, keeps manual selections, isolates watch', async () => {
    let film = { ...initial };
    let r: ReturnType<typeof create>;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const before = JSON.stringify(r!.toJSON());
    film.watch = false;
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-chapter': 5 }).props['data-shot']).toBe('water-cell');
    const btn = (name: string) =>
      r!.root.findAllByType('button').find((b) => b.children.join('') === name)!;
    await act(() => btn('Sodium recovery').props.onClick());
    expect(r!.root.findByProps({ 'data-chapter': 6 })).toBeDefined();
    await act(() => btn('Na/K pump on').props.onClick());
    expect(r!.root.findByProps({ 'data-chapter': 6 }).props['data-driver']).toBe(false);
    film.watch = true;
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON())).toBe(before);
    film.watch = false;
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-chapter': 6 }).props['data-driver']).toBe(false);
    await act(() => btn('Water recovery').props.onClick());
    expect(r!.root.findByProps({ 'data-chapter': 5 }).props['data-driver']).toBe(true);
    await act(() => r!.unmount());
  });
  it('uses missing observations as gaps and restores an independent practice copy', async () => {
    const film = { ...initial, chapter: 2, watch: false };
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
    });
    const btn = (name: string) =>
      r!.root.findAllByType('button').find((b) => b.children.join('') === name)!;
    const count = () => r!.root.findAllByType('circle').length;
    expect(count()).toBe(7);
    await act(() => btn('Mark missing').props.onClick());
    expect(count()).toBe(6);
    await act(() => btn('Restore practice records').props.onClick());
    expect(count()).toBe(7);
    await act(() => r!.unmount());
  });
  it('keeps zero-gradient channels inserted and does not replay insertion in the counterexample', async () => {
    const film = { ...initial, chapterTime: 27 };
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
    });
    expect(r!.root.findByProps({ 'data-channel': 'AQP2-tag-1' })).toBeDefined();
    expect(r!.root.findAllByProps({ 'data-water': 'water-A' })).toHaveLength(1);
    expect(r!.root.findByProps({ 'data-chapter': 5 }).props['data-driver']).toBe(false);
    await act(() => r!.unmount());
  });
});

it('inherits disabled renal drivers and the exact selected water/ion shot, preserving manual choices per theme', async () => {
  for (const locale of ['zh', 'en'] as const)
    for (const chapter of [5, 6]) {
      testLocale.value = locale;
      const film = {
        ...initial,
        chapter,
        chapterTime: chapter === 5 ? (locale === 'zh' ? 24 : 27) : locale === 'zh' ? 30 : 31,
      };
      let r: ReturnType<typeof create>;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const stage = () => JSON.stringify((r!.toJSON() as { children: unknown[] }).children[0]);
      const before = stage();
      const root = () => r!.root.findByProps({ className: 'bbf17' }),
        button = (zh: string, en: string) =>
          r!.root
            .findAllByType('button')
            .find((n) => n.children.join('') === (locale === 'zh' ? zh : en))!;
      expect(root().props['data-driver']).toBe(false);
      film.watch = false;
      await act(() => r!.update(node()));
      expect(root().props['data-driver']).toBe(false);
      expect(stage()).toBe(before);
      const progress = r!.root.findByProps({
        'aria-label': locale === 'zh' ? '过程进度' : 'Process progress',
      });
      expect(progress.props.value).toBe(
        Math.round(fluidDirector(chapter, film.chapterTime, locale).cell * 100),
      );
      await act(() =>
        button(
          chapter === 5 ? '保留水势差' : '钠钾泵工作',
          chapter === 5 ? 'Water gradient' : 'Na/K pump on',
        ).props.onClick(),
      );
      expect(root().props['data-driver']).toBe(true);
      await act(() =>
        button(
          chapter === 5 ? '钠的回收' : '水的回收',
          chapter === 5 ? 'Sodium recovery' : 'Water recovery',
        ).props.onClick(),
      );
      expect(root().props['data-shot']).toBe(chapter === 5 ? 'salt-loss' : 'loss');
      expect(root().props['data-driver']).toBe(true);
      await act(() =>
        button(
          chapter === 5 ? '钠钾泵工作' : '保留水势差',
          chapter === 5 ? 'Na/K pump on' : 'Water gradient',
        ).props.onClick(),
      );
      expect(root().props['data-driver']).toBe(false);
      await act(() =>
        button(
          chapter === 5 ? '水的回收' : '钠的回收',
          chapter === 5 ? 'Water recovery' : 'Sodium recovery',
        ).props.onClick(),
      );
      expect(root().props['data-driver']).toBe(true);
      film.watch = true;
      await act(() => r!.update(node()));
      expect(root().props['data-driver']).toBe(false);
      expect(stage()).toBe(before);
      film.watch = false;
      await act(() => r!.update(node()));
      expect(root().props['data-driver']).toBe(true);
      await act(() => r!.unmount());
    }
  testLocale.value = 'en';
});

it('fresh Explore has the exact measured local state before, during and after each renal intervention', async () => {
  for (const locale of ['zh', 'en'] as const)
    for (const chapter of [5, 6]) {
      testLocale.value = locale;
      const times =
        chapter === 5
          ? locale === 'zh'
            ? [8.9, 12, 16, 21.6, 21.8, 24, 27, 31.5]
            : [11.1, 15, 20, 25.6, 25.8, 27, 30.2, 35]
          : locale === 'zh'
            ? [9.5, 12, 15, 21, 23, 25.7, 26, 30, 32]
            : [8.2, 11.5, 16, 23, 26, 28.1, 28.3, 32, 34];
      for (const chapterTime of times) {
        const film = { ...initial, chapter, chapterTime };
        let r: ReturnType<typeof create>;
        const node = () =>
          createElement(FilmContext.Provider, { value: film }, createElement(Scene));
        await act(() => {
          r = create(node());
        });
        const stage = () => JSON.stringify((r!.toJSON() as { children: unknown[] }).children[0]);
        const before = stage(),
          d = fluidDirector(chapter, chapterTime, locale);
        expect(r!.root.findByProps({ className: 'bbf17' }).props['data-driver']).toBe(d.driver);
        film.watch = false;
        await act(() => r!.update(node()));
        expect(stage()).toBe(before);
        expect(r!.root.findByProps({ className: 'bbf17' }).props['data-driver']).toBe(d.driver);
        const isCell = ['water-cell', 'no-gradient', 'sodium-cell', 'pump-off'].includes(d.shot);
        expect(
          r!.root.findByProps({ 'aria-label': locale === 'zh' ? '过程进度' : 'Process progress' })
            .props.value,
        ).toBe(Math.round((isCell ? d.cell : d.progress) * 100));
        await act(() => r!.unmount());
      }
    }
  testLocale.value = 'en';
});
