import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi } from 'vitest';
import DynamicMassLab from './DynamicMassLab';
const film = vi.hoisted(() => ({ watch: true, chapter: 2, chapterTime: 8, chapterProgress: 0.5 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 264, compact: true }),
}));
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) =>
    createElement(
      'select',
      { ...p, 'aria-label': p.label },
      p.options.map((o: any) => createElement('option', { value: o.value, key: o.value }, o.label)),
    ),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('fresh Explore inherits the current physical state; manual choices persist and Watch remains authored', async () => {
  film.watch = true;
  film.chapter = 2;
  film.chapterTime = 8;
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(DynamicMassLab));
  });
  const host = () => r.root.findByType('section');
  const before = { ...host().props };
  film.watch = false;
  await act(() => r.update(createElement(DynamicMassLab)));
  for (const k of Object.keys(before).filter((k) => k.startsWith('data-')))
    expect(host().props[k]).toEqual(before[k]);
  const slider = r.root.findAllByType('input')[0]!;
  const label = slider.props['aria-label'];
  const original = slider.props.value;
  const changed = slider.props.min;
  await act(() => slider.props.onChange(changed));
  expect(
    r.root.findAllByType('input').find((n) => n.props['aria-label'] === label)!.props.value,
  ).toBe(changed);
  film.watch = true;
  await act(() => r.update(createElement(DynamicMassLab)));
  for (const k of Object.keys(before).filter((k) => k.startsWith('data-')))
    expect(host().props[k]).toEqual(before[k]);
  film.watch = false;
  await act(() => r.update(createElement(DynamicMassLab)));
  expect(
    r.root.findAllByType('input').find((n) => n.props['aria-label'] === label)!.props.value,
  ).toBe(changed);
  expect(original).not.toBeUndefined();
  await act(() => r.unmount());
});
it('every chapter renders finite SVG geometry and preserves its entry view', async () => {
  for (let chapter = 0; chapter < 4; chapter++) {
    film.watch = true;
    film.chapter = chapter;
    film.chapterTime = 12;
    let r!: ReactTestRenderer;
    await act(() => {
      r = create(createElement(DynamicMassLab));
    });
    const before = r.root.findByType('section').props['data-dynamic-view'];
    film.watch = false;
    await act(() => r.update(createElement(DynamicMassLab)));
    expect(r.root.findByType('section').props['data-dynamic-view']).toBe(before);
    expect(JSON.stringify(r.toJSON())).not.toMatch(/NaN|Infinity/);
    await act(() => r.unmount());
  }
});

it('40 N / requested 1 s displays one common actual time in both apparatuses and isolates Watch', async () => {
  film.watch = true;
  film.chapter = 3;
  film.chapterTime = 25;
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(DynamicMassLab));
  });
  const host = () => r.root.findByType('section');
  const apparatuses = () =>
    r.root.findAllByType('svg').filter((n) => n.props['data-dynamic-apparatus']);
  expect(apparatuses().map((n) => n.props['data-observation-time'])).toEqual([1, 1]);
  film.watch = false;
  await act(() => r.update(createElement(DynamicMassLab)));
  const range = (label: string) =>
    r.root.findAllByType('input').find((n) => n.props['aria-label'] === label)!;
  await act(() => range('恒定拉力').props.onChange(40));
  await act(() => range('Requested time').props.onChange(1));
  const stop = Math.sqrt((0.5 * 68) / 40);
  expect(host().props['data-time']).toBeCloseTo(stop, 14);
  expect(host().props['data-requested-time']).toBe(1);
  expect(host().props['data-comparison-limited']).toBe(true);
  expect(apparatuses().map((n) => n.props['data-observation-time'])).toEqual([stop, stop]);
  expect(apparatuses()[0].props['data-position']).toBeCloseTo(0.25, 14);
  expect(apparatuses()[1].props['data-position']).toBeCloseTo((0.25 * 68) / 88, 14);
  expect(JSON.stringify(r.toJSON())).toContain('0.922');
  expect(JSON.stringify(r.toJSON())).toContain('both freeze at that instant');
  film.watch = true;
  await act(() => r.update(createElement(DynamicMassLab)));
  expect(host().props['data-force']).toBe(25);
  expect(apparatuses().map((n) => n.props['data-observation-time'])).toEqual([1, 1]);
  film.watch = false;
  await act(() => r.update(createElement(DynamicMassLab)));
  expect(host().props['data-force']).toBe(40);
  expect(apparatuses().map((n) => n.props['data-observation-time'])).toEqual([stop, stop]);
  await act(() => r.unmount());
});
