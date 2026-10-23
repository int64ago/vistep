import { it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioPopulationGrowth';
let locale = 'en';
vi.mock('../../i18n', () => ({ browserLocale: () => locale }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 272, compact: true }),
}));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const initial: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 3,
  run: 0,
  duration: 278.5,
  chapters: [0, 23.5, 48.5, 74, 118, 141.5, 165.5, 190.5, 228.5, 252].map((at, i) => ({
    id: String(i),
    at,
    title: '',
    titleEn: '',
    caption: '',
    captionEn: '',
  })),
  chapterTime: 33,
  chapterProgress: 0.77,
};
async function mount(film: Director) {
  let r: ReturnType<typeof create>;
  const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
  await act(() => {
    r = create(node());
  });
  return {
    get root() {
      return r!.root;
    },
    update: () => act(() => r!.update(node())),
    close: () => act(() => r!.unmount()),
    json: () => JSON.stringify(r!.toJSON()),
  };
}
for (const lang of ['zh', 'en'])
  it(`${lang}: fresh Explore follows the current causal shot; manual settings persist and do not leak into watch`, async () => {
    locale = lang;
    const f = { ...initial },
      r = await mount(f),
      population = () =>
        r.root.findAll((n) => n.props['data-population'] !== undefined)[0].props['data-population'];
    const before = population();
    f.watch = false;
    await r.update();
    expect(population()).toBe(before);
    const progress = r.root
      .findAllByType('input')
      .find((n) => n.props.type === 'range' && n.props.max === 44)!;
    await act(() => progress.props.onChange({ target: { value: '39' } }));
    const advanced = population();
    expect(advanced).not.toBe(before);
    await act(() => r.root.findByType('select').props.onChange({ target: { value: '8' } }));
    expect(r.root.findByProps({ className: 'bpg19' }).props['data-chapter']).toBe(8);
    f.watch = true;
    await r.update();
    expect(population()).toBe(before);
    f.watch = false;
    await r.update();
    expect(r.root.findByProps({ className: 'bpg19' }).props['data-chapter']).toBe(8);
    await act(() => r.root.findByType('select').props.onChange({ target: { value: '3' } }));
    expect(population()).toBe(advanced);
    await r.close();
  });
it('changing current dilution does not rewrite a recorded sample and zero remains distinct from missing', async () => {
  locale = 'en';
  const r = await mount({ ...initial, watch: false, chapter: 7, chapterTime: 5 });
  const button = (text: string) =>
    r.root.findAllByType('button').find((n) => n.children.join('') === text)!;
  await act(() => button('Use my count records').props.onClick());
  const input = (name: string) =>
    r.root.findAllByType('input').find((n) => n.props['aria-label'] === name)!;
  await act(() => input('Count 1').props.onChange({ target: { value: '20' } }));
  const row = () => r.root.findAll((n) => n.props['data-day'] === 3)[0].props;
  expect(row()['data-mean']).toBe(50_000_000);
  expect(row()['data-repeats']).toBe(1);
  await act(() => input('Current sample dilution').props.onChange({ target: { value: '5' } }));
  expect(row()['data-mean']).toBe(50_000_000);
  await act(() => input('Count 2').props.onChange({ target: { value: '40' } }));
  expect(row()['data-mean']).toBe(50_000_000);
  expect(row()['data-repeats']).toBe(2);
  await act(() => input('Count 1').props.onChange({ target: { value: '0' } }));
  expect(row()['data-repeats']).toBe(2);
  await act(() => input('Count 1').props.onChange({ target: { value: '' } }));
  expect(row()['data-repeats']).toBe(1);
  await r.close();
});
it('a different proposed cause changes the predicted budding without altering fixed observations', async () => {
  locale = 'en';
  const f = { ...initial, watch: false, chapter: 7, chapterTime: 35 },
    r = await mount(f);
  const fed = () =>
    r.root.findAll((n) => n.props['data-fed'] === true)[0].props['data-expected-count'];
  expect(fed()).toBe(8);
  await act(() =>
    r.root
      .findAllByType('button')
      .find((n) => n.children.join('') === 'Other inhibition')!
      .props.onClick(),
  );
  expect(fed()).toBe(4);
  f.watch = true;
  await r.update();
  expect(fed()).toBe(8);
  f.watch = false;
  await r.update();
  expect(fed()).toBe(4);
  await r.close();
});

