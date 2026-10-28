import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './MagdeburgBowlsLab';
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
    Object.entries(r!.root.find((n) => n.props.className === 'bowls-lab').props).filter(
      ([k]) => k.startsWith('data-') && k !== 'data-watch',
    ),
  );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.2 });
});
it('unedited Explore preserves every chapter through Watch replay and a second Explore', async () => {
  for (let chapter = 0; chapter < 4; chapter++)
    for (const progress of [0, 0.4, 0.9, 1]) {
      Object.assign(film, {
        watch: true,
        chapter,
        chapterProgress: progress,
        chapterTime: progress * 26,
      });
      await act(() => {
        r = create(createElement(Scene));
      });
      const authored = state();
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toEqual(authored);
      Object.assign(film, { watch: true, chapter: 0, chapterTime: 0, chapterProgress: 0 });
      await act(() => r!.update(createElement(Scene)));
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
  const changes: [string, number][] = [
    ['密封后气体温度', 65],
    ['每侧拉力', 600],
    ['压力均衡进度', 0.37],
    ['密封后气体温度', 149.5],
    ['每侧拉力', 1400],
    ['压力均衡进度', 1],
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
