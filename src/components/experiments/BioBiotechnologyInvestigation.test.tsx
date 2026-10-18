import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioBiotechnologyInvestigation from './BioBiotechnologyInvestigation';
vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));
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
  duration: 140,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioBiotechnologyInvestigation));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all seven investigation chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 7; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'AWKEF' } }),
  );
  for (let chapter = 0; chapter < 7; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects the label investigation directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-3-105-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('标识与科普调查');
  await act(async () => v.unmount());
});
