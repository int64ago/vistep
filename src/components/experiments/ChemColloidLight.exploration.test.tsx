import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChemColloidLight from './ChemColloidLight';
import { FilmContext, type Director } from '../lab/FilmContext';
import { observedRoute } from '../../models/chem-colloid-light';
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 280, compact: true }),
}));
let renderer: ReactTestRenderer | undefined;
const base: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 1,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0.35,
};
const tree = (director = base) =>
  createElement(FilmContext.Provider, { value: director }, createElement(ChemColloidLight));
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
});
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});
function mount() {
  act(() => {
    renderer = create(tree());
  });
}
function click(label: string) {
  const b = renderer!.root.findAllByType('button').find((n) => n.children.join('') === label);
  expect(b).toBeDefined();
  act(() => b!.props.onClick());
}
function texts() {
  return renderer!.root
    .findAllByType('text')
    .map((n) => n.children.join(''))
    .join('|');
}

describe('colloid causal exploration', () => {
  it('blocks only the eye route and keeps the screen result; watch discards the exploratory blocker', () => {
    mount();
    click('Block a path');
    expect(texts()).toContain('Eye: scattered light');
    click('Block particle-to-eye light');
    expect(texts()).toContain('Eye: no light');
    expect(texts()).toContain('Screen lit');
    const g = observedRoute(280, true);
    const route = `M${g.particle.x} ${g.particle.y}L${g.blocker.x} ${g.blocker.y}`;
    expect(renderer!.root.findAllByType('path').some((n) => n.props.d === route)).toBe(true);
    expect(renderer!.root.findByType('svg').props['aria-label']).toContain('intercepts only');
    act(() => renderer!.update(tree({ ...base, watch: true, chapter: 1, chapterProgress: 0.44 })));
    expect(texts()).toContain('Eye: scattered light');
    expect(renderer!.root.findAllByType('button')).toHaveLength(0);
  });
  it('renders a finite scattered wave train, then removes it after all light has left', () => {
    mount();
    click('Why it scatters');
    const fields = () => renderer!.root.findAllByProps({ 'data-light': 'scattered-field' });
    expect(fields().some((n) => n.props.d.length > 0)).toBe(true);
    const slider = renderer!.root.findByType('input');
    act(() => slider.props.onChange({ target: { value: '12' } }));
    expect(fields().every((n) => n.props.d.trim() === '')).toBe(true);
    expect(texts()).toContain('Source off');
    expect(texts()).toContain('Response stops');
    expect(renderer!.root.findByType('svg').props['aria-label']).toContain('final');
  });
  it('shows the no-particle boundary instead of leaving a decorative side beam', () => {
    mount();
    click('Test a prediction');
    const slider = renderer!.root.findByType('input');
    act(() => slider.props.onChange({ target: { value: '0' } }));
    const svg = renderer!.root.findByType('svg');
    expect(svg.props['aria-label']).toContain('100.0% unscattered, 0.0% scattered');
    expect(
      svg
        .findAllByType('path')
        .filter((n) => n.props.strokeWidth === '8' || n.props.d === 'M140 91V159')
        .every((n) => n.props.opacity === 0),
    ).toBe(true);
  });
});
