import { it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioSoilDecomposition';
import { soilChapterSeconds } from '../../models/bio-soil-decomposition';
let locale = 'en';
vi.mock('../../i18n', () => ({ browserLocale: () => locale }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 272 }),
}));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const starts = soilChapterSeconds.map((_, i) =>
  soilChapterSeconds.slice(0, i).reduce((a, b) => a + b, 0),
);
const initial: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 1,
  run: 0,
  duration: 263,
  chapters: starts.map((at, i) => ({
    id: `${i}`,
    at,
    title: '',
    caption: '',
    titleEn: '',
    captionEn: '',
  })),
  chapterTime: 21,
  chapterProgress: 0.7,
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
for (const lang of ['zh', 'en'])
  it(`${lang}: nine fresh Explore views inherit chapter and causal time; manual choices persist without changing watch`, async () => {
    locale = lang;
    for (let ch = 0; ch < 9; ch++) {
      const f = { ...initial, chapter: ch, chapterTime: soilChapterSeconds[ch] * 0.7 },
        r = await mount(f),
        state = () => r.root.findByProps({ className: 'bsd20' }).props;
      const old = state();
      f.watch = false;
      await r.update();
      expect(state()['data-shot']).toBe(old['data-shot']);
      expect(state()['data-time']).toBe(old['data-time']);
      const range = r.root.findAllByType('input').find((n) => n.props.type === 'range')!;
      await act(() => range.props.onChange({ target: { value: '3' } }));
      expect(state()['data-time']).toBe(3);
      f.watch = true;
      await r.update();
      expect(state()['data-time']).toBe(old['data-time']);
      f.chapter = 0;
      f.chapterTime = 0;
      f.watch = false;
      await r.update();
      expect(state()['data-chapter']).toBe(ch);
      expect(state()['data-time']).toBe(3);
      await act(() =>
        r.root.findByType('select').props.onChange({ target: { value: String((ch + 1) % 9) } }),
      );
      expect(state()['data-chapter']).toBe((ch + 1) % 9);
      await act(() =>
        r.root.findByType('select').props.onChange({ target: { value: String(ch) } }),
      );
      expect(state()['data-time']).toBe(3);
      await r.close();
    }
  });
it('zero enzyme or zero product use changes the tracked carbon fate; manual flags do not alter the film', async () => {
  locale = 'en';
  const f = { ...initial, chapter: 8, chapterTime: 24, watch: false },
    r = await mount(f);
  const button = (name: string) =>
    r.root.findAllByType('button').find((n) => n.children.join('') === name)!;
  await act(() => button('Outside cleavage').props.onClick());
  expect(r.root.findAll((n) => n.props['data-pool-name'] === 'polymer')).toHaveLength(24);
  await act(() => button('Outside cleavage').props.onClick());
  await act(() => button('Further use').props.onClick());
  expect(r.root.findAll((n) => n.props['data-pool-name'] === 'other')).toHaveLength(0);
  f.watch = true;
  await r.update();
  expect(r.root.findAll((n) => n.props['data-pool-name'] === 'other').length).toBeGreaterThan(0);
  await r.close();
});
it('leaves measurements blank and accepts an observed zero rather than replacing it with the model', async () => {
  const r = await mount({ ...initial, chapter: 2, chapterTime: 4, watch: false });
  const inputs = r.root.findAllByType('input').filter((n) => n.props.type === 'number');
  expect(inputs.map((n) => n.props.value)).toEqual(['', '', '', '']);
  await act(() => inputs[0].props.onChange({ target: { value: '2' } }));
  await act(() => inputs[1].props.onChange({ target: { value: '0' } }));
  expect(r.root.findAllByType('strong')[0].children.join('')).toBe('2 → 0 g');
  await r.close();
});

for (const lang of ['zh', 'en'])
  it(`${lang}: aliquot source identities never switch midway through a transfer`, async () => {
    locale = lang;
    const f = { ...initial, chapter: 5, chapterTime: 13.9 },
      r = await mount(f);
    const split = () => r.root.find((n) => n.props['data-sample'] !== undefined);
    expect(split().props['data-sample']).toBe('A');
    expect(split().props['data-aliquots']).toBe('10,10');
    f.chapterTime = 14;
    await r.update();
    expect(split().props['data-sample']).toBe('B');
    expect(split().props['data-source-ml']).toBe(40);
    expect(split().props['data-aliquots']).toBe('0,0');
    f.watch = false;
    await r.update();
    expect(split().props['data-sample']).toBe('B');
    expect(split().props['data-transfer-progress']).toBe(0);
    await r.close();
  });

it('renders no phantom receiving liquid at zero volume and clips positive liquid to the tube interior', async () => {
  const f = { ...initial, chapter: 5, chapterTime: 14 },
    r = await mount(f);
  expect(r.root.findAll((n) => n.props['data-aliquot-liquid'] !== undefined)).toHaveLength(0);
  f.chapterTime = 26;
  await r.update();
  const liquid = r.root.findAll((n) => n.props['data-aliquot-liquid'] !== undefined);
  expect(liquid).toHaveLength(2);
  for (const x of liquid) {
    expect(x.props.height).toBe(70);
    expect(x.props.clipPath).toMatch(/^url/);
  }
  await r.close();
});

it('uses the model gate opening and stroked portion dimensions in the actual rendered paths', async () => {
  const r = await mount({ ...initial, chapterTime: 17.2 });
  const gate = r.root
    .findAllByType('path')
    .find((x) => x.props['data-gate-clear-width'] !== undefined)!;
  expect(gate.props['data-gate-clear-width']).toBe(35);
  expect(gate.props.d).toBe('M116 149V170M156 149V170');
  for (const n of r.root.findAll((n) => n.props['data-carbon-id'])) {
    const rect = n.findByType('rect');
    expect(rect.props.width + rect.props.strokeWidth).toBe(29);
    expect(gate.props['data-gate-clear-width'] - (rect.props.width + rect.props.strokeWidth)).toBe(
      6,
    );
  }
  await r.close();
});

for (const lang of ['zh', 'en'])
  it(`${lang}: first boolean edit pins the entire visible shot across Watch reset`, async () => {
    locale = lang;
    const f = { ...initial, chapter: 4, chapterTime: 12, watch: false },
      r = await mount(f);
    const state = () => r.root.findByProps({ className: 'bsd20' }).props;
    const button = r.root
      .findAllByType('button')
      .find((n) => n.children.join('') === (lang === 'en' ? 'Outside cleavage' : '胞外酶切'))!;
    await act(() => button.props.onClick());
    const saved = state();
    f.watch = true;
    f.chapter = 0;
    f.chapterTime = 0;
    await r.update();
    expect(state()['data-chapter']).toBe(0);
    f.watch = false;
    await r.update();
    expect(state()['data-chapter']).toBe(4);
    expect(state()['data-time']).toBe(saved['data-time']);
    expect(state()['data-shot']).toBe(saved['data-shot']);
    expect(
      r.root
        .findAllByType('button')
        .find((n) => n.children.join('') === (lang === 'en' ? 'Outside cleavage' : '胞外酶切'))!
        .props['aria-pressed'],
    ).toBe(false);
    await r.close();
  });
