import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import NuclearEvidenceLab, { NuclearArtwork } from './NuclearEvidenceLab';
import { nuclearDirector, chainAccount } from '../../models/nuclear-evidence';
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
const all: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const r of all.splice(0)) await act(() => r.unmount());
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
    r = create(createElement(NuclearEvidenceLab));
  });
  all.push(r);
  return r;
};
const control = (r: ReactTestRenderer, label: string) =>
  r.root.findAll((n) => n.props['aria-label'] === label)[0]!;
const shot = (r: ReactTestRenderer) => r.root.findByType(NuclearArtwork).props.shot;
it('initializes all six textbook entries including the early Chadwick alias', async () => {
  for (const [v, m, chapter] of [
    ['e1-chadwick-reference', 'neutron', 2],
    ['e3-chadwick-neutron', 'neutron', 2],
    ['e3-rutherford-proton', 'nitrogen', 0],
    ['e3-uranium-fission-discovery', 'fission', 4],
    ['e3-uranium-multifragment-fission', 'tracks', 6],
    ['e3-fermi-controlled-chain-reaction', 'chain', 8],
  ]) {
    film.variant = String(v);
    film.chapter = Number(chapter);
    const r = await mount();
    expect(shot(r).mode).toBe(m);
  }
});
it('changing candidate mass changes prediction without changing fixed records', async () => {
  film.variant = 'e1-chadwick-reference';
  film.chapter = 2;
  const r = await mount();
  await act(() => control(r, 'Observation view').props.onChange('inference'));
  const values = () =>
    r.root.findAll((n) => n.props['data-fixed-recoil']).map((n) => n.props['data-velocity']);
  const before = values();
  await act(() => control(r, 'Candidate incident mass').props.onChange(2));
  expect(shot(r).candidateMass).toBe(2);
  await act(() => control(r, 'Observation progress').props.onChange(1));
  expect(values()).toEqual(before);
  expect(
    renderToStaticMarkup(createElement(NuclearArtwork, { shot: shot(r), locale: 'en' })),
  ).toContain('He prediction 16.5');
  await act(() => control(r, 'Fixed record source').props.onChange('chadwick'));
  expect(values()).toEqual([3.7e7, 4.7e6]);
});
it('retains exploration choices while watch uses authored chapter state', async () => {
  const r = await mount();
  await act(() => control(r, 'Nuclear evidence').props.onChange('tracks'));
  await act(() => control(r, 'Charged-track count').props.onChange('4'));
  await act(() => control(r, 'Vertex comparison').props.onChange('yes'));
  film.watch = true;
  film.chapter = 2;
  await act(() => r.update(createElement(NuclearEvidenceLab)));
  expect(shot(r).mode).toBe('neutron');
  film.watch = false;
  await act(() => r.update(createElement(NuclearEvidenceLab)));
  expect(shot(r).mode).toBe('tracks');
  expect(shot(r).count).toBe(4);
  expect(shot(r).unrelated).toBe(true);
});
it('focus changes visibility of the unrelated track without changing path identity', async () => {
  film.variant = 'e3-uranium-multifragment-fission';
  film.chapter = 6;
  const r = await mount();
  await act(() => control(r, 'Vertex comparison').props.onChange('yes'));
  const tracks = () => r.root.findAll((n) => n.props['data-track-id']);
  const ids = tracks().map((n) => n.props['data-track-id']);
  const before = tracks().at(-1)!.props.opacity;
  await act(() => control(r, 'Illustrative focus depth').props.onChange(1));
  expect(tracks().map((n) => n.props['data-track-id'])).toEqual(ids);
  expect(tracks().at(-1)!.props.opacity).toBeGreaterThan(before);
});
it('loss controls update real fate classification and bounded expectation', async () => {
  film.variant = 'e3-fermi-controlled-chain-reaction';
  film.chapter = 8;
  const r = await mount();
  await act(() => control(r, 'Observation progress').props.onChange(1));
  await act(() => control(r, 'Abstract escape fraction').props.onChange(0.6));
  await act(() => control(r, 'Abstract non-fission absorption').props.onChange(0.4));
  expect(chainAccount(shot(r).escape, shot(r).absorb).k).toBe(0);
  expect(r.root.findAll((n) => n.props['data-child-id'])).toHaveLength(0);
});
it('all chapters and boundary charts render finite responsive geometry', () => {
  for (const width of [268, 640])
    for (let c = 0; c < 10; c++)
      for (const t of [0, 7, 16, 24, 28]) {
        const s = renderToStaticMarkup(
          createElement(NuclearArtwork, {
            shot: nuclearDirector(c, t / 28, t),
            width,
            locale: 'en',
          }),
        );
        expect(s).not.toMatch(/NaN|Infinity|undefined/);
        expect(s).toContain('data-nuclear-view');
      }
  for (const escape of [0, 1])
    for (const absorb of [0, 1])
      expect(
        renderToStaticMarkup(
          createElement(NuclearArtwork, { shot: { ...nuclearDirector(9, 1), escape, absorb } }),
        ),
      ).not.toMatch(/NaN|Infinity/);
});

