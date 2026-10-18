import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemReactionRates from './ChemReactionRates';
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
  createElement(FilmContext.Provider, { value: v }, createElement(ChemReactionRates));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('all eleven watch chapters reconstruct independently of exploration inputs', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree(base));
  });
  const frames: string[] = [];
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(r.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => r.update(tree({ ...base, watch: false })));
  await act(async () =>
    r.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'my observation' } }),
  );
  await act(async () =>
    r.root
      .findAllByType('button')
      .find((b) => b.children.join('') === '用气体体积计时')!
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
  for (let chapter = 0; chapter < 11; chapter++) {
    await act(async () => r.update(tree({ ...base, chapter })));
    expect(JSON.stringify(r.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => r.unmount());
});
it('quantitative chapter reaches its final 10mL endpoint; direct mechanism variant opens its own view', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree({ ...base, chapter: 6, chapterProgress: 1 }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('10.0 mL · 7.5 s');
  await act(async () => r.unmount());
  await act(async () => {
    r = create(tree({ ...base, watch: false, variant: 'chem-elective-1-model-p28' }));
  });
  expect(JSON.stringify(r.toJSON())).toContain('碰撞的能量条件');
  await act(async () => r.unmount());
});
