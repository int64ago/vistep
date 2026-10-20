import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemSulfurTransformations from './ChemSulfurTransformations';
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
  duration: 262.5,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const tree = (chapter: number, watch = true, t = 0, variant = 'sulfur-inquiry') => (
  <FilmContext.Provider
    value={{ ...base, chapter, watch, chapterTime: t, chapterProgress: t / 30, variant }}
  >
    <ChemSulfurTransformations />
  </FilmContext.Provider>
);
const frame = (c: number, t: number, variant?: string) =>
  renderToStaticMarkup(tree(c, true, t, variant));
let r: ReactTestRenderer | undefined;
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => {
  if (r) act(() => r!.unmount());
  r = undefined;
  vi.unstubAllGlobals();
});
function render(c: number, watch = false, t = 0) {
  act(() => {
    if (r) r.update(tree(c, watch, t));
    else r = create(tree(c, watch, t));
  });
}
function click(text: string) {
  const b = r!.root.findAllByType('button').find((b) => b.children.join('') === text);
  expect(b).toBeDefined();
  act(() => b!.props.onClick());
}
function range(label: string, value: number) {
  const input = r!.root.findAllByType('input').find((x) => x.props['aria-label'] === label);
  expect(input).toBeDefined();
  act(() => input!.props.onChange({ target: { value: String(value) } }));
}
const section = () => r!.root.findByType('section');
describe('sulfur visible causal boundaries', () => {
  it('has no predicted product amounts before the two reveals', () => {
    expect(frame(2, 18)).toContain('data-answer-visible="false"');
    expect(frame(2, 18)).not.toContain('>1.25<');
    expect(frame(2, 24)).toContain('>1.25<');
    expect(frame(5, 23)).toContain('data-answer-visible="false"');
    expect(frame(5, 23)).not.toContain('>0.50<');
    expect(frame(5, 31)).toContain('>0.50<');
    expect(frame(8, 5)).not.toContain('0.129');
    expect(frame(8, 16)).toContain('0.129');
  });
  it('shows the persistent fifteen atoms and both sulfur destinations', () => {
    const html = frame(5, 19.1);
    expect(html.match(/data-atom-id=/g)).toHaveLength(15);
    expect(html).toContain('data-atom-id="s-salt"');
    expect(html).toContain('data-destination="CuSO4"');
    expect(html).toContain('data-atom-id="s-gas"');
    expect(html).toContain('data-destination="SO2"');
  });
  it('retains the coil versus copper-piece apparatus distinction', () => {
    expect(frame(3, 5, 'copper-acid')).toContain('data-copper="wire"');
    expect(frame(3, 5, 'sulfur-practical')).toContain('data-copper="piece"');
  });
  it('follows current chapters until explicit selection and isolates exploration from watch', () => {
    render(5);
    expect(section().props['data-chapter']).toBe('copper-solution-evidence');
    render(2, true, 24.1);
    render(2);
    expect(section().props['data-chapter']).toBe('sulfide-permanganate');
    range('Initial permanganate units', 0);
    expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
      '0.00',
      '0.00',
    ]);
    click('Two sulfurs');
    click('Finite reagents');
    range('Sulfuric-acid units', 1);
    expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
      '0.50',
      '0.50',
    ]);
    render(2, true, 24.1);
    expect(section().props['data-chapter']).toBe('sulfide-permanganate');
    expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
      '5.00',
      '1.25',
    ]);
    render(2);
    expect(section().props['data-chapter']).toBe('copper-solution-evidence');
    expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
      '0.50',
      '0.50',
    ]);
  });
  it('changes heat propagation through a real model control', () => {
    render(7);
    range('Dimensionless model time', 20);
    const far = () => r!.root.findByProps({ 'data-cell': 30 }).props['data-reacted'];
    expect(far()).toBeGreaterThan(0.99);
    click('No heat release');
    expect(far()).toBe(0);
    click('No ignition');
    expect(
      r!.root
        .findAll((n) => n.props['data-cell'] !== undefined)
        .every((n) => n.props['data-reacted'] === 0),
    ).toBe(true);
  });
  it('keeps the same stopped product amount as the comparison progress advances', () => {
    render(4);
    range('Stopping point for this comparison', 0.4);
    range('Compared reaction progress', 0.5);
    const note = () =>
      r!.root
        .findAllByProps({ className: 'csx15-note' })
        .map((x) => x.children.join(''))
        .join(' ');
    expect(note()).toContain('0.40');
    range('Compared reaction progress', 1);
    expect(note()).toContain('0.40');
  });
});
