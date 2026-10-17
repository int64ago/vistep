import { describe, it, expect } from 'vitest';
import {
  typeKEmf,
  typeKTemperature,
  thermocouple,
  thermocoupleDefaults,
  thermocoupleSegments,
  thermocoupleShot,
} from './thermocouple';
describe('type K thermocouple reference and compensation', () => {
  it('matches independent NIST tabulated values within table rounding', () => {
    for (const [t, e] of [
      [-100, -3.554],
      [0, 0],
      [100, 4.096],
      [400, 16.397],
      [600, 24.905],
      [1000, 41.276],
    ])
      expect(typeKEmf(t)).toBeCloseTo(e, 3);
  });
  it('inverts the nonlinear function over the supported range', () => {
    for (const t of [-150, -10, 0, 25, 100, 400, 600, 1372])
      expect(typeKTemperature(typeKEmf(t))).toBeCloseTo(t, 6);
  });
  it('equal temperatures give zero measured voltage but compensated absolute temperature', () => {
    const s = thermocouple({ ...thermocoupleDefaults(), hot: 100, cold: 100, sensedCold: 100 });
    expect(s.measured).toBe(0);
    expect(s.indicated).toBeCloseTo(100, 8);
  });
  it('warming only the reference changes raw voltage but not corrected hot temperature', () => {
    const a = thermocouple(thermocoupleDefaults()),
      b = thermocouple({ ...thermocoupleDefaults(), cold: 100, sensedCold: 100 });
    expect(b.measured).toBeLessThan(a.measured);
    expect(b.naive).toBeLessThan(a.naive);
    expect(b.indicated).toBeCloseTo(a.indicated, 8);
  });
  it('cold sensor error propagates through voltage correction, not a direct temperature sum', () => {
    const p = { ...thermocoupleDefaults(), sensedCold: 35 },
      s = thermocouple(p);
    expect(s.indicated).toBeGreaterThan(p.hot);
    expect(Math.abs(s.indicated - (s.naive + p.sensedCold))).toBeGreaterThan(0.1);
    expect(thermocouple(s).measured).toBe(s.measured);
  });
  it('moving interior thermal gradients preserves integrated paired emf and an isothermal insert adds none', () => {
    for (const profile of [0, 0.5, 1]) {
      const p = { ...thermocoupleDefaults(), profile, bridge: true };
      expect(thermocoupleSegments(p).reduce((a, b) => a + b.emf, 0)).toBeCloseTo(
        thermocouple(p).measured,
        10,
      );
      expect(thermocouple(p).bridgeContribution).toBe(0);
    }
  });
  it('rejects out of range temperatures', () => {
    expect(() => typeKEmf(1400)).toThrow();
    expect(() => thermocouple({ ...thermocoupleDefaults(), cold: -1 })).toThrow();
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import Thermocouple from '../components/experiments/Thermocouple';
it('executes every chapter and exploration without nonfinite output', () => {
  for (let chapter = 0; chapter < 6; chapter++)
    for (const progress of [0, 0.5, 1]) {
      const value = {
        watch: true,
        playing: false,
        time: chapter * 24 + progress * 24,
        chapter,
        run: 0,
        duration: 144,
        chapters: [],
        chapterTime: progress * 24,
        chapterProgress: progress,
      };
      expect(
        renderToStaticMarkup(
          createElement(FilmContext.Provider, { value }, createElement(Thermocouple)),
        ),
      ).not.toMatch(/NaN|Infinity/);
      expect(Number.isFinite(thermocoupleShot(chapter, progress).measured)).toBe(true);
    }
  expect(renderToStaticMarkup(createElement(Thermocouple))).not.toMatch(/NaN|Infinity/);
});
