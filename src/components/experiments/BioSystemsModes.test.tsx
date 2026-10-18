import { act, createElement, type ComponentType } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioBufferComparison from './BioBufferComparison';
import BioNerveSignals from './BioNerveSignals';
import BioChemicalSignals from './BioChemicalSignals';
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
  duration: 150,
  chapters: [],
  run: 0,
};
const render = (C: ComponentType, value: Director) =>
  createElement(FilmContext.Provider, { value }, createElement(C));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
describe('biology systems directed and exploration states', () => {
  it.each([
    ['buffer', BioBufferComparison, 'bio-elective-1-007-1', 1],
    ['nerve', BioNerveSignals, 'bio-elective-1-027-1', 1],
    ['chemical transfer', BioChemicalSignals, 'bio-elective-1-031-1', 1],
  ] as const)(
    'restores the %s shot after manual input changes',
    async (_label, C, variant, chapter) => {
      let view!: ReactTestRenderer;
      const directed = { ...base, variant, chapter };
      await act(async () => {
        view = create(render(C, directed));
      });
      const before = JSON.stringify(view.toJSON());
      await act(async () => view.update(render(C, { ...directed, watch: false })));
      const input = view.root.findAllByType('input')[0];
      await act(async () => input.props.onChange({ target: { value: '0' } }));
      await act(async () => view.update(render(C, directed)));
      expect(JSON.stringify(view.toJSON())).toBe(before);
      await act(async () => view.unmount());
    },
  );
  it.each([
    [BioNerveSignals, 'bio-elective-1-032-1', '金属连接'],
    [BioNerveSignals, 'bio-elective-1-mechanism-15', '突触前末梢'],
    [BioChemicalSignals, 'bio-elective-1-045-1', '酸进入小肠'],
  ] as const)(
    'selects the specified apparatus on a direct curriculum visit',
    async (C, variant, expected) => {
      let view!: ReactTestRenderer;
      await act(async () => {
        view = create(render(C, { ...base, watch: false, variant }));
      });
      expect(JSON.stringify(view.toJSON())).toContain(expected);
      await act(async () => view.unmount());
    },
  );
});
