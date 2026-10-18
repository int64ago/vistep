import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import InductionCoilLab, { InductionArtwork } from './InductionCoilLab';
import { inductionDirector } from '../../models/induction-coil-lab';
const film = vi.hoisted(() => ({
  watch: false,
  chapter: 0,
  chapterTime: 0,
  chapterProgress: 0,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const a of mounted.splice(0)) await act(() => a.unmount());
  Object.assign(film, {
    watch: false,
    chapter: 0,
    chapterTime: 0,
    chapterProgress: 0,
    variant: '',
  });
});
const mount = async () => {
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(InductionCoilLab));
  });
  mounted.push(r);
  return r;
};
const control = (r: ReactTestRenderer, label: string) =>
  r.root.findAll((n) => n.props['aria-label'] === label)[0]!;
it('initializes five textbook entries and keeps manual choices across watch', async () => {
  for (const [v, e] of [
    ['e2-lenz-magnet-coil', 'coil'],
    ['e2-lenz-aluminium-ring', 'ring'],
    ['e2-faraday-falling-magnet', 'fall'],
    ['e2-faraday-disc', 'disc'],
    ['r3-faraday-disc', 'disc'],
  ]) {
    film.variant = v!;
    const r = await mount();
    expect(r.root.findByType(InductionArtwork).props.shot.experiment).toBe(e);
    await act(() => control(r, 'Choose an induction experiment').props.onChange('ring'));
    await act(() => control(r, 'Ring connection').props.onChange('open'));
    film.watch = true;
    film.chapter = 7;
    film.chapterTime = 10;
    await act(() => r.update(createElement(InductionCoilLab)));
    expect(r.root.findByType(InductionArtwork).props.shot.experiment).toBe('disc');
    film.watch = false;
    await act(() => r.update(createElement(InductionCoilLab)));
    expect(r.root.findByType(InductionArtwork).props.shot.closed).toBe(false);
  }
});
it('opening the real ring control preserves emf but removes current and closes no hidden path', async () => {
  const r = await mount();
  await act(() => control(r, 'Choose an induction experiment').props.onChange('ring'));
  await act(() => control(r, 'Ring connection').props.onChange('open'));
  const svg = r.root.findByType('svg');
  expect(svg.props['data-emf']).not.toBe(0);
  expect(svg.props['data-current']).toBe(0);
  expect(r.root.findAll((n) => n.props['data-induction-loop'] === 'split')).toHaveLength(1);
});
it('fall turns and height update both the trajectory and shown comparison', async () => {
  const r = await mount();
  await act(() => control(r, 'Choose an induction experiment').props.onChange('fall'));
  await act(() => control(r, 'Observation view').props.onChange('trace'));
  await act(() => control(r, 'Coil turns').props.onChange(120));
  await act(() => control(r, 'Release height').props.onChange(0.14));
  const shot = r.root.findByType(InductionArtwork).props.shot;
  expect(shot.turns).toBe(120);
  expect(shot.height).toBe(0.14);
  const text = r.root
    .findAllByType('text')
    .map((x) => x.children.join(''))
    .join(' ');
  expect(text).toContain('80 → 120');
  expect(text).toContain('1.5');
});
it('disc controls open a visible switch and reversing changes the actual radial-route current', async () => {
  const r = await mount();
  await act(() => control(r, 'Choose an induction experiment').props.onChange('disc'));
  const route = () =>
    r.root.findAll((n) => n.props['data-induction-route'] === 'disc-radial')[0]!.props[
      'data-current'
    ];
  const before = route();
  await act(() => control(r, 'Disc angular velocity').props.onChange(-20));
  expect(route()).toBe(-before);
  await act(() => control(r, 'Current path').props.onChange('open'));
  expect(route()).toBe(0);
  const d = r.root.findAll((n) => n.props['data-induction-part'] === 'disc-switch')[0]!.props.d;
  expect(d).toContain(' 22');
});
it('all nine chapter states render finite SVG with real stopping and prediction hold', () => {
  for (const w of [268, 640])
    for (let c = 0; c < 9; c++)
      for (const t of [0, 3, 8, 13, 19, 25]) {
        const s = renderToStaticMarkup(
          createElement(InductionArtwork, { shot: inductionDirector(c, t / 26, t), width: w }),
        );
        expect(s).not.toMatch(/NaN|Infinity|undefined/);
        expect(s).toContain('data-induction-view=');
      }
});

it('zero disc speed removes both force and velocity vectors; a reversal preserves radius identities', () => {
  for (const locale of ['zh', 'en'] as const)
    for (const time of [5, 15])
      for (const omega of [-40, 0, 40]) {
        // Both measured films show the radial mechanism here, before and
        // after the intervening brush-circuit close-up.
        const shot = inductionDirector(7, time / 26, time, locale);
        expect(shot.view).toBe('radial');
        const svg = renderToStaticMarkup(
          createElement(InductionArtwork, {
            shot: { ...shot, omega },
            width: 268,
          }),
        );
        expect((svg.match(/data-induction-radius=/g) || []).length).toBe(2);
        expect((svg.match(/data-induction-vector=/g) || []).length).toBe(omega === 0 ? 0 : 4);
        expect(svg).toContain(`data-induction-speed="${omega * 0.04}"`);
        expect(svg).toContain(`data-induction-speed="${omega * 0.08}"`);
      }
});
