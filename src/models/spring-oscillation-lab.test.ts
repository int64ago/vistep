import { describe, it, expect } from 'vitest';
import {
  springState,
  springSamples,
  measuredSpringPeriod,
  pencilTrace,
} from './spring-oscillation-lab';
describe('spring recording apparatus', () => {
  it('conserves energy and returns to the same state after a period', () => {
    const z = springState(0);
    for (const t of [0, 0.1, 0.4, 1, 2]) expect(springState(t).energy).toBeCloseTo(z.energy, 12);
    expect(springState(z.period).x).toBeCloseTo(z.x, 12);
  });
  it('keeps period independent of amplitude but scales with mass and uniform spring length', () => {
    const a = springState(0);
    expect(springState(0, 0.2, 1, 0.025).period).toBe(a.period);
    expect(springState(0, 0.4).period / a.period).toBeCloseTo(Math.SQRT2, 12);
    expect(springState(0, 0.2, 0.5).period / a.period).toBeCloseTo(Math.SQRT1_2, 12);
  });
  it('retains the second oscillator at its release position until the selected delay', () => {
    const T = springState(0).period;
    expect(springState(T / 8, 0.2, 1, 0.05, T / 4).held).toBe(true);
    expect(springState(T / 4).x).toBeCloseTo(0, 12);
    expect(springState(T / 4, 0.2, 1, 0.05, T / 4).x).toBe(0.05);
  });
  it('records exact equally timed samples and paper distance from actual time', () => {
    const a = springSamples(0.2, 0.04);
    expect(a).toHaveLength(6);
    expect(a[5].time).toBe(0.2);
    expect(pencilTrace(2).paper).toBe(0.1);
    expect(pencilTrace(2, 0.1).x).toBe(pencilTrace(2).x);
  });
  it('reduces a fixed start/stop timing error by counting full cycles', () => {
    const T = springState(0).period;
    expect(measuredSpringPeriod(0.2, 1, 10, 0.2).period - T).toBeCloseTo(0.02, 12);
    expect(measuredSpringPeriod(0.2, 1, 1, 0.2).period - T).toBeCloseTo(0.2, 12);
    expect(() => springState(NaN)).toThrow();
    expect(() => springSamples(1, 0)).toThrow();
  });
});
