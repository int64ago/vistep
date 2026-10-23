import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemUnsaturatedHydrocarbons';
const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => locale.value }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 1,
  chapterTime: 17,
  chapterProgress: 0.3,
  time: 40,
  duration: 246.5,
  chapters: [],
  run: 0,
};
describe('hydrocarbon actual React causal state', () => {
  it('inherits the same atom positions when opening Explore midway through the net account', async () => {
    let film = { ...base };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const atoms = () =>
      r!.root
        .findAll((x) => x.props['data-atom-id'])
        .map((x) => ({ id: x.props['data-atom-id'], circle: x.findByType('circle').props }));
    const before = atoms();
    expect(before).toHaveLength(13);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(atoms()).toEqual(before);
    await act(() => r!.unmount());
  });
  it('keeps the budget answer hidden until the actual reveal or explicit exploration action', async () => {
    let film = { ...base, chapterTime: 26 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    expect(r!.root.findAll((x) => x.props['data-result'])).toHaveLength(0);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    const button = r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === 'Test prediction')!;
    await act(() => button.props.onClick());
    expect(r!.root.findByProps({ 'data-result': 'remaining' }).children.join('')).toBe('0.20 mmol');
    await act(() => r!.unmount());
  });
  it('manual budget changes persist in Explore but cannot alter the watched fixed question', async () => {
    let film = { ...base, chapterTime: 32 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    const input = r!.root.findAllByType('input').find((x) => x.props.type === 'range')!;
    await act(() => input.props.onChange({ target: { value: '10' } }));
    expect(r!.root.findByProps({ 'data-result': 'remaining' }).children.join('')).toBe('0.00 mmol');
    film = { ...film, watch: true, chapterTime: 26 };
    await act(() => r!.update(node()));
    expect(r!.root.findByType('section').props['data-electrons']).toBe(4);
    expect(r!.root.findAll((x) => x.props['data-result'])).toHaveLength(0);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-result': 'remaining' }).children.join('')).toBe('0.00 mmol');
    await act(() => r!.unmount());
  });
  it('inherits all retained apparatus chapters without jumping to a variant default', async () => {
    for (const chapter of [0, 2, 3, 4, 5, 6, 7]) {
      let film = { ...base, chapter, chapterTime: 10 };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const before = r!.root.findByType('section').props['data-exposure'];
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(r!.root.findByType('section').props['data-chapter']).toBe(chapter);
      expect(r!.root.findByType('section').props['data-exposure']).toBe(before);
      await act(() => r!.unmount());
    }
  });
});

describe('measured words have their actual rendered evidence', () => {
  it.each([
    { language: 'zh', manganese: 9.15, prediction: 27.63, result: 30.47, bromine: 34.99 },
    { language: 'en', manganese: 10.03, prediction: 29.09, result: 31.63, bromine: 36.01 },
  ])('renders Mn reduction, hidden question and answer at the $language words', async (cue) => {
    locale.value = cue.language;
    let film = { ...base, chapterTime: cue.manganese };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const manganese = r!.root.findByProps({ 'data-atom-id': 'Mn-1' });
    expect(manganese.findByType('text').children.join('')).toBe('Mn²⁺');
    // The reduced destination token must not still look bonded to four oxygens.
    expect(
      r!.root
        .findAllByType('line')
        .filter((x) => x.props.stroke === '#aa8cb2')
        .every((x) => x.props.opacity === 0),
    ).toBe(true);
    expect(r!.root.findAll((x) => x.props['data-group'] === 'water')).toHaveLength(0);
    film = { ...film, chapterTime: cue.prediction };
    await act(() => r!.update(node()));
    expect(r!.root.findAll((x) => x.props['data-result'])).toHaveLength(0);
    film = { ...film, chapterTime: cue.result };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-result': 'remaining' }).children.join('')).toBe('0.20 mmol');
    expect(r!.root.findByProps({ 'data-result': 'reduced' }).children.join('')).toBe('0.80 mmol');
    film = { ...film, chapterTime: cue.bromine };
    await act(() => r!.update(node()));
    expect(r!.root.findByType('section').props['data-shot']).toBe('contrast');
    await act(() => r!.unmount());
    locale.value = 'en';
  });
});
