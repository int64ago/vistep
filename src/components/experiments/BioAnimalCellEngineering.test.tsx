import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioAnimalCellEngineering from './BioAnimalCellEngineering';
const locale = vi.hoisted(() => ({ value: 'zh' }));
vi.mock('../../i18n', () => ({ browserLocale: () => locale.value }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 320, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 10,
  chapter: 0,
  chapterProgress: 0.6,
  chapterTime: 10,
  duration: 240,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioAnimalCellEngineering));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all twelve animal-cell engineering chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'own note' } }),
  );
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects somatic nuclear transfer directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-3-052-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('核、卵细胞质与孕育来源');
  await act(async () => v.unmount());
});

const svgTree = (v: ReactTestRenderer) =>
  JSON.stringify(
    v.root
      .findByType('svg')
      .findAll(() => true)
      .map((n) => ({ type: n.type, props: { ...n.props, children: undefined } })),
  );
it('inherits actual SVG and complete state on first Explore and restores unedited then edited state after Watch replay', async () => {
  for (const language of ['zh', 'en'])
    for (const chapter of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      locale.value = language;
      let v!: ReactTestRenderer;
      const watch = { ...base, chapter, chapterProgress: chapter === 2 ? 0.8 : 0.61 };
      await act(async () => {
        v = create(tree(watch));
      });
      const snapshot = () =>
        v.root.findByProps({ className: 'bio-animal-cell' }).props['data-snapshot'];
      const initial = snapshot(),
        visible = svgTree(v);
      await act(async () => v.update(tree({ ...watch, watch: false })));
      expect(snapshot()).toBe(initial);
      expect(svgTree(v)).toBe(visible);
      await act(async () => v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 1 })));
      await act(async () =>
        v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 1, watch: false })),
      );
      expect(snapshot()).toBe(initial);
      expect(svgTree(v)).toBe(visible);
      await act(async () =>
        v.root.findAllByType('input')[0].props.onChange({ target: { value: '.23' } }),
      );
      await act(async () =>
        v.root.findByType('textarea').props.onChange({ target: { value: 'own evidence' } }),
      );
      const edited = snapshot(),
        editedSVG = svgTree(v);
      await act(async () => v.update(tree(watch)));
      expect(svgTree(v)).toBe(visible);
      await act(async () => v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 2 })));
      await act(async () =>
        v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 2, watch: false })),
      );
      expect(snapshot()).toBe(edited);
      expect(svgTree(v)).toBe(editedSVG);
      await act(async () => v.unmount());
    }
});
