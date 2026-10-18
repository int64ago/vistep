import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import ChemSodiumReactions from './ChemSodiumReactions';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 256, compact: true }),
}));
let r: ReactTestRenderer | undefined;
const d: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 266.5,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  });
});
afterEach(() => {
  if (r) act(() => r!.unmount());
  r = undefined;
  vi.unstubAllGlobals();
});
function render(v = d) {
  act(() => {
    const node = createElement(
      FilmContext.Provider,
      { value: v },
      createElement(ChemSodiumReactions),
    );
    if (r) r.update(node);
    else r = create(node);
  });
}
function click(text: string) {
  const node = r!.root.findAllByType('button').find((n) => n.children.join('').includes(text));
  expect(node).toBeDefined();
  act(() => node!.props.onClick());
}
function range(i: number, v: number) {
  act(() => r!.root.findAllByType('input')[i].props.onChange({ target: { value: String(v) } }));
}
function surface() {
  return r!.root.findAllByType('svg').find((n) => n.props['data-layer'] !== undefined)!.props;
}
describe('sodium exploration keeps controls and scientific state connected', () => {
  it('stops new model oxidation without erasing a previous layer and isolates watch state', () => {
    render();
    expect(surface()['data-layer']).toBe(0.4);
    click('Oxygen contact');
    click('Add model exposure');
    expect(surface()['data-layer']).toBe(0.4);
    click('Oxygen contact');
    click('Add model exposure');
    expect(surface()['data-layer']).toBeCloseTo(0.6);
    render({ ...d, watch: true, chapterTime: 22 });
    expect(surface()['data-layer']).toBe(0.8);
    expect(surface()['data-oxygen-contact']).toBe(false);
    render();
    expect(surface()['data-layer']).toBeCloseTo(0.6);
    click('Reset fresh face');
    expect(surface()['data-layer']).toBe(0);
  });
  it('preserves the oxide counterexample while changing the actual sodium amount', () => {
    render();
    click('An equal-sodium test');
    range(0, 1);
    range(1, 8);
    const svg = r!.root
      .findAllByType('svg')
      .find((n) => n.props['data-sodium-amount'] !== undefined)!;
    expect(svg.props['data-sodium-amount']).toBe(8);
    expect(svg.props['data-revealed']).toBe(true);
    const text = r!.root.findAllByType('text').map((n) => n.children.join(''));
    expect(text).toContain('4 H₂');
    expect(text).toContain('No gas');
    expect(text).toContain('2 O₂');
    range(0, 0.3);
    expect(r!.root.findByProps({ 'data-sodium-amount': 8 }).props['data-revealed']).toBe(false);
    expect(r!.root.findAllByType('text').filter((n) => n.children.join('') === '?')).toHaveLength(
      3,
    );
  });
  it('renders every peroxide atom and both ledger units from the same progress', () => {
    render();
    click('Follow peroxide oxygen');
    range(0, 0.5);
    expect(r!.root.findAll((n) => n.props['data-atom'])).toHaveLength(14);
    expect(r!.root.findAll((n) => n.props['data-ledger-electron'])).toHaveLength(2);
    range(0, 1);
    expect(r!.root.findByProps({ 'data-atom-count': 14 }).props['data-complete']).toBe(true);
    render({ ...d, watch: true, chapter: 4, chapterTime: 8 });
    expect(r!.root.findByProps({ 'data-atom-count': 14 }).props['data-complete']).toBe(false);
    render();
    expect(r!.root.findByProps({ 'data-atom-count': 14 }).props['data-complete']).toBe(true);
  });
});

it('shows the narrated indicator evidence and the water oxygen at measured English cues', () => {
  render({ ...d, watch: true, chapter: 3, chapterTime: 28 });
  expect(r!.root.findAllByType('text').some((n) => n.children.join('') === 'Phenolphthalein')).toBe(
    true,
  );
  render({ ...d, watch: true, chapter: 4, chapterTime: 20.75 });
  expect(
    r!.root.findAllByType('p').some((n) => n.children.join('') === 'The oxygen pair is now O₂'),
  ).toBe(true);
  expect(r!.root.findAllByType('text').some((n) => n.children.join('') === 'O₂ · 0')).toBe(true);
  render({ ...d, watch: true, chapter: 4, chapterTime: 29 });
  const rings = r!.root.findAllByType('circle').filter((n) => n.props.stroke === '#4d8eae');
  expect(rings).toHaveLength(2);
});
