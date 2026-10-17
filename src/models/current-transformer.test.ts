import { describe, it, expect } from 'vitest';
import {
  ctDefaults,
  currentTransformer,
  ctH,
  ctEnergy,
  ctShot,
  ctWinding,
} from './current-transformer';
describe('nonlinear current transformer magnetic and burden circuit', () => {
  it('matches the independent linear phasor solution at low field', () => {
    const p = { ...ctDefaults(), primaryRms: 5, knee: 100 },
      lm = (4e-7 * Math.PI * p.permeability * p.secondaryTurns ** 2 * p.area) / p.pathLength,
      x = 2 * Math.PI * p.frequency * lm,
      mag = x / Math.hypot(p.burden, x),
      lead = Math.atan(p.burden / x);
    for (const theta of [0.1, 1, 2, 3])
      expect(currentTransformer(p, theta).secondary).toBeCloseTo(
        ((Math.SQRT2 * p.primaryRms) / p.secondaryTurns) * mag * Math.sin(theta + lead),
        6,
      );
  });
  it('conserves ampere-turns and instantaneous power including magnetic stored energy', () => {
    const p = { ...ctDefaults(), burden: 8 };
    for (const theta of [0.2, 0.8, 1.6, 2.8]) {
      const s = currentTransformer(p, theta);
      expect(s.primaryTurns * s.primary - s.secondaryTurns * s.secondary).toBeCloseTo(
        p.pathLength * ctH(s.b, p),
        10,
      );
      const h = 1e-7,
        dWdB = (ctEnergy(s.b + h, p) - ctEnergy(s.b - h, p)) / (2 * h);
      expect(s.inputPower - s.burdenPower).toBeCloseTo(dWdB * s.db, 5);
    }
  });
  it('doubling secondary turns roughly halves measured current with low burden', () => {
    const p = ctDefaults(),
      rms = (turns: number) =>
        Math.sqrt(
          Array.from(
            { length: 256 },
            (_, i) =>
              currentTransformer({ ...p, secondaryTurns: turns }, (i / 256) * 2 * Math.PI)
                .secondary ** 2,
          ).reduce((a, b) => a + b, 0) / 256,
        );
    expect(rms(100) / rms(200)).toBeCloseTo(2, 2);
  });
  it('high burden increases flux and waveform error, rather than forcing an exact turns ratio', () => {
    const metric = (burden: number) => {
      const p = { ...ctDefaults(), burden },
        s = Array.from({ length: 256 }, (_, i) => currentTransformer(p, (i / 256) * 2 * Math.PI));
      return {
        b: Math.max(...s.map((q) => Math.abs(q.b))),
        error: s.reduce((a, q) => a + (q.secondary - q.idealSecondary) ** 2, 0),
      };
    };
    const a = metric(1),
      b = metric(8);
    expect(b.b).toBeGreaterThan(a.b * 3);
    expect(b.error).toBeGreaterThan(a.error * 20);
  });
  it('open circuit has zero current but finite sharply varying induced voltage, while DC steady state induces none', () => {
    const p = ctDefaults(),
      open = currentTransformer({ ...p, open: true }, 0);
    expect(open.secondary).toBe(0);
    expect(open.voltage).toBeGreaterThan(60);
    const dc = currentTransformer({ ...p, waveform: 'dc' }, 1);
    expect(dc.secondary).toBe(0);
    expect(dc.voltage).toBe(0);
    expect(dc.b).toBeGreaterThan(0.8);
  });
  it('periodic magnetic energy returns to its initial value and windings have the actual selected turn count', () => {
    for (const burden of [0.2, 8]) {
      const p = { ...ctDefaults(), burden },
        a = currentTransformer(p, 0),
        b = currentTransformer(p, 2 * Math.PI - 1e-8);
      expect(a.b).toBeCloseTo(b.b, 6);
      expect(currentTransformer(a, 1).secondary).toBeCloseTo(
        currentTransformer(p, 1).secondary,
        12,
      );
    }
    for (const n of [100, 200]) expect(ctWinding(n)).toHaveLength(n);
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import CurrentTransformer from '../components/experiments/CurrentTransformer';
it('renders all chapters and exploration without nonfinite output', () => {
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
          createElement(FilmContext.Provider, { value }, createElement(CurrentTransformer)),
        ),
      ).not.toMatch(/NaN|Infinity/);
      expect(Number.isFinite(ctShot(chapter, progress).b)).toBe(true);
    }
  expect(renderToStaticMarkup(createElement(CurrentTransformer))).not.toMatch(/NaN|Infinity/);
});
