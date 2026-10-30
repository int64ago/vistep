import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './BlackbodyLab';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 3,
  chapterProgress: 0.2,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../lab/useCompact', () => ({ useCompact: () => true }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const state = () => r!.root.find((n) => n.props.className === 'blackbody-lab').props['data-state'];
const svg = () =>
  JSON.stringify((r!.toJSON() as any).children.filter((n: any) => n?.type === 'svg'));
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.2, chapterTime: 6.8 });
});
it('captures every unedited authored state on first Explore and restores it after Watch replay', async () => {
  for (let c = 0; c < 4; c++)
    for (const p of [0, 0.3, 0.55, 0.94]) {
      Object.assign(film, {
        watch: true,
        chapter: c,
        chapterProgress: p,
        chapterTime: p * [34, 28, 28, 58][c],
      });
      await act(() => {
        r = create(createElement(Scene));
      });
      const before = state(),
        beforeSvg = svg();
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toBe(before);
      expect(svg()).toBe(beforeSvg);
      Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0, chapterTime: 0 });
      await act(() => r!.update(createElement(Scene)));
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toBe(before);
      expect(svg()).toBe(beforeSvg);
      await act(() => r!.unmount());
      r = undefined;
    }
});
it('preserves independently changed temperature, wavelength and theory selection across replay', async () => {
  Object.assign(film, { watch: true, chapter: 3, chapterProgress: 0.8, chapterTime: 46.4 });
  await act(() => {
    r = create(createElement(Scene));
  });
  film.watch = false;
  await act(() => r!.update(createElement(Scene)));
  for (const wavelength of [0.2, 1, 8]) {
    await act(() =>
      r!.root
        .findAll((n) => n.props['aria-label'] === 'Probe wavelength')[0]
        .props.onChange(wavelength),
    );
    const a = state(),
      aSvg = svg();
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0, chapterTime: 0 });
    await act(() => r!.update(createElement(Scene)));
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toBe(a);
    expect(svg()).toBe(aSvg);
  }
  await act(() =>
    r!.root
      .findAllByType('button')
      .find((n) => n.children.includes('Temperature prediction'))!
      .props.onClick(),
  );
  for (const t of [1600, 3000, 6000, 6500]) {
    await act(() =>
      r!.root
        .findAll((n) => n.props['aria-label'] === 'Blackbody temperature')[0]
        .props.onChange(t),
    );
    const a = state();
    expect(JSON.parse(a).history).toBe(false);
    Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0, chapterTime: 0 });
    await act(() => r!.update(createElement(Scene)));
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toBe(a);
  }
});
