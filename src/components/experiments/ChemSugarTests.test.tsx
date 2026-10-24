import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemSugarTests';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 1,
  chapterProgress: 0.62,
  chapterTime: 14,
  time: 38,
  duration: 296,
  chapters: [],
  run: 0,
};
describe('sugar exploration continuity', () => {
  it('inherits all twelve current shots, preserves geometry, and restores the unedited scene after Watch reset', async () => {
    for (let chapter = 0; chapter < 12; chapter++) {
      let film = { ...base, chapter },
        r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const geometry = () =>
        r!.root
          .findAll(
            (x) =>
              typeof x.type === 'string' &&
              ['path', 'circle', 'g', 'ellipse', 'text', 'line'].includes(x.type),
          )
          .map((x) =>
            Object.fromEntries(Object.entries(x.props).filter(([k]) => k !== 'children')),
          );
      const before = geometry();
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(geometry()).toEqual(before);
      const manual = JSON.stringify(r!.toJSON()).replace(/_r_[0-9a-z]+_/g, '_generated_');
      film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 1 };
      await act(() => r!.update(node()));
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(JSON.stringify(r!.toJSON()).replace(/_r_[0-9a-z]+_/g, '_generated_')).toBe(manual);
      await act(() => r!.unmount());
    }
  });
  it('retains the entire edited assay and independently gates its reagent, medium and warming', async () => {
    let film = { ...base, chapter: 7 },
      r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    const click = async (text: string) =>
      act(() =>
        r!.root
          .findAllByType('button')
          .find((x) => x.children.join('') === text)!
          .props.onClick(),
      );
    await click('Test prediction');
    await click('Glucose');
    const range = async (max: number, value: number) =>
      act(() =>
        r!.root
          .findAllByType('input')
          .find((x) => x.props.type === 'range' && x.props.max === max)!
          .props.onChange({ target: { value: String(value) } }),
      );
    await range(1, 1);
    await range(2, 2);
    await range(4, 1);
    const extent = () =>
      r!.root.findAll((x) => x.props['data-sugar-extent'] !== undefined)[0].props[
        'data-sugar-extent'
      ];
    expect(extent()).toBe(0.5);
    const edited = JSON.stringify(r!.toJSON()).replace(/_r_[0-9a-z]+_/g, '_generated_');
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 1 };
    await act(() => r!.update(node()));
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON()).replace(/_r_[0-9a-z]+_/g, '_generated_')).toBe(edited);
    await range(4, 0);
    expect(extent()).toBe(0);
    await range(4, 2);
    await range(2, 0);
    expect(extent()).toBe(0);
    await act(() => r!.unmount());
  });
});
