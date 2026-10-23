import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioGeneticMaterial';
let locale = 'en';
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => locale }));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const initial: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 228.5,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
async function mount(film: Director) {
  let r: ReturnType<typeof create>;
  const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
  await act(() => {
    r = create(node());
  });
  return {
    get root() {
      return r!.root;
    },
    update: () => act(() => r!.update(node())),
    close: () => act(() => r!.unmount()),
    json: () => JSON.stringify(r!.toJSON()),
  };
}
describe('material measured state inheritance', () => {
  for (const lang of ['zh', 'en'])
    it(`${lang}: all eight fresh modes retain objects and manual choices stay separate`, async () => {
      locale = lang;
      for (let chapter = 0; chapter < 8; chapter++) {
        const film = { ...initial, chapter, chapterTime: 21 };
        const r = await mount(film);
        const state = () => {
          const p = r.root.findByProps({ className: 'bio-genetic-material bgm18' }).props;
          return [
            'data-mode',
            'data-isotope',
            'data-treatment',
            'data-blended',
            'data-progress',
          ].map((k) => p[k]);
        };
        const before = state();
        film.watch = false;
        await r.update();
        expect(state()).toEqual(before);
        await act(() =>
          r.root.findByType('select').props.onChange({ target: { value: 'remove' } }),
        );
        const dnase = r.root.findAllByType('button').find((x) => x.children.join('') === 'DNA酶')!;
        await act(() => dnase.props.onClick());
        expect(state()[2]).toBe('dnase');
        film.watch = true;
        await r.update();
        expect(state()).toEqual(before);
        film.watch = false;
        await r.update();
        expect(state()[0]).toBe('remove');
        expect(state()[2]).toBe('dnase');
        await r.close();
      }
    });
  it('inherits omitted blending as the same deposited coats, and other new themes keep stable defaults', async () => {
    locale = 'en';
    const film = { ...initial, chapter: 6, chapterTime: 27 };
    const r = await mount(film);
    film.watch = false;
    await r.update();
    expect(
      r.root.findByProps({ className: 'bio-genetic-material bgm18' }).props['data-blended'],
    ).toBe(false);
    await act(() => r.root.findByType('select').props.onChange({ target: { value: 'entry' } }));
    expect(
      r.root.findByProps({ className: 'bio-genetic-material bgm18' }).props['data-isotope'],
    ).toBe('sulfur');
    await r.close();
  });
});
