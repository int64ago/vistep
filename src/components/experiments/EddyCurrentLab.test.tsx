import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { it, expect, vi, afterEach } from 'vitest';
import EddyCurrentLab, { EddyArtwork } from './EddyCurrentLab';
const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterTime: 3,
  chapterProgress: 0.2,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
const language = vi.hoisted(() => ({ value: 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => language.value }));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: any) => createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let r: ReactTestRenderer | undefined;
const shot = () => r!.root.findByType(EddyArtwork).props.shot;
const control = (label: string) => r!.root.findAll((n) => n.props['aria-label'] === label)[0]!;
afterEach(async () => {
  if (r) await act(() => r!.unmount());
  r = undefined;
  Object.assign(film, {
    watch: true,
    chapter: 0,
    chapterTime: 3,
    chapterProgress: 0.2,
    variant: '',
  });
});
it('fresh Explore inherits the current apparatus, local view, calculation and prediction in every window', async () => {
  for (let c = 0; c < 10; c++)
    for (const t of [2, 10, 20]) {
      Object.assign(film, { watch: true, chapter: c, chapterTime: t });
      await act(() => {
        r = create(createElement(EddyCurrentLab));
      });
      const before = shot();
      film.watch = false;
      await act(() => r!.update(createElement(EddyCurrentLab)));
      expect(shot()).toEqual(before);
      await act(() => r!.unmount());
      r = undefined;
    }
});
it('manual field and view persist, while Watch uses its independent director', async () => {
  Object.assign(film, { watch: false, chapter: 5, chapterTime: 10 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  await act(() => control('Normal magnetic field').props.onChange(-0.5));
  await act(() => control('View').props.onChange('energy'));
  const manual = shot();
  film.watch = true;
  await act(() => r!.update(createElement(EddyCurrentLab)));
  expect(shot().field).toBe(0.3);
  expect(shot().view).toBe('loop');
  Object.assign(film, { chapter: 0, chapterTime: 0 });
  await act(() => r!.update(createElement(EddyCurrentLab)));
  expect(shot().apparatus).toBe('meter');
  film.watch = false;
  await act(() => r!.update(createElement(EddyCurrentLab)));
  expect(shot()).toEqual(manual);
});
it('a held prediction remains unanswered in fresh Explore until the explicit physical test', async () => {
  Object.assign(film, { watch: false, chapter: 5, chapterTime: 19 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  expect(shot()).toMatchObject({ question: true, field: 0.3 });
  await act(() =>
    r!.root
      .findAllByType('button')
      .find((n) => n.children.includes('Test prediction'))!
      .props.onClick(),
  );
  expect(shot()).toMatchObject({ question: false, field: -0.3 });
});
it('a stopped magnet in an intact tube retains flux but every rendered complete ring carries zero current', async () => {
  Object.assign(film, { chapter: 7, chapterTime: 24 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  const rings = r!.root.findAll((n) => n.type === 'g' && n.props['data-ring-z'] !== undefined);
  expect(rings.length).toBeGreaterThan(2);
  for (const g of rings) {
    expect(g.props['data-flux']).toBeGreaterThan(0);
    expect(g.props['data-current']).toBeCloseTo(0, 12);
  }
  expect(r!.root.findByProps({ 'data-object': 'tube' }).props['data-slit']).toBe(false);
});
it('cut tube rings are visibly open and never carry a current across the gap', async () => {
  Object.assign(film, { chapter: 7, chapterTime: 12 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  const rings = r!.root.findAll((n) => n.type === 'g' && n.props['data-ring-z'] !== undefined);
  for (const g of rings) {
    expect(g.props['data-current']).toBeCloseTo(0, 12);
    expect(
      g.findAll((n) => n.props['data-loop-closed'] !== undefined)[0]!.props['data-loop-closed'],
    ).toBe(false);
  }
});
it('frame B and rotor normal use the same actual spatial angle as the flux', async () => {
  Object.assign(film, { chapter: 2, chapterTime: 14 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  const g = r!.root.findByProps({ 'data-object': 'frame' }),
    p = r!.root.findAll((n) => n.props['data-frame-normal-x'] !== undefined)[0]!;
  expect(p.props['data-frame-normal-x']).toBeCloseTo(Math.cos(p.props['data-rotor-angle']), 12);
  expect(p.props['data-frame-normal-y']).toBeCloseTo(Math.sin(p.props['data-rotor-angle']), 12);
  expect(g.props['data-relative-angle']).toBeCloseTo(
    1.6 * shot().time - p.props['data-rotor-angle'],
    12,
  );
});
it('spring ends at the moving magnet attachment and coil leads connect to the same switch', async () => {
  Object.assign(film, { chapter: 9, chapterTime: 9 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  const spring = r!.root.findAll(
      (n) => n.type === 'path' && n.props['data-spring-bottom'] !== undefined,
    )[0]!,
    magnet = r!.root.findByProps({ 'data-part': 'magnet' });
  expect(spring.props['data-spring-bottom']).toBeCloseTo(magnet.props['data-center-y'] - 24, 12);
  expect(r!.root.findByProps({ 'data-switch': 'spring' }).props['data-closed']).toBe(true);
});
it('the initially absent disc field is introduced by its own prediction, not multiplied by minus zero', async () => {
  Object.assign(film, { watch: false, chapter: 4, chapterTime: 20 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  expect(shot().field).toBe(0);
  await act(() =>
    r!.root
      .findAllByType('button')
      .find((n) => n.children.includes('Test prediction'))!
      .props.onClick(),
  );
  expect(shot().field).toBe(0.3);
});
it('each optional comparison uses the selected apparatus rather than a disc fallback', async () => {
  Object.assign(film, { watch: false, chapter: 2, chapterTime: 10 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  await act(() => control('View').props.onChange('compare'));
  expect(
    r!.root.findAll((n) => n.type === 'path' && n.props['data-compared-apparatus'] === 'frame'),
  ).toHaveLength(2);
});
it('an externally held tube shows zero instantaneous electrical power instead of old falling energy', async () => {
  Object.assign(film, { watch: false, chapter: 7, chapterTime: 25 });
  await act(() => {
    r = create(createElement(EddyCurrentLab));
  });
  expect(r!.root.findAll((n) => n.props['data-external-holder'] === 'true')).toHaveLength(1);
  await act(() => control('View').props.onChange('energy'));
  expect(r!.root.findAll((n) => n.props['data-static-test'] === 'true')).toHaveLength(1);
  expect(r!.root.findAll((n) => n.props['data-energy-value'] !== undefined)).toHaveLength(0);
});

it('passes locale to the measured director and carries the held question into Explore', async () => {
  for (const lang of ['zh', 'en']) {
    language.value = lang;
    Object.assign(film, { watch: true, chapter: 7, chapterTime: 4 });
    await act(() => {
      r = create(createElement(EddyCurrentLab));
    });
    expect(shot().question).toBe(lang === 'zh');
    const current = shot();
    film.watch = false;
    await act(() => r!.update(createElement(EddyCurrentLab)));
    expect(shot()).toEqual(current);
    await act(() => r!.unmount());
    r = undefined;
  }
  language.value = 'en';
});
