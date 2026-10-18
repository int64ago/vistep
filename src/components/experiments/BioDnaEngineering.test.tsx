import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioDnaEngineering from './BioDnaEngineering';
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
  duration: 234,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioDnaEngineering));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all thirteen DNA engineering chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'own note' } }),
  );
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects PCR and electrophoresis directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-3-084-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('扩增与电泳证据');
  await act(async () => v.unmount());
});
it('keeps the30-cycle exponential curve inside its axes', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, watch: false, variant: 'bio-elective-3-084-1' }));
  });
  await act(async () => {
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === '循环与理想上限')!
      .props.onClick();
  });
  const inputs = v.root.findAllByType('input');
  await act(async () => {
    inputs.find((a) => a.props.max === '30')!.props.onChange({ target: { value: '30' } });
  });
  const d = v.root.findAllByType('path').find((a) => a.props.stroke === '#9f8aae')!.props.d;
  const nums = d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!.map(Number);
  for (let i = 0; i < nums.length; i += 2) {
    expect(nums[i]).toBeGreaterThanOrEqual(26);
    expect(nums[i]).toBeLessThanOrEqual(294);
    expect(nums[i + 1]).toBeGreaterThanOrEqual(89);
    expect(nums[i + 1]).toBeLessThanOrEqual(219);
  }
  await act(async () => v.unmount());
});
