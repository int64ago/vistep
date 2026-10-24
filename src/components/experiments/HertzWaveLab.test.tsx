import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './HertzWaveLab';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 3,
  chapterProgress: 0.2,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const state = () =>
  Object.fromEntries(
    Object.entries(r!.root.find((n) => n.props.className === 'hz20').props).filter(
      ([k]) => k.startsWith('data-') && k !== 'data-watch',
    ),
  );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterTime: 3, chapterProgress: 0.2 });
});
it('fresh Explore inherits each current apparatus, local view and computed parameter', async () => {
  for (let c = 0; c < 6; c++)
    for (const t of [2, 8, 18, 25]) {
      Object.assign(film, { watch: true, chapter: c, chapterTime: t });
      await act(() => {
        r = create(createElement(Scene));
      });
      const a = state();
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toEqual(a);
      await act(() => r!.unmount());
      r = undefined;
    }
});
it('manual values persist through Watch without leaking into the director', async () => {
  Object.assign(film, { watch: false, chapter: 4, chapterTime: 8 });
  await act(() => {
    r = create(createElement(Scene));
  });
  const input = r!.root.findAll((n) => n.props['aria-label'] === 'Loop normal–field angle')[0];
  await act(() => input.props.onChange(90));
  const a = state();
  expect(a['data-angle']).toBeCloseTo((90 * Math.PI) / 180, 12);
  Object.assign(film, { watch: true, chapter: 0, chapterTime: 0 });
  await act(() => r!.update(createElement(Scene)));
  expect(state()).not.toEqual(a);
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  expect(state()).toEqual(a);
});
it('all ordinary frames have finite actual SVG attributes', async () => {
  for (let c = 0; c < 6; c++) {
    Object.assign(film, { watch: true, chapter: c, chapterTime: 20 });
    await act(() => {
      r = create(createElement(Scene));
    });
    expect(JSON.stringify(r!.toJSON())).not.toMatch(/NaN|Infinity/);
    await act(() => r!.unmount());
    r = undefined;
  }
});

it('reception uses the aligned apparatus after a manual polarization intervention', async () => {
  Object.assign(film, { watch: false, chapter: 4, chapterTime: 8 });
  await act(() => {
    r = create(createElement(Scene));
  });
  await act(() =>
    r!.root
      .findAll((n) => n.props['aria-label'] === 'Loop normal–field angle')[0]
      .props.onChange(90),
  );
  expect(Math.abs(Number(state()['data-response']))).toBeLessThan(1e-12);
  await act(() =>
    r!.root.findAll((n) => n.props['aria-label'] === 'Choose wave evidence')[0].props.onChange('1'),
  );
  expect(Number(state()['data-response'])).toBeGreaterThan(0.1);
  expect(Number(state()['data-angle'])).toBeCloseTo(Math.PI / 2, 12);
});
