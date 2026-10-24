import { it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioFermentationPathways';
import { fermentationSpeechAnchors } from '../../models/bio-fermentation-pathways';
let lang = 'en';
vi.mock('../../i18n', () => ({ browserLocale: () => lang }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288 }),
}));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const lengths = [20, 20, 34, 38, 20, 20, 20, 20, 20, 20, 20, 20],
  starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
const initial: Director = {
  watch: true,
  playing: false,
  chapter: 0,
  chapterTime: 14,
  chapterProgress: 0.7,
  time: 14,
  run: 0,
  duration: 272,
  chapters: starts.map((at, i) => ({
    id: String(i),
    at,
    title: String(i),
    titleEn: String(i),
    caption: '',
    captionEn: '',
  })),
};
async function mount(f: Director) {
  let r: ReturnType<typeof create>;
  const node = () => createElement(FilmContext.Provider, { value: f }, createElement(Scene));
  await act(() => {
    r = create(node());
  });
  return {
    get root() {
      return r!.root;
    },
    update: () => act(() => r!.update(node())),
    close: () => act(() => r!.unmount()),
  };
}
for (const locale of ['zh', 'en'])
  it(`${locale}: fresh Explore inherits all12 shots and history; manual choices persist without changing watch`, async () => {
    lang = locale;
    for (let ch = 0; ch < 12; ch++) {
      const f = { ...initial, chapter: ch, chapterTime: lengths[ch] * 0.7 },
        r = await mount(f),
        props = () => r.root.findByProps({ className: 'bfp21' }).props;
      const old = props();
      f.watch = false;
      await r.update();
      expect(props()['data-shot']).toBe(old['data-shot']);
      expect(props()['data-time']).toBe(old['data-time']);
      expect(props()['data-oxygen']).toBe(old['data-oxygen']);
      const range = r.root.findAllByType('input').find((n) => n.props.type === 'range')!;
      expect(range.props.max).toBe(lengths[ch]);
      await act(() => range.props.onChange({ target: { value: '3' } }));
      expect(props()['data-time']).toBe(3);
      const edited = props();
      f.watch = true;
      f.chapter = 0;
      f.chapterTime = 0;
      await r.update();
      expect(props()['data-chapter']).toBe(0);
      expect(props()['data-time']).toBe(0);
      f.watch = false;
      await r.update();
      expect(props()['data-chapter']).toBe(ch);
      expect(props()['data-time']).toBe(3);
      for (const key of [
        'data-oxygen',
        'data-temperature',
        'data-salt',
        'data-ethanol',
        'data-acetate',
      ])
        expect(props()[key]).toBe(edited[key]);
      await act(() =>
        r.root.findByType('select').props.onChange({ target: { value: String((ch + 1) % 12) } }),
      );
      await act(() =>
        r.root.findByType('select').props.onChange({ target: { value: String(ch) } }),
      );
      expect(props()['data-time']).toBe(3);
      await r.close();
    }
  });
for (const locale of ['zh', 'en'])
  it(`${locale}: first non-time edit pins time and inherited reactor events across Watch reset`, async () => {
    lang = locale;
    const f = { ...initial, chapter: 10, chapterTime: 14, watch: false },
      r = await mount(f),
      get = () => r.root.findByProps({ className: 'bfp21' }).props,
      before = get(),
      mixingLabel = locale === 'zh' ? '搅拌开启' : 'Mixing on';
    const button = () =>
      r.root.findAllByType('button').find((n) => n.children.join('') === mixingLabel)!;
    await act(() => button().props.onClick());
    expect(get()['data-time']).toBe(14);
    expect(get()['data-oxygen']).toBeCloseTo(before['data-oxygen'], 10);
    expect(button().props['aria-pressed']).toBe(false);
    f.watch = true;
    f.chapter = 0;
    f.chapterTime = 0;
    await r.update();
    f.watch = false;
    await r.update();
    expect(get()['data-chapter']).toBe(10);
    expect(get()['data-time']).toBe(14);
    expect(get()['data-oxygen']).toBeCloseTo(before['data-oxygen'], 10);
    expect(get()['data-temperature']).toBeCloseTo(before['data-temperature'], 10);
    expect(button().props['aria-pressed']).toBe(false);
    const clock = r.root
      .findAllByType('input')
      .find((n) => n.props['aria-label'] === (locale === 'zh' ? '本章时间' : 'Chapter time'))!;
    await act(() => clock.props.onChange({ target: { value: '15' } }));
    expect(get()['data-oxygen']).toBeLessThan(before['data-oxygen']);
    await r.close();
  });
