import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemSolutionPreparation';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 272, compact: true }),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe('preparation React state', () => {
  it('fresh Explore preserves transfer/mixing/dilution and explicit control stays isolated from watch', async () => {
    let film = {
      watch: true,
      playing: false,
      chapter: 1,
      chapterTime: 5,
      chapterProgress: 5 / 27,
      time: 35,
      duration: 178,
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
      [1, 5],
      [2, 9],
      [3, 12],
      [3, 22],
      [3, 27],
      [4, 6],
      [5, 14],
    ]) {
      film = { ...film, watch: true, chapter, chapterTime: time };
      await act(() => r!.update(node()));
      const before = state();
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      for (const name of ['data-mode', 'data-stage', 'data-volume', 'data-recovery', 'data-mixed'])
        expect(state()[name]).toBe(before[name]);
    }
    const ranges = r!.root.findAllByType('input').filter((x) => x.props.type === 'range');
    const vol = ranges.find((x) => x.props.max === 101.2)!;
    expect(vol).toBeDefined();
    await act(() => vol.props.onChange({ target: { value: '99' } }));
    expect(state()['data-volume']).toBe(99);
    film = { ...film, watch: true, chapter: 3, chapterTime: 18 };
    await act(() => r!.update(node()));
    expect(state()['data-volume']).toBe(100);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(state()['data-volume']).toBe(99);
    await act(() => r!.unmount());
  });
});
