import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi } from 'vitest';
import SmallDeformationLab from './SmallDeformationLab';
const film = vi.hoisted(() => ({ watch: true, chapter: 2, chapterProgress: 0.8, chapterTime: 22 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288, compact: true }),
}));
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => 'zh' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', p),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('fresh Explore preserves the actual frame, manual choice persists, watch ignores it', async () => {
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(SmallDeformationLab));
  });
  const host = () => r.root.findByType('section');
  expect(host().props['data-deform-wall']).toBe(4);
  film.watch = false;
  await act(() => r.update(createElement(SmallDeformationLab)));
  expect(host().props['data-deform-wall']).toBe(4);
  await act(() => r.root.findAllByType('input')[1]!.props.onChange(1.2));
  expect(host().props['data-deform-wall']).toBe(1.2);
  film.watch = true;
  film.chapter = 3;
  film.chapterTime = 0;
  await act(() => r.update(createElement(SmallDeformationLab)));
  expect(host().props['data-deform-wall']).toBe(4);
  film.watch = false;
  await act(() => r.update(createElement(SmallDeformationLab)));
  expect(host().props['data-deform-wall']).toBe(1.2);
  await act(() => r.unmount());
});
it('spoken lower profile remains present with the current light spot', async () => {
  film.watch = true;
  film.chapter = 1;
  film.chapterTime = 17;
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(createElement(SmallDeformationLab));
  });
  expect(r.root.findAll((n) => n.props['data-deformation-profile'] === '500')).toHaveLength(1);
  expect(r.root.findAll((n) => n.props['data-wall-spot'] === 'true')).toHaveLength(1);
  await act(() => r.unmount());
});
