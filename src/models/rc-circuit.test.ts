import { describe, it, expect } from 'vitest';
import { rcDefaults, rcState, rcShot, rcCurve } from './rc-circuit';
describe('RC exact state and energy', () => {
  it('starts at finite source-over-resistance current without a voltage jump', () => {
    const s = rcState(rcDefaults(), 0);
    expect(s.voltage).toBe(0);
    expect(s.current).toBe(0.005);
    expect(s.energy).toBe(0);
  });
  it('matches the independent one-time-constant benchmark', () => {
    const s = rcState(rcDefaults(), 1);
    expect(s.voltage / 5).toBeCloseTo(1 - 1 / Math.E, 12);
    expect(s.current / 0.005).toBeCloseTo(1 / Math.E, 12);
  });
  it('preserves voltage continuity when switching from charge to discharge', () => {
    const p = rcDefaults(),
      before = rcState(p, 0.8),
      after = rcState({ ...p, target: 0, initial: before.voltage }, 0);
    expect(after.voltage).toBe(before.voltage);
    expect(after.current).toBeLessThan(0);
  });
  it('balances supplied, stored and dissipated energy for arbitrary initial conditions', () => {
    for (const initial of [0, 2, 8])
      for (const target of [0, 5])
        for (const time of [0, 0.1, 1, 10])
          expect(rcState({ ...rcDefaults(), initial, target }, time).energyResidual).toBeCloseTo(
            0,
            12,
          );
  });
  it('doubling R halves initial current; doubling C does not', () => {
    const p = rcDefaults();
    expect(rcState({ ...p, resistance: 2000 }, 0).current).toBe(0.0025);
    expect(rcState({ ...p, capacitance: 0.002 }, 0).current).toBe(0.005);
  });
  it('charges asymptotically rather than snapping to full at one tau', () => {
    expect(rcState(rcDefaults(), 1).voltage).toBeLessThan(5);
    expect(rcState(rcDefaults(), 5).voltage).toBeCloseTo(4.966310265, 8);
  });
  it('reconstructs authored states without playback history and rejects invalid inputs', () => {
    expect(rcShot(5, 0.4)).toEqual(rcShot(5, 0.4));
    expect(rcCurve(rcDefaults(), 5)).toHaveLength(81);
    expect(() => rcState({ ...rcDefaults(), resistance: 0 }, 1)).toThrow();
    expect(() => rcState(rcDefaults(), -1)).toThrow();
  });
});