it('the finite-food comparison is fixed and does not repurpose capacity as consumer count', async () => {
  locale = 'en';
  const f = { ...initial, watch: false, chapterTime: 35 },
    r = await mount(f);
  const range = (max: number) =>
    r.root.findAllByType('input').find((n) => Number(n.props.max) === max)!;
  await act(() => range(650).props.onChange({ target: { value: '200' } }));
  await act(() => range(44).props.onChange({ target: { value: '3.8' } }));
  expect(
    r.root.findAll((n) => n.props['data-food-consumers'] !== undefined)[0].props[
      'data-food-consumers'
    ],
  ).toBe(3);
  expect(r.root.findAllByType('input').some((n) => Number(n.props.max) === 650)).toBe(false);
  await act(() => range(44).props.onChange({ target: { value: '6.8' } }));
  expect(
    r.root.findAll((n) => n.props['data-food-consumers'] !== undefined)[0].props[
      'data-food-consumers'
    ],
  ).toBe(12);
  expect(r.root.findAll((n) => n.props['data-food']).length).toBe(24);
  await r.close();
});

for (const lang of ['zh', 'en'])
  it(`${lang}: the renewal note agrees with the actual selected interval at every capacity`, async () => {
    locale = lang;
    const f = { ...initial, watch: false, chapterTime: lang === 'en' ? 27.95 : 30.4 },
      r = await mount(f);
    const capacity = () => r.root.findAllByType('input').find((n) => Number(n.props.max) === 650)!;
    const note = () => r.root.findByProps({ className: 'bpg19-note' }).children.join('');
    const count = () =>
      r.root.findAll((n) => n.props['data-cohort-count'] !== undefined)[0].props[
        'data-cohort-count'
      ];
    for (const k of [200, 375, 650]) {
      await act(() => capacity().props.onChange({ target: { value: String(k) } }));
      const expected =
        count() === 4
          ? lang === 'zh'
            ? '本段净增为 0，继续追踪个体。'
            : 'Net change is 0; follow the individuals.'
          : count() > 4
            ? lang === 'zh'
              ? '本段出生多于死亡。'
              : 'Births exceed deaths in this interval.'
            : lang === 'zh'
              ? '本段死亡多于出生。'
              : 'Deaths exceed births in this interval.';
      expect(note()).toBe(expected);
    }
    await act(() => capacity().props.onChange({ target: { value: '200' } }));
    expect(count()).toBe(2);
    f.watch = true;
    await r.update();
    expect(count()).toBe(4);
    f.watch = false;
    await r.update();
    expect(count()).toBe(2);
    await r.close();
  });

for (const lang of ['zh', 'en'])
  it(`${lang}: measured chapter durations govern all Explore themes, including another watch chapter`, async () => {
    locale = lang;
    const f = { ...initial, chapter: 0, chapterTime: 7, watch: false },
      r = await mount(f);
    const range = () =>
      r.root
        .findAllByType('input')
        .find((n) => n.props['aria-label'] === (lang === 'en' ? 'Progress' : '过程位置'))!;
    await act(() => r.root.findByType('select').props.onChange({ target: { value: '3' } }));
    expect(range().props.max).toBe(44);
    expect(range().props.value).toBeCloseTo(30.8);
    await act(() => range().props.onChange({ target: { value: '43.9' } }));
    f.watch = true;
    await r.update();
    f.watch = false;
    await r.update();
    expect(range().props.value).toBe(43.9);
    await act(() => r.root.findByType('select').props.onChange({ target: { value: '7' } }));
    expect(range().props.max).toBe(38);
    expect(range().props.value).toBeCloseTo(26.6);
    await r.close();
  });
