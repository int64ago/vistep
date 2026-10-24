import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './BicycleCircularMotion';
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
it('first exploration inherits the complete frame, and the first edited state survives a Watch reset', async () => {
  for (let chapter = 0; chapter < 4; chapter++) {
    Object.assign(film, { watch: true, chapter, chapterProgress: 0.55 });
    await act(() => {
      r = create(createElement(Scene));
    });
    const watched = state();
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(watched);
    const control = r!.root.findAll((n) => n.props['aria-label'] === '后齿轮齿数')[0];
    await act(() => control.props.onChange('16'));
    const manual = state();
    expect(manual['data-rear']).toBe(16);
    expect(manual['data-time']).toBe(watched['data-time']);
    expect(manual['data-view']).toBe(watched['data-view']);
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0 });
    await act(() => r!.update(createElement(Scene)));
    expect(state()['data-rear']).toBe(20);
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(manual);
    await act(() => r!.unmount());
    r = undefined;
  }
});
