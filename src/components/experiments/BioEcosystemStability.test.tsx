import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioEcosystemStability from './BioEcosystemStability';
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
  duration: 220,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioEcosystemStability));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all ten ecosystem-stability chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 10; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('input')[0].props.onChange({ target: { value: '0' } }),
  );
  for (let chapter = 0; chapter < 10; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects the ecological tank directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-2-078-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('有条件的生态缸稳定性');
  await act(async () => v.unmount());
});
