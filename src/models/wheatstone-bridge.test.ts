import { describe, it, expect } from 'vitest';
import { bridgeDefaults, bridgeState, bridgeShot } from './wheatstone-bridge';
describe('loaded Wheatstone bridge', () => {
  it('has zero detector current but nonzero supply current at balance', () => {
    const s = bridgeState(bridgeDefaults());
    expect(s.va).toBeCloseTo(2.5);
    expect(s.im).toBeCloseTo(0);
    expect(s.sourceCurrent).toBeCloseTo(0.005);
  });
  it('matches independent unloaded voltage dividers', () => {
    const s = bridgeState({ ...bridgeDefaults(), r4: 2000, meter: Infinity });
    expect(s.va).toBeCloseTo(2.5);
    expect(s.vb).toBeCloseTo(10 / 3);
    expect(s.difference).toBeCloseTo(-5 / 6);
  });
  it('conserves current at both nodes and source power across parameter extremes', () => {
    for (const meter of [100, 1000, 1e6, Infinity])
      for (const r2 of [500, 2000]) {
        const s = bridgeState({ ...bridgeDefaults(), r2, r4: 3000, meter });
        expect(s.i1 - s.i2 - s.im).toBeCloseTo(0, 12);
        expect(s.i3 - s.i4 + s.im).toBeCloseTo(0, 12);
        expect(s.sourcePower).toBeCloseTo(s.dissipation, 12);
      }
  });
  it('scaling excitation does not disturb the balance ratio', () => {
    for (const u of [0, 0.5, 1]) {
      const s = bridgeState(bridgeShot(4, u));
      expect(s.im).toBeCloseTo(0, 12);
      expect(s.sourceCurrent).toBeGreaterThan(0);
    }
  });
  it('detector loading changes an unbalanced bridge voltage', () => {
    const a = bridgeState({ ...bridgeDefaults(), r4: 2000, meter: 100 }),
      b = bridgeState({ ...bridgeDefaults(), r4: 2000, meter: 1e6 });
    expect(Math.abs(a.difference)).toBeLessThan(Math.abs(b.difference));
  });
  it('rejects nonphysical input and handles zero excitation', () => {
    expect(() => bridgeState({ ...bridgeDefaults(), r1: 0 })).toThrow();
    expect(bridgeState({ ...bridgeDefaults(), supply: 0 }).sourceCurrent).toBe(0);
  });
});
