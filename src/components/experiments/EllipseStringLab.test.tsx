import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './EllipseStringLab';
const film = vi.hoisted(() => ({ watch: true, chapter: 0, chapterProgress: 0.55 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const state = () =>
  Object.fromEntries(
    Object.entries(r!.root.findByType('section').props).filter(([k]) => k.startsWith('data-')),
  );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
});
it('preserves untouched focus and pencil positions through a replay', async () => {
  Object.assign(film, { watch: true, chapter: 3, chapterProgress: 0.4 });
  await act(() => {
    r = create(createElement(Scene));
  });
  const paused = state();
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0 });
  await act(() => r!.update(createElement(Scene)));
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  expect(state()).toEqual(paused);
});
it('inherits both focus spacing and pencil position, preserving them across Watch and manual return', async () => {
  for (let chapter = 0; chapter < 4; chapter++) {
    Object.assign(film, { watch: true, chapter, chapterProgress: 0.55 });
    await act(() => {
      r = create(createElement(Scene));
    });
    const watched = state();
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(watched);
    await act(() =>
      r!.root.findAll((n) => n.props['aria-label'] === '两焦点间距')[0].props.onChange(0.9),
    );
    const manual = state();
    expect(manual['data-trace']).toBe(watched['data-trace']);
    expect(manual['data-distance']).toBe(0.9);
    expect(manual['data-length-sum']).toBeCloseTo(1, 12);
    Object.assign(film, { watch: true, chapter: 3, chapterProgress: 1 });
    await act(() => r!.update(createElement(Scene)));
    expect(state()['data-distance']).toBe(0);
    expect(state()['data-minor-axis']).toBe(1);
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(manual);
    await act(() => r!.unmount());
    r = undefined;
  }
});
