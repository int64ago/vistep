import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioPlantGrowthRegulators from './BioPlantGrowthRegulators';
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
  duration: 176,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioPlantGrowthRegulators));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all eight plant-regulator chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 8; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('input')[0].props.onChange({ target: { value: '0' } }),
  );
  for (let chapter = 0; chapter < 8; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects the rooting investigation directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-1-103-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('从插条到原始记录');
  await act(async () => v.unmount());
});

it('starts actual observations empty and replaces examples only with entered counts', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, watch: false, variant: 'bio-elective-1-103-1' }));
  });
  const button = (label: string) =>
    v.root.findAllByType('button').find((b) => b.children.includes(label))!;
  await act(async () => button('录入实际观察').props.onClick());
  expect(
    v.root
      .findAllByType('input')
      .filter((i) => i.props.type === 'number')
      .map((i) => i.props.value),
  ).toEqual(['', '', '']);
  await act(async () =>
    v.root
      .findAllByType('input')
      .filter((i) => i.props.type === 'number')[0]
      .props.onChange({ target: { value: '5' } }),
  );
  await act(async () => button('记录表').props.onClick());
  expect(JSON.stringify(v.toJSON())).toContain('5 / — / —');
  await act(async () => v.unmount());
});
