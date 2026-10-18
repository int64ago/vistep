import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import ChemPrecipitationPaths from './ChemPrecipitationPaths';
import { FilmContext, type Director } from '../lab/FilmContext';
import { PRECIPITATION_DURATIONS } from '../../models/chem-precipitation-paths';
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 256, compact: true }),
}));
let renderer: ReactTestRenderer | undefined;
const director: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 255,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
});
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});
function mount(watch = false, chapter = 0, p = 0) {
  act(() => {
    renderer = create(
      createElement(
        FilmContext.Provider,
        {
          value: {
            ...director,
            watch,
            chapter,
            chapterProgress: p,
            chapterTime: p * PRECIPITATION_DURATIONS[chapter],
          },
        },
        createElement(ChemPrecipitationPaths),
      ),
    );
  });
  return renderer!;
}
function click(label: string) {
  const b = renderer!.root.findAllByType('button').find((b) => b.children.join('') === label);
  expect(b, `button ${label}`).toBeDefined();
  act(() => b!.props.onClick());
}
function range(index: number, value: number) {
  const inputs = renderer!.root.findAllByType('input');
  act(() => inputs[index].props.onChange({ target: { value: String(value) } }));
}
const text = () => JSON.stringify(renderer!.toJSON());
const phases = () =>
  renderer!.root.findAll((n) => n.props['data-silver']).map((n) => n.props['data-phase']);
describe('precipitation controls change the depicted material state', () => {
  it('retains an explicit sulfur connected to its two silver markers on a short screen', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    });
    mount(true, 6, 1);
    const formula = renderer!.root.findByProps({ 'data-sulfide-formula': 0 });
    expect(formula.findByType('text').children).toEqual(['S']);
    expect(formula.findByType('path').props.d.match(/L/g)).toHaveLength(2);
    expect(
      renderer!.root.findAll((n) => n.props['data-sulfide-formula'] !== undefined),
    ).toHaveLength(1);
    expect(phases().filter((p) => p === 2)).toHaveLength(10);
    for (const id of ['Ag-0', 'Ag-1']) {
      expect(renderer!.root.findByProps({ 'data-silver': id }).props['data-phase']).toBe(2);
    }
  });
  it('shows the independently checked partial-dose counterexample as an intermediate, then reallocates Ag to AgI', () => {
    mount();
    click('Silver salts');
    expect(phases().filter((p) => p === 0)).toHaveLength(3);
    expect(phases().filter((p) => p === 1)).toHaveLength(3);
    expect(phases().filter((p) => p === 2)).toHaveLength(4);
    expect(renderer!.root.findByProps({ 'data-iodide-phase': 'AgI' })).toBeDefined();
    expect(text()).toContain('AgCl ');
    expect(text()).toContain('0.30');
    click('Intermediate');
    expect(phases().filter((p) => p === 0)).toHaveLength(6);
    expect(phases().filter((p) => p === 1)).toHaveLength(0);
    expect(phases().filter((p) => p === 2)).toHaveLength(4);
    expect(text()).toContain('Selected intermediate');
    expect(text()).toContain('1.59e+6');
    click('Re-form AgI');
    range(2, 0.2);
    expect(phases().filter((p) => p === 'water')).toHaveLength(1);
    const ids = renderer!.root
      .findAll((n) => n.props['data-silver'])
      .map((n) => n.props['data-silver']);
    expect(new Set(ids).size).toBe(10);
    range(2, 1);
    expect(phases().filter((p) => p === 1)).toHaveLength(3);
  });
  it('removes barium and precipitate at zero dose and does not offer irrelevant controls', () => {
    mount();
    range(0, 0);
    expect(renderer!.root.findAllByProps({ 'data-particle': 'Ba-tracked' })).toHaveLength(0);
    expect(renderer!.root.findByProps({ 'data-solid': 'barium-sulfate' }).props.opacity).toBe(0);
    click('Acid');
    click('Neutralize');
    expect(renderer!.root.findAllByType('input')).toHaveLength(1);
    click('Iron & magnesium');
    click('Same-colour comparison');
    expect(renderer!.root.findAllByType('input')).toHaveLength(0);
    expect(text()).toContain('Initial extra OH⁻');
  });
  it('keeps playback independent of saved exploration doses', () => {
    const r = mount();
    click('Silver salts');
    range(0, 0.1);
    range(1, 0.1);
    act(() =>
      r.update(
        createElement(
          FilmContext.Provider,
          {
            value: { ...director, watch: true, chapter: 6, chapterProgress: 1, chapterTime: 24.5 },
          },
          createElement(ChemPrecipitationPaths),
        ),
      ),
    );
    expect(phases().filter((p) => p === 2)).toHaveLength(10);
    act(() =>
      r.update(
        createElement(
          FilmContext.Provider,
          { value: director },
          createElement(ChemPrecipitationPaths),
        ),
      ),
    );
    expect(phases().filter((p) => p === 2)).toHaveLength(2);
    expect(phases().filter((p) => p === 1)).toHaveLength(1);
  });
  it('identifies iron(III) instead of elemental iron in the transfer and distinguishes dynamic exchange from bulk amounts', () => {
    mount(true, 8, 0.6);
    expect(text()).toContain('Fe³⁺');
    expect(text()).not.toContain('"Fe"');
    act(() =>
      renderer!.update(
        createElement(
          FilmContext.Provider,
          {
            value: { ...director, watch: true, chapter: 4, chapterProgress: 0.2, chapterTime: 3.8 },
          },
          createElement(ChemPrecipitationPaths),
        ),
      ),
    );
    expect(text()).toContain('counts are not phase amounts');
    expect(text()).not.toContain('Ag ledger');
  });
});
