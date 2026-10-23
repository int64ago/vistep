import { act, createElement, type ComponentType } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioBufferComparison from './BioBufferComparison';
import BioNerveSignals from './BioNerveSignals';
import BioChemicalSignals from './BioChemicalSignals';
import variants from '../../data/curriculum-variants.json';
import timeline from '../../data/film-timeline.json';
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
function entryDirector(variant: keyof typeof variants): Director {
  const selected = variants[variant];
  const film = timeline[selected.sceneSlug as keyof typeof timeline];
  const chapter = film.chapters.findIndex((c) => c.id === selected.chapterIds[0]);
  expect(chapter).toBeGreaterThanOrEqual(0);
  return {
    ...base,
    watch: false,
    variant,
    chapter,
    chapterTime: 0,
    chapterProgress: 0,
    time: film.chapters[chapter].at,
  };
}
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
    [BioNerveSignals, 'bio-elective-1-mechanism-15', '少量电荷差形成电压'],
    [BioChemicalSignals, 'bio-elective-1-045-1', '酸进入小肠'],
  ] as const)(
    'selects the specified apparatus on a direct curriculum visit',
    async (C, variant, expected) => {
      let view!: ReactTestRenderer;
      await act(async () => {
        view = create(render(C, entryDirector(variant)));
      });
      expect(JSON.stringify(view.toJSON())).toContain(expected);
      if (variant === 'bio-elective-1-mechanism-15') {
        expect(view.root.findByProps({ className: 'bns18' }).props['data-theme']).toBe('membrane');
      }
      await act(async () => view.unmount());
    },
  );
  it('keeps later synapse chapters reachable within the membrane-mechanism textbook window', async () => {
    let view!: ReactTestRenderer;
    const entry = entryDirector('bio-elective-1-mechanism-15');
    await act(async () => {
      view = create(render(BioNerveSignals, { ...entry, chapter: 3, chapterTime: 10 }));
    });
    expect(JSON.stringify(view.toJSON())).toContain('突触前后膜');
    await act(async () => view.unmount());
  });
});
