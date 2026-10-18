import { describe, it, expect } from 'vitest';
import { tapeDots, tapeMotion, tapeInterval, tapeAcceleration, tapeShot } from './ticker-tape-lab';
describe('ticker tape acquisition and measurement', () => {
  it('50Hz produces 50 intervals in one second, not fifty times the duration', () => {
    const d = tapeDots('timer', 1);
    expect(d).toHaveLength(51);
    expect(d[50].t).toBe(1);
    expect(d[1].x - d[0].x).toBeCloseTo(0.006, 12);
  });
  it('returns the independent falling-distance benchmark and finite-difference g', () => {
    expect(tapeMotion('fall', 0.4).x).toBeCloseTo(0.784, 12);
    expect(tapeAcceleration('fall', 0.3)).toBeCloseTo(9.8, 10);
  });
  it('a shrinking one-sided average approaches velocity for nonlinear motion', () => {
    const exact = tapeMotion('velocity', 0.5).v;
    expect(Math.abs(tapeInterval('velocity', 0.5, 0.52).average - exact)).toBeLessThan(
      Math.abs(tapeInterval('velocity', 0.5, 0.9).average - exact),
    );
  });
  it('midpoint average is exact for constant acceleration but not for jerk', () => {
    expect(tapeInterval('cart', 0.2, 0.8).average).toBeCloseTo(tapeMotion('cart', 0.5).v, 12);
    expect(tapeInterval('velocity', 0.2, 0.8).average).not.toBeCloseTo(
      tapeMotion('velocity', 0.5).v,
      4,
    );
  });
  it('seeks reconstruct dots without retaining past history', () => {
    const a = tapeShot(4, 0.5);
    tapeShot(0, 0.9);
    expect(tapeShot(4, 0.5)).toEqual(a);
    expect(() => tapeInterval('fall', 0.4, 0.4)).toThrow();
  });
});

