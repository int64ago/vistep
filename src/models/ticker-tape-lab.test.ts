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
