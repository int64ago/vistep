import { describe, it, expect } from 'vitest';
import {
  copperAlcoholCycle,
  dichromateAlcohol,
  alcoholOxidationDirector,
} from './chem-alcohol-oxidation';
describe('ethanol oxidation accounts', () => {
  it('preserves copper while oxygen transfers into oxide and water', () => {
    for (const air of [true, false])
      for (const ethanol of [true, false])
        for (let t = 0; t <= 4; t += 0.03125) {
          const m = copperAlcoholCycle(t, air, ethanol);
          expect(m.copper + m.oxide).toBeCloseTo(1);
          expect(m.oxide + m.water).toBeCloseTo(2 * m.oxygen);
          expect(m.aldehyde).toBeCloseTo(m.water);
          expect(m.oxide).toBeGreaterThanOrEqual(0);
        }
  });
  it('repeats the copper cycle and distinguishes missing reactants', () => {
    expect(copperAlcoholCycle(3).aldehyde).toBe(3);
    expect(copperAlcoholCycle(3).copper).toBe(1);
    expect(copperAlcoholCycle(3, false).aldehyde).toBe(0);
    expect(copperAlcoholCycle(3, true, false).oxide).toBe(1);
    expect(copperAlcoholCycle(3, true, false).aldehyde).toBe(0);
  });
  it('balances carbon, hydrogen, oxygen, chromium and charge for acid oxidation', () => {
    for (const e of [0, 1, 3, 6])
      for (const d of [0, 1, 2, 4])
        for (const h of [0, 8, 16, 32])
          for (const p of [0, 0.3, 1]) {
            const m = dichromateAlcohol(p, e, d, h);
            expect(2 * m.ethanol + 2 * m.aceticAcid).toBeCloseTo(2 * e);
            expect(6 * m.ethanol + 4 * m.aceticAcid + m.acid + 2 * m.water).toBeCloseTo(6 * e + h);
            expect(m.ethanol + 7 * m.dichromate + 2 * m.aceticAcid + m.water).toBeCloseTo(
              e + 7 * d,
            );
            expect(2 * m.dichromate + m.chromiumIII).toBeCloseTo(2 * d);
            expect(-2 * m.dichromate + m.acid + 3 * m.chromiumIII).toBeCloseTo(-2 * d + h);
            expect(m.electrons).toBeCloseTo(m.aceticAcid * 4);
          }
  });
  it('limits the final state by oxidant, alcohol or acid and retains excess colour', () => {
    expect(dichromateAlcohol(1, 3, 2).aceticAcid).toBe(3);
    expect(dichromateAlcohol(1, 1, 2).dichromate).toBeCloseTo(4 / 3);
    expect(dichromateAlcohol(1, 3, 2, 8).aceticAcid).toBe(1.5);
    expect(dichromateAlcohol(NaN).extent).toBe(0);
  });
  it('seeks each observation independently', () => {
    expect(alcoholOxidationDirector(0, 1).cycleTime).toBeCloseTo(0.45);
    expect(alcoholOxidationDirector(1, 1).cycleTime).toBe(1);
    expect(alcoholOxidationDirector(2, 1).cycleTime).toBe(3);
    expect(alcoholOxidationDirector(4, 0).oxidationProgress).toBe(0);
  });
});
