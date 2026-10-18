import { describe, it, expect } from 'vitest';
import { frictionPull, frictionSteady, normalFriction, frictionFilmState } from './friction-lab';
describe('friction apparatus', () => {
  it('static friction adapts below its maximum without motion', () => {
    const s = frictionPull(1);
    expect(s.pull).toBeCloseTo(1.1025);
    expect(s.friction).toBe(s.pull);
    expect(s.position).toBe(0);
    expect(s.sliding).toBe(false);
  });
  it('sliding obeys the instantaneous force balance', () => {
    for (const time of [2.001, 2.1, 2.5, 4]) {
      const s = frictionPull(time);
      expect(s.pull - s.friction).toBeCloseTo(0.5 * s.acceleration, 12);
    }
  });
  it('position and velocity are continuous at breakaway while friction changes law', () => {
    const a = frictionPull(2),
      b = frictionPull(2 + 1e-8);
    expect(b.position).toBeCloseTo(a.position, 10);
    expect(b.velocity).toBeCloseTo(a.velocity, 7);
    expect(b.pull).toBeCloseTo(a.pull, 6);
    expect(b.friction).toBeLessThan(a.friction);
  });
  it('trajectory derivative matches stated velocity and acceleration', () => {
    const dt = 1e-5,
      a = frictionPull(2.2 - dt),
      b = frictionPull(2.2 + dt),
      s = frictionPull(2.2);
    expect((b.position - a.position) / (2 * dt)).toBeCloseTo(s.velocity, 7);
    expect((b.velocity - a.velocity) / (2 * dt)).toBeCloseTo(s.acceleration, 7);
  });
  it('constant speed gives pull equal to kinetic friction and scales with normal load', () => {
    const a = frictionSteady(1, 0.5),
      b = frictionSteady(1, 1);
    expect(a.pull).toBe(a.friction);
    expect(b.pull).toBe(2 * a.pull);
    expect(b.acceleration).toBe(0);
  });
  it('peak marker remains at breakaway after the reading drops', () => {
    const s = frictionPull(4);
    expect(s.peak).toBeCloseTo(normalFriction().staticLimit);
    expect(s.pull).toBeCloseTo(s.kinetic, 5);
    expect(s.peak).toBeGreaterThan(s.pull);
  });
  it('rejects non-finite physical inputs instead of drawing a non-finite trajectory', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(() => frictionSteady(bad)).toThrow(RangeError);
      expect(() => frictionPull(bad)).toThrow(RangeError);
      expect(() => frictionSteady(1, bad)).toThrow(RangeError);
    }
    expect(frictionSteady(-1).position).toBe(0);
  });
  it('holds rest during the recorded stationary explanation and retains the peak after release', () => {
    for (const [locale, still, release, settled] of [
      ['en', 8, 14, 25],
      ['zh', 10, 15.8, 27.5],
    ] as const) {
      const frame = (seconds: number) =>
        frictionPull(frictionFilmState(3, seconds, locale).physicalTime);
      expect(frame(still).sliding).toBe(false);
      expect(frame(still).pull).toBeLessThan(frame(still).staticLimit);
      expect(frame(release).sliding).toBe(true);
      expect(frame(release).acceleration).toBeGreaterThan(0);
      expect(frame(settled).pull).toBeCloseTo(frame(settled).kinetic, 3);
      expect(frame(settled).peak).toBeCloseTo(frame(settled).staticLimit, 12);
    }
  });
  it('continuous sensor, block and reading can share a monotonic physical clock', () => {
    for (const locale of ['zh', 'en'] as const)
      for (const chapter of [3, 4]) {
        let previous = 0;
        for (let seconds = 0; seconds <= 35; seconds += 0.1) {
          const time = frictionFilmState(chapter, seconds, locale).physicalTime;
          expect(time).toBeGreaterThanOrEqual(previous);
          previous = time;
        }
        const s = frictionPull(
          frictionFilmState(4, locale === 'en' ? 8.2 : 10, locale).physicalTime,
        );
        expect(s.pull).toBeCloseTo(s.kinetic, 3);
      }
  });
});
