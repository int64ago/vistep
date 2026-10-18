import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioNeuralEvidence from './BioNeuralEvidence';
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
  duration: 154,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioNeuralEvidence));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all seven chapters after changing manual state', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let before = [];
  for (let chapter = 0; chapter < 7; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    before.push(JSON.stringify(v.toJSON()));
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('input')[0].props.onChange({ target: { value: '0' } }),
  );
  for (let chapter = 0; chapter < 7; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(before[chapter]);
  }
  await act(async () => v.unmount());
});
it.each([
  ['bio-elective-1-034-1', '对侧'],
  ['bio-elective-1-037-1', '病例证据'],
])('selects its target exploration view', async (variant, text) => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant, watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain(text === '对侧' ? '左侧皮层' : text);
  await act(async () => v.unmount());
});
