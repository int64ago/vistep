import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemAcidEvidence from './ChemAcidEvidence';
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
  duration: 144,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(ChemAcidEvidence));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('eight watch chapters remain independent of exploratory concentrations, leak and observations', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 8; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'actual record' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('input')
      .find((a) => a.props.min === '-4')!
      .props.onChange({ target: { value: '-4' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('button')
      .find((a) => a.children.join('') === '压强曲线与总产量')!
      .props.onClick(),
  );
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '1' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('input')
      .find((a) => a.props.step === '.1')!
      .props.onChange({ target: { value: '1' } }),
  );
  for (let chapter = 0; chapter < 8; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('pressure variant opens at injection and narrowed course retains absolute film chapters', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-body-p61' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('封闭装置中的注入');
  await act(async () =>
    r.update(
      tree({ ...base, variant: 'chem-elective-1-body-p61', chapter: 7, chapterProgress: 0.98 }),
    ),
  );
  expect(JSON.stringify(r.toJSON())).toContain('1.39 mg');
  expect(JSON.stringify(r.toJSON())).toContain('2.000');
  await act(async () => r.unmount());
});
