import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemHydrolysisApplications from './ChemHydrolysisApplications';
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
  createElement(FilmContext.Provider, { value: v }, createElement(ChemHydrolysisApplications));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('thirteen film chapters reconstruct without exploration or record leakage', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toMatch(/NaN|Infinity/);
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'Actual sample' } }),
  );
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '9' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('input')
      .find((x) => x.props.min === '2')!
      .props.onChange({ target: { value: '3' } }),
  );
  await act(async () => r.root.findAllByType('button')[0].props.onClick());
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('activity variant opens its own first experiment, concentrated acid never displays precise pH', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-activity-3' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('晶体入水，再加入浓酸');
  await act(async () => r.update(tree({ ...base, chapter: 7 })));
  expect(JSON.stringify(r.toJSON())).not.toMatch(/pH [0-9]/);
  await act(async () => r.unmount());
});
