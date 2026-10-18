import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext, type Director } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import BioCellFates from './BioCellFates';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en', t: (s: string) => s }));
const base: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 195.5,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const element = (chapter: number, time: number, watch = true) => (
  <FilmContext.Provider
    value={{ ...base, chapter, chapterTime: time, chapterProgress: time / 40, watch }}
  >
    <BioCellFates />
  </FilmContext.Provider>
);
it('holds the regeneration question until the spoken answer', () => {
  const q = renderToStaticMarkup(element(0, 35));
  expect(q).toContain('换了条件，还能保证再生吗？');
  expect(q).not.toContain('保留信息 ≠ 保证再生');
  expect(renderToStaticMarkup(element(0, 38))).toContain('保留信息 ≠ 保证再生');
});
it('keeps reported somatic totals fixed while the separate illustrative branch changes', () => {
  for (const time of [0, 2, 8, 14, 25]) {
    const html = renderToStaticMarkup(element(4, time));
    expect(html).toContain('<strong>1090</strong>');
    expect(html).toContain('<strong>131</strong>');
    expect(html).toContain('<strong>959</strong>');
    expect(html.match(/data-lineage-id=/g)).toHaveLength(15);
  }
});
it('fresh exploration preserves the current evidence, program and donor focus', () => {
  expect(renderToStaticMarkup(element(0, 27, false))).toContain('data-fates-shot="expression"');
  expect(renderToStaticMarkup(element(0, 27, false))).toContain('data-program-role="shoot"');
  expect(renderToStaticMarkup(element(2, 10, false))).toContain('data-nuclear-focus="1"');
  expect(renderToStaticMarkup(element(3, 13, false))).toContain('data-study="1983"');
});
it('keeps the prediction question on entering exploration', () => {
  const html = renderToStaticMarkup(element(0, 35, false));
  expect(html).toContain('换了条件，还能保证再生吗？');
  expect(html).toContain('揭晓再生预测');
  expect(html).not.toContain('保留信息 ≠ 保证再生');
});
let renderer: ReactTestRenderer | undefined;
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});
it('keeps an explicit research selection without changing the authored film', () => {
  act(() => {
    renderer = create(element(3, 13, false));
  });
  const section = () => renderer!.root.findByType('section');
  expect(section().props['data-study']).toBe(1983);
  const selector = renderer!.root
    .findAllByType(Segments)
    .find((x) => x.props.label === '研究年份')!;
  act(() => selector.props.onChange('1976'));
  expect(section().props['data-study']).toBe(1976);
  act(() => renderer!.update(element(3, 13, true)));
  expect(section().props['data-study']).toBe(1983);
  act(() => renderer!.update(element(3, 13, false)));
  expect(section().props['data-study']).toBe(1976);
});
it('the first exploration adjustment uses the displayed local clock', () => {
  act(() => {
    renderer = create(element(0, 26, false));
  });
  expect(renderer!.root.findByType(Range).props.value).toBeCloseTo(0.3498085, 5);
  act(() => renderer!.unmount());
  act(() => {
    renderer = create(element(2, 8, false));
  });
  expect(renderer!.root.findByType(Range).props.value).toBeCloseTo(0.5329062, 5);
});
