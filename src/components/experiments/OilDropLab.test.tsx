import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import OilDropLab, { OilDropArtwork } from './OilDropLab';
import { oilDirector } from '../../models/oil-drop-lab';
const film = vi.hoisted(() => ({ watch: false, chapter: 0, chapterTime: 0, variant: '' }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: { label: string; value: number; onChange: (n: number) => void }) =>
    createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const v of mounted.splice(0)) await act(() => v.unmount());
  Object.assign(film, { watch: false, chapter: 0, chapterTime: 0, variant: '' });
});
const mount = async () => {
  let v!: ReactTestRenderer;
  await act(() => {
    v = create(createElement(OilDropLab));
  });
  mounted.push(v);
  return v;
};
const choose = async (v: ReactTestRenderer, value: string) =>
  act(() => v.root.findAllByType('select')[0]!.props.onChange({ target: { value } }));
it('both unchanged textbook windows start with the unknown drop and retain chosen exploration', async () => {
  for (const variant of ['r3-millikan-charge', 'e3-millikan-oil-drop']) {
    film.variant = variant;
    const v = await mount();
    expect(v.root.findByType(OilDropArtwork).props.direction.shot).toBe('reticle');
    await choose(v, 'held-out');
    film.watch = true;
    await act(() => v.update(createElement(OilDropLab)));
    expect(v.root.findByType(OilDropArtwork).props.direction.shot).toBe('reticle');
    film.watch = false;
    await act(() => v.update(createElement(OilDropLab)));
    expect(v.root.findByType(OilDropArtwork).props.direction.shot).toBe('held-out');
  }
});
it('does not leak held-out observations or balancing answer before learner reveal', async () => {
  const v = await mount();
  await choose(v, 'held-out');
  expect(v.root.findByProps({ 'data-oil-heldout': 'hidden' })).toBeDefined();
  await act(() =>
    v.root
      .findAllByType('button')
      .find((n) => n.children.join('') === 'Reveal and test')!
      .props.onClick(),
  );
  expect(v.root.findByProps({ 'data-oil-heldout': 'revealed' })).toBeDefined();
  await choose(v, 'charge-inference');
  expect(v.root.findByProps({ 'data-oil-charge-answer': 'hidden' })).toBeDefined();
});
it('changing candidate increments moves rings but never historical change dots', async () => {
  const v = await mount();
  await choose(v, 'lattice');
  const points = () =>
    v.root
      .findAll((n) => n.props['data-oil-fixed-change'] !== undefined)
      .map((n) => [n.props['data-oil-fixed-change'], n.props.cx, n.props.cy]);
  const before = points();
  for (const n of [2, 0.5, 1]) {
    await act(() =>
      v.root
        .findAllByType('button')
        .find((b) => b.children.join('') === `Candidate step ×${n}`)!
        .props.onClick(),
    );
    expect(points()).toEqual(before);
  }
});
it('manual voltage restarts the named trial and watch restores authored history', async () => {
  const v = await mount();
  await choose(v, 'force-balance');
  const get = (label: string) =>
    v.root.findAllByType('input').find((n) => n.props['aria-label'] === label)!;
  await act(() => get('Time in this trial').props.onChange(4));
  expect(v.root.findByType(OilDropArtwork).props.direction.physicalTime).toBe(4);
  await act(() => get('Voltage (starts a new trial)').props.onChange(-200));
  expect(v.root.findByType(OilDropArtwork).props.direction.physicalTime).toBe(0);
  expect(v.root.findByType(OilDropArtwork).props.direction.voltage).toBe(-200);
  film.watch = true;
  film.chapter = 1;
  film.chapterTime = 20;
  await act(() => v.update(createElement(OilDropLab)));
  expect(v.root.findByType(OilDropArtwork).props.direction).toEqual(oilDirector(1, 20, 'en'));
});
it('serializes all directed lenses in both distinct viewport geometries without nonfinite attributes', () => {
  for (const width of [268, 640])
    for (let c = 0; c < 3; c++)
      for (let t = 0; t < 83; t += 3) {
        const svg = renderToStaticMarkup(
          createElement(OilDropArtwork, { width, direction: oilDirector(c, t) }),
        );
        expect(svg).not.toMatch(/NaN|Infinity|undefined/);
        expect(svg).toContain(`viewBox="0 0 ${width} ${width < 400 ? 270 : 300}"`);
      }
});

it('a neutral direct-render input reports no electrical balance rather than a nonfinite answer', () => {
  const svg = renderToStaticMarkup(
    createElement(OilDropArtwork, {
      width: 268,
      input: { chargeMagnitude: 0 },
      direction: oilDirector(1, 36),
    }),
  );
  expect(svg).toContain('Uncharged: voltage cannot hold it');
  expect(svg).not.toMatch(/NaN|Infinity/);
});

it('does not call an instantaneously resting but unbalanced prediction drop balanced', () => {
  const svg = renderToStaticMarkup(
    createElement(OilDropArtwork, {
      width: 268,
      direction: oilDirector(1, 43, 'en'),
    }),
  );
  expect(svg).toContain('Initially still');
  expect(svg).not.toContain('Balanced');
  expect(svg).toContain('data-oil-velocity="0"');
});
