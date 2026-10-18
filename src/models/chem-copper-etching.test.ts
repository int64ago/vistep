import { describe, it, expect } from 'vitest';
import { copperEtching, copperProtected, copperEtchDirector } from './chem-copper-etching';
describe('copper etching', () => {
  it('preserves all protected copper and removes only exposed copper', () => {
    const m = copperEtching();
    expect(m.copperSolid).toBeCloseTo(m.protectedFraction);
    expect(m.depth).toBe(1);
    expect(copperProtected(20, 12)).toBe(true);
    expect(copperProtected(20, 4)).toBe(false);
  });
  it('consumes two ferric per copper independently of mask', () => {
    const m = copperEtching(1, 0.5);
    expect(m.removed).toBe(0.25);
    expect(m.ferricLeft).toBe(0);
    expect(m.ferrous).toBe(0.5);
    expect(m.depth).toBeLessThan(1);
  });
  it('conserves both elements across boundaries', () => {
    for (const mask of [false, true])
      for (const f of [0, 0.1, 1, 3])
        for (const p of [0, 0.4, 1]) {
          const m = copperEtching(p, f, mask);
          expect(m.copperSolid + m.copperIon).toBeCloseTo(1);
          expect(m.ferricLeft + m.ferrous).toBeCloseTo(f);
          expect(m.copperSolid).toBeGreaterThanOrEqual(m.protectedFraction - 1e-12);
        }
    expect(copperEtching(1, 2, false).copperSolid).toBe(0);
  });
  it('reconstructs mask and final wash views', () => {
    expect(copperEtchDirector(0, 1).extent).toBe(0);
    expect(copperEtchDirector(3, 0).maskVisible).toBe(false);
    expect(copperEtchDirector(3, 0).extent).toBe(1);
  });
});
