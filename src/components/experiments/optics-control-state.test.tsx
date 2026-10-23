import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GeometricOpticsLab, { GeometricArtwork } from './GeometricOpticsLab';
import OpticalDiffractionLab, { OpticalDiffractionArtwork } from './OpticalDiffractionLab';
import PolarizationEvidenceLab from './PolarizationEvidenceLab';
import DoubleSlitMeasurementLab from './DoubleSlitMeasurementLab';

const film = vi.hoisted(() => ({ watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 }));
vi.mock('../lab/FilmContext', () => ({
  useShowcase: () => film,
}));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (props: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (n: number) => void;
  }) => createElement('input', { ...props, 'aria-label': props.label }),
  Segments: (props: { label: string; value: string; onChange: (v: string) => void }) =>
    createElement('select', { ...props, 'aria-label': props.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() =>
  Object.assign(film, { watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 }),
);

const input = (view: ReactTestRenderer, name: string) =>
  view.root.findAllByType('input').find((n) => n.props['aria-label'] === name)!;
async function click(view: ReactTestRenderer, label: string) {
  const button = view.root.findAllByType('button').find((n) => n.children.join('') === label)!;
  await act(() => button.props.onClick());
}
async function select(view: ReactTestRenderer, label: string, value: string) {
  const control = view.root.findAllByType('select').find((n) => n.props['aria-label'] === label)!;
  await act(() => control.props.onChange(value));
}

describe('optical experiment controls keep each apparatus in its own domain', () => {
  it('preserves separate pin and plate angles across path switches', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(GeometricOpticsLab));
    });
    await act(() => input(view, 'Incidence angle / °').props.onChange(60));
    await click(view, 'Glass apparent depth');
    const plate = input(view, 'Viewing angle in air / °');
    expect(plate.props.value).toBe(25);
    expect(plate.props.value).toBeLessThanOrEqual(plate.props.max);
    await act(() => plate.props.onChange(45));
    await click(view, 'Pin alignment');
    expect(input(view, 'Incidence angle / °').props.value).toBe(60);
    await click(view, 'Glass apparent depth');
    expect(input(view, 'Viewing angle in air / °').props.value).toBe(45);
    await act(() => view.unmount());
  });

  it('keeps aperture radius independent of a larger opaque disk', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(OpticalDiffractionLab));
    });
    await select(view, 'Apparatus', '1');
    await act(() => input(view, 'Radius / mm').props.onChange(1));
    await select(view, 'Apparatus', '0');
    await select(view, 'Close view', 'aperture');
    expect(input(view, 'Radius / mm').props.value).toBe(0.2);
    expect(input(view, 'Radius / mm').props.max).toBe(0.4);
    await select(view, 'Apparatus', '1');
    expect(input(view, 'Radius / mm').props.value).toBe(1);
    await act(() => view.unmount());
  });

  it('only offers wavelength control when wavelength changes the displayed field', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(OpticalDiffractionLab));
    });
    expect(input(view, 'Wavelength / nm')).toBeTruthy();
    await select(view, 'Close view', 'colors');
    expect(input(view, 'Wavelength / nm')).toBeUndefined();
    await select(view, 'Close view', 'aperture');
    expect(input(view, 'Wavelength / nm')).toBeTruthy();
    await act(() => view.unmount());
  });

  it('replays the authored Brewster comparison after exploration at normal incidence', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(PolarizationEvidenceLab));
    });
    await click(view, 'Everyday light');
    await click(view, 'Glass');
    await act(() => input(view, 'Reflection incidence / °').props.onChange(0));
    Object.assign(film, { watch: true, chapter: 4, chapterProgress: 0.5 });
    await act(() => view.update(createElement(PolarizationEvidenceLab)));
    expect(view.root.findByProps({ className: 'modern-readout' }).children.join('')).toContain(
      '0.0%',
    );
    await act(() => view.unmount());
  });

  it('restores the authored glass and mirror parameters on replay', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(GeometricOpticsLab));
    });
    await click(view, 'Glass apparent depth');
    await act(() => input(view, 'Glass index').props.onChange(1.8));
    Object.assign(film, { watch: true, chapter: 5, chapterProgress: 0 });
    await act(() => view.update(createElement(GeometricOpticsLab)));
    expect(view.root.findByProps({ className: 'modern-readout' }).children.join('')).toContain(
      'd/n = 53.3 mm',
    );
    await act(() => view.unmount());
    film.watch = false;
    await act(() => {
      view = create(createElement(DoubleSlitMeasurementLab));
    });
    await click(view, 'Lloyd mirror');
    await act(() => input(view, 'Source height / mm').props.onChange(0.6));
    Object.assign(film, { watch: true, chapter: 6, chapterProgress: 0.5 });
    await act(() => view.update(createElement(DoubleSlitMeasurementLab)));
    expect(view.root.findByProps({ className: 'modern-readout' }).children.join('')).toContain(
      '2h = 0.60 mm',
    );
    await act(() => view.unmount());
  });
});

describe('the actual SVG retains physical directions and visible evidence', () => {
  it('keeps extreme plate rays in frame with the correct refractive-angle ratio', () => {
    const markup = renderToStaticMarkup(
      createElement(GeometricArtwork, { mode: 2, angle: 45, index: 1.3 }),
    );
    const rays = [...markup.matchAll(/d="M170 231L([\d.-]+) 131L([\d.-]+) 51"/g)];
    expect(rays).toHaveLength(2);
    for (const ray of rays) {
      const exit = Number(ray[1]),
        end = Number(ray[2]);
      expect(end).toBeGreaterThan(20);
      expect(end).toBeLessThan(320);
      const outside = Math.abs(end - exit),
        inside = Math.abs(exit - 170);
      const sineAir = outside / Math.hypot(outside, 80);
      const sineGlass = inside / Math.hypot(inside, 100);
      expect(sineAir / sineGlass).toBeCloseTo(1.3, 10);
    }
  });

  it('keeps the faint pencil pattern visible without normalizing away reduced transmission', () => {
    const markup = renderToStaticMarkup(
      createElement(OpticalDiffractionArtwork, { phase: 4, width: 50 }),
    );
    const wider = renderToStaticMarkup(
      createElement(OpticalDiffractionArtwork, { phase: 4, width: 100 }),
    );
    const centralIntensity = (html: string) =>
      Number(html.match(/data-screen-x="0"[^>]*data-intensity="([^"]+)"/)![1]);
    // At these small Fresnel numbers, halving the aperture gives about one quarter
    // of the central intensity; equalized peaks would erase this physical change.
    expect(centralIntensity(markup)).toBeGreaterThan(0.004);
    expect(centralIntensity(markup)).toBeLessThan(0.005);
    expect(centralIntensity(markup) / centralIntensity(wider)).toBeCloseTo(0.25, 2);
    expect(Number(markup.match(/data-first-prediction="([^"]+)"/)![1])).toBeCloseTo(11, 8);
    const path = [...markup.matchAll(/<path d="([^"]+)"[^>]*stroke="#769784"/g)].at(-1)![1];
    const coordinates = [...path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const ys = coordinates.map((p) => p[1]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(5);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(256);
  });
});
