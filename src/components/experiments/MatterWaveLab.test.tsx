import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, it, expect, vi } from 'vitest';
import MatterWaveLab, { MatterWaveArtwork } from './MatterWaveLab';
import { matterDirector } from '../../models/matter-wave-lab';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 12,
  chapterProgress: 0.3,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
const language = vi.hoisted(() => ({ value: 'en' as 'zh' | 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => language.value }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const shot = () => r!.root.findByType(MatterWaveArtwork).props.shot;
const control = (label: string) => r!.root.findAll((n) => n.props['aria-label'] === label)[0]!;
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  language.value = 'en';
  Object.assign(film, {
    watch: true,
    chapter: 0,
    chapterTime: 12,
    chapterProgress: 0.3,
    variant: '',
  });
});
it('inherits the current causal shot and actual numbers in all three curriculum windows', async () => {
  for (const [chapter, time] of [
    [0, 12],
    [1, 4],
    [1, 15],
    [2, 10],
    [2, 25],
    [3, 8],
    [4, 15],
    [5, 6],
    [5, 20],
    [6, 1],
    [6, 20],
  ]) {
    Object.assign(film, { watch: true, chapter, chapterTime: time });
    await act(() => {
      r = create(createElement(MatterWaveLab));
    });
    const a = shot();
    film.watch = false;
    await act(() => r!.update(createElement(MatterWaveLab)));
    expect(shot()).toEqual(a);
    await act(() => r!.unmount());
    r = undefined;
  }
});
it('preserves manual apparatus and physical inputs but restores the automatic director in Watch', async () => {
  Object.assign(film, { watch: false, chapter: 5, chapterTime: 8 });
  await act(() => {
    r = create(createElement(MatterWaveLab));
  });
  await act(() => control('Grazing angle / °').props.onChange(31));
  await act(() => control('Plane spacing / pm').props.onChange(210));
  const custom = shot();
  // The real player restarts Watch at chapter zero; the edited view must survive that reset.
  Object.assign(film, { watch: true, chapter: 0, chapterTime: 0 });
  await act(() => r!.update(createElement(MatterWaveLab)));
  expect(shot()).toEqual(matterDirector(0, 0, language.value));
  film.watch = false;
  await act(() => r!.update(createElement(MatterWaveLab)));
  expect(shot()).toEqual(custom);
});
it('preserves a held ring prediction until an explicit physical test', async () => {
  Object.assign(film, { watch: false, chapter: 2, chapterTime: 10 });
  await act(() => {
    r = create(createElement(MatterWaveLab));
  });
  expect(shot()).toMatchObject({ question: true, voltage: 2000 });
  await act(() => r!.root.findAllByType('button')[0]!.props.onClick());
  expect(shot()).toMatchObject({ question: false, voltage: 5000 });
});
it('actual rendered extra path segments and waves share geometry-derived phase', async () => {
  Object.assign(film, { chapter: 5, chapterTime: 20 });
  await act(() => {
    r = create(createElement(MatterWaveLab));
  });
  const lengths = r!.root
    .findAll((n) => n.type === 'path' && n.props['data-extra-route'])
    .map((n) => n.props['data-length-pm']);
  expect(lengths).toHaveLength(2);
  expect(lengths[0] + lengths[1]).toBeCloseTo(400 / 3, 10);
  const phases = r!.root
    .findAll((n) => n.type === 'path' && n.props['data-matter-field'] !== undefined)
    .map((n) => n.props['data-wave-phase']);
  expect(phases).toHaveLength(3);
  for (const p of phases) expect(p).toBeCloseTo(2 * Math.PI, 12);
});
it('each rendered ring radius scales from the same computed screen intersection and actual voltage', async () => {
  Object.assign(film, { chapter: 2, chapterTime: 25 });
  await act(() => {
    r = create(createElement(MatterWaveLab));
  });
  const circles = r!.root.findAll(
    (n) => n.type === 'circle' && n.props['data-powder-ring'] !== undefined,
  );
  expect(circles).toHaveLength(2);
  for (const c of circles) expect(c.props.r / c.props['data-radius-mm']).toBeCloseTo(2.45, 12);
});
it('opening the fixed-sample biprism experiment does not import a hidden voltage from the separate foil experiment', async () => {
  Object.assign(film, { watch: false, chapter: 2, chapterTime: 24 });
  await act(() => {
    r = create(createElement(MatterWaveLab));
  });
  await act(() => control('Accelerating voltage / V').props.onChange(7000));
  await act(() => control('Matter-wave view').props.onChange('events'));
  expect(shot()).toMatchObject({ view: 'events', voltage: 2000 });
  await act(() => control('Accumulated events').props.onChange(25));
  const before = r!.root
    .findAll((n) => n.type === 'circle' && n.props['data-hit-id'] !== undefined)
    .map((n) => ({ id: n.props['data-hit-id'], x: n.props.cx, y: n.props.cy }));
  await act(() => control('Accumulated events').props.onChange(350));
  expect(
    r!.root
      .findAll((n) => n.type === 'circle' && n.props['data-hit-id'] !== undefined)
      .slice(0, 25)
      .map((n) => ({ id: n.props['data-hit-id'], x: n.props.cx, y: n.props.cy })),
  ).toEqual(before);
});

