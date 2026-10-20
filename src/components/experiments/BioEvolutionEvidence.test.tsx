import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioEvolutionEvidence';
import { inhibitionRadius } from '../../models/bio-evolution-evidence';
const testLocale = vi.hoisted(() => ({ value: 'zh' as 'zh' | 'en' }));
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => testLocale.value }));
const initial: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 285,
  chapters: [],
  chapterTime: 20,
  chapterProgress: 0.7,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
describe('evolution actual React exploration controls', () => {
  it('follows current chapter until a manual choice, then preserves it without changing watch', async () => {
    let f = { ...initial, chapter: 7, chapterTime: 10 };
    const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(node());
    });
    const update = async () => act(() => r.update(node()));
    expect(r!.root.findByProps({ 'data-mode': 'selection' })).toBeDefined();
    f.watch = false;
    await update();
    expect(r!.root.findByType('select').props.value).toBe('selection');
    await act(() =>
      r!.root.findByType('select').props.onChange({ target: { value: 'frequency' } }),
    );
    expect(r!.root.findByProps({ 'data-mode': 'frequency' })).toBeDefined();
    f.watch = true;
    f.chapter = 9;
    await update();
    expect(r!.root.findByProps({ 'data-mode': 'reunion' })).toBeDefined();
    f.watch = false;
    await update();
    expect(r!.root.findByProps({ 'data-mode': 'frequency' })).toBeDefined();
    await act(() => r!.unmount());
  });
  it('does not change watch output after manipulating source, clone presence or migration', async () => {
    let f = { ...initial, chapter: 7, chapterTime: 10 };
    const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(node());
    });
    const before = JSON.stringify(r!.toJSON());
    f.watch = false;
    await act(() => r!.update(node()));
    await act(() =>
      r!.root
        .findAllByType('button')
        .find((x) => x.children.join('') === '预存R-3：有')!
        .props.onClick(),
    );
    expect(r!.root.findByProps({ 'data-lineage': 'S-0' })).toBeDefined();
    f.watch = true;
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON())).toBe(before);
    await act(() => r!.unmount());
  });
  it('uses the same radial scale for paper and inhibition edge, including zero source', async () => {
    const f = { ...initial, chapter: 6, chapterTime: 9, watch: false };
    let r: ReturnType<typeof create>;
    await act(() => {
      r = create(createElement(FilmContext.Provider, { value: f }, createElement(Scene)));
    });
    for (const source of [0, 0.05, 0.12, 0.13, 1]) {
      const sourceInput = r!.root.findByProps({ 'aria-label': '归一化药物源' });
      expect(sourceInput).toBeDefined();
      await act(() => sourceInput!.props.onChange({ target: { value: String(source) } }));
      const paper = r!.root.findByProps({ 'data-radial-paper': true }).props;
      const halo = r!.root.findByProps({ 'data-radial-halo': true }).props;
      expect(Number(paper.x) + paper.width).toBeCloseTo(40 + (8 / 64) * 248, 10);
      expect(halo.x).toBe(Number(paper.x) + paper.width);
      expect(halo.x + halo.width).toBeCloseTo(40 + (inhibitionRadius(0.12, source) / 64) * 248, 10);
      if (source <= 0.13) expect(halo.width).toBe(0);
      else expect(halo.width).toBeGreaterThan(0);
    }
    await act(() => r!.unmount());
  });
});

it('inherits concealed whale observation and current S-0 lineage without an early reveal', async () => {
  for (const ch of [1, 7]) {
    const f = { ...initial, chapter: ch, chapterTime: ch === 1 ? 14 : 22 };
    let r: ReturnType<typeof create>;
    const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const prop = ch === 1 ? 'data-observation' : 'data-lineage',
      expected = ch === 1 ? 'concealed' : 'S-0';
    expect(r!.root.findAll((n) => n.props[prop] === expected)).toHaveLength(1);
    const positions = () =>
      r!.root
        .findAll((n) => n.props['data-clone'])
        .map((n) => [n.props['data-clone'], n.props.transform]);
    const before = positions();
    f.watch = false;
    await act(() => r!.update(node()));
    expect(r!.root.findAll((n) => n.props[prop] === expected)).toHaveLength(1);
    expect(positions()).toEqual(before);
    await act(() => r!.unmount());
  }
});

it('inherits the frequency chapter fixed selection direction before the moths-specific background cut', async () => {
  for (const locale of ['zh', 'en'] as const) {
    testLocale.value = locale;
    const f = { ...initial, chapter: 5, chapterTime: 10.5 };
    let r: ReturnType<typeof create>;
    const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const counts = () =>
      r!.root
        .findAllByType('output')
        .map((n) => n.children.join(''))
        .filter((text) => text.startsWith('×'));
    expect(counts()).toEqual(['× 11', '× 22', '× 63']);
    f.watch = false;
    await act(() => r!.update(node()));
    expect(counts()).toEqual(['× 11', '× 22', '× 63']);
    await act(() => r!.unmount());
  }
  testLocale.value = 'zh';
});

it('uses stable defaults when a late reunion shot switches to another evidence mode, in both languages', async () => {
  for (const locale of ['zh', 'en'] as const) {
    testLocale.value = locale;
    const f = { ...initial, chapter: 9, chapterTime: 17.55 };
    let r: ReturnType<typeof create>;
    const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
    await act(() => {
      r = create(node());
    });
    const watchBefore = JSON.stringify(r!.toJSON());
    f.watch = false;
    await act(() => r!.update(node()));
    const choose = async (value: string) =>
      act(() => r!.root.findAllByType('select')[0].props.onChange({ target: { value } }));
    const button = (label: string) =>
      r!.root.findAllByType('button').find((n) => n.children.join('') === label)!;
    await choose('selection');
    expect(r!.root.findByProps({ 'data-lineage': 'R-3' })).toBeDefined();
    expect(r!.root.findByProps({ 'aria-label': '过程进度' }).props.value).toBe(0);
    await act(() => button('预存R-3：有').props.onClick());
    await choose('anatomy');
    expect(r!.root.findByProps({ 'data-observation': 'concealed' })).toBeDefined();
    expect(r!.root.findAllByType('b').some((n) => n.children.join('') === '鲸类的鳍')).toBe(true);
    await act(() => button('揭示独立观察').props.onClick());
    await choose('molecular');
    expect(button('1/3').props['aria-pressed']).toBe(true);
    await act(() => button('3/3').props.onClick());
    await choose('selection');
    expect(r!.root.findByProps({ 'data-lineage': 'S-0' })).toBeDefined();
    await choose('anatomy');
    expect(r!.root.findByProps({ 'data-observation': 'revealed' })).toBeDefined();
    await choose('molecular');
    expect(button('3/3').props['aria-pressed']).toBe(true);
    f.watch = true;
    await act(() => r!.update(node()));
    expect(JSON.stringify(r!.toJSON())).toBe(watchBefore);
    f.watch = false;
    await act(() => r!.update(node()));
    expect(button('3/3').props['aria-pressed']).toBe(true);
    await act(() => r!.unmount());
  }
  testLocale.value = 'zh';
});
