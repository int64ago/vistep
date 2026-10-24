import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemEsterReaction';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  watch: true,
  playing: false,
  chapter: 3,
  chapterProgress: 0.2,
  chapterTime: 10,
  time: 84.5,
  duration: 285.5,
  chapters: [],
  run: 0,
};
describe('ester current scene and native input contract', () => {
  it('inherits all ten chapters and their visible geometry on fresh Explore', async () => {
    for (let chapter = 0; chapter < 10; chapter++) {
      let film = { ...base, chapter };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const geo = () =>
          r!.root
            .findAll(
              (x) =>
                typeof x.type === 'string' &&
                ['path', 'circle', 'g', 'ellipse', 'text', 'line'].includes(x.type),
            )
            .map((x) =>
              Object.fromEntries(Object.entries(x.props).filter(([k]) => k !== 'children')),
            ),
        before = geo();
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(r!.root.findByType('section').props['data-ester-chapter']).toBe(chapter);
      expect(geo()).toEqual(before);
      await act(() => r!.unmount());
    }
  });
  it('keeps prediction results hidden, allows native reveal and isolates Watch', async () => {
    for (const chapter of [3, 7]) {
      let film = { ...base, chapter, chapterProgress: chapter === 3 ? 0.2 : 0.42 };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      const result = () =>
        chapter === 3
          ? r!.root.findByProps({ className: 'chem-ester-atom-panel' }).props['data-isotope-result']
          : r!.root.findByProps({ className: 'chem-ester-closed' }).props['data-equilibrium'];
      expect(result()).toBe('hidden');
      expect(r!.root.findAllByProps({ 'data-common-equilibrium': 'true' })).toHaveLength(0);
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      await act(() =>
        r!.root
          .findAllByType('button')
          .find((x) => x.children.join('') === 'Test prediction')!
          .props.onClick(),
      );
      expect(result()).not.toBe('hidden');
      film = { ...film, watch: true };
      await act(() => r!.update(node()));
      expect(result()).toBe('hidden');
      await act(() => r!.unmount());
    }
  });
  it('makes zero manual hydroxide remove consumption without changing Watch', async () => {
    let film = { ...base, chapter: 8, chapterProgress: 1, watch: false };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const input = r!.root
      .findAllByType('input')
      .find((x) => x.props.type === 'range' && x.props.max === 3)!;
    await act(() => input.props.onChange({ target: { value: '0' } }));
    const stock = () => r!.root.findByProps({ className: 'chem-ester-salt' }).props;
    expect(stock()['data-acetate']).toBe(0);
    expect(stock()['data-hydroxide-left']).toBe(0);
    film = { ...film, watch: true };
    await act(() => r!.update(node()));
    expect(stock()['data-acetate']).toBeGreaterThan(0);
    await act(() => r!.unmount());
  });
  it('restores the complete edited exploration after Watch actually resets to chapter zero', async () => {
    for (const chapter of [3, 7, 8]) {
      let film = { ...base, chapter, chapterProgress: chapter === 3 ? 0.2 : 0.7 };
      let r: ReactTestRenderer;
      const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
      await act(() => {
        r = create(node());
      });
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      if (chapter === 8) {
        const input = r!.root
          .findAllByType('input')
          .find((x) => x.props.type === 'range' && x.props.max === 3)!;
        await act(() => input.props.onChange({ target: { value: '0.4' } }));
      } else {
        const button = r!.root
          .findAllByType('button')
          .find((x) => x.props.className === 'chem-ester-reveal')!;
        await act(() => button.props.onClick());
      }
      const manual = JSON.stringify(r!.toJSON());
      film = {
        ...film,
        watch: true,
        chapter: 0,
        chapterProgress: 0,
        chapterTime: 0,
        time: 0,
        run: 1,
      };
      await act(() => r!.update(node()));
      expect(r!.root.findByType('section').props['data-ester-chapter']).toBe(0);
      film = { ...film, watch: false };
      await act(() => r!.update(node()));
      expect(JSON.stringify(r!.toJSON())).toBe(manual);
      await act(() => r!.unmount());
    }
  });
  it('retains an unedited exploration scene across Watch reset and makes early reveal visible', async () => {
    let film = { ...base, chapterProgress: 0.02 };
    let r: ReactTestRenderer;
    const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    const before = JSON.stringify(r!.toJSON());
    film = { ...film, watch: true, chapter: 0, chapterProgress: 0 };
    await act(() => r!.update(node()));
    film = { ...film, watch: false };
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON())).toBe(before);
    await act(() =>
      r!.root
        .findAllByType('button')
        .find((x) => x.props.className === 'chem-ester-reveal')!
        .props.onClick(),
    );
    expect(r!.root.findByType('section').props['data-ester-shot']).toBe('atoms');
    expect(
      r!.root.findByProps({ className: 'chem-ester-atom-panel' }).props['data-isotope-result'],
    ).toBe('ester');
    await act(() => r!.unmount());
  });
});
