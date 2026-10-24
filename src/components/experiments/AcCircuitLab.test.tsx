import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import Scene from './AcCircuitLab';
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
    Object.entries(r!.root.find((n) => n.props.className === 'ac21').props).filter(
      ([k]) => k.startsWith('data-') && k !== 'data-watch',
    ),
  );
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, { watch: true, chapter: 0, chapterProgress: 0.2 });
});
it('fresh Explore preserves every chapter at early, middle and late causal states', async () => {
  for (let chapter = 0; chapter < 12; chapter++)
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
    ['Choose circuit', 'inductor'],
    ['Supply', 'ac'],
    ['Frequency', 200],
    ['Inductance', 0.1],
    ['Signal phase', 2.7],
    ['Choose circuit', 'capacitor'],
    ['Capacitance', 500],
    ['Supply', 'dc'],
    ['Time after switching', 59],
    ['Choose circuit', 'lc'],
    ['Elapsed natural periods', 3.14],
    ['Loop resistance', 4],
    ['Switch position', 'source'],
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

it('rounded conserved energy labels total100 while the model keeps exact shares', async () => {
  Object.assign(film, { watch: false, chapter: 11, chapterProgress: 0.94 });
  await act(() => {
    r = create(createElement(Scene));
  });
  for (const resistance of [0, 1, 4]) {
    await act(() =>
      r!.root
        .findAll((n) => n.props['aria-label'] === 'Loop resistance')[0]
        .props.onChange(resistance),
    );
    for (const cycles of [0, 0.25, 0.5, 2.1, 5.5, 9.4, 10]) {
      await act(() =>
        r!.root
          .findAll((n) => n.props['aria-label'] === 'Elapsed natural periods')[0]
          .props.onChange(cycles),
      );
      const labels = r!.root
        .find((n) => n.props.className === 'ac21-energy-key')
        .findAllByType('b')
        .map((n) => Number(n.children.join('').replace('%', '')));
      expect(labels.reduce((a, b) => a + b, 0)).toBe(100);
      expect(labels.every((n) => n >= 0 && n <= 100)).toBe(true);
      const actual = state();
      expect(
        Number(actual['data-electric']) +
          Number(actual['data-magnetic']) +
          Number(actual['data-heat']),
      ).toBeCloseTo(0.0125, 12);
    }
  }
});
