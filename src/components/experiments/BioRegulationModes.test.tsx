import { act, createElement, type ComponentType } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioEndocrineEvidence from './BioEndocrineEvidence';
import BioBodyFluidBalance from './BioBodyFluidBalance';
vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 320, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 12,
  chapter: 1,
  chapterProgress: 0.55,
  chapterTime: 12,
  duration: 264,
  chapters: [],
  run: 0,
};
const render = (C: ComponentType, value: Director) =>
  createElement(FilmContext.Provider, { value }, createElement(C));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
describe('regulation film state contracts', () => {
  it.each([
    [BioEndocrineEvidence, 12],
    [BioBodyFluidBalance, 7],
  ] as const)('reconstructs every directed chapter independently of edits', async (C, count) => {
    let v!: ReactTestRenderer;
    await act(async () => {
      v = create(render(C, base));
    });
    const frames = [];
    for (let chapter = 0; chapter < count; chapter++) {
      await act(async () => v.update(render(C, { ...base, chapter })));
      const snapshot = JSON.stringify(v.toJSON());
      expect(snapshot).not.toContain('NaN');
      frames.push(snapshot);
    }
    await act(async () => v.update(render(C, { ...base, watch: false })));
    await act(async () =>
      v.root.findAllByType('input')[0].props.onChange({ target: { value: '0' } }),
    );
    for (let chapter = 0; chapter < count; chapter++) {
      await act(async () => v.update(render(C, { ...base, chapter })));
      expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
    }
    await act(async () => v.unmount());
  });
  it.each([
    [BioBodyFluidBalance, 'bio-elective-1-012-1', '一天中的体温记录'],
    [BioBodyFluidBalance, 'bio-elective-1-mechanism-17', '体温与水盐调节'],
    [BioEndocrineEvidence, 'bio-elective-1-049-1', '染色体'],
    [BioEndocrineEvidence, 'bio-elective-1-053-1', '甲状腺轴'],
  ] as const)('opens the target-specific exploration view', async (C, variant, label) => {
    let v!: ReactTestRenderer;
    await act(async () => {
      v = create(render(C, { ...base, watch: false, variant }));
    });
    expect(JSON.stringify(v.toJSON())).toContain(label);
    await act(async () => v.unmount());
  });
});