it('keeps B anchored to the shared AB/BC fold at narrow/desktop geometry bounds', async () => {
  for (const width of [260, 288, 740])
    for (const theta of [5, 65])
      for (const d of [100, 300]) {
        const s = { ...matterDirector(5, 20), theta, d };
        await act(() => {
          r = create(createElement(MatterWaveArtwork, { shot: s, width, locale: 'en' }));
        });
        const coordinates = (name: string) =>
          r!.root
            .findAll((n) => n.type === 'path' && n.props['data-extra-route'] === name)[0]!
            .props.d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)
            .map(Number);
        const ab = coordinates('AB'),
          bc = coordinates('BC');
        const point = r!.root.findAll(
          (n) => n.type === 'circle' && n.props['data-matter-point'] === 'B',
        )[0]!;
        const label = r!.root
          .findAll((n) => n.type === 'g' && n.props['data-matter-label'] === 'B')[0]!
          .findByType('text');
        expect([point.props.cx, point.props.cy]).toEqual(ab.slice(2));
        expect([point.props.cx, point.props.cy]).toEqual(bc.slice(0, 2));
        expect(label.props.x).toBe(point.props.cx);
        expect(label.props.y - point.props.cy).toBeGreaterThan(12);
        expect(label.props.y - point.props.cy).toBeLessThan(22);
        expect(label.props.y).toBeLessThanOrEqual(150);
        await act(() => r!.unmount());
        r = undefined;
      }
});

it('passes the actual recording locale to the c1 phase director and renders the moving vector sum', async () => {
  for (const locale of ['zh', 'en'] as const) {
    language.value = locale;
    Object.assign(film, { watch: true, chapter: 1, chapterTime: 3 });
    await act(() => {
      r = create(createElement(MatterWaveLab));
    });
    expect(shot()).toEqual(matterDirector(1, 3, locale));
    expect(shot().view).toBe(locale === 'en' ? 'phasors' : 'reflection');
    const start = locale === 'en' ? 2.25 : 3.6;
    film.chapterTime = start;
    await act(() => r!.update(createElement(MatterWaveLab)));
    const before = r!.root.findAll(
      (n) => n.type === 'path' && n.props['data-eight-plane-sum'] !== undefined,
    )[0]!.props.d;
    expect(
      r!.root.findAll((n) => n.type === 'g' && n.props['data-plane-vector'] !== undefined),
    ).toHaveLength(8);
    film.chapterTime = locale === 'en' ? 4.27 : 7.25;
    await act(() => r!.update(createElement(MatterWaveLab)));
    const after = r!.root.findAll(
      (n) => n.type === 'path' && n.props['data-eight-plane-sum'] !== undefined,
    )[0]!.props.d;
    expect(after).not.toBe(before);
    expect(shot()).toEqual(matterDirector(1, film.chapterTime, locale));
    await act(() => r!.unmount());
    r = undefined;
  }
});
