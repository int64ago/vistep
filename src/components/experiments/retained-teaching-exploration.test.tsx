import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import ApparentWeightLab from './ApparentWeightLab';
import ElasticityLab from './ElasticityLab';

const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 0,
  chapterProgress: 0,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en', t: (s: string) => s }));
vi.mock('../lab/Controls', async (original) => ({
  ...(await original<typeof import('../lab/Controls')>()),
  Range: (props: { label: string; value: number; onChange: (value: number) => void }) =>
    createElement('input', { ...props, 'aria-label': props.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let view: ReactTestRenderer | undefined;
afterEach(async () => {
  if (view) await act(() => view!.unmount());
  view = undefined;
});
const text = (node: unknown): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : node && typeof node === 'object' && 'children' in node
      ? (node.children as unknown[]).map(text).join('')
      : '';
it('keeps the authored60kg film independent while remembering an explored100kg passenger', async () => {
  Object.assign(film, { watch: true, chapter: 0, chapterTime: 0, chapterProgress: 0, variant: '' });
  await act(() => {
    view = create(createElement(ApparentWeightLab));
  });
  const reading = () => text(view!.root.findByProps({ className: 'apparent-weight-reading' }));
  expect(reading()).toContain('60.0');
  film.watch = false;
  await act(() => view!.update(createElement(ApparentWeightLab)));
  await act(() => view!.root.findByProps({ 'aria-label': '人体质量' }).props.onChange(100));
  film.watch = true;
  await act(() => view!.update(createElement(ApparentWeightLab)));
  expect(reading()).toContain('60.0');
  film.watch = false;
  await act(() => view!.update(createElement(ApparentWeightLab)));
  expect(view!.root.findByProps({ 'aria-label': '人体质量' }).props.value).toBe(100);
});
it('starts late-chapter exploration with rubber and restores its authored unloading state', async () => {
  Object.assign(film, {
    watch: true,
    chapter: 4,
    chapterTime: 7,
    chapterProgress: 0.26,
    variant: '',
  });
  await act(() => {
    view = create(createElement(ElasticityLab));
  });
  const reading = () => text(view!.root.findByProps({ className: 'elastic-readings' }));
  const authored = reading();
  film.watch = false;
  await act(() => view!.update(createElement(ElasticityLab)));
  const chosen = view!.root.findAllByType('button').find((b) => text(b) === '橡皮筋');
  expect(chosen?.props['aria-pressed']).toBe(true);
  await act(() => view!.root.findByProps({ 'aria-label': '伸长量' }).props.onChange(0.12));
  film.watch = true;
  await act(() => view!.update(createElement(ElasticityLab)));
  expect(reading()).toBe(authored);
});
