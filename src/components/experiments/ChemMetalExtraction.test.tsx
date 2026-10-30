import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemMetalExtraction';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 2,
  chapterProgress: 0.83,
  chapterTime: 24,
  time: 77,
  duration: 196,
  chapters: [],
  run: 0,
};
describe('metal extraction exploration continuity', () => {
  it('inherits every route and comparison and restores the complete unedited state after replay', async () => {
    for (let chapter = 0; chapter < 7; chapter++)
      for (const chapterProgress of [0.15, 0.83]) {
        let film = { ...base, chapter, chapterProgress },
          r: ReactTestRenderer;
        const node = () =>
          createElement(FilmContext.Provider, { value: film }, createElement(Scene));
        await act(() => {
          r = create(node());
        });
        const state = () =>
          r!.root.findAll((x) => x.props['data-metal-state'] !== undefined)[0].props[
            'data-metal-state'
          ];
        const before = state();
        film = { ...film, watch: false };
        await act(() => r!.update(node()));
        expect(state()).toBe(before);
        film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 1 };
        await act(() => r!.update(node()));
        film = { ...film, watch: false };
        await act(() => r!.update(node()));
        expect(state()).toBe(before);
        await act(() => r!.unmount());
      }
  });
  it('uses actual temperature and gas-ratio changes and retains them after Watch reset', async () => {
    let film = { ...base, watch: false },
      r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const click = async (text: string) =>
      act(() =>
        r!.root
          .findAllByType('button')
          .find((x) => x.children.join('') === text)!
          .props.onClick(),
      );
    await click('1200 K');
    const slider = r!.root.findAllByType('input').find((x) => x.props.type === 'range')!;
    await act(() => slider.props.onChange({ target: { value: '0.1' } }));
    const state = () =>
      r!.root.findAll((x) => x.props['data-metal-state'] !== undefined)[0].props[
        'data-metal-state'
      ];
    const before = state();
    expect(JSON.parse(before)).toMatchObject({ temperature: 1200, gasRatio: 0.1 });
    const energy = () => r!.root.findAll((x) => x.props['data-iron-dg'] !== undefined)[0];
    expect(energy().props['data-iron-dg']).toBeLessThan(0);
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 1 };
    await act(() => r!.update(node()));
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(state()).toBe(before);
    await click('Carbon anodes are consumed');
    const power = r!.root.findAllByType('input').find((x) => x.props.type === 'checkbox')!;
    await act(() => power.props.onChange({ target: { checked: false } }));
    const disabled = state();
    expect(JSON.parse(disabled).power).toBe(false);
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0, run: 2 };
    await act(() => r!.update(node()));
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(state()).toBe(disabled);
    await act(() => r!.unmount());
  });
});

it('lets reverse energy change the visible prediction and survives replay intact', async () => {
  let film = { ...base, chapter: 3, chapterProgress: 0.4, chapterTime: 13, watch: false },
    r: ReactTestRenderer;
  const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
  await act(() => {
    r = create(node());
  });
  const energy = () => r!.root.findAll((x) => x.props['data-aluminothermic-dg'] !== undefined)[0];
  expect(energy().props['data-aluminothermic-dg']).toBeLessThan(0);
  await act(() =>
    r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === 'Oxygen to iron')!
      .props.onClick(),
  );
  expect(energy().props['data-aluminothermic-dg']).toBeGreaterThan(0);
  const before = r!.root.findAll((x) => x.props['data-metal-state'] !== undefined)[0].props[
    'data-metal-state'
  ];
  film = { ...film, watch: true, chapter: 0, chapterTime: 0, chapterProgress: 0, run: 1 };
  await act(() => r!.update(node()));
  film = { ...film, watch: false };
  await act(() => r!.update(node()));
  expect(
    r!.root.findAll((x) => x.props['data-metal-state'] !== undefined)[0].props['data-metal-state'],
  ).toBe(before);
  expect(energy().props['data-aluminothermic-dg']).toBeGreaterThan(0);
  await act(() => r!.unmount());
});
