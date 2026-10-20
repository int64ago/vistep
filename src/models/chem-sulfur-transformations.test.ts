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

import {
  copperNetAtoms,
  copperSulfurInventory,
  permanganateBudget,
  sulfurElectronLedger,
  ironSulfurMass,
  sulfurFilmState,
} from './chem-sulfur-transformations';
describe('causal sulfur inventories', () => {
  it('keeps the same fifteen atoms and a complete formal transit account', () => {
    let ids: string[] = [];
    for (const width of [256, 272, 390, 680])
      for (const p of [0, 0.1, 0.2, 0.3, 0.5, 0.79, 0.8, 0.9, 1]) {
        const s = copperNetAtoms(p, width);
        const current = s.atoms.map((a) => a.id).sort();
        if (!ids.length) ids = current;
        expect(current).toEqual(ids);
        expect(s.atoms.filter((a) => a.element === 'Cu')).toHaveLength(1);
        expect(s.atoms.filter((a) => a.element === 'S')).toHaveLength(2);
        expect(s.atoms.filter((a) => a.element === 'O')).toHaveLength(8);
        expect(s.atoms.filter((a) => a.element === 'H')).toHaveLength(4);
        expect(s.sumOxidation - s.transitElectrons).toBe(0);
        expect(
          s.atoms.every((a) => a.x >= 11 && a.x <= width - 11 && a.y >= 11 && a.y <= 218),
        ).toBe(true);
      }
    const final = copperNetAtoms(1);
    expect(final.atoms.find((a) => a.id === 's-salt')?.destination).toBe('CuSO4');
    expect(final.atoms.find((a) => a.id === 's-gas')?.destination).toBe('SO2');
    for (const group of ['water-0', 'water-1']) {
      expect(final.atoms.filter((a) => a.destination === group && a.element === 'H')).toHaveLength(
        2,
      );
      expect(final.atoms.filter((a) => a.destination === group && a.element === 'O')).toHaveLength(
        1,
      );
    }
  });
  it('conserves formal oxidation totals while two distinct donors feed one acceptor', () => {
    for (const route of ['comproportionation', 'copper', 'iron'] as const)
      for (const p of [0, 0.21, 0.32, 0.5, 0.79, 0.8, 1]) {
        const s = sulfurElectronLedger(route, p);
        expect(s.totalWithTransit).toBe(route === 'copper' ? 6 : 0);
        expect(s.departed).toBe(s.accepted + s.inTransit);
        expect(s.packets.every((x) => x.phase !== 'transit' || (x.x >= 40 && x.x <= 240))).toBe(
          true,
        );
      }
    const mid = sulfurElectronLedger('comproportionation', 0.5);
    expect(mid.departed).toBe(4);
    expect(mid.accepted).toBe(0);
    expect(mid.inTransit).toBe(4);
    expect(sulfurElectronLedger('comproportionation', 1).centers.map((x) => x.oxidation)).toEqual([
      0, 0, 0,
    ]);
  });
  it('independently balances acidic H2S net routes including oxygen, hydrogen and charge', () => {
    for (const endpoint of ['sulfur', 'sulfate'] as const)
      for (const progress of [0, 0.25, 0.7, 1]) {
        const s = permanganateBudget(endpoint, 5, 2, progress),
          mn = s.manganeseII,
          x = s.conversion;
        expect(s.sulfideRemaining + s.sulfur + s.sulfate).toBeCloseTo(5, 12);
        expect(s.permanganateRemaining + mn).toBeCloseTo(2, 12);
        expect(4 * mn).toBeCloseTo(4 * s.sulfate + s.water, 12);
        expect(2 * x + s.protonsConsumed).toBeCloseTo(2 * s.water, 12);
        expect(-mn + s.protonsConsumed).toBeCloseTo(2 * mn - 2 * s.sulfate, 12);
      }
    expect(permanganateBudget('sulfur', 5, 2).conversion).toBe(5);
    expect(permanganateBudget('sulfate', 5, 2).conversion).toBe(1.25);
    expect(permanganateBudget('sulfate', 5, 2).sulfideRemaining).toBe(3.75);
  });
  it('does not create an unlimited acid supply or erase products on stopping', () => {
    expect(copperSulfurInventory(1, 1).extent).toBe(0.5);
    expect(copperSulfurInventory(3, 1).extent).toBe(0.5);
    expect(copperSulfurInventory(1, 0).extent).toBe(0);
    const stop = copperSulfurInventory(1, 2, 1, 0.7);
    expect(stop).toEqual(copperSulfurInventory(1, 2, 0.7, 0.7));
    for (const cu of [0, 0.5, 2])
      for (const acid of [0, 1, 4])
        for (const p of [0, 0.3, 1]) {
          const s = copperSulfurInventory(cu, acid, p);
          expect(s.copper + s.copperSulfate).toBeCloseTo(cu, 12);
          expect(s.acid + s.copperSulfate + s.sulfurDioxide).toBeCloseTo(acid, 12);
          expect(2 * s.acid + 2 * s.water).toBeCloseTo(2 * acid, 12);
          expect(4 * s.acid + 4 * s.copperSulfate + 2 * s.sulfurDioxide + s.water).toBeCloseTo(
            4 * acid,
            12,
          );
        }
  });
  it('predicts nonzero iron excess from textbook masses rather than from black appearance', () => {
    const s = ironSulfurMass();
    expect(s.ironLeftG).toBeCloseTo(1 - (0.5 * 55.845) / 32.06, 12);
    expect(s.ironLeftG).toBeCloseTo(0.129054897068, 10);
    expect(s.ironSulfideG + s.ironLeftG + s.sulfurLeftG).toBeCloseTo(1.5, 12);
    expect(ironSulfurMass(0, 0.5).sulfurLeftG).toBe(0.5);
  });
  it('hides predicted amounts before disclosure and preserves practical wire differences', () => {
    expect(sulfurFilmState(2, 0, 18).reveal).toBe(false);
    expect(sulfurFilmState(2, 0, 22).reveal).toBe(true);
    expect(sulfurFilmState(5, 0, 22).reveal).toBe(false);
    expect(sulfurFilmState(5, 0, 31).reveal).toBe(true);
    expect(sulfurFilmState(8, 0, 5).reveal).toBe(false);
    expect(sulfurFilmState(4, 1, 20, false).lift).toBe(1);
    expect(sulfurFilmState(4, 1, 20, true).lift).toBe(0);
  });
  it('handles unsupported numeric inputs and an unavailable thermal history without NaNs', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(
        copperNetAtoms(bad, bad).atoms.every((a) => Number.isFinite(a.x + a.y + a.oxidation)),
      ).toBe(true);
      expect(
        Object.values(permanganateBudget('sulfur', bad, bad, bad))
          .filter((x) => typeof x === 'number')
          .every(Number.isFinite),
      ).toBe(true);
      expect(Object.values(copperSulfurInventory(bad, bad, bad, bad)).every(Number.isFinite)).toBe(
        true,
      );
      expect(
        simulateIronSulfur({ heatRelease: bad }).at(-1)!.temperature.every(Number.isFinite),
      ).toBe(true);
    }
    expect(heatFrameAt([], 2).reacted.every((x) => x === 0)).toBe(true);
  });
});
