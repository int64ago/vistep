import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import ChemElectronTransfer from './ChemElectronTransfer';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 256, compact: true }),
}));
let r: ReactTestRenderer | undefined;
const director: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 137,
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
function render(d = director) {
  const v = createElement(FilmContext.Provider, { value: d }, createElement(ChemElectronTransfer));
  act(() => {
    if (r) r.update(v);
    else r = create(v);
  });
}
function click(label: string) {
  const b = r!.root.findAllByType('button').find((b) => b.children.join('') === label);
  expect(b).toBeDefined();
  act(() => b!.props.onClick());
}
function range(index: number, value: number) {
  act(() =>
    r!.root.findAllByType('input')[index].props.onChange({ target: { value: String(value) } }),
  );
}
const charges = () =>
  r!.root
    .findAll((n) => n.props['data-atom'])
    .map((n) => [n.props['data-atom'], n.props['data-charge']]);
describe('electron picture interaction', () => {
  it('renders fouractual atoms and sixteen electronmarkers in thewhole ratio', () => {
    render();
    click('Whole ratio');
    expect(r!.root.findAll((n) => n.props['data-atom'])).toHaveLength(4);
    expect(r!.root.findAll((n) => n.props['data-electron'])).toHaveLength(16);
    range(0, 1);
    expect(charges()).toEqual([
      ['Na-0', 1],
      ['Cl-0', -1],
      ['Na-1', 1],
      ['Cl-1', -1],
    ]);
  });
  it('keeps the sharedHCl pair while toggling only theformalallocation overlay', () => {
    render();
    click('Covalent sharing');
    expect(r!.root.findByProps({ 'data-shared-pair': 'true' })).toBeDefined();
    expect(r!.root.findAll((n) => n.props['data-electron'])).toHaveLength(8);
    click('Formal allocation layer · Shown');
    expect(r!.root.findAllByProps({ 'data-formal-allocation': 'true' })).toHaveLength(0);
    expect(r!.root.findByProps({ 'data-shared-pair': 'true' })).toBeDefined();
  });
  it('keeps the copper prediction unanswered until exploration advances, including a return to the start', () => {
    render();
    click('Predict copper');
    const heading = () => r!.root.findByProps({ className: 'cet-kicker' }).children.join('');
    expect(heading()).toBe('How many Cu²⁺ can 1 Fe reduce?');
    expect(r!.root.findAll((n) => n.props['data-packet'] !== undefined)).toHaveLength(0);
    range(2, 0.25);
    expect(heading()).toBe('Two electron units reduce one Cu²⁺');
    expect(r!.root.findAll((n) => n.props['data-packet'] !== undefined)).toHaveLength(1);
    range(2, 0);
    expect(heading()).toBe('How many Cu²⁺ can 1 Fe reduce?');
    expect(r!.root.findAll((n) => n.props['data-packet'] !== undefined)).toHaveLength(0);
    range(0, 0);
    expect(heading()).toBe('No Fe supplies electrons');
  });
  it('changes actualcopper reduction atzeroFe and retains exploration separatelyfromwatch', () => {
    render();
    click('Predict copper');
    range(0, 0);
    range(2, 1);
    expect(charges()).toEqual([
      ['Cu-0', 2],
      ['Cu-1', 2],
    ]);
    render({ ...director, watch: true, chapter: 3, chapterTime: 38 });
    expect(charges().filter(([id, c]) => String(id).startsWith('Cu') && c === 0)).toHaveLength(2);
    render();
    expect(charges()).toEqual([
      ['Cu-0', 2],
      ['Cu-1', 2],
    ]);
  });
});
