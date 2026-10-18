import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import GravityMeasurements from './GravityMeasurements';
const film = vi.hoisted(() => ({
  watch: false,
  chapter: 0,
  chapterProgress: 0,
  chapterTime: 0,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: undefined, width: 280, compact: true }),
}));
vi.mock('../lab/Controls', async (original) => ({
  ...(await original<typeof import('../lab/Controls')>()),
  Range: (props: { label: string; value: number; onChange: (value: number) => void }) =>
    createElement('input', { ...props, 'aria-label': props.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounts: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const v of mounts.splice(0)) await act(() => v.unmount());
});
async function mount(variant = '', chapter = 0) {
  Object.assign(film, { watch: false, chapter, chapterProgress: 0, chapterTime: 0, variant });
  let v!: ReactTestRenderer;
  await act(() => {
    v = create(createElement(GravityMeasurements));
  });
  mounts.push(v);
  return v;
}
const host = (v: ReactTestRenderer) => v.root.findByType('section');
const button = (v: ReactTestRenderer, title: string) =>
  v.root.findAllByType('button').find((n) => n.children.join('') === title)!;
const input = (v: ReactTestRenderer, title: string) =>
  v.root.findAllByType('input').find((n) => n.props['aria-label'] === title)!;
async function rerender(v: ReactTestRenderer) {
  await act(() => v.update(createElement(GravityMeasurements)));
}
it('opens the actual apparatus of each textbook window', async () => {
  for (const [id, mode, shot] of [
    ['required-2-moon-earth-test', 0, 'prediction'],
    ['required-2-cavendish', 1, 'force'],
    ['required-2-newton-cannon', 2, 'orbit'],
  ] as const) {
    const v = await mount(id);
    expect(host(v).props['data-gravity-mode']).toBe(mode);
    expect(host(v).props['data-gravity-shot']).toBe(shot);
  }
});
it('uses the current chapter when opening explore, then retains an explicit system choice', async () => {
  const v = await mount('', 4);
  expect(host(v).props['data-gravity-mode']).toBe(2);
  await act(() => button(v, 'Torsion balance').props.onClick());
  await act(() => input(v, 'Model attractor mass / kg').props.onChange(79));
  film.watch = true;
  await rerender(v);
  expect(host(v).props['data-gravity-mode']).toBe(2);
  film.watch = false;
  await rerender(v);
  expect(host(v).props['data-gravity-mode']).toBe(1);
  expect(input(v, 'Model attractor mass / kg').props.value).toBe(79);
});
it('moves a hypothetical body and changes its prediction without changing the lunar reference', async () => {
  const v = await mount('required-2-moon-earth-test');
  const ref = host(v).props['data-reference'];
  const body = () => v.root.find((n) => n.props['data-hypothetical-distance'] !== undefined);
  const initialX = body().props.cx;
  const prediction = () =>
    v.root.find((n) => n.props['data-gravity-prediction'] === 'true').children.join('');
  const before = prediction();
  await act(() => input(v, 'Hypothetical distance / lunar distance').props.onChange(2));
  expect(body().props.cx).toBeGreaterThan(initialX);
  expect(body().props['data-hypothetical-distance']).toBe(2);
  expect(prediction()).not.toBe(before);
  expect(host(v).props['data-reference']).toBe(ref);
});
it('preserves each published record path through model edits and run changes', async () => {
  const v = await mount('required-2-cavendish');
  await act(() => button(v, 'Published results').props.onClick());
  const points = () => v.root.find((n) => n.props['data-point-count'] !== undefined);
  const initial = points().props;
  await act(() => button(v, '2 · S₂').props.onClick());
  expect(points().props['data-point-count']).toBe(654);
  await act(() => button(v, 'Forces').props.onClick());
  await act(() => input(v, 'Model attractor mass / kg').props.onChange(200));
  await act(() => button(v, 'Published results').props.onClick());
  await act(() => button(v, '1 · S₁').props.onClick());
  expect(points().props['data-point-count']).toBe(617);
  expect(points().props.d).toBe(initial.d);
});
it('withholds the inferred result before its reveal and restores the question on rewind', async () => {
  const v = await mount('required-2-cavendish');
  Object.assign(film, { watch: true, chapter: 3, chapterProgress: 0.56, chapterTime: 28 });
  await rerender(v);
  const answer = () => v.root.find((n) => n.props['data-inferred-g-visible'] !== undefined);
  expect(answer().children.join('')).toBe('G = ?');
  film.chapterProgress = 0.68;
  film.chapterTime = 29.5;
  await rerender(v);
  expect(answer().children.join('')).toContain('6.5');
  film.chapterProgress = 0.56;
  film.chapterTime = 28;
  await rerender(v);
  expect(answer().children.join('')).toBe('G = ?');
});

it('ties the visible lunar result to the spoken result rather than overall progress', async () => {
  const v = await mount('required-2-moon-earth-test');
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.9, chapterTime: 12 });
  await rerender(v);
  const prediction = () =>
    v.root.find((n) => n.props['data-gravity-prediction'] === 'true').children.join('');
  expect(prediction()).toBe('a = ?');
  film.chapterTime = 18;
  await rerender(v);
  expect(prediction()).toContain('0.002692');
  film.chapterTime = 12;
  await rerender(v);
  expect(prediction()).toBe('a = ?');
});
