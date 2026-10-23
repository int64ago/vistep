import { describe, it, expect } from 'vitest';
import { dynamicMassState, foldingSupport } from './dynamic-mass-lab';
describe('constant-force dynamic mass measurement', () => {
  it('uses total moving mass rather than weight', () => {
    const s = dynamicMassState(0.5, 62, 25, 6);
    expect(s.acceleration).toBeCloseTo(25 / 68);
    expect(s.position).toBeCloseTo(0.5 * (25 / 68) * 0.25);
  });
  it('encoder average velocities infer the exact constant acceleration independently', () => {
    const s = dynamicMassState(1, 62, 25, 6);
    expect(s.measuredAcceleration).toBeCloseTo(s.acceleration, 10);
    expect(s.measuredMass).toBeCloseTo(62, 8);
  });
  it('does not report a mass before enough crossings', () => {
    expect(dynamicMassState(0.1).measuredMass).toBeNull();
    expect(dynamicMassState(0.5, 62, 0).measuredMass).toBeNull();
  });
  it('same force gives lower acceleration to greater mass', () => {
    expect(dynamicMassState(0.5, 80).acceleration).toBeLessThan(
      dynamicMassState(0.5, 50).acceleration,
    );
  });
  it('counting intervals get shorter as velocity grows', () => {
    const s = dynamicMassState(1);
    const durations = s.crossings.slice(1).map((v, i) => v.time - s.crossings[i].time);
    for (let i = 1; i < durations.length; i++) expect(durations[i]).toBeLessThan(durations[i - 1]);
  });
  it('folding arm links keep their lengths for the entire measurement stroke', () => {
    for (const d of [0.4, 0.5, 0.65]) {
      const s = foldingSupport(d);
      expect(Math.hypot(s.midpoint, s.rise)).toBeCloseTo(0.36, 12);
    }
  });
});
import { dynamicMassFilm, dynamicMassGeometry } from './dynamic-mass-lab';
it('rejects nonfinite links and unbounded encoder allocation while retaining zero-force rest', () => {
  for (const length of [0, -1, NaN, Infinity]) expect(() => foldingSupport(0.2, length)).toThrow();
  expect(() => dynamicMassState(1, 62, 25, 6, 0.25, 1e-12)).toThrow();
  const s = dynamicMassState(100, 62, 0);
  expect(s.position).toBe(0);
  expect(s.velocity).toBe(0);
  expect(s.crossings).toEqual([{ distance: 0, time: 0 }]);
  expect(s.measuredMass).toBeNull();
});
it('grating crossings and fixed geometric marks share one coordinate, and every rigid side remains 0.36 m', () => {
  for (let i = 0; i <= 12; i++) {
    const g = dynamicMassGeometry(i * 0.02);
    expect(g.platformX).toBeCloseTo(g.marks[i].x);
    expect(Math.hypot(g.separation / 2, g.arm.rise)).toBeCloseTo(0.36, 12);
  }
});
it('keeps the heavier-person comparison hidden before the prediction hold ends', () => {
  expect(dynamicMassFilm(3, 12).view).toBe('comparison');
  expect(dynamicMassFilm(3, 12).reveal).toBe(false);
  expect(dynamicMassFilm(3, 20).reveal).toBe(true);
  expect(() => dynamicMassFilm(NaN, 1)).toThrow();
});

it('rejects arithmetic overflow without changing valid-domain calculations', () => {
  expect(() => dynamicMassState(1, Number.MAX_VALUE, 25, Number.MAX_VALUE)).toThrow();
  expect(() => dynamicMassState(1, Number.MIN_VALUE, Number.MAX_VALUE, 0)).toThrow();
  expect(() => foldingSupport(1, Number.MAX_VALUE)).toThrow();
});

import { dynamicMassComparison } from './dynamic-mass-lab';
it('freezes both 40 N trials at the first stroke endpoint rather than comparing different times', () => {
  const result = dynamicMassComparison(1, 40);
  const stop = Math.sqrt((2 * 0.25 * 68) / 40);
  expect(result.requestedTime).toBe(1);
  expect(result.time).toBeCloseTo(stop, 14);
  expect(result.limited).toBe(true);
  expect(result.states.map((q) => q.time)).toEqual([result.time, result.time]);
  expect(result.states[0].position).toBeCloseTo(0.25, 14);
  expect(result.states[1].position).toBeCloseTo((0.25 * 68) / 88, 14);
  expect(result.states[1].position).not.toBeCloseTo(dynamicMassState(1, 82, 40).position, 8);
  for (const q of result.states) {
    expect(q.velocity).toBeCloseTo((40 / (q.mass + 6)) * stop, 14);
    expect(q.acceleration * q.totalMass).toBeCloseTo(40, 12);
  }
});
it('preserves default 25 N and early comparison results exactly, including the zero-force limit', () => {
  for (const force of [0, 25, 40]) {
    for (const time of [0, 0.4, 0.9]) {
      const q = dynamicMassComparison(time, force);
      expect(q.limited).toBe(false);
      for (const state of q.states) {
        const { mass, ...sample } = state;
        expect(sample).toEqual(dynamicMassState(time, mass, force));
      }
    }
  }
  const unchanged = dynamicMassComparison(1, 25);
  expect(unchanged.time).toBe(1);
  expect(unchanged.limited).toBe(false);
  const rest = dynamicMassComparison(1, 0);
  expect(rest.time).toBe(1);
  expect(rest.states.map((q) => q.position)).toEqual([0, 0]);
  expect(rest.states.map((q) => q.measuredMass)).toEqual([null, null]);
});
it('uses the same finite time and valid stroke across the accepted comparison control domain', () => {
  for (const force of [0, 1, 25, 34, 35, 40])
    for (const time of [0, 0.5, 0.92, 0.93, 1]) {
      const q = dynamicMassComparison(time, force);
      expect(q.time).toBeLessThanOrEqual(time);
      for (const s of q.states) {
        expect(s.time).toBe(q.time);
        expect(s.position).toBeGreaterThanOrEqual(0);
        expect(s.position).toBeLessThanOrEqual(0.25 + 1e-12);
        expect(Number.isFinite(s.velocity)).toBe(true);
      }
    }
  for (const time of [NaN, Infinity, -Infinity])
    expect(() => dynamicMassComparison(time)).toThrow();
  for (const force of [NaN, Infinity, -1]) expect(() => dynamicMassComparison(1, force)).toThrow();
});
