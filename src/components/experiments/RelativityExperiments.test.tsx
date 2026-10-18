import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import RelativityExperiments, { RelativityArtwork } from './RelativityExperiments';
const film = vi.hoisted(() => ({
  watch: false,
  chapter: 0,
  chapterProgress: 0.6,
  chapterTime: 0,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: {
    label: string;
    onChange: (n: number) => void;
    value: number;
    min: number;
    max: number;
  }) => createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const v of mounted.splice(0)) await act(() => v.unmount());
  Object.assign(film, {
    watch: false,
    chapter: 0,
    chapterProgress: 0.6,
    chapterTime: 0,
    variant: '',
  });
});
const button = (v: ReactTestRenderer, name: string) =>
  v.root.findAllByType('button').find((b) => b.children.join('') === name)!;
const input = (v: ReactTestRenderer, name: string) =>
  v.root.findAllByType('input').find((b) => b.props['aria-label'] === name)!;
const mount = async () => {
  let v!: ReactTestRenderer;
  await act(() => {
    v = create(createElement(RelativityExperiments));
  });
  mounted.push(v);
  return v;
};
it('all four textbook windows choose the right apparatus before and after watch/explore', async () => {
  const ids = [
    'required-2-michelson-morley',
    'required-2-simultaneity',
    'required-2-muons',
    'required-2-atomic-clocks',
  ];
  for (let i = 0; i < ids.length; i++) {
    Object.assign(film, { variant: ids[i], chapter: 2 * i, watch: true });
    const v = await mount();
    const authored = v.root.findByType(RelativityArtwork).props;
    film.watch = false;
    await act(() => v.update(createElement(RelativityExperiments)));
    expect(v.root.findByType(RelativityArtwork).props.mode).toBe(i);
    await act(() => button(v, 'Atomic clocks').props.onClick());
    await act(() => input(v, 'Flight altitude / m').props.onChange(0));
    film.watch = true;
    await act(() => v.update(createElement(RelativityExperiments)));
    expect(v.root.findByType(RelativityArtwork).props).toEqual(authored);
    film.watch = false;
    await act(() => v.update(createElement(RelativityExperiments)));
    expect(v.root.findByType(RelativityArtwork).props.height).toBe(0);
  }
});
it('reversing the train changes actual wall arrival order, with the same A/B identities', async () => {
  film.variant = 'required-2-simultaneity';
  const v = await mount();
  await act(() => input(v, 'Train velocity / c').props.onChange(-0.6));
  await act(() => input(v, 'Observation progress').props.onChange(0.4));
  const walls = v.root.findAll((n) => n.props['data-wall-side'] !== undefined);
  expect(walls.map((w) => w.props['data-wall-side'])).toEqual([-1, 1]);
  expect(walls.map((w) => w.props['data-arrived'])).toEqual([false, true]);
  await act(() => button(v, 'Train frame').props.onClick());
  expect(
    v.root
      .findAll((n) => n.props['data-wall-side'] !== undefined)
      .every((w) => !w.props['data-arrived']),
  ).toBe(true);
  await act(() => input(v, 'Observation progress').props.onChange(1));
  expect(
    v.root
      .findAll((n) => n.props['data-wall-side'] !== undefined)
      .every((w) => w.props['data-arrived']),
  ).toBe(true);
});
it('changing model controls cannot modify the published four-clock records', async () => {
  film.variant = 'required-2-atomic-clocks';
  const v = await mount();
  await act(() => button(v, 'Published clock results').props.onClick());
  const offsets = () =>
    v.root
      .findAll((n) => n.props['data-offset-ns'] !== undefined)
      .map((n) => [n.props['data-clock-id'], n.props['data-offset-ns']]);
  const before = offsets();
  await act(() => input(v, 'Flight altitude / m').props.onChange(0));
  await act(() => button(v, 'Published clock results').props.onClick());
  expect(offsets()).toEqual(before);
  await act(() => button(v, 'Fly west').props.onClick());
  expect(offsets()).toEqual([
    [120, 277],
    [361, 284],
    [408, 266],
    [447, 266],
  ]);
});
it('unrevealed records contain neither hidden result markers nor answer-sized bars', () => {
  const before = renderToStaticMarkup(
    createElement(RelativityArtwork, { mode: 2, shot: 'muon-records', reveal: false, width: 268 }),
  );
  const after = renderToStaticMarkup(
    createElement(RelativityArtwork, { mode: 2, shot: 'muon-records', reveal: true, width: 268 }),
  );
  expect(before).not.toContain('data-record-count="412"');
  expect(after).toContain('data-record-count="412"');
  const hidden = renderToStaticMarkup(
    createElement(RelativityArtwork, { mode: 3, shot: 'clock-records', reveal: false, width: 268 }),
  );
  expect(hidden).not.toContain('−59');
  expect(hidden).not.toContain('-59 ±');
  expect(hidden).toContain('Not revealed yet');
});
