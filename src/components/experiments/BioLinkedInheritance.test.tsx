import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioLinkedInheritance';
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
  duration: 226,
  chapters: [],
  chapterTime: 12,
  chapterProgress: 0.5,
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
  };
}
describe('linked inheritance directed controls', () => {
  for (const lang of ['zh', 'en'])
    it(`${lang}: eight themes follow the current chapter then keep explicit choice`, async () => {
      locale = lang;
      for (let chapter = 0; chapter < 8; chapter++) {
        const film = { ...initial, chapter };
        const r = await mount(film);
        const state = () =>
          r.root.findByProps({ className: 'bio-linked bli18' }).props['data-mode'];
        const before = state();
        film.watch = false;
        await r.update();
        expect(state()).toBe(before);
        await act(() =>
          r.root
            .findAllByType('button')
            .find((b) => b.children.join('') === '人群抽样与分母')!
            .props.onClick(),
        );
        expect(state()).toBe('survey');
        film.watch = true;
        await r.update();
        expect(state()).toBe(before);
        film.watch = false;
        await r.update();
        expect(state()).toBe('survey');
        await r.close();
      }
    });
  it('keeps a zero-person sample undefined rather than zero prevalence', async () => {
    const r = await mount({ ...initial, watch: false, chapter: 6, chapterTime: 0 });
    expect(
      r.root
        .findByProps({ className: 'bio-linked-survey-result' })
        .findByType('strong')
        .children.join(''),
    ).toBe('—');
    await r.close();
  });
});
