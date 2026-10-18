import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChemCorrosionProtection from './ChemCorrosionProtection';
import { FilmContext, type Director } from '../lab/FilmContext';
import * as model from '../../models/chem-corrosion-protection';

vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 280 }),
}));
let renderer: ReactTestRenderer | undefined;
const director: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 1,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0.7,
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
});
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function mount() {
  act(() => {
    renderer = create(
      createElement(
        FilmContext.Provider,
        { value: director },
        createElement(ChemCorrosionProtection),
      ),
    );
  });
  return renderer!;
}
function choose(view: number) {
  act(() =>
    renderer!.root.findByType('select').props.onChange({ target: { value: String(view) } }),
  );
}
function click(label: string) {
  const button = renderer!.root.findAllByType('button').find((b) => b.children.join('') === label);
  expect(button, `Missing ${label}`).toBeDefined();
  act(() => button!.props.onClick());
}
function heading() {
  return renderer!.root.findByProps({ className: 'chem-corrosion-head' }).children.join('');
}
function drawingText() {
  return renderer!.root
    .findByType('svg')
    .findAllByType('text')
    .map((n) => n.children.join(''))
    .join('|');
}

describe('corrosion exploration reflects the active experiment', () => {
  it('identifies the iron-only geometry and corrosion state after the protection trial is disabled', () => {
    const state = vi.spyOn(model, 'protectionState');
    mount();
    choose(3);
    expect(drawingText()).toContain('Zn oxidation');
    expect(drawingText()).toContain('|Zn|');
    state.mockClear();
    click('Metallic contact');
    expect(heading()).toBe('Iron-only control: no zinc protection');
    expect(drawingText()).toContain('Fe oxidation · H⁺ reduction');
    expect(drawingText()).not.toContain('Zn oxidation');
    expect(drawingText()).not.toContain('Electrolyte + metal contact');
    expect(
      renderer!.root
        .findByType('svg')
        .findAllByType('text')
        .map((n) => n.children.join('')),
    ).not.toContain('Zn');
    expect(state.mock.calls.at(-1)?.[1]).toBe(false);
    expect(state.mock.results.at(-1)?.value.ironLost).toBeGreaterThan(0);
    choose(4);
    expect(heading()).toBe('Iron-only control: test for Fe²⁺');
    expect(drawingText()).toContain('Separate trial: iron only');
    click('Metallic contact');
    choose(3);
    expect(heading()).toBe('Zinc supplies electrons and protects iron');
    expect(drawingText()).toContain('Zn oxidation');
  });
  it('removes carbon grains when the same model input switches carbon off and restores both together', () => {
    const thermal = vi.spyOn(model, 'warmerModel');
    mount();
    choose(10);
    const grains = () => renderer!.root.findAllByProps({ 'data-material': 'carbon' }).length;
    expect(grains()).toBe(10);
    thermal.mockClear();
    click('Activated carbon');
    expect(grains()).toBe(0);
    const noCarbon = thermal.mock.calls.filter(([seconds]) => seconds > 0);
    expect(noCarbon.length).toBeGreaterThan(0);
    expect(noCarbon.every(([, opts]) => opts?.carbon === false)).toBe(true);
    const without = thermal.mock.results.at(-1)!.value.generated;
    thermal.mockClear();
    click('Activated carbon');
    expect(grains()).toBe(10);
    expect(
      thermal.mock.calls
        .filter(([seconds]) => seconds > 0)
        .every(([, opts]) => opts?.carbon === true),
    ).toBe(true);
    expect(thermal.mock.results.at(-1)!.value.generated).toBeGreaterThan(without);
  });
  it('keeps whole hydrogen bubbles in the liquid and fades them at its surface in both electrode trials', () => {
    mount();
    choose(3);
    const progress = () =>
      renderer!.root.findAllByType('input').find((n) => n.props.type === 'range')!;
    const setProgress = (value: number) =>
      act(() => progress().props.onChange({ target: { value: String(value) } }));
    for (const connected of [true, false]) {
      if (!connected) click('Metallic contact');
      for (let i = 0; i <= 100; i++) {
        setProgress(i / 100);
        const liquid = renderer!.root
          .findAllByType('path')
          .find((n) => n.props.fill === '#d9e3ce')!;
        const surface = Number(/M[-\d.]+ ([-\d.]+)/.exec(liquid.props.d)![1]);
        const bubbles = renderer!.root.findAllByProps({ 'data-process': 'hydrogen-bubble' });
        expect(bubbles).toHaveLength(3);
        for (const bubble of bubbles) {
          const { cy, r, opacity } = bubble.props;
          expect(cy - Number(r) - 0.5).toBeGreaterThanOrEqual(surface);
          expect(cy + Number(r) + 0.5).toBeLessThan(280);
          expect(opacity).toBeGreaterThanOrEqual(0);
          expect(opacity).toBeLessThanOrEqual(1);
        }
      }
      setProgress(0.299);
      const nearest = renderer!.root
        .findAllByProps({ 'data-process': 'hydrogen-bubble' })
        .sort((a, b) => a.props.cy - b.props.cy)[0];
      expect(nearest.props.cy).toBeLessThan(194);
      expect(nearest.props.opacity).toBeLessThan(0.05);
    }
  });
  it('labels dry and leaking controls without claiming the default visible result', () => {
    mount();
    click('Gas leak');
    expect(heading()).toBe('Leaking control: no sustained rise');
    click('Moist');
    expect(heading()).toBe('Dry and leaking control');
    click('Gas leak');
    expect(heading()).toBe('Dry control: unchanged water level');
    choose(6);
    expect(heading()).toBe('Dry control: no indicator zones');
    expect(renderer!.root.findByType('svg').props['aria-label']).toBe(heading());
    click('Moist');
    click('Metallic contact');
    expect(heading()).toBe('Separated metals: observe iron corrosion');
  });
});
