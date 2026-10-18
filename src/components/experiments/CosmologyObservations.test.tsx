import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import CosmologyObservations, { CosmologyArtwork } from './CosmologyObservations';
import { cosmologyDirector } from '../../models/cosmology-observations';
const film = vi.hoisted(() => ({ watch: false, chapter: 0, chapterTime: 0, variant: '' }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: { label: string; onChange: (n: number) => void; value: number }) =>
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
    v = create(createElement(CosmologyObservations));
  });
  mounted.push(v);
  return v;
};
const choose = async (v: ReactTestRenderer, value: string) =>
  act(() => v.root.findByType('select').props.onChange({ target: { value } }));
it('both exact lesson windows initialize their mechanism and preserve exploration across watch', async () => {
  for (const [variant, chapter, expected] of [
    ['required-2-hubble', 0, 'spectrum'],
    ['required-2-cmb', 2, 'horn'],
  ] as const) {
    Object.assign(film, { variant, chapter, watch: true });
    const v = await mount();
    film.watch = false;
    await act(() => v.update(createElement(CosmologyObservations)));
    expect(v.root.findByType(CosmologyArtwork).props.direction.shot).toBe(expected);
    await choose(v, 'map');
    film.watch = true;
    await act(() => v.update(createElement(CosmologyObservations)));
    expect(v.root.findByType(CosmologyArtwork).props.direction.shot).toBe(expected);
    film.watch = false;
    await act(() => v.update(createElement(CosmologyObservations)));
    expect(v.root.findByType(CosmologyArtwork).props.direction.shot).toBe('map');
  }
});
it('candidate changes cannot move the actual 24 plotted historical points', async () => {
  const v = await mount();
  await choose(v, 'records');
  const coords = () =>
    v.root
      .findAll((n) => n.props['data-hubble-id'] !== undefined)
      .map((n) => [n.props['data-hubble-id'], n.props.cx, n.props.cy]);
  const before = coords();
  await act(() =>
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === 'Constant speed')!
      .props.onClick(),
  );
  expect(coords()).toEqual(before);
  expect(before).toHaveLength(24);
});
it('prediction controls alter actual reveal state without exposing the final line or future curve first', async () => {
  const v = await mount();
  expect(v.root.findAll((n) => n.props['data-spectral-line'] === 'observed-2')).toHaveLength(0);
  await act(() =>
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === 'Reveal prediction')!
      .props.onClick(),
  );
  expect(v.root.findAll((n) => n.props['data-spectral-line'] === 'observed-2')).toHaveLength(1);
  await choose(v, 'cooling');
  expect(v.root.findAll((n) => n.props['data-cooling-curve'] === 'future')).toHaveLength(0);
  await act(() =>
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === 'Reveal prediction')!
      .props.onClick(),
  );
  expect(v.root.findAll((n) => n.props['data-cooling-curve'] === 'future')).toHaveLength(1);
});
it('every measured directed shot serializes finite artwork at the actual phone viewBox', () => {
  for (const locale of ['zh', 'en'] as const)
    for (let chapter = 0; chapter < 5; chapter++)
      for (let t = 0; t <= 51; t += 2) {
        const markup = renderToStaticMarkup(
          createElement(CosmologyArtwork, {
            width: 268,
            direction: cosmologyDirector(chapter, t, locale),
          }),
        );
        expect(markup).not.toMatch(/NaN|Infinity|undefined/);
        expect(markup).toContain('viewBox="0 0 268 270"');
      }
});
