import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi } from 'vitest';
import InertialFramesLab from './InertialFramesLab';
const film = vi.hoisted(() => ({ watch: true, chapter: 3, chapterProgress: 0.4, chapterTime: 8 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288, compact: true }),
}));
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => 'zh' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('enters Explore at the same event and keeps one ball history in both frames', async () => {
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(InertialFramesLab));
  });
  const host = () => r.root.findByType('section'),
    time = host().props['data-inertia-time'];
  film.watch = false;
  await act(() => r.update(createElement(InertialFramesLab)));
  expect(host().props['data-inertia-duration']).toBe(2);
  expect(host().props['data-inertia-time']).toBe(time);
  const views = r.root.findAllByType('svg');
  expect(views[0]!.props['data-physical-state']).toBe(views[1]!.props['data-physical-state']);
  await act(() => r.root.findAllByType('input')[1]!.props.onChange(0));
  film.watch = true;
  film.chapter = 0;
  await act(() => r.update(createElement(InertialFramesLab)));
  expect(host().props['data-inertia-mu']).toBe(0.03);
  film.watch = false;
  await act(() => r.update(createElement(InertialFramesLab)));
  expect(host().props['data-inertia-mu']).toBe(0);
  await act(() => r.unmount());
});
