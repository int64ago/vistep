import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemCorrosionProtection from './ChemCorrosionProtection';
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
  createElement(FilmContext.Provider, { value: v }, createElement(ChemCorrosionProtection));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('all thirteen chapters reconstruct independently after exploration settings and notes change', async () => {
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
  for (const b of r.root.findAllByType('button')) await act(async () => b.props.onClick());
  await act(async () =>
    r.root
      .findAllByType('textarea')[0]
      .props.onChange({ target: { value: 'Actual measured trial' } }),
  );
  await act(async () =>
    r.root.findAllByType('select')[0].props.onChange({ target: { value: '12' } }),
  );
  for (const input of r.root.findAllByType('input'))
    await act(async () => input.props.onChange({ target: { value: input.props.min } }));
  for (let chapter = 0; chapter < 13; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('research variant starts with composition; final sampling frame holds the second trial endpoint', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-practice-p116' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('暖贴研究：先确定变量');
  await act(async () => r.update(tree({ ...base, chapter: 4, chapterProgress: 1 })));
  expect(JSON.stringify(r.toJSON())).toContain('1.1 mL');
  expect(JSON.stringify(r.toJSON())).toContain('独立试验：仅 Fe');
  await act(async () => r.unmount());
});
