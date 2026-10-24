import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './WaxMotionComposition';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 3,
  chapterProgress: 0.2,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en', t: (s: string) => s }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const state = () =>
  Object.fromEntries(
    Object.entries(r!.root.find((n) => n.props.className === 'wax-motion-lab').props).filter(
      ([k]) => k.startsWith('data-') && k !== 'data-watch',
    ),
  );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.2 });
});
it('fresh Explore preserves every chapter at early, middle and late causal states', async () => {
  for (let chapter = 0; chapter < 4; chapter++)
    for (const progress of [0, 0.4, 0.9, 1]) {
      Object.assign(film, { watch: true, chapter, chapterProgress: progress });
      await act(() => {
        r = create(createElement(Scene));
      });
      const authored = state();
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toEqual(authored);
      expect(JSON.stringify(r!.toJSON())).not.toMatch(/NaN|Infinity/);
      await act(() => r!.unmount());
      r = undefined;
    }
});
it('all editable parameters survive Watch reset then Explore without affecting the director', async () => {
  film.watch = false;
  await act(() => {
    r = create(createElement(Scene));
  });
  const changes: [string, string | number][] = [
    ['玻璃管的运动', 'uniform'],
    ['水平分速度', 0.18],
    ['竖直上升速度', 0.16],
    ['模型时间', 4],
    ['玻璃管的运动', 'accelerated'],
    ['水平加速度', 0.02],
    ['模型时间', 3.7],
    ['玻璃管的运动', 'startup'],
  ];
  for (const [label, value] of changes) {
    await act(() =>
      r!.root.findAll((n) => n.props['aria-label'] === label)[0].props.onChange(value),
    );
    const manual = state();
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0 });
    await act(() => r!.update(createElement(Scene)));
    expect(state()).not.toEqual(manual);
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(manual);
    expect(JSON.stringify(r!.toJSON())).not.toMatch(/NaN|Infinity/);
  }
});
