import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './CentripetalForceLab';
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
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.55 });
});
it('inherits the paused apparatus and all conditions, then restores a complete edited state after Watch', async () => {
  for (let chapter = 0; chapter < 8; chapter++) {
    Object.assign(film, { watch: true, chapter, chapterProgress: 0.55 });
    await act(() => {
      r = create(createElement(Scene));
    });
    const watched = state();
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(watched);
    await act(() =>
      r!.root.findAll((n) => n.props['aria-label'] === '模型时间')[0].props.onChange(0.25),
    );
    const manual = state();
    expect(manual).toEqual({ ...watched, 'data-time': 0.25 });
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0 });
    await act(() => r!.update(createElement(Scene)));
    expect(state()['data-time']).toBe(0);
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(manual);
    await act(() => r!.unmount());
    r = undefined;
  }
});
it('preserves an untouched exploration when Watch replays from the first chapter', async () => {
  Object.assign(film, { watch: true, chapter: 5, chapterProgress: 0.7 });
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
it('keeps a low-speed stationary bag distinct from prescribed Watch motion', async () => {
  Object.assign(film, { chapter: 1, watch: false });
  await act(() => {
    r = create(createElement(Scene));
  });
  await act(() => r!.root.findAll((n) => n.props['aria-label'] === '角速度')[0].props.onChange(0));
  expect(r!.root.findAll((n) => n.props['data-vector'] === 'resultant')).toHaveLength(0);
  const manual = state();
  film.watch = true;
  await act(() => r!.update(createElement(Scene)));
  expect(state()['data-omega']).toBe(4.5);
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  expect(state()).toEqual(manual);
});