import {
  tapeSegments,
  predictTapePoint,
  localTapeEstimate,
  uniformTape,
  tickerCartRig,
  tickerEvidenceShot,
} from './ticker-tape-lab';
describe('paper evidence and prediction', () => {
  it('retains the original acquisition IDs through equal-time grouping', () => {
    const segments = tapeSegments('cart');
    expect(segments.map((s) => [s.from.index, s.to.index])).toEqual([
      [0, 5],
      [5, 10],
      [10, 15],
      [15, 20],
      [20, 25],
    ]);
    segments.forEach((s) => expect(s.dt).toBeCloseTo(0.1, 12));
    expect(segments.map((s) => Number((s.dx * 100).toFixed(1)))).toEqual([1.5, 2.1, 2.7, 3.3, 3.9]);
    expect(segments.map((s) => Number(s.average.toFixed(2)))).toEqual([
      0.15, 0.21, 0.27, 0.33, 0.39,
    ]);
  });
  it('predicts the cart next mark from exactly three old marks', () => {
    const s = tapeSegments('cart', 4);
    const result = predictTapePoint([s[1].to, s[2].to, s[3].to]);
    expect(result.nextGap).toBeCloseTo(0.039, 12);
    expect(result.x).toBeCloseTo(0.135, 12);
    expect(result.t).toBeCloseTo(0.5, 12);
    expect(result.acceleration).toBeCloseTo(0.6, 12);
  });
  it('predicts free fall independently from the first 0.1-second displacements', () => {
    const s = tapeSegments('fall', 3);
    expect(s.map((s) => Number((s.dx * 100).toFixed(1)))).toEqual([4.9, 14.7, 24.5]);
    const predicted = predictTapePoint([s[0].to, s[1].to, s[2].to]);
    expect(predicted.nextGap).toBeCloseTo(0.343, 12);
    expect(predicted.x).toBeCloseTo(0.784, 12);
    expect(predicted.acceleration).toBeCloseTo(9.8, 12);
  });
  it('rejects incomplete or unequal-time evidence instead of fitting an arbitrary curve', () => {
    expect(() => predictTapePoint([{ index: 0, t: 0, x: 0 }])).toThrow(RangeError);
    expect(() =>
      predictTapePoint([
        { index: 0, t: 0, x: 0 },
        { index: 5, t: 0.1, x: 0.1 },
        { index: 15, t: 0.3, x: 0.3 },
      ]),
    ).toThrow(RangeError);
    expect(() => tapeSegments('cart', 6)).toThrow(RangeError);
  });
  it('retains a nonzero finite-resolution error for nonconstant acceleration', () => {
    const wide = localTapeEstimate(20),
      narrow = localTapeEstimate(1);
    expect(wide.average).toBeCloseTo(0.3128, 12);
    expect(narrow.average).toBeCloseTo(0.300032, 12);
    expect(narrow.exact).toBeCloseTo(0.3, 12);
    expect(narrow.average).toBeGreaterThan(narrow.exact);
    expect(narrow.dt).toBeCloseTo(0.04, 12);
    expect(() => localTapeEstimate(0.5)).toThrow(RangeError);
  });
  it('fast uniform motion has wider but still equal gaps, with the same sample times', () => {
    const slow = uniformTape(0.3, 0.1),
      fast = uniformTape(0.6, 0.1);
    expect(slow.map((s) => s.t)).toEqual(fast.map((s) => s.t));
    expect(fast).toHaveLength(6);
    for (let i = 1; i < fast.length; i++) expect(fast[i].x - fast[i - 1].x).toBeCloseTo(0.012, 12);
  });
  it('keeps the physical plot scale responsive to acceleration', () => {
    expect(tapeSegments('cart', 5, 1.2)[4].dx).toBeGreaterThan(tapeSegments('cart', 5, 0.6)[4].dx);
  });
});
describe('acquisition geometry and film boundaries', () => {
  it('conserves rope length and tangent continuity on both compositions', () => {
    for (const width of [240, 264, 334, 640]) {
      const start = tickerCartRig(width, 0);
      for (const displacement of [0, 0.015, 0.096, 0.21]) {
        const rig = tickerCartRig(width, displacement);
        expect(rig.ropeLength).toBeCloseTo(start.ropeLength, 12);
        expect(rig.hook.y).toBe(rig.pulley.y - rig.pulley.r);
        expect(rig.hanger.x).toBe(rig.pulley.x + rig.pulley.r);
        expect(rig.paperEnd - start.paperEnd).toBeCloseTo(rig.hanger.y - start.hanger.y, 12);
        expect(rig.hook.x).toBeLessThan(rig.pulley.x);
      }
    }
  });
  it('keeps the newest acquired dot at the stationary needle at an acquisition time', () => {
    const dots = tapeDots('cart', 0.4),
      last = dots.at(-1)!;
    const rig = tickerCartRig(264, last.x);
    expect(rig.needleX + (last.x - last.x) * rig.scale).toBe(rig.needleX);
    expect(rig.needleX + last.x * rig.scale).toBeLessThan(rig.paperEnd);
  });
  it('holds the predicted answer before each standalone chapter ends', () => {
    expect(tickerEvidenceShot(3, 0.86)).toMatchObject({ view: 'predict', reveal: false });
    expect(tickerEvidenceShot(3, 0.95)).toMatchObject({ view: 'predict', reveal: true });
    expect(tickerEvidenceShot(4, 0.7)).toMatchObject({ view: 'predict', reveal: false });
    expect(tickerEvidenceShot(4, 0.82)).toMatchObject({ view: 'predict', reveal: true });
    expect(tickerEvidenceShot(4, 0.95).view).toBe('masses');
  });
  it('is deterministic when seeking backwards and clamps finite progress', () => {
    const first = tickerEvidenceShot(3, 0.4);
    tickerEvidenceShot(4, 1);
    expect(tickerEvidenceShot(3, 0.4)).toEqual(first);
    expect(tickerEvidenceShot(0, -1).p).toBe(0);
    expect(tickerEvidenceShot(0, 2).p).toBe(1);
    expect(() => tickerEvidenceShot(5, 0)).toThrow(RangeError);
  });
});

it('rejects nonfinite motion and zero-width acceleration while clamping finite time', () => {
  expect(() => tapeMotion('cart', NaN)).toThrow(RangeError);
  expect(() => tapeDots('cart', Infinity)).toThrow(RangeError);
  expect(() => tapeAcceleration('cart', 0.2, 0)).toThrow(RangeError);
  expect(() => tapeAcceleration('cart', 0.2, -0.1)).toThrow(RangeError);
  expect(tapeMotion('fall', -1).t).toBe(0);
  expect(tapeMotion('fall', 2).t).toBe(0.5);
});

import { tapeAverageBeat } from './ticker-tape-lab';
it('builds the finite-interval reading from distance, then ten real gaps, then the average', () => {
  expect(tapeAverageBeat(0.1)).toMatchObject({
    distanceVisible: false,
    timeVisible: false,
    averageVisible: false,
  });
  expect(tapeAverageBeat(0.25)).toMatchObject({ distanceVisible: true, timeVisible: false });
  expect(tapeAverageBeat(0.44).countedGaps).toBe(5);
  expect(tapeAverageBeat(0.52)).toMatchObject({ countedGaps: 10, averageVisible: false });
  expect(tapeAverageBeat(0.57)).toMatchObject({ countedGaps: 10, averageVisible: true });
});

import { tickerNeedleAt } from './ticker-tape-lab';
it('touches the tape at acquisition instants and lifts clear between marks', () => {
  for (const time of [0, 0.02, 0.1, 0.3, 0.4]) {
    expect(tickerNeedleAt(time).lift).toBeCloseTo(0, 10);
    expect(tickerNeedleAt(time).contactOpacity).toBeCloseTo(1, 10);
  }
  expect(tickerNeedleAt(0.01)).toMatchObject({ lift: 10, contactOpacity: 0 });
});

