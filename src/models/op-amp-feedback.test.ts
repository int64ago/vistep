import { describe, it, expect } from 'vitest';
import { opAmpDefaults, opAmpSteady, opAmpStep } from './op-amp-feedback';
describe('finite-gain negative feedback with exact slew-limited step', () => {
  it('the divider and finite amplifier gain both constrain the same steady output', () => {
    const s = opAmpSteady(opAmpDefaults(), 0.5);
    expect(s.output).toBeCloseTo(5 / (1 + 1e-4), 12);
    expect(s.output).toBeCloseTo(s.gain * s.error, 9);
    expect(s.minus).toBeCloseTo(s.dividerCurrent * s.groundResistance, 12);
    expect(s.output - s.minus).toBeCloseTo(s.dividerCurrent * s.feedbackResistance, 12);
    expect(s.error).toBeGreaterThan(0);
  });
  it('finite loop gain gives a quantitative virtual-short error', () => {
    const p = opAmpDefaults(),
      low = opAmpSteady({ ...p, gain: 20 }, 0.5),
      high = opAmpSteady(p, 0.5);
    expect(low.output).toBeCloseTo(10 / 3, 12);
    expect(low.error).toBeCloseTo(1 / 6, 12);
    expect(high.error).toBeLessThan(51e-6);
  });
  it('open loop and saturated feedback do not enforce equal input voltages', () => {
    const p = opAmpDefaults(),
      open = opAmpSteady({ ...p, feedback: false }, 0.001),
      limited = opAmpSteady(p, 1.5);
    expect(open.output).toBe(10);
    expect(open.error).toBe(0.001);
    expect(limited.output).toBe(10);
    expect(limited.minus).toBe(1);
    expect(limited.error).toBe(0.5);
  });
  it('the exact step derivative obeys the first-order law and slew limit', () => {
    const p = opAmpDefaults(),
      h = 1e-10;
    for (const time of [1e-6, 10e-6, 20e-6]) {
      const s = opAmpStep(p, 0.8, time),
        numeric =
          (opAmpStep(p, 0.8, time + h).output - opAmpStep(p, 0.8, time - h).output) / (2 * h),
        expected = Math.max(
          -p.slewRate,
          Math.min(p.slewRate, 2 * Math.PI * p.poleHz * (p.gain * s.error - s.output)),
        );
      expect(numeric / expected).toBeCloseTo(1, 7);
      expect(Math.abs(s.rate)).toBeLessThanOrEqual(p.slewRate);
    }
  });
  it('larger steps stay in the same finite slope longer, with continuous joins', () => {
    const p = opAmpDefaults(),
      small = opAmpStep(p, 0.2, 0),
      large = opAmpStep(p, 0.8, 0);
    expect(large.slewTime).toBeGreaterThan(small.slewTime);
    for (const s of [small, large]) {
      const a = opAmpStep(p, s.input, s.slewTime - 1e-10),
        b = opAmpStep(p, s.input, s.slewTime + 1e-10);
      expect(Math.abs(b.output - a.output)).toBeLessThan(0.00011);
    }
    expect(opAmpStep(p, 0.8, 100e-6).output).toBeCloseTo(opAmpSteady(p, 0.8).output, 10);
  });
  it('rails, reversed steps and structural state reuse remain well-defined', () => {
    const p = opAmpDefaults();
    for (const input of [-1.5, 1.5])
      for (const tm of [0, 10e-6, 0.01]) {
        const s = opAmpStep(p, input, tm);
        expect(Math.abs(s.output)).toBeLessThanOrEqual(10);
        expect(opAmpStep(s, input, tm).output).toBeCloseTo(s.output, 12);
      }
    expect(opAmpStep(p, -0.5, 1, 5).output).toBeCloseTo(opAmpSteady(p, -0.5).output, 12);
  });
});

// Execution coverage only: rendered markup is not a visual or playback review.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import OpAmpFeedback from '../components/experiments/OpAmpFeedback';
it('executes each authored chapter and default exploration without nonfinite SVG values', () => {
  for (let chapter = 0; chapter < 6; chapter++)
    for (const progress of [0, 0.5, 1]) {
      const html = renderToStaticMarkup(
        createElement(
          FilmContext.Provider,
          {
            value: {
              watch: true,
              playing: false,
              time: chapter * 24 + progress * 24,
              chapter,
              run: 0,
              duration: 144,
              chapters: [],
              chapterTime: progress * 24,
              chapterProgress: progress,
            },
          },
          createElement(OpAmpFeedback),
        ),
      );
      expect(html).not.toMatch(/NaN|Infinity/);
      expect(html).toContain('opamp-circuit');
    }
  expect(renderToStaticMarkup(createElement(OpAmpFeedback))).toContain('opamp-controls');
});
