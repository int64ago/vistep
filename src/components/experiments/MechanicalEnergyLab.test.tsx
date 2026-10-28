import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './MechanicalEnergyLab';
const film = vi.hoisted(() => ({ watch: true, chapter: 0, chapterProgress: 0.55 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const state = () =>
  Object.fromEntries(
    Object.entries(r!.root.findByType('section').props).filter(([k]) => k.startsWith('data-')),
  );
const geometry = () =>
  r!.root
    .findAllByType('svg')
    .map((svg) =>
      svg
        .findAll((n) => ['path', 'circle', 'rect', 'g'].includes(String(n.type)))
        .map((n) => Object.fromEntries(Object.entries(n.props).filter(([k]) => k !== 'children'))),
    );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
});
it('keeps the paused evidence and full geometry when entering Explore and after untouched replay', async () => {
  for (let chapter = 0; chapter < 8; chapter++) {
    Object.assign(film, { watch: true, chapter, chapterProgress: 0.55 });
    await act(() => {
      r = create(createElement(Scene));
    });
    const paused = state(),
      picture = geometry();
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(paused);
    expect(geometry()).toEqual(picture);
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0 });
    await act(() => r!.update(createElement(Scene)));
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(paused);
    expect(geometry()).toEqual(picture);
    await act(() => r!.unmount());
    r = undefined;
  }
});
it('retains a changed time and its other physical conditions through replay', async () => {
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.55 });
  await act(() => {
    r = create(createElement(Scene));
  });
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  await act(() =>
    r!.root.findAll((n) => n.props['aria-label'] === '模型时间')[0].props.onChange(0.1),
  );
  const manual = state(),
    picture = geometry();
  expect(manual['data-time']).toBe(0.1);
  Object.assign(film, { watch: true, chapter: 7, chapterProgress: 0.9 });
  await act(() => r!.update(createElement(Scene)));
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  expect(state()).toEqual(manual);
  expect(geometry()).toEqual(picture);
});
