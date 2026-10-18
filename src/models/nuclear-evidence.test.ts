import { describe, it, expect } from 'vitest';
import {
  nitrogenReaction,
  neutronRecoil,
  fissionBalance,
  fragmentEvent,
  chainExpectation,
} from './nuclear-evidence';
describe('nuclear evidence calculations', () => {
  it('conserves two-dimensional momentum and energy including Q', () => {
    for (const a of [0, 20, 70, 120, 160]) {
      const s = nitrogenReaction(a);
      expect(s.proton.x + s.oxygen.x).toBeCloseTo(s.incoming, 12);
      expect(s.proton.y + s.oxygen.y).toBe(0);
      expect(s.protonEnergy + s.oxygenEnergy).toBeCloseTo(s.alphaEnergy + s.q, 10);
    }
  });
  it('transfers maximal energy to equal-mass recoil targets', () => {
    expect(neutronRecoil(1).fraction).toBe(1);
    expect(neutronRecoil(14).fraction).toBeCloseTo(56 / 225);
  });
  it('balances nucleon and charge bookkeeping for a selected fission channel', () => {
    const { input, output } = fissionBalance();
    for (const key of ['a', 'z'] as const)
      expect(input.reduce((s, x) => s + x[key], 0)).toBe(output.reduce((s, x) => s + x[key], 0));
  });
  it('balances selected multi-fragment momentum and distinguishes expectation regimes', () => {
    for (const c of [3, 4] as const) {
      const x = fragmentEvent(c);
      expect(x.reduce((s, a) => s + a.x, 0)).toBeCloseTo(0);
      expect(x.reduce((s, a) => s + a.y, 0)).toBeCloseTo(0);
    }
    expect(chainExpectation(1, 10)).toBe(32);
    expect(chainExpectation(0.8, 10)).toBeLessThan(32);
    expect(chainExpectation(1.2, 10)).toBeGreaterThan(32);
  });
});
