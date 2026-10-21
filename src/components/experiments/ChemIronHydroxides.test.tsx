import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemIronHydroxides';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe('hydroxide React state', () => {
  it('fresh Explore retains partial precipitation and current micro/no-O2 comparison', async () => {
    let film = {
      watch: true,
      playing: false,
      chapter: 0,
      chapterTime: 6.5,
      chapterProgress: 0.2,
      time: 6.5,
      duration: 113,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const state = () => r!.root.findByType('section').props;
    for (const [chapter, time] of [
      [0, 6.5],
      [2, 9],
      [3, 10],
    ]) {
      film = { ...film, watch: true, chapter, chapterTime: time };
      await act(() => r!.update(node()));
      const before = state();
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      for (const key of ['data-oh', 'data-oxidized', 'data-micro', 'data-compare'])
        expect(state()[key]).toBe(before[key]);
    }
    const range = r!.root.findAllByType('input').find((x) => x.props.max === 0.25)!;
    await act(() => range.props.onChange({ target: { value: '0' } }));
    expect(state()['data-oxidized']).toBe(0);
    film = { ...film, watch: true, chapter: 1, chapterTime: 10 };
    await act(() => r!.update(node()));
    expect(state()['data-oxidized']).toBe(1);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(state()['data-oxidized']).toBe(0);
    await act(() => r!.unmount());
  });
  it('retains four Fe identities but removes solid OH groups in the no-precipitate comparison', async () => {
    const film = {
      watch: true,
      playing: false,
      chapter: 2,
      chapterTime: 21,
      chapterProgress: 0.8,
      time: 77,
      duration: 113,
      chapters: [],
      run: 0,
    };
    let r: ReactTestRenderer;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
    });
    expect(r!.root.findAll((x) => x.props['data-iron-id'] !== undefined)).toHaveLength(4);
    expect(r!.root.findAllByType('text').filter((x) => x.children.join('') === 'OH')).toHaveLength(
      0,
    );
    expect(
      r!.root.findAllByType('text').filter((x) => x.children.join('') === 'Fe²⁺'),
    ).toHaveLength(4);
    await act(() => r!.unmount());
  });
});

it('low-base React microview derives all four sectors and phase readouts from the complete iron inventory', async () => {
  const film = {
    watch: false,
    playing: false,
    chapter: 2,
    chapterTime: 12,
    chapterProgress: 0.5,
    time: 68,
    duration: 113,
    chapters: [],
    run: 0,
  };
  let r: ReactTestRenderer;
  await act(() => {
    r = create(createElement(FilmContext.Provider, { value: film }, createElement(Scene)));
  });
  const inputs = () => r!.root.findAllByType('input');
  const range = async (max: number, v: number) => {
    await act(() =>
      inputs()
        .find((x) => x.props.max === max)!
        .props.onChange({ target: { value: String(v) } }),
    );
  };
  for (const oh of [0, 0.1, 1, 2])
    for (const oxygen of [0, 0.005, 0.125, 0.25]) {
      await range(4, oh);
      await range(0.25, oxygen);
      await range(1, 1);
      const slots = r!.root.findAll((x) => x.props['data-iron-id'] !== undefined);
      const sum = (key: string) => slots.reduce((s, x) => s + x.props[key], 0),
        solid = Math.min(1, oh / 2),
        oxidized = Math.min(solid, 4 * oxygen);
      expect(sum('data-solid-amount')).toBeCloseTo(solid, 12);
      expect(sum('data-aqueous-ii')).toBeCloseTo(1 - solid, 12);
      expect(sum('data-solid-iii')).toBeCloseTo(oxidized, 12);
      for (const [key, value] of [
        ['aqueousII', 1 - solid],
        ['solidII', solid - oxidized],
        ['solidIII', oxidized],
      ] as const)
        expect(r!.root.findByProps({ 'data-inventory': key }).props['data-amount']).toBeCloseTo(
          value,
          12,
        );
      if (oh === 0.1)
        expect(
          r!.root.findAllByType('text').filter((x) => x.children.join('') === 'OH'),
        ).toHaveLength(0);
    }
  await act(() => r!.unmount());
});
