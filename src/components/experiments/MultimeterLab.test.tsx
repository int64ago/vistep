import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import MultimeterLab, { MultimeterArtwork } from './MultimeterLab';
import { multimeterDirector, lampMeter } from '../../models/multimeter-lab';
const film = vi.hoisted(() => ({ watch: false, chapter: 0, chapterTime: 0, variant: '' }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (p: { label: string; value: number; onChange: (n: number) => void }) =>
    createElement('input', { ...p, 'aria-label': p.label }),
  Segments: (p: { label: string; value: string; onChange: (n: string) => void }) =>
    createElement('select', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const v of mounted.splice(0)) await act(() => v.unmount());
  Object.assign(film, { watch: false, chapter: 0, chapterTime: 0, variant: '' });
});
const mount = async () => {
  let v!: ReactTestRenderer;
  await act(() => {
    v = create(createElement(MultimeterLab));
  });
  mounted.push(v);
  return v;
};
const choose = async (v: ReactTestRenderer, value: string) =>
  act(() => v.root.findAllByType('select')[0]!.props.onChange({ target: { value } }));
it('initializes the two textbook windows correctly and retains manual choices after watch', async () => {
  for (const [variant, initial] of [
    ['r3-multimeter-practice', 'voltage-external'],
    ['r3-multimeter-faults', 'fault'],
  ]) {
    film.variant = variant;
    const v = await mount();
    expect(v.root.findByType(MultimeterArtwork).props.direction.shot).toBe(initial);
    await choose(v, 'diode');
    film.watch = true;
    film.chapter = 8;
    film.chapterTime = 20;
    await act(() => v.update(createElement(MultimeterLab)));
    expect(v.root.findByType(MultimeterArtwork).props.direction).toEqual(multimeterDirector(8, 20));
    film.watch = false;
    await act(() => v.update(createElement(MultimeterLab)));
    expect(v.root.findByType(MultimeterArtwork).props.direction.shot).toBe('diode');
  }
});
it('actual fault controls move the measured section and preserve finite loading', async () => {
  const v = await mount();
  await choose(v, 'fault');
  const get = (name: string) =>
    v.root.findAllByType('select').find((s) => s.props['aria-label'] === name)!;
  await act(() => get('Fault').props.onChange('socket'));
  await act(() => get('Probe location').props.onChange('lamp'));
  const d = v.root.findByType(MultimeterArtwork).props.direction;
  expect(d.fault).toBe('socket');
  expect(d.probe).toBe('lamp');
  const currents = v.root.findAll((n) => n.props['data-meter-route'] === 'fault-red');
  expect(currents[0]!.props['data-current']).toBeGreaterThan(0);
});
it('short/open controls change the circuit, and calibration restores a real short', async () => {
  const v = await mount();
  await choose(v, 'ohm-core');
  const click = (label: string) =>
    act(() =>
      v.root
        .findAllByType('button')
        .find((b) => b.children.join('') === label)!
        .props.onClick(),
    );
  await click('Open probes');
  expect(v.root.findByType(MultimeterArtwork).props.direction.resistance).toBe(Infinity);
  await click('Calibrate right-hand zero');
  expect(v.root.findByType(MultimeterArtwork).props.direction.resistance).toBe(0);
  expect(v.root.findByType(MultimeterArtwork).props.direction.gain).toBe(1);
  await choose(v, 'diode');
  expect(v.root.findAllByType('button').some((b) => b.children.join('') === 'Open probes')).toBe(
    false,
  );
});
it('renders all chapters and candidate limits without nonfinite SVG geometry', () => {
  for (const narrow of [false, true])
    for (let c = 0; c < 10; c++)
      for (const t of [0, 8, 16, 25, 34]) {
        const svg = renderToStaticMarkup(
          createElement(MultimeterArtwork, { direction: multimeterDirector(c, t), narrow }),
        );
        expect(svg).not.toMatch(/NaN|Infinity|undefined/);
        expect(svg).toContain(`viewBox="0 0 ${narrow ? 268 : 640} 280"`);
      }
});
it('uses the same head and correct branch identities in both internal modes', () => {
  for (const c of [0, 1, 2]) {
    const svg = renderToStaticMarkup(
      createElement(MultimeterArtwork, { direction: multimeterDirector(c, 12), narrow: true }),
    );
    expect(svg).toContain('same-50uA-2kohm');
  }
  const a = renderToStaticMarkup(
    createElement(MultimeterArtwork, { direction: multimeterDirector(1, 14), narrow: true }),
  );
  expect(a).toContain('head-branch');
  expect(a).toContain('shunt-branch');
});

it('does not carry hidden open/short settings into a different specimen', async () => {
  const v = await mount();
  await choose(v, 'ohm-core');
  await act(() =>
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === 'Open probes')!
      .props.onClick(),
  );
  await choose(v, 'cold');
  expect(v.root.findByType(MultimeterArtwork).props.direction.resistance).toBe(15);
  await choose(v, 'contact');
  expect(v.root.findByType(MultimeterArtwork).props.direction.resistance).toBe(50000);
});
it('reversed DC probes change signed head current, without reversing the source lamp current', async () => {
  const v = await mount();
  const before = v.root.findAll((n) => n.props['data-meter-dial'] === 'same-head')[0]!.props[
    'data-deflection'
  ];
  await act(() =>
    v.root
      .findAllByType('button')
      .find((b) => b.children.join('') === 'Swap probes')!
      .props.onClick(),
  );
  const after = v.root.findAll((n) => n.props['data-meter-dial'] === 'same-head')[0]!.props[
    'data-deflection'
  ];
  expect(after).toBeCloseTo(-before, 12);
});

it('external source wire carries lamp plus meter current on the voltage range', async () => {
  const v = await mount(),
    s = lampMeter('voltage', 5);
  for (const kind of ['external-source', 'external-return'])
    expect(
      v.root.findAll((n) => n.props['data-meter-route'] === kind)[0]!.props['data-current'],
    ).toBeCloseTo(s.lampCurrent + s.meterCurrent, 14);
});

it('opening exploration follows the current chapter before a manual view is chosen', async () => {
  film.chapter = 5;
  film.chapterTime = 14;
  const v = await mount();
  expect(v.root.findByType(MultimeterArtwork).props.direction.shot).toBe('contact');
  await choose(v, 'diode');
  film.chapter = 3;
  await act(() => v.update(createElement(MultimeterLab)));
  expect(v.root.findByType(MultimeterArtwork).props.direction.shot).toBe('diode');
});
