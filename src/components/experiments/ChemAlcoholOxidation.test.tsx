import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemAlcoholOxidation';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 2,
  chapterProgress: 27 / 48.5,
  chapterTime: 27,
  time: 82,
  duration: 228,
  chapters: [],
  run: 0,
};
describe('ethanol oxidation native React contract', () => {
  it('inherits every current shot and geometry on fresh exploration', async () => {
    for (const chapter of [0, 1, 2, 3, 4, 5]) {
      let film = { ...base, chapter };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const section = r!.root.findByType('section').props;
      const geometry = () =>
        r!.root
          .findAll(
            (x) =>
              typeof x.type === 'string' &&
              ['path', 'circle', 'g', 'ellipse', 'text'].includes(x.type),
          )
          .map((x) =>
            Object.fromEntries(Object.entries(x.props).filter(([k]) => k !== 'children')),
          );
      const svg = geometry();
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(r!.root.findByType('section').props['data-alcox-chapter']).toBe(chapter);
      expect(r!.root.findByType('section').props['data-shot']).toBe(section['data-shot']);
      expect(geometry()).toEqual(svg);
      await act(() => r!.unmount());
    }
  });
  it('does not leak either answer through result nodes, and keeps manual reveals out of watch', async () => {
    for (const chapter of [2, 5]) {
      let film = { ...base, chapter, chapterProgress: chapter === 2 ? 27 / 48.5 : 34 / 54.5 };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const result = () =>
        r!.root.findAll(
          (x) =>
            x.props['data-copper-yield'] !== undefined || x.props['data-acid-yield'] !== undefined,
        );
      expect(result()).toHaveLength(0);
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      const button = r!.root
        .findAllByType('button')
        .find((x) => x.children.join('') === 'Test the prediction')!;
      await act(() => button.props.onClick());
      expect(result()).toHaveLength(1);
      const y = chapter === 2 ? 'data-copper-yield' : 'data-acid-yield';
      expect(result()[0].props[y]).toBe(chapter === 2 ? 1 : 3);
      film = { ...film, watch: true };
      await act(() => r!.update(node()));
      expect(result()).toHaveLength(0);
      await act(() => r!.unmount());
    }
  });
  it('keeps tracked atom nodes and removes only the selected hydrogen bonds', async () => {
    let film = { ...base, chapter: 3, chapterProgress: 20 / 42 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const ids = () =>
      r!.root.findAll((x) => x.props['data-atom-id']).map((x) => x.props['data-atom-id']);
    const initial = ids();
    expect(r!.root.findByProps({ 'data-bond': 'departing-H' }).props.opacity).toBe(1);
    film = { ...film, chapterProgress: 1 };
    await act(() => r!.update(node()));
    expect(ids()).toEqual(initial);
    expect(r!.root.findByProps({ 'data-bond': 'departing-H' }).props.opacity).toBe(0);
    expect(r!.root.findByProps({ 'data-bond': 'carbonyl' }).props.opacity).toBe(1);
    expect(r!.root.findByProps({ 'data-bond': 'water' }).props.opacity).toBe(1);
    await act(() => r!.unmount());
  });
});

describe('measured English visible sequence', () => {
  it('adds the two copper equations before cancellation and keeps inventory prediction hidden', async () => {
    let film = { ...base, chapter: 2, chapterProgress: 8 / 48.5 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    expect(r!.root.findByProps({ 'data-cancelled': false })).toBeTruthy();
    film = { ...film, chapterProgress: 12 / 48.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-cancelled': true })).toBeTruthy();
    film = { ...film, chapterProgress: 28.9 / 48.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findAll((x) => x.props['data-copper-yield'] !== undefined)).toHaveLength(0);
    film = { ...film, chapterProgress: 31.2 / 48.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-copper-yield': 1 })).toBeTruthy();
    await act(() => r!.unmount());
  });
  it('reveals 4e and 6e unit accounts before the12e pairing and holds the final answer', async () => {
    let film = { ...base, chapter: 5, chapterProgress: 17.5 / 54.5 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    expect(r!.root.findAllByProps({ 'data-unit-electrons': 'ethanol' })).toHaveLength(1);
    expect(r!.root.findAllByProps({ 'data-unit-electrons': 'dichromate' })).toHaveLength(0);
    expect(r!.root.findAllByProps({ 'data-total-electrons': '12' })).toHaveLength(0);
    film = { ...film, chapterProgress: 24.5 / 54.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findAllByProps({ 'data-unit-electrons': 'dichromate' })).toHaveLength(1);
    expect(r!.root.findAllByProps({ 'data-total-electrons': '12' })).toHaveLength(0);
    film = { ...film, chapterProgress: 28 / 54.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findAllByProps({ 'data-total-electrons': '12' })).toHaveLength(1);
    film = { ...film, chapterProgress: 39.0 / 54.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findAll((x) => x.props['data-acid-yield'] !== undefined)).toHaveLength(0);
    film = { ...film, chapterProgress: 43.4 / 54.5 };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-acid-yield': 3 })).toBeTruthy();
    await act(() => r!.unmount());
  });
});

describe('restoring exploration after the native Watch reset', () => {
  it('restores the entire edited endpoint after Watch has returned to chapter zero', async () => {
    let film = { ...base, chapter: 5, chapterProgress: 34 / 54.5, watch: false };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const sliders = () => r!.root.findAllByType('input').filter((x) => x.props.type === 'range');
    // Set a non-default oxidant stock through the actual Range component.
    await act(() => sliders()[2].props.onChange({ target: { value: '1' } }));
    const reveal = () =>
      r!.root.findAllByType('button').find((x) => x.children.join('') === 'Test the prediction')!;
    await act(() => reveal().props.onClick());
    const before = JSON.stringify(r!.toJSON());
    expect(r!.root.findByProps({ 'data-acid-yield': 1.5 })).toBeTruthy();
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0, chapterTime: 0, time: 0 };
    await act(() => r!.update(node()));
    expect(r!.root.findByType('section').props['data-alcox-chapter']).toBe(0);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON())).toBe(before);
    await act(() => r!.unmount());
  });
});
