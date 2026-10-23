import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, it, expect, vi } from 'vitest';
import {
  fresnelSlit,
  diffractionDisplayColor,
  SLIT_EXPOSURE,
  diffractionDirector,
} from '../../models/optical-diffraction-lab';
import OpticalDiffractionLab, { OpticalDiffractionArtwork } from './OpticalDiffractionLab';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 12,
  chapterProgress: 0.3,
  locale: 'en' as 'en' | 'zh',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => film.locale }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, {
    watch: true,
    chapter: 0,
    chapterTime: 12,
    chapterProgress: 0.3,
    locale: 'en' as 'en' | 'zh',
  });
});
const shot = () => r!.root.findByType(OpticalDiffractionArtwork).props.shot;
const control = (label: string) => r!.root.findAll((n) => n.props['aria-label'] === label)[0]!;
it('fresh Explore preserves current subview, input values and unrevealed questions in both windows', async () => {
  for (const [c, t] of [
    [0, 12],
    [1, 10],
    [1, 18],
    [1, 31],
    [2, 20],
    [3, 18],
    [4, 9],
    [5, 8],
    [6, 4],
    [6, 15],
    [6, 32],
    [7, 20],
  ]) {
    Object.assign(film, { watch: true, chapter: c, chapterTime: t });
    await act(() => {
      r = create(createElement(OpticalDiffractionLab));
    });
    const a = shot();
    film.watch = false;
    await act(() => r!.update(createElement(OpticalDiffractionLab)));
    expect(shot()).toEqual(a);
    await act(() => r!.unmount());
    r = undefined;
  }
});
it('manual apparatus and sample choices persist but do not alter watch director', async () => {
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  const a = shot();
  film.watch = false;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  await act(() => control('Apparatus').props.onChange('1'));
  expect(shot()).toMatchObject({ mode: 1, view: 'shadow', reveal: false });
  await act(() => control('Radius / mm').props.onChange(0.9));
  await act(() => r!.root.findAllByType('button')[0]!.props.onClick());
  expect(shot()).toMatchObject({ mode: 1, radius: 0.9, view: 'disk', reveal: true });
  film.watch = true;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  expect(shot()).toEqual(a);
  film.watch = false;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  expect(shot()).toMatchObject({ mode: 1, radius: 0.9, view: 'disk' });
});
it('prediction hides actual screen results until explicit reveal, and changing the gap resets the question', async () => {
  Object.assign(film, { watch: false, chapter: 1, chapterTime: 31 });
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  const screen = () =>
    r!.root.findAll((n) => n.type === 'rect' && n.props['data-screen-x'] !== undefined);
  expect(screen()).toHaveLength(0);
  await act(() => r!.root.findAllByType('button')[0]!.props.onClick());
  expect(screen()).toHaveLength(301);
  await act(() => control('Slit width / μm').props.onChange(80));
  expect(screen()).toHaveLength(0);
  expect(shot()).toMatchObject({ width: 80, question: true, reveal: false });
});
it('circle screen has only radii computed from the common field and no separate bright-dot graphic', async () => {
  Object.assign(film, { chapter: 6, chapterTime: 32 });
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  const rings = r!.root.findAll(
    (n) => n.type === 'circle' && n.props['data-radial-intensity'] !== undefined,
  );
  expect(rings).toHaveLength(181);
  expect(rings.at(-1)!.props['data-r']).toBe(0);
  expect(rings.at(-1)!.props['data-radial-intensity']).toBeCloseTo(1, 5);
});
it('renders pair sums from the same sampled fields: broad at center, nearly flat at the first minimum', async () => {
  Object.assign(film, { chapter: 1, chapterTime: 2 });
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  const spans = () =>
    r!.root
      .findAll((n) => n.type === 'path' && n.props['data-pair-sum'] !== undefined)
      .map((n) => {
        const ys = [...n.props.d.matchAll(/[ML](-?[\d.e+]+) (-?[\d.e+]+)/g)].map((m) =>
          Number(m[2]),
        );
        return Math.max(...ys) - Math.min(...ys);
      });
  expect(spans()).toHaveLength(4);
  for (const span of spans()) expect(span).toBeGreaterThan(30);
  film.chapterTime = 26;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  for (const span of spans()) expect(span).toBeLessThan(0.3);
});

