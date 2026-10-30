import { createElement, type ComponentType } from 'react';
import { act, create, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import ElectrostaticInduction from './ElectrostaticInduction';
import FranklinElectricityEvidence from './FranklinElectricityEvidence';
import CoulombTorsion from './CoulombTorsion';
import ElectricFieldMapping from './ElectricFieldMapping';
import ElectrostaticApplicationsLab from './ElectrostaticApplicationsLab';
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
    Object.entries(r!.root.findByType('section').props).filter(
      ([key]) => key.startsWith('data-') && key !== 'data-watch' && key !== 'data-chapter',
    ),
  );
const isProbe = (n: ReactTestInstance): boolean =>
  !!n.props['data-exploration-tool'] || !!(n.parent && isProbe(n.parent));
const geometry = () =>
  r!.root
    .findAllByType('svg')
    .map((svg) =>
      svg
        .findAll(
          (n) => ['path', 'circle', 'rect', 'g', 'text'].includes(String(n.type)) && !isProbe(n),
        )
        .map((n) =>
          Object.fromEntries(Object.entries(n.props).filter(([key]) => key !== 'children')),
        ),
    );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
});
const cases: [string, ComponentType, number, string, number | string][] = [
  ['induction', ElectrostaticInduction, 7, '移近 → 分开 → 移走 → 重接', 43],
  ['Franklin', FranklinElectricityEvidence, 4, '两路示意电源电压幅值', 350],
  ['Coulomb', CoulombTorsion, 4, '未偏转时的球心距离', 11],
  ['field mapping', ElectricFieldMapping, 4, '碎屑取向过程', 23],
  ['applications', ElectrostaticApplicationsLab, 6, '带电球电荷', -12],
];
for (const [name, Scene, count, label, value] of cases) {
  it(`${name}: entering Explore retains the actual paused apparatus in every chapter, and survives untouched replay`, async () => {
    for (let chapter = 0; chapter < count; chapter++) {
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
      Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.1 });
      await act(() => r!.update(createElement(Scene)));
      film.watch = false;
      await act(() => r!.update(createElement(Scene)));
      expect(state()).toEqual(paused);
      expect(geometry()).toEqual(picture);
      await act(() => r!.unmount());
      r = undefined;
    }
  });
  it(`${name}: changing a real input changes the model and persists through replay`, async () => {
    Object.assign(film, { watch: true, chapter: 1, chapterProgress: 0.55 });
    await act(() => {
      r = create(createElement(Scene));
    });
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    const before = geometry();
    await act(() =>
      r!.root.findAll((n) => n.props['aria-label'] === label)[0].props.onChange(value),
    );
    const manual = state(),
      picture = geometry();
    expect(picture).not.toEqual(before);
    Object.assign(film, { watch: true, chapter: count - 1, chapterProgress: 0.9 });
    await act(() => r!.update(createElement(Scene)));
    film.watch = false;
    await act(() => r!.update(createElement(Scene)));
    expect(state()).toEqual(manual);
    expect(geometry()).toEqual(picture);
  });
}
