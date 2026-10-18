import { describe, it, expect } from 'vitest';
import {
  copperSulfuric,
  sulfurComproportionation,
  sulfidePermanganate,
  simulateIronSulfur,
  heatFrameAt,
  ironSulfurInventory,
  sulfurTransformDirector,
} from './chem-sulfur-transformations';
describe('sulfur transformations', () => {
  it('conserves copper/sulfur and uses two acid equivalents without forming hydrogen', () => {
    for (const p of [0, 0.2, 1]) {
      const m = copperSulfuric(p);
      expect(m.copper + m.copperSulfate).toBe(1);
      expect(m.sulfurInAcid + m.sulfurInSalt + m.sulfurInGas).toBe(2);
      expect(m.sulfurDioxide).toBe(m.copperSulfate);
    }
    expect(copperSulfuric(1, false).extent).toBe(0);
    expect(copperSulfuric(1, true, false).extent).toBe(0);
    expect(copperSulfuric(1, true, true, false).extent).toBe(0);
  });
  it('balances electrons and sulfur at both sulfide endpoints', () => {
    for (const p of [0, 0.1, 0.6, 1]) {
      const c = sulfurComproportionation(p);
      expect(c.sulfide + c.sulfurIV + c.sulfur).toBeCloseTo(3, 12);
      expect(c.donated).toBe(c.accepted);
      for (const end of ['sulfur', 'sulfate'] as const) {
        const m = sulfidePermanganate(end, p);
        expect(m.sulfide + m.sulfur + m.sulfate).toBe(1);
        expect(m.donated).toBeCloseTo(m.accepted, 12);
        expect(m.permanganateRemaining + m.manganeseII).toBeCloseTo(m.permanganateInitial, 12);
      }
    }
  });
  it('propagates after ignition removal only with enough exothermic feedback', () => {
    const hot = simulateIronSulfur(),
      cold = simulateIronSulfur({ ignition: false }),
      noHeat = simulateIronSulfur({ heatRelease: 0 });
    expect(heatFrameAt(hot, 1).reacted[20]).toBe(0);
    expect(heatFrameAt(hot, 8).reacted[30]).toBeGreaterThan(0.9);
    expect(heatFrameAt(hot, 20).reacted.every((x) => x > 0.99)).toBe(true);
    expect(Math.max(...heatFrameAt(hot, 20).temperature)).toBeLessThan(0.3);
    expect(cold.at(-1)!.reacted.every((x) => x === 0)).toBe(true);
    expect(noHeat.at(-1)!.reacted[20]).toBe(0);
  });
  it('respects limiting iron and distinguishes a wire from the practical copper piece', () => {
    const m = ironSulfurInventory(1.15, 1);
    expect(m.iron).toBeCloseTo(0.15, 12);
    expect(m.sulfur).toBe(0);
    expect(ironSulfurInventory(0.4, 1).ironSulfide).toBe(0.4);
    expect(
      simulateIronSulfur({ ironRatio: 0 })
        .at(-1)!
        .reacted.every((x) => x === 0),
    ).toBe(true);
    expect(sulfurTransformDirector(4, 1, false).lift).toBe(1);
    expect(sulfurTransformDirector(4, 1, true).lift).toBe(0);
  });
});