it('keeps quantitative far-field predictions inside their valid and visible input domain after leaving a wide Fresnel view', async () => {
  Object.assign(film, { watch: false, chapter: 0, chapterTime: 0 });
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  await act(() => control('Slit width / μm').props.onChange(800));
  for (const view of ['prediction', 'pencils', 'calipers']) {
    await act(() => control('Close view').props.onChange(view));
    const a = shot().width;
    expect((a * 1e-6 * a * 1e-6) / 450e-9).toBeLessThanOrEqual(0.05);
    expect(650 / control('Slit width / μm').props.min).toBeLessThanOrEqual(15);
    expect(control('Slit width / μm').props.max).toBe(a);
  }
});

it('caliper green-to-red prediction reveals a red screen from the same wavelength-dependent physical intensity', async () => {
  Object.assign(film, { watch: true, chapter: 5, chapterTime: 2 });
  await act(() => {
    r = create(createElement(OpticalDiffractionLab));
  });
  const center = () =>
    r!.root.findAll((n) => n.type === 'rect' && n.props['data-screen-x'] === 0)[0]!;
  expect(shot().wavelength).toBe(550);
  const green = center().props.fill;
  expect(green).toBe(diffractionDisplayColor([fresnelSlit(0, 100, 550)], SLIT_EXPOSURE, 550));
  film.chapterTime = 8;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  expect(shot().wavelength).toBe(650);
  expect(center()).toBeUndefined();
  film.chapterTime = 16;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  const red = center();
  expect(red.props['data-intensity']).toBeCloseTo(fresnelSlit(0, 100, 650), 12);
  expect(red.props.fill).toBe(
    diffractionDisplayColor([red.props['data-intensity']], SLIT_EXPOSURE, 650),
  );
  expect(red.props.fill).not.toBe(green);
  film.watch = false;
  await act(() => r!.update(createElement(OpticalDiffractionLab)));
  expect(center().props.fill).toBe(red.props.fill);
});

it('remembers disk and aperture radii independently across apparatus/view switches while watch remains authored', async () => {
  for (const locale of ['zh', 'en'] as const) {
    Object.assign(film, { watch: true, chapter: 3, chapterTime: 15, locale });
    await act(() => {
      r = create(createElement(OpticalDiffractionLab));
    });
    const authored = shot(),
      labels =
        locale === 'en'
          ? ['Apparatus', 'Close view', 'Radius / mm']
          : ['观察装置', '局部观察', '半径 / mm'];
    film.watch = false;
    await act(() => r!.update(createElement(OpticalDiffractionLab)));
    expect(shot()).toEqual(authored);
    await act(() => control(labels[0]!).props.onChange('1'));
    await act(() => control(labels[2]!).props.onChange(1));
    await act(() => control(labels[0]!).props.onChange('0'));
    await act(() => control(labels[1]!).props.onChange('aperture'));
    expect(shot().radius).toBe(authored.radius);
    await act(() => control(labels[2]!).props.onChange(0.2));
    await act(() => control(labels[0]!).props.onChange('1'));
    expect(shot().radius).toBe(1);
    await act(() => control(labels[0]!).props.onChange('0'));
    await act(() => control(labels[1]!).props.onChange('aperture'));
    expect(shot().radius).toBe(0.2);
    await act(() => control(labels[2]!).props.onChange(0.4));
    await act(() => control(labels[1]!).props.onChange('screen'));
    await act(() => control(labels[1]!).props.onChange('aperture'));
    expect(shot().radius).toBe(0.4);
    film.watch = true;
    await act(() => r!.update(createElement(OpticalDiffractionLab)));
    expect(shot()).toEqual(authored);
    film.watch = false;
    await act(() => r!.update(createElement(OpticalDiffractionLab)));
    expect(shot().radius).toBe(0.4);
    await act(() => r!.unmount());
    r = undefined;
  }
});
