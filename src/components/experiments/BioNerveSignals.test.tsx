import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { FilmContext, type Director } from '../lab/FilmContext';
import Scene from './BioNerveSignals';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288 }),
}));
const initial: Director = {
  watch: true,
  playing: false,
  time: 51,
  chapter: 2,
  run: 0,
  duration: 154,
  chapters: [],
  chapterTime: 7,
  chapterProgress: 7 / 22,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
async function mounted(film: Director) {
  let renderer: ReturnType<typeof create>;
  const node = () => createElement(FilmContext.Provider, { value: film }, createElement(Scene));
  await act(() => {
    renderer = create(node());
  });
  return {
    get root() {
      return renderer!.root;
    },
    update: () => act(() => renderer!.update(node())),
    close: () => act(() => renderer!.unmount()),
    json: () => JSON.stringify(renderer!.toJSON()),
    button: (name: string) =>
      renderer!.root.findAllByType('button').find((b) => b.children.join('') === name)!,
  };
}
describe('nerve actual mounted state', () => {
  it('labels net voltage decline rather than merely the still-open sodium gate', async () => {
    const r = await mounted({ ...initial, watch: false });
    const time = r.root.findAllByType('input').find((n) => n.props.max === '6')!;
    await act(() => time.props.onChange({ target: { value: '1.45' } }));
    expect(
      r.root.findByProps({ className: 'bns18-head' }).findByType('span').children.join(''),
    ).toBe('K exits; voltage falls');
    await r.close();
  });
  it('does not report historical contraction before its visible condition changes', async () => {
    const r = await mounted({ ...initial, chapter: 5, chapterTime: 0 });
    expect(
      r.root.findAllByType('text').some((n) => n.children.join('') === 'Observe the contact'),
    ).toBe(true);
    await r.close();
  });
  it('inherits membrane shot, changes computed charge, isolates watch and retains manual exploration', async () => {
    const film = { ...initial };
    const r = await mounted(film),
      before = r.json();
    const voltage = () => r.root.findByProps({ 'data-voltage': true }).children.join('');
    const original = voltage();
    film.watch = false;
    await r.update();
    expect(r.root.findByProps({ className: 'bns18' }).props['data-theme']).toBe('membrane');
    expect(voltage()).toBe(original);
    await act(() => r.button('Na pathway').props.onClick());
    expect(voltage()).not.toBe(original);
    await act(() => r.button('Synapse').props.onClick());
    expect(r.root.findByProps({ className: 'bns18' }).props['data-theme']).toBe('synapse');
    film.watch = true;
    await r.update();
    expect(r.json()).toBe(before);
    film.watch = false;
    await r.update();
    expect(r.root.findByProps({ className: 'bns18' }).props['data-theme']).toBe('synapse');
    await act(() => r.button('Membrane charge').props.onClick());
    expect(r.button('Na pathway').props['aria-pressed']).toBe(false);
    await r.close();
  });
  it('capacitance changes the same current-integrated waveform and both closed pathways hold rest', async () => {
    const film = { ...initial, watch: false };
    const r = await mounted(film),
      v = () => r.root.findByProps({ 'data-voltage': true }).children.join('');
    const before = v();
    const cap = r.root.findAllByType('input').find((n) => n.props.min === '.5')!;
    await act(() => cap.props.onChange({ target: { value: '2' } }));
    expect(v()).not.toBe(before);
    await act(() => r.button('Na pathway').props.onClick());
    await act(() => r.button('K pathway').props.onClick());
    expect(v()).toBe('-70.0 mV');
    await r.close();
  });
  it('synapse current chapter inherits the actual controlled condition until manually changed', async () => {
    const film = { ...initial, chapter: 4, chapterTime: 17 };
    const r = await mounted(film);
    expect(r.root.findByProps({ className: 'bns18' }).props['data-counter']).toBe('receptor');
    film.watch = false;
    await r.update();
    expect(r.root.findByProps({ className: 'bns18' }).props['data-theme']).toBe('synapse');
    // Exploration initially inherits the disabled receptor rather than silently restoring it.
    expect(r.button('Receptors responsive').props['aria-pressed']).toBe(false);
    await act(() => r.button('Receptors responsive').props.onClick());
    expect(r.button('Receptors responsive').props['aria-pressed']).toBe(true);
    film.watch = true;
    await r.update();
    expect(r.root.findByProps({ className: 'bns18' }).props['data-counter']).toBe('receptor');
    film.watch = false;
    await r.update();
    expect(r.button('Receptors responsive').props['aria-pressed']).toBe(true);
    await r.close();
  });
  it('coincident electrodes give zero and historical disconnected contact remains distinct', async () => {
    const film = { ...initial, watch: false, chapter: 1, chapterTime: 5 };
    const r = await mounted(film);
    const separation = r.root.findAllByType('input').find((n) => n.props.max === '45')!;
    await act(() => separation.props.onChange({ target: { value: '0' } }));
    expect(r.root.findAllByType('text').some((n) => n.children.join('').includes('= 0.0'))).toBe(
      true,
    );
    await act(() => r.button('Bioelectric evidence').props.onClick());
    await act(() => r.button('Disconnected').props.onClick());
    expect(r.root.findAllByType('text').some((n) => n.children.join('') === 'No contraction')).toBe(
      true,
    );
    await r.close();
  });
});

it('starts an unrelated manually selected theme at its own initial condition', async () => {
  const film = { ...initial, chapter: 4, chapterTime: 17 };
  const r = await mounted(film);
  const before = r.json();
  film.watch = false;
  await r.update();
  expect(r.button('Receptors responsive').props['aria-pressed']).toBe(false);
  await act(() => r.button('Bioelectric evidence').props.onClick());
  expect(r.button('Metal').props['aria-pressed']).toBe(true);
  expect(r.root.findAllByType('input').find((n) => n.props.max === '6')!.props.value).toBe(0);
  await act(() => r.button('Tissue contact').props.onClick());
  film.watch = true;
  await r.update();
  expect(r.json()).toBe(before);
  film.watch = false;
  await r.update();
  expect(r.button('Tissue contact').props['aria-pressed']).toBe(true);
  await r.close();
});