import { tickerNarratedProgress } from './ticker-tape-lab';
describe('measured bilingual speech and visible evidence', () => {
  const at = (locale: 'zh' | 'en', chapter: number, seconds: number) =>
    tickerEvidenceShot(chapter, tickerNarratedProgress(chapter, seconds, locale));

  it('keeps each timer referent present while the actual recording names it', () => {
    // Independent ASR phrase times plus the assembled cue's 0.45-second lead-in.
    for (const [locale, compare, needle, count, conclusion] of [
      ['zh', 6.5, 12, 16.5, 23],
      ['en', 8, 15, 20, 25],
    ] as const) {
      expect(at(locale, 0, compare).view).toBe('steady');
      expect(at(locale, 0, needle).view).toBe('acquire');
      expect(at(locale, 0, count).view).toBe('count');
      expect(at(locale, 0, conclusion).view).toBe('steady');
    }
  });

  it('finishes the ten real gaps before the spoken division and later-interval comparison', () => {
    for (const [locale, counting, divide, later] of [
      ['zh', 7.5, 10.5, 15],
      ['en', 8, 11.7, 16],
    ] as const) {
      const countingBeat = tapeAverageBeat(at(locale, 1, counting).p);
      expect(countingBeat.countedGaps).toBeGreaterThan(0);
      expect(countingBeat.countedGaps).toBeLessThan(10);
      expect(countingBeat.averageVisible).toBe(false);
      expect(tapeAverageBeat(at(locale, 1, divide).p)).toMatchObject({
        countedGaps: 10,
        averageVisible: true,
      });
      expect(at(locale, 1, divide).reveal).toBe(false);
      expect(at(locale, 1, later).reveal).toBe(true);
      expect(at(locale, 2, 20).p).toBeGreaterThanOrEqual(0.79);
    }
  });

  it('separates a spoken numerical prediction from the newly revealed cart record', () => {
    for (const [locale, values, velocities, graph, question, prediction, newRecord] of [
      ['zh', 13, 18, 28, 33, 37.5, 39],
      ['en', 13, 18, 30, 35, 39.5, 41],
    ] as const) {
      expect(at(locale, 3, values)).toMatchObject({ view: 'segments' });
      expect(at(locale, 3, values).p).toBeLessThan(0.46);
      expect(at(locale, 3, velocities).p).toBeGreaterThanOrEqual(0.46);
      expect(at(locale, 3, graph).view).toBe('graph');
      expect(at(locale, 3, question)).toMatchObject({
        view: 'predict',
        predictionKnown: false,
        reveal: false,
      });
      expect(at(locale, 3, prediction)).toMatchObject({
        view: 'predict',
        predictionKnown: true,
        reveal: false,
      });
      expect(at(locale, 3, newRecord)).toMatchObject({
        view: 'predict',
        predictionKnown: true,
        reveal: true,
      });
    }
    expect(at('zh', 4, 25)).toMatchObject({
      view: 'predict',
      predictionKnown: true,
      reveal: false,
    });
    expect(at('zh', 4, 27)).toMatchObject({ view: 'predict', reveal: true });
    expect(at('zh', 4, 30).view).toBe('masses');
  });

  it('reconstructs a monotone bounded direction track at seeks in either language', () => {
    for (const locale of ['zh', 'en'] as const) {
      for (let chapter = 0; chapter < 5; chapter++) {
        let previous = 0;
        for (let seconds = 0; seconds <= 50; seconds += 0.125) {
          const p = tickerNarratedProgress(chapter, seconds, locale);
          expect(p).toBeGreaterThanOrEqual(previous);
          expect(p).toBeLessThanOrEqual(1);
          previous = p;
        }
        expect(tickerNarratedProgress(chapter, -1, locale)).toBe(0);
        expect(tickerNarratedProgress(chapter, 50, locale)).toBe(1);
        const state = at(locale, chapter, 15);
        at(locale, chapter, 2);
        expect(at(locale, chapter, 15)).toEqual(state);
      }
    }
    expect(() => tickerNarratedProgress(0, NaN, 'zh')).toThrow(RangeError);
    expect(() => tickerNarratedProgress(5, 0, 'en')).toThrow(RangeError);
  });

  it('keeps the revised English 0.1-second explanation and each later fall referent visible', () => {
    expect(at('en', 4, 10).view).toBe('segments');
    expect(at('en', 4, 24.5).view).toBe('segments');
    expect(at('en', 4, 26.5)).toMatchObject({
      view: 'predict',
      predictionKnown: false,
      reveal: false,
    });
    expect(at('en', 4, 28.5)).toMatchObject({
      view: 'predict',
      predictionKnown: true,
      reveal: false,
    });
    expect(at('en', 4, 31)).toMatchObject({ view: 'predict', reveal: true });
    expect(at('en', 4, 33).view).toBe('masses');
    expect(at('en', 4, 43.9).view).toBe('masses');
  });
});
