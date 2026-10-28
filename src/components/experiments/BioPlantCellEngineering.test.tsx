import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioPlantCellEngineering from './BioPlantCellEngineering';
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
  duration: 220,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioPlantCellEngineering));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all eleven plant-cell engineering chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'own note' } }),
  );
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects plant hormone experiment design directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-3-037-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('配比之外，还看浓度');
  await act(async () => v.unmount());
});
const svgFrame = (v: ReactTestRenderer) => {
  const root = v.toJSON() as { children: Array<{ type?: string }> };
  return JSON.stringify(root.children.find((x) => x.type === 'svg'));
};
it('inherits every actual SVG and restores unedited exploration after Watch replay', async () => {
  for (const chapter of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    let v!: ReactTestRenderer;
    const directed = { ...base, chapter, chapterProgress: chapter === 3 ? 0.3 : 0.63 };
    await act(async () => {
      v = create(tree(directed));
    });
    const current = svgFrame(v);
    await act(async () => v.update(tree({ ...directed, watch: false })));
    expect(svgFrame(v), `chapter ${chapter}: initial inheritance`).toBe(current);
    await act(async () => v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 1 })));
    await act(async () =>
      v.update(tree({ ...base, chapter: 0, chapterProgress: 0, watch: false, run: 1 })),
    );
    expect(svgFrame(v), `chapter ${chapter}: unedited restoration`).toBe(current);
    await act(async () => v.unmount());
  }
});
it('restores modified visible conditions, development, prediction and notes without changing Watch', async () => {
  let v!: ReactTestRenderer;
  const directed = { ...base, chapter: 3, chapterProgress: 0.8 };
  await act(async () => {
    v = create(tree(directed));
  });
  const watch = svgFrame(v);
  await act(async () => v.update(tree({ ...directed, watch: false })));
  const ranges = v.root.findAllByType('input').filter((x) => x.props.type === 'range');
  await act(async () => ranges[0].props.onChange({ target: { value: '.96' } }));
  await act(async () => ranges[1].props.onChange({ target: { value: '5' } }));
  await act(async () =>
    v.root.findByType('textarea').props.onChange({ target: { value: 'my prediction' } }),
  );
  const edited = svgFrame(v);
  expect(edited).not.toBe(watch);
  await act(async () => v.update(tree(directed)));
  expect(svgFrame(v)).toBe(watch);
  await act(async () => v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 1 })));
  await act(async () =>
    v.update(tree({ ...base, chapter: 0, chapterProgress: 0, run: 1, watch: false })),
  );
  expect(svgFrame(v)).toBe(edited);
  expect(v.root.findByType('textarea').props.value).toBe('my prediction');
  await act(async () => v.unmount());
});

it('inherits and restores both measured-language SVG states without editing Explore', async () => {
  for (const lang of ['zh', 'en']) {
    locale.value = lang;
    for (const [chapter, chapterTime] of [
      [0, 5.8],
      [1, 11.5],
      [2, 15],
      [3, 11.9],
      [3, 15.6],
    ]) {
      let v!: ReactTestRenderer;
      const current = { ...base, chapter, chapterTime, chapterProgress: chapterTime / 28 };
      await act(async () => {
        v = create(tree(current));
      });
      const watched = svgFrame(v);
      await act(async () => v.update(tree({ ...current, watch: false })));
      expect(svgFrame(v), `${lang} c${chapter} at${chapterTime}: inheritance`).toBe(watched);
      await act(async () => v.update(tree({ ...base, chapterTime: 0, run: 1 })));
      await act(async () => v.update(tree({ ...base, chapterTime: 0, run: 1, watch: false })));
      expect(svgFrame(v), `${lang} c${chapter} at${chapterTime}: unedited restore`).toBe(watched);
      await act(async () => v.unmount());
    }
  }
  locale.value = 'zh';
});
