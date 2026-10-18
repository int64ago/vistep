import { describe, it, expect } from 'vitest';
import {
  fallFilmState,
  paperDrop,
  tiedStoneArgument,
  fallActivityShot,
} from './free-fall-activities';
import { newtonFilmState, newtonPair } from './newton-tube';
describe('word-timed falling comparisons', () => {
  it('changes the actual drag in the narrated counterexample while preserving the three bodies', () => {
    const air = fallFilmState(1, 3, 'en'),
      vacuum = fallFilmState(1, 16.1, 'en');
    const kinds = ['sheet', 'paper-ball', 'eraser'] as const;
    const a = kinds.map((k) => paperDrop(k, air.time, air.density).distance);
    const v = kinds.map((k) => paperDrop(k, vacuum.time, vacuum.density).distance);
    expect(a[0]).toBeLessThan(a[1]);
    expect(a[1]).toBeLessThan(a[2]);
    for (const y of v) expect(y).toBeCloseTo(4.9 * vacuum.time ** 2, 12);
  });
  it('makes the two ruler scale comparisons represent fourfold displacement', () => {
    const early = fallFilmState(4, 4, 'en'),
      later = fallFilmState(4, 10, 'en');
    expect((later.reaction / early.reaction) ** 2).toBeCloseTo(4, 12);
  });
  it('uses the same physical instant for both Newton-tube trials', () => {
    for (const lang of ['zh', 'en'] as const) {
      const s = newtonFilmState(4, 8, lang);
      expect(s.airTime).toBe(s.vacuumTime);
      const a = newtonPair(s.airTime),
        v = newtonPair(s.vacuumTime, s.density);
      expect(a.iron.distance).toBeGreaterThan(a.feather.distance);
      expect(v.iron.distance).toBe(v.feather.distance);
    }
  });
  it('keeps invalid routing input out of rendering', () => {
    for (const v of [NaN, Infinity, -Infinity]) {
      expect(() => tiedStoneArgument(v)).toThrow(RangeError);
      expect(() => fallActivityShot(0, v)).toThrow(RangeError);
      expect(() => fallFilmState(0, v, 'zh')).toThrow(RangeError);
      expect(
        Object.values(newtonFilmState(v, v, 'en'))
          .filter((x) => typeof x === 'number')
          .every(Number.isFinite),
      ).toBe(true);
    }
  });
});

import { galileoTrackView, galileoTimingGeometry, galileoFilmState } from './galileo-inclines';
describe('continuous ramp geometry and honest close framing', () => {
  it('keeps a visible sphere without reducing the true shallow return distance', () => {
    const shallow = galileoTrackView(2.6, 1),
      steep = galileoTrackView(2.6, 35);
    expect(shallow.radius).toBeGreaterThanOrEqual(7.15);
    expect(shallow.returnDistance).toBeGreaterThan(39);
    expect(shallow.continuesRight).toBe(true);
    expect(shallow.center.x).toBeLessThanOrEqual(270.0001);
    expect(shallow.state.energy).toBeCloseTo(6.86, 4);
    expect(steep.state.energy).toBeCloseTo(6.86, 4);
  });
  it('attaches supports to the same ramp with feet above the table at the steepest control value', () => {
    for (const a of [3, 6, 12, 18]) {
      const g = galileoTimingGeometry(a);
      for (const s of g.supports) {
        expect(s.top).toBeLessThan(s.bottom);
        expect(s.bottom).toBe(g.tableY - 1);
        const y = 80 + (s.x - 35) * Math.tan(g.phi) + 8;
        expect(s.top).toBeCloseTo(y, 10);
      }
    }
  });
  it('starts separate incline trials from the same geometric release and keeps horizontal continuation', () => {
    for (const locale of ['zh', 'en'] as const) {
      const d = galileoFilmState(4, 20, locale);
      expect(d.right).toBe(0);
      const v = galileoTrackView(d.run, d.right);
      expect(v.continuesRight).toBe(true);
      expect(v.state.y).toBe(0);
      expect(v.state.velocity).toBeGreaterThan(3);
    }
  });
});

it('camera-fixed horizontal ball retains world-distance references and supported ramp boundaries', () => {
  const a = galileoTrackView(1.9, 0),
    b = galileoTrackView(2.6, 0);
  expect(b.center.x).toBeCloseTo(a.center.x, 10);
  expect(b.ticks[0].x - a.ticks[0].x).toBeCloseTo(-a.state.velocity * 0.7 * a.scale, 7);
  for (const deg of [2, 30, NaN, Infinity])
    expect(() => galileoTimingGeometry(deg)).toThrow(RangeError);
});
