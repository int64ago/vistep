import { describe, it, expect } from 'vitest';
import { threePhase, threePhaseDefaults, threePhaseShot } from './three-phase-power';
describe('balanced sources and a neutral-connected star load', () => {
  it('derives √3 line RMS from a vector difference rather than arithmetic voltage addition', () => {
    for (const theta of [0, 0.3, 1, 2]) {
      const s = threePhase(threePhaseDefaults(), theta);
      expect(s.lineRms).toBeCloseTo(Math.sqrt(3) * 230, 10);
      expect(s.lineVoltage).toBeCloseTo(s.phase[0].voltage - s.phase[1].voltage, 12);
    }
  });
  it('balanced current sums to zero and total instantaneous power is constant for any common impedance angle', () => {
    for (const angle of [0, 0.3, Math.PI / 3])
      for (let i = 0; i < 100; i++) {
        const s = threePhase({ ...threePhaseDefaults(), angle }, (i / 100) * 2 * Math.PI);
        expect(s.neutral).toBeCloseTo(0, 10);
        expect(s.power).toBeCloseTo(((3 * 230 ** 2) / 100) * Math.cos(angle), 9);
      }
  });
  it('single-phase instantaneous power reaches zero and twice the mean', () => {
    const p = { ...threePhaseDefaults(), phases: 1 as const };
    expect(threePhase(p, 0).power).toBe(0);
    expect(threePhase(p, Math.PI / 2).power).toBeCloseTo((2 * 230 ** 2) / 100, 9);
    expect(threePhase(p, 1).neutral).toBe(threePhase(p, 1).phase[0].current);
  });
  it('halving A impedance creates neutral current equal to one original phase and adds a power ripple', () => {
    const p = { ...threePhaseDefaults(), aScale: 0.5 },
      a = threePhase(p, 0),
      b = threePhase(p, Math.PI / 2);
    expect(a.neutralRms).toBeCloseTo(2.3, 10);
    expect(b.power - a.power).toBeCloseTo((2 * 230 ** 2) / 100, 9);
    expect(b.neutral).toBeCloseTo(Math.SQRT2 * 2.3, 10);
  });
  it('inductive phase power can reverse while total real power stays positive', () => {
    const s = threePhase({ ...threePhaseDefaults(), angle: Math.PI / 4 }, 0.3);
    expect(s.phase[0].power).toBeLessThan(0);
    expect(s.power).toBeGreaterThan(0);
    expect(s.reactivePower).toBeCloseTo(s.activePower, 9);
    for (const q of s.phase)
      expect(Math.hypot(q.resistance, 2 * Math.PI * s.frequency * q.inductance)).toBeCloseTo(
        q.impedance,
        10,
      );
  });
  it('integrated time-domain power matches independent phasor mean for an unbalanced load', () => {
    const p = { ...threePhaseDefaults(), angle: 0.4, aScale: 1.6 },
      n = 1000,
      average =
        Array.from({ length: n }, (_, i) => threePhase(p, (i / n) * 2 * Math.PI).power).reduce(
          (a, b) => a + b,
          0,
        ) / n;
    expect(average).toBeCloseTo(threePhase(p, 0).activePower, 9);
    expect(threePhase(threePhase(p, 0), 0.4).power).toBeCloseTo(threePhase(p, 0.4).power, 12);
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import ThreePhasePower from '../components/experiments/ThreePhasePower';
it('executes all causal film states and exploration with finite output', () => {
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
          createElement(FilmContext.Provider, { value }, createElement(ThreePhasePower)),
        ),
      ).not.toMatch(/NaN|Infinity/);
      expect(Number.isFinite(threePhaseShot(chapter, progress).power)).toBe(true);
    }
  expect(renderToStaticMarkup(createElement(ThreePhasePower))).not.toMatch(/NaN|Infinity/);
});
