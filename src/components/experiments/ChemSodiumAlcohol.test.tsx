import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemSodiumAlcohol';
import { protonExchange } from '../../models/chem-sodium-alcohol';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 5,
  chapterTime: 14,
  chapterProgress: 14 / 64,
  time: 153,
  duration: 203,
  chapters: [],
  run: 0,
};
describe('sodium-alcohol real React state', () => {
  it('inherits all current chapters without a variant reset', async () => {
    for (const chapter of [0, 1, 2, 3, 4, 5]) {
      let film = { ...base, chapter };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const before = r!.root.findByType('section').props['data-alcohol-chapter'];
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(r!.root.findByType('section').props['data-alcohol-chapter']).toBe(before);
      await act(() => r!.unmount());
    }
  });
  it('preserves selected proton geometry on first exploration entry', async () => {
    let film = { ...base };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const positions = () =>
      r!.root.findAll((x) => x.props['data-proton-atom']).map((x) => x.findByType('circle').props);
    const old = positions();
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(positions()).toEqual(old);
    await act(() => r!.unmount());
  });
  it('keeps prediction hidden and manual controls isolated from watch', async () => {
    let film = { ...base, chapterTime: 39 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    expect(r!.root.findByProps({ 'data-ethoxide': 'hidden' })).toBeTruthy();
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    const button = r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === 'Test the prediction')!;
    await act(() => button.props.onClick());
    expect(r!.root.findAll((x) => x.props['data-ethoxide'] === 'hidden')).toHaveLength(0);
    film = { ...film, watch: true };
    await act(() => r!.update(node()));
    expect(r!.root.findByProps({ 'data-ethoxide': 'hidden' })).toBeTruthy();
    await act(() => r!.unmount());
  });
  it('keeps an explicitly selected mode only in exploration across watch resets', async () => {
    let film = { ...base, watch: false, chapter: 4, chapterTime: 10 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const button = r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === 'Proton exchange · DMSO')!;
    await act(() => button.props.onClick());
    expect(r!.root.findByType('section').props['data-alcohol-chapter']).toBe(5);
    film = { ...film, watch: true, chapter: 0, chapterTime: 0 };
    await act(() => r!.update(node()));
    expect(r!.root.findByType('section').props['data-alcohol-chapter']).toBe(0);
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(r!.root.findByType('section').props['data-alcohol-chapter']).toBe(5);
    await act(() => r!.unmount());
  });
});

describe('measured reversal mounted identity', () => {
  it('retains the same atom and electron-pair nodes across records and reverse shot, then Explore inherits them', async () => {
    let film = { ...base, chapterTime: 14 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const atoms = () => r!.root.findAll((x) => x.props['data-proton-atom']);
    const pairs = () => r!.root.findAll((x) => x.props['data-electron-pair']);
    const initialAtoms = atoms(),
      initialPairs = pairs();
    for (const t of [28, 38, 43]) {
      film = { ...film, chapterTime: t };
      await act(() => r!.update(node()));
      expect(atoms()).toEqual(initialAtoms);
      expect(pairs()).toEqual(initialPairs);
    }
    const points = () => atoms().map((x) => x.findByType('circle').props);
    const before = points();
    expect(r!.root.findByProps({ className: 'chem-na-exchange' }).props['data-reversed']).toBe(
      true,
    );
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(points()).toEqual(before);
    expect(r!.root.findByProps({ className: 'chem-na-exchange' }).props['data-reversed']).toBe(
      true,
    );
    const waterInput = r!.root.findAllByType('input').find((e) => Number(e.props.max) === 8)!;
    await act(() => waterInput.props.onChange({ target: { value: '8' } }));
    expect(r!.root.findByProps({ className: 'chem-na-exchange' }).props['data-reversed']).toBe(
      false,
    );
    expect(
      r!.root.findByProps({ className: 'chem-na-controls-result' }).props['data-equilibrium'],
    ).toBe(protonExchange(8).ethoxide);
    expect(r!.root.findByProps({ 'data-fixed-record': 'DMSO-1980' }).parent!.props.hidden).toBe(
      false,
    );
    film = { ...film, watch: true };
    await act(() => r!.update(node()));
    expect(points()).toEqual(before);
    expect(r!.root.findByProps({ className: 'chem-na-exchange' }).props['data-reversed']).toBe(
      true,
    );
    await act(() => r!.unmount());
  });
});
