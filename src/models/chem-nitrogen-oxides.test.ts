import { describe, it, expect } from 'vitest';
import {
  nitrogenInitial,
  oxidizeNitrogen,
  absorbNitrogen,
  finishNitrogenAbsorption,
  nitrogenGasVolume,
  nitrogenAtomInventory,
  copperNitric,
  syringeLiquidDepth,
} from './chem-nitrogen-oxides';
describe('nitrogen-oxide inventories', () => {
  it('maps liquid volume to a circular segment in the horizontal barrel', () => {
    for (const f of [0, 0.1, 0.5, 0.9, 1]) {
      const h = syringeLiquidDepth(f, 1);
      const area = Math.acos(1 - h) - (1 - h) * Math.sqrt(Math.max(0, 2 * h - h * h));
      expect(area / Math.PI).toBeCloseTo(f, 10);
    }
  });
  it('matches the textbook 20mL NO + 10mL air limiting-oxygen benchmark', () => {
    const s = nitrogenInitial(10),
      brown = oxidizeNitrogen(s),
      clear = absorbNitrogen(brown);
    expect(brown.no2).toBeCloseTo(4.2, 12);
    expect(nitrogenGasVolume(brown)).toBeCloseTo(27.9, 12);
    expect(clear.no).toBeCloseTo(17.2, 12);
    expect(clear.aqueousN).toBeCloseTo(2.8, 12);
    expect(nitrogenGasVolume(clear)).toBeCloseTo(25.1, 12);
  });
  it('conserves reactive nitrogen and oxygen with water consumption recorded', () => {
    for (const feed of [0, 10, 15, 25])
      for (const pure of [false, true]) {
        const a = nitrogenInitial(feed, pure),
          b = absorbNitrogen(oxidizeNitrogen(a, 0.6), 0.7),
          c = finishNitrogenAbsorption(a);
        for (const x of [b, c]) {
          expect(nitrogenAtomInventory(x).reactiveN).toBeCloseTo(20, 10);
          expect(nitrogenAtomInventory(x).oxygenFromGas).toBeCloseTo(
            nitrogenAtomInventory(a).oxygenFromGas,
            10,
          );
        }
      }
  });
  it('separates absent oxygen, absent water and enough pure oxygen', () => {
    expect(finishNitrogenAbsorption(nitrogenInitial(0)).no).toBe(20);
    const dry = finishNitrogenAbsorption(nitrogenInitial(10), false);
    expect(dry.no2).toBeCloseTo(4.2, 12);
    expect(dry.aqueousN).toBe(0);
    const full = finishNitrogenAbsorption(nitrogenInitial(15, true));
    expect(full.aqueousN).toBeCloseTo(20, 10);
    expect(full.no + full.no2).toBeLessThan(1e-10);
    expect(nitrogenGasVolume(finishNitrogenAbsorption(nitrogenInitial(20, true)))).toBeCloseTo(
      5,
      10,
    );
  });
  it('balances nitric-acid nitrogen and electrons in both textbook copper cases', () => {
    for (const conc of [true, false])
      for (const p of [0, 0.3, 1]) {
        const m = copperNitric(conc, p);
        expect(m.copper + m.copperII).toBe(1);
        expect(m.nitrateInSalt + m.no + m.no2).toBeCloseTo(m.nitricAcidConsumed, 12);
        expect(3 * m.no + m.no2).toBeCloseTo(m.electrons, 12);
      }
  });
});
