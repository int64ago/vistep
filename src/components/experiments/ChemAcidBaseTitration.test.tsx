import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemAcidBaseTitration from './ChemAcidBaseTitration';
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
  duration: 216,
  chapters: [],
  run: 0,
};
const tree = (d: Director) =>
  createElement(FilmContext.Provider, { value: d }, createElement(ChemAcidBaseTitration));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('all twelve watch views ignore independent exploration and private records', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toMatch(/NaN|Infinity/);
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'My conditions' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('input')
      .find((x) => x.props.type === 'number')!
      .props.onChange({ target: { value: '2.35' } }),
  );
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '10' } }),
  );
  await act(async () =>
    r.root.findAllByType('select')[1].props.onChange({ target: { value: 'tip-bubble' } }),
  );
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('activity starts with preparation, actual-record fields are blank, and half-drop reaches held endpoint before chapter end', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-activity-2' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('检漏与润洗');
  expect(
    r.root
      .findAllByType('input')
      .filter((x) => x.props.type === 'number')
      .every((x) => x.props.value === ''),
  ).toBe(true);
  await act(async () => r.update(tree({ ...base, chapter: 7, chapterProgress: 0.95 })));
  expect(JSON.stringify(r.toJSON())).toContain('30 / 30 s');
  expect(JSON.stringify(r.toJSON())).toContain('pH 7.00');
  await act(async () => r.unmount());
});
