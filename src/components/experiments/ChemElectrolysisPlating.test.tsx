import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemElectrolysisPlating from './ChemElectrolysisPlating';
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
  duration: 198,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(ChemElectrolysisPlating));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('every chapter reconstructs independently after exploration changes', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toMatch(/NaN|Infinity/);
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  for (const b of r.root.findAllByType('button')) await act(async () => b.props.onClick());
  await act(async () =>
    r.root.findAllByType('input')[1].props.onChange({ target: { value: '.4' } }),
  );
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'Recorded specimen' } }),
  );
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('activity starts at surface preparation, and open circuit retains local chemistry', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-activity-4' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('打磨、除油、冲洗');
  await act(async () => r.update(tree({ ...base, chapter: 9 })));
  expect(JSON.stringify(r.toJSON())).toContain('外电路断开');
  expect(JSON.stringify(r.toJSON())).toContain('Fe + Cu²⁺ → Fe²⁺ + Cu');
  await act(async () => r.unmount());
});
