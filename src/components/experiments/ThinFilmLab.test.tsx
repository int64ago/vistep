import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, it, expect, vi } from 'vitest';
import ThinFilmLab, { ThinFilmArtwork } from './ThinFilmLab';
const language = vi.hoisted(() => ({ value: 'en' }));
const film = vi.hoisted(() => ({ watch: true, chapter: 0, chapterTime: 12, chapterProgress: 0.3 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => language.value }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  language.value = 'en';
  Object.assign(film, { watch: true, chapter: 0, chapterTime: 12, chapterProgress: 0.3 });
});
const shot = () => r!.root.findByType(ThinFilmArtwork).props.shot;
const control = (s: string) => r!.root.findAll((n) => n.props['aria-label'] === s)[0]!;
it('fresh exploration preserves the actual current apparatus, subview and calculations', async () => {
  for (const [c, t] of [
    [0, 12],
    [0, 34],
    [1, 11],
    [2, 18],
    [3, 15],
    [4, 10],
    [4, 20],
  ]) {
    Object.assign(film, { watch: true, chapter: c, chapterTime: t });
    await act(() => {
      r = create(createElement(ThinFilmLab));
    });
    const before = shot();
    film.watch = false;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(shot()).toEqual(before);
    await act(() => r!.unmount());
    r = undefined;
  }
});
it('manual choices persist while watch restores the exact authored state', async () => {
  await act(() => {
    r = create(createElement(ThinFilmLab));
  });
  const authored = shot();
  film.watch = false;
  await act(() => r!.update(createElement(ThinFilmLab)));
  await act(() => control('Film apparatus').props.onChange('1'));
  await act(() => control('Spacer sheets').props.onChange('1'));
  expect(shot()).toMatchObject({ mode: 1, view: 'wedge', sheets: 1, reveal: false, angle: 0 });
  await act(() => r!.root.findAllByType('button')[0]!.props.onClick());
  expect(shot().reveal).toBe(true);
  film.watch = true;
  await act(() => r!.update(createElement(ThinFilmLab)));
  expect(shot()).toEqual(authored);
  film.watch = false;
  await act(() => r!.update(createElement(ThinFilmLab)));
  expect(shot()).toMatchObject({ mode: 1, sheets: 1, reveal: true });
});
it('angle, thickness and wavelength controls alter the same optical state; returning to normal wedge clears the angle', async () => {
  film.watch = false;
  await act(() => {
    r = create(createElement(ThinFilmLab));
  });
  await act(() => control('Incidence angle / °').props.onChange(35));
  await act(() => control('Local thickness / nm').props.onChange(650));
  await act(() => control('Wavelength / nm').props.onChange(450));
  expect(shot()).toMatchObject({ angle: 35, thickness: 650, wavelength: 450 });
  await act(() => control('Film apparatus').props.onChange('1'));
  expect(shot().angle).toBe(0);
  await act(() => control('Observation view').props.onChange('paths'));
  await act(() => control('Incidence angle / °').props.onChange(35));
  await act(() => control('Observation view').props.onChange('wedge'));
  expect(shot().angle).toBe(0);
});

it('the color closeup samples its visible centre at every chosen local thickness, even after a different drainage choice', async () => {
  film.watch = false;
  await act(() => {
    r = create(createElement(ThinFilmLab));
  });
  await act(() => control('Observation view').props.onChange('observation'));
  await act(() => control('Relative thickness').props.onChange(0.15));
  await act(() => control('Observation view').props.onChange('colors'));
  for (const d of [0, 100, 650]) {
    await act(() => control('Local thickness / nm').props.onChange(d));
    const marker = r!.root.findAll(
      (n) => n.type === 'path' && n.props['data-selected-thickness'] !== undefined,
    )[0]!;
    expect(marker.props['data-selected-thickness']).toBe(d);
    expect(marker.props['data-contour-y']).toBe(0.5);
    expect(
      r!.root.findAll((n) => n.type === 'rect' && n.props['data-color-wave'] !== undefined),
    ).toHaveLength(3);
  }
});

import { FILM_CUTS } from '../../models/thin-film-lab';
it('renders each actual measured path/phase reveal and carries a held prediction into Explore', async () => {
  for (const locale of ['zh', 'en'] as const) {
    language.value = locale;
    const k = FILM_CUTS[locale];
    Object.assign(film, { watch: true, chapter: 0, chapterTime: k.soap.paths + 0.05 });
    await act(() => {
      r = create(createElement(ThinFilmLab));
    });
    const parts = (attribute: string) =>
      r!.root.findAll((n) => n.type === 'path' && n.props[attribute] !== undefined);
    expect(parts('data-optical-route').map((n) => n.props['data-optical-route'])).toEqual([
      'incident',
      'front',
    ]);
    film.chapterTime = k.soap.internal + 0.05;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(parts('data-optical-route')).toHaveLength(3);
    expect(r!.root.findAll((n) => n.props['data-phase-boundary'])).toHaveLength(0);
    film.chapterTime = k.soap.frontPhase + 0.05;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(
      r!.root
        .findAll((n) => n.props['data-phase-boundary'])
        .map((n) => n.props['data-phase-boundary']),
    ).toEqual(['front']);
    film.chapterTime = k.soap.wavefront + 0.05;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(parts('data-optical-reference')).toHaveLength(1);
    film.chapterTime = k.soap.collapse - 0.05;
    await act(() => r!.update(createElement(ThinFilmLab)));
    const held = shot();
    expect(held.reveal).toBe(false);
    film.watch = false;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(shot()).toEqual(held);
    await act(() =>
      control(locale === 'en' ? 'Local thickness / nm' : '局部膜厚 / nm').props.onChange(0),
    );
    expect(shot()).toMatchObject({ thickness: 0, reveal: true });
    film.watch = true;
    await act(() => r!.update(createElement(ThinFilmLab)));
    expect(shot()).toEqual(held);
    await act(() => r!.unmount());
    r = undefined;
  }
});
