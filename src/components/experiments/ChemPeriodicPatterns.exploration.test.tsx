import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemPeriodicPatterns from './ChemPeriodicPatterns';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 272, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 236,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const frame = (chapter: number, t: number, watch = true, variant?: string) =>
  renderToStaticMarkup(
    <FilmContext.Provider
      value={{ ...base, chapter, chapterTime: t, chapterProgress: t / 30, watch, variant }}
    >
      <ChemPeriodicPatterns />
    </FilmContext.Provider>,
  );
describe('visible evidence without answer leakage', () => {
  it('keeps 118 element identities while rearranging', () => {
    expect(frame(1, 20).match(/data-element-id=/g)).toHaveLength(118);
  });
  it('does not render the hidden iodine value before the prediction reveal', () => {
    expect(frame(6, 12)).toContain('data-record="I" data-hidden="true"');
    expect(frame(6, 12)).not.toContain('>2.5<');
    expect(frame(6, 19)).toContain('>2.5<');
  });
  it('shows both affected atoms and the real departing token in the property window', () => {
    const html = frame(7, 24);
    expect(html).toContain('data-ion="P"');
    expect(html).toContain('data-ion="S"');
    expect(html.match(/data-tracked="true"/g)).toHaveLength(2);
    expect(html).toContain('data-electron-id="S-3p-0-1"');
  });
  it('holds the identical energy question before showing its answer', () => {
    const q = frame(7, 33);
    expect(q).toContain('which can ionize?');
    expect(q).not.toContain('Al is allowed');
    expect(q).not.toContain('data-phase="free"');
    expect(frame(7, 47)).toContain('Al is allowed');
  });
  it('shows source versus mnemonic, and never calls the mnemonic measured', () => {
    const x = frame(3, 18);
    expect(x).toContain('Mnemonic');
    expect(x).toContain('Spectroscopy');
    expect(x).toContain('3d⁹ 4s²');
    expect(x).toContain('3d¹⁰ 4s¹');
  });
  it('uses the actual textbook chapter, including chapters later in each window', () => {
    expect(frame(2, 0, false, 'electron-filling')).toContain('data-chapter="valence-filling"');
    expect(frame(7, 0, false, 'electronegativity')).toContain('data-chapter="ionization-dips"');
    const halogens = frame(6, 12, false, 'electronegativity');
    expect(halogens).toContain('data-chapter="halogen-trend"');
    expect(halogens).toContain('data-record="I" data-hidden="true"');
    expect(halogens).toContain('Reveal textbook I');
    expect(halogens).not.toContain('Na–Cl share period 3');
  });
});

let renderer: ReactTestRenderer | undefined;
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});
function live(chapter: number, watch: boolean, time = 12) {
  const tree = (
    <FilmContext.Provider
      value={{
        ...base,
        chapter,
        watch,
        chapterTime: time,
        chapterProgress: time / 30,
        variant: 'electronegativity',
      }}
    >
      <ChemPeriodicPatterns />
    </FilmContext.Provider>
  );
  act(() => {
    if (renderer) renderer.update(tree);
    else renderer = create(tree);
  });
}
const current = () => renderer!.root.findByType('section').props['data-chapter'];
const recordIds = () =>
  renderer!.root
    .findAll((n) => typeof n.type === 'string' && n.props['data-record'])
    .map((n) => n.props['data-record']);
function click(label: string) {
  const button = renderer!.root.findAllByType('button').find((n) => n.children.join('') === label);
  expect(button).toBeDefined();
  act(() => button!.props.onClick());
}
const selected = (label: string) =>
  renderer!.root.findAllByType('button').find((n) => n.children.join('') === label)?.props[
    'aria-pressed'
  ];
describe('mounted React exploration state across chapter changes', () => {
  it('follows each current chapter until a topic is explicitly selected', () => {
    live(7, true);
    live(7, false);
    expect(current()).toBe('ionization-dips');
    expect(selected('Ionization')).toBe(true);
    live(6, true);
    live(6, false);
    expect(current()).toBe('halogen-trend');
    expect(recordIds()).toEqual(['F', 'Cl', 'Br', 'I']);
    expect(selected('Fixed data')).toBe(true);
    expect(selected('Halogens')).toBe(true);
    live(5, true);
    live(5, false);
    expect(current()).toBe('alkali-trend');
    expect(recordIds()).toEqual(['Li', 'Na', 'K', 'Rb', 'Cs']);
    expect(selected('Alkali metals')).toBe(true);
  });
  it('retains an explicit topic without leaking it into the automatic film', () => {
    live(6, false);
    click('Cr / Cu');
    click('Cu');
    live(7, true, 24);
    expect(current()).toBe('ionization-dips');
    expect(renderer!.root.findAll((n) => n.props['data-ion'] === 'P')).toHaveLength(1);
    live(7, false);
    expect(current()).toBe('configuration-exceptions');
    expect(selected('Cr / Cu')).toBe(true);
    expect(selected('Cu')).toBe(true);
  });
  it('retains an explicitly chosen record group but watch reads its own fixed records', () => {
    live(6, false);
    click('Alkali metals');
    expect(selected('Alkali metals')).toBe(true);
    live(4, true);
    expect(recordIds()).toEqual(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar']);
    live(7, false);
    expect(current()).toBe('period-electronegativity');
    expect(selected('Fixed data')).toBe(true);
    expect(selected('Alkali metals')).toBe(true);
    expect(recordIds()).toEqual(['Li', 'Na', 'K', 'Rb', 'Cs']);
  });
});

describe('measured separate atom states', () => {
  it('keeps neutral P as reference and updates the S header when its selected electron departs', () => {
    const before = frame(7, 14);
    expect(before).toContain('P: unpaired; S: one pair');
    const during = frame(7, 20);
    expect(during).toContain('S: paired electron departing');
    expect(during).not.toContain('S: one pair');
    const after = frame(7, 22);
    expect(after).toContain('data-ion="P" data-phase="bound"');
    expect(after).toContain('data-ion="S" data-phase="free"');
    expect(after).toContain('S: paired electron removed');
    expect(after).not.toContain('S: one pair');
  });
  it('does not claim S ionized when explore progress is one but supplied energy is zero', () => {
    live(7, false);
    click('P / S');
    const set = (label: string, value: string) => {
      const input = renderer!.root
        .findAllByType('input')
        .find((n) => n.props['aria-label'] === label)!;
      act(() => input.props.onChange({ target: { value } }));
    };
    set('Selected event progress', '1');
    set('Supplied energy / eV', '0');
    expect(renderer!.root.findAll((n) => n.props['data-ion'] === 'S')[0].props['data-phase']).toBe(
      'bound',
    );
    const text = JSON.stringify(renderer!.toJSON());
    expect(text).not.toContain('S⁺: 3p³ + e⁻');
  });
});