it('an observation-only first edit keeps the calibration view across a Watch restart', async () => {
  lang = 'en';
  const f = { ...initial, chapter: 3, chapterTime: 4, watch: false },
    r = await mount(f),
    get = () => r.root.findByProps({ className: 'bfp21' }).props;
  const absorbance = r.root.findAllByType('input').find((n) => n.props.step === '.001')!;
  await act(() => absorbance.props.onChange({ target: { value: '.068' } }));
  f.watch = true;
  f.chapter = 0;
  f.chapterTime = 0;
  await r.update();
  f.watch = false;
  await r.update();
  expect(get()['data-chapter']).toBe(3);
  expect(get()['data-time']).toBe(4);
  expect(get()['data-shot']).toBe('calibration');
  expect(r.root.findAllByType('input').find((n) => n.props.step === '.001')!.props.value).toBe(
    '.068',
  );
  await r.close();
});
it('keeps fixed textbook evidence immutable when rate controls change', async () => {
  const f = { ...initial, chapter: 2, chapterTime: 30, watch: false },
    r = await mount(f);
  const original = r.root.findAll((n) => n.props['data-record-id']).map((n) => ({ ...n.props }));
  const rate = r.root.findAllByType('input').find((n) => Number(n.props.max) === 1.2)!;
  await act(() => rate.props.onChange({ target: { value: '0' } }));
  expect(
    r.root.findAll((n) => n.props['data-record-id']).map((n) => n.props['data-approx-mgkg']),
  ).toEqual(original.map((n) => n['data-approx-mgkg']));
  await r.close();
});
it('renders an empty receiving vessel and no pipette liquid when the transferred volume is zero', async () => {
  const a = fermentationSpeechAnchors(lang);
  const f = { ...initial, chapter: 2, chapterTime: a.sampleStart },
    r = await mount(f);
  expect(r.root.findAll((n) => n.props['data-sample-liquid'] === 'receiver')).toHaveLength(0);
  expect(r.root.findAll((n) => n.props['data-sample-liquid'] === 'source')).toHaveLength(1);
  f.chapterTime = a.sampleEnd - 0.1;
  await r.update();
  expect(r.root.findAll((n) => n.props['data-sample-liquid'] === 'receiver')).toHaveLength(1);
  await r.close();
});
it('an actual Explore oxygen click changes future input without retroactively deleting acquired stock', async () => {
  lang = 'en';
  const f = { ...initial, chapter: 9, chapterTime: 10, watch: false },
    r = await mount(f),
    get = () => r.root.findByProps({ className: 'bfp21' }).props;
  const oxygen = get()['data-oxygen'];
  const b = r.root.findAllByType('button').find((n) => n.children.join('') === 'Oxygen on')!;
  await act(() => b.props.onClick());
  expect(get()['data-oxygen']).toBeCloseTo(oxygen, 10);
  const clock = r.root
    .findAllByType('input')
    .find((n) => n.props['aria-label'] === 'Chapter time')!;
  await act(() => clock.props.onChange({ target: { value: '11' } }));
  expect(get()['data-oxygen']).toBeLessThan(oxygen);
  await r.close();
});

for (const locale of ['zh', 'en'])
  it(`${locale}: Watch calibration ignores manual dilution and restores the edited observation afterward`, async () => {
    lang = locale;
    const f = { ...initial, chapter: 3, chapterTime: 4, watch: false },
      r = await mount(f),
      input = (step: string) => r.root.findAllByType('input').find((n) => n.props.step === step)!,
      reading = () =>
        r.root
          .findAllByType('text')
          .map((n) => n.children.join(''))
          .find((v) => v.startsWith('0.068'));
    await act(() => input('.001').props.onChange({ target: { value: '.068' } }));
    await act(() =>
      r.root
        .findAllByType('input')
        .find((n) => n.props['aria-label'] === (locale === 'zh' ? '稀释倍数' : 'Dilution factor'))!
        .props.onChange({ target: { value: '4' } }),
    );
    expect(reading()).toBe('0.068 → 1.2 → 24.0');
    f.watch = true;
    await r.update();
    expect(reading()).toBe('0.068 → 1.2 → 12.0');
    f.watch = false;
    await r.update();
    expect(reading()).toBe('0.068 → 1.2 → 24.0');
    await r.close();
  });

for (const locale of ['zh', 'en'])
  it(`${locale}: counterfactual comparison uses the same rounding as the visible nitrogen pool`, async () => {
    lang = locale;
    const a = fermentationSpeechAnchors(locale),
      f = { ...initial, chapter: 3, chapterTime: a.rerunStart + 3 },
      r = await mount(f);
    const text = (node: { children: readonly unknown[] }): string =>
      node.children
        .map((n) => (typeof n === 'string' ? n : text(n as { children: readonly unknown[] })))
        .join('');
    for (const time of [a.rerunStart + 3, a.rerunStart + 4, a.rerunStart + 6]) {
      f.chapterTime = time;
      await r.update();
      const pool = text(r.root.findByProps({ 'data-nitrogen-percent': 1 }));
      expect(
        text(r.root.findByProps({ 'data-nitrite-comparison': true })).endsWith('→ ' + pool),
      ).toBe(true);
    }
    await r.close();
  });
