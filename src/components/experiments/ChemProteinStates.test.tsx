import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemProteinStates';
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
describe('protein exploration continuity', () => {
  it('inherits all eight current shots, preserves geometry, and restores the unedited scene after Watch reset', async () => {
    for (let chapter = 0; chapter < 8; chapter++) {
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
  it('retains edited site identity, conditions and progress after replay', async () => {
    let film = { ...base, chapter: 6 },
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
    await click('Few');
    await click('Phenylalanine');
    const range = r!.root.findAllByType('input').find((x) => x.props.type === 'range')!;
    await act(() => range.props.onChange({ target: { value: '0.81' } }));
    const scene = () => r!.root.findAll((x) => x.props['data-protein-state'] !== undefined)[0];
    const before = scene().props['data-protein-state'];
    expect(JSON.parse(before)).toMatchObject({
      sample: 'few',
      residue: 'phenylalanine',
      progress: 0.81,
    });
    const colour = () => r!.root.findAll((x) => x.props['data-colour-yellow'] !== undefined)[0];
    expect(colour().props['data-colour-yellow']).toBe(0);
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 1 };
    await act(() => r!.update(node()));
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(scene().props['data-protein-state']).toBe(before);
    await click('Tyrosine');
    expect(colour().props['data-colour-yellow']).toBeCloseTo(1 / 3);
    const acid = r!.root.findAll(
      (x) => x.props.role === 'group' && x.props['aria-label'] === 'Concentrated nitric acid',
    )[0];
    await act(() =>
      acid
        .findAllByType('button')
        .find((x) => x.children.join('') === 'None')!
        .props.onClick(),
    );
    expect(colour().props['data-colour-yellow']).toBe(0);
    await act(() => r!.unmount());
  });
});