it('draws the momentum ledger with one scale at both widths', () => {
  for (const width of [268, 640])
    for (const angle of [0, 40, 100, 160]) {
      const svg = renderToStaticMarkup(
        createElement(NuclearArtwork, {
          shot: { ...nuclearDirector(1, 1, 25), angle },
          width,
          locale: 'en',
        }),
      );
      const vector = (name: string) => {
        const m = svg.match(
          new RegExp('data-vector="' + name + '"[^>]*><path d="M[^l]+l([^ ]+) ([^\\"]+)"'),
        );
        expect(m).not.toBeNull();
        return [Number(m![1]), Number(m![2])];
      };
      const a = vector('incoming'),
        p = vector('proton'),
        o = vector('oxygen');
      expect(p[0]! + o[0]!).toBeCloseTo(a[0]!, 8);
      expect(p[1]! + o[1]!).toBeCloseTo(a[1]!, 8);
    }
});
it('keeps the visible collision bodies tangent at impact and separated afterward', () => {
  for (const width of [268, 640])
    for (const target of [1, 4, 14])
      for (const candidateMass of [0.2, 1, 4])
        for (const progress of [0.38, 0.5, 1]) {
          const svg = renderToStaticMarkup(
            createElement(NuclearArtwork, {
              shot: {
                ...nuclearDirector(3, 0),
                view: 'collision',
                target,
                candidateMass,
                progress,
              },
              width,
              locale: 'en',
            }),
          );
          const p = Number(svg.match(/data-projectile-x="([^"]+)/)![1]),
            t = Number(svg.match(/data-recoil-x="([^"]+)/)![1]);
          expect(t - p).toBeGreaterThanOrEqual(8 + (target === 1 ? 12 : 22) - 1e-9);
        }
});

it('fresh exploration preserves each measured current subview and calculation before any manual choice', async () => {
  for (const [chapter, time] of [
    [1, 21.5],
    [3, 13],
    [3, 24],
    [4, 19],
    [5, 11],
    [6, 17],
    [7, 8],
    [8, 13],
    [9, 8],
  ]) {
    film.chapter = chapter!;
    film.chapterTime = time!;
    film.chapterProgress = time! / 28;
    film.watch = true;
    const r = await mount(),
      before = shot(r);
    film.watch = false;
    await act(() => r.update(createElement(NuclearEvidenceLab)));
    expect(shot(r)).toEqual(before);
  }
});
it('manual progress persists while watch restores the measured unanswered prediction', async () => {
  Object.assign(film, { chapter: 5, chapterTime: 11, chapterProgress: 11 / 28, watch: false });
  const r = await mount();
  expect(shot(r).reveal).toBe(false);
  await act(() => control(r, 'Observation progress').props.onChange(0.9));
  expect(shot(r).reveal).toBe(true);
  film.watch = true;
  await act(() => r.update(createElement(NuclearEvidenceLab)));
  expect(shot(r).reveal).toBe(false);
  expect(shot(r).progress).toBe(1);
  film.watch = false;
  await act(() => r.update(createElement(NuclearEvidenceLab)));
  expect(shot(r).reveal).toBe(true);
  expect(shot(r).progress).toBe(0.9);
});
it('detector rise follows the charged recoil arrival, not just paraffin insertion', () => {
  const early = renderToStaticMarkup(
    createElement(NuclearArtwork, { shot: nuclearDirector(2, 0, 6, 'en'), locale: 'en' }),
  );
  const late = renderToStaticMarkup(
    createElement(NuclearArtwork, { shot: nuclearDirector(2, 0, 11, 'en'), locale: 'en' }),
  );
  expect(early).toContain('Paraffin');
  expect(early).toContain('Weak background');
  expect(late).toContain('Ionization increases');
});
