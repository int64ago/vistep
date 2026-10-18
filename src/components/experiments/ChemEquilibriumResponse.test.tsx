import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemEquilibriumResponse from './ChemEquilibriumResponse';
vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 240, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 10,
  chapter: 0,
  chapterProgress: 0.8,
  chapterTime: 10,
  duration: 234,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(ChemEquilibriumResponse));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('all thirteen chapters reconstruct after chemistry controls and records change', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'own observations' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('button')
      .find((b) => b.children.join('').includes('催化加速'))!
      .props.onClick(),
  );
  await act(async () =>
    r.root
      .findAllByType('button')
      .find((b) => b.children.join('') === '平衡实验活动')!
      .props.onClick(),
  );
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '2' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('input')
      .find((a) => a.props.max === '10')!
      .props.onChange({ target: { value: '0' } }),
  );
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('direct pressure variant opens its apparatus and swap retains two flask identities', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-experiment-2-2' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('c(NO₂)');
  await act(async () => r.update(tree({ ...base, chapter: 12, chapterProgress: 0.45 })));
  expect(JSON.stringify(r.toJSON())).toContain('保留瓶号');
  await act(async () => r.unmount());
});

it('the selected initial side agrees with the displayed concentrations in exploration', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false }));
  });
  await act(async () =>
    r.root.findAllByType('input')[0].props.onChange({ target: { value: '0' } }),
  );
  const values = () => r.root.findAllByType('text').map((n) => n.children.join(''));
  expect(values()).toContain('3.00');
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '1' } }),
  );
  expect(values()).toContain('2.00');
  expect(values().filter((x) => x === '0.00')).toHaveLength(2);
  expect(values()).not.toContain('3.00');
  await act(async () => r.unmount());
});
