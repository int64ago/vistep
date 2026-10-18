import { describe, it, expect } from 'vitest';
import {
  benzoicSolubility,
  benzoicBatch,
  heatingState,
  benzoicDirector,
} from './chem-benzoic-recrystallization';
describe('benzoic-acid recrystallization', () => {
  it('preserves the warm mother-liquor acid when a cold wash can recrystallize it', () => {
    const m = benzoicBatch(50, 75, 50, 2);
    expect(m.hotCakeAcid + m.motherAcid + m.washAcid + m.productAcid).toBeCloseTo(0.9, 10);
    expect(m.washAcid).toBeLessThanOrEqual((benzoicSolubility(25) * 4) / 100);
  });
  it('reproduces all three textbook solubility anchors', () => {
    expect(benzoicSolubility(25)).toBeCloseTo(0.34);
    expect(benzoicSolubility(50)).toBeCloseTo(0.85);
    expect(benzoicSolubility(75)).toBeCloseTo(2.2);
  });
  it('predicts the unwashed crystal and mother-liquid amounts independently', () => {
    const m = benzoicBatch(50, 75, 25, 0);
    expect(m.crystals).toBeCloseTo(0.73);
    expect(m.dissolved).toBeCloseTo(0.17);
    expect(m.hotCakeAcid).toBe(0);
    expect(m.sand).toBeCloseTo(0.03);
  });
  it('conserves acid, salt and water across every collected or discarded stream', () => {
    for (const V of [20, 50, 120])
      for (const Tf of [25, 50, 75])
        for (const W of [0, 5, 20]) {
          const m = benzoicBatch(V, Tf, 25, W);
          expect(m.hotCakeAcid + m.motherAcid + m.washAcid + m.productAcid).toBeCloseTo(
            m.initialAcid,
            10,
          );
          expect(m.motherSalt + m.washSalt + m.productSalt).toBeCloseTo(m.initialSalt, 10);
          expect(m.motherWater + m.washWater + m.dryingWater).toBeCloseTo(V + W, 10);
          expect(m.productMass).toBeGreaterThanOrEqual(0);
        }
  });
  it('loses target acid in a filter that has cooled too far', () => {
    expect(benzoicBatch(50, 25).hotCakeAcid).toBeCloseTo(0.73);
    expect(benzoicBatch(50, 25).crystals).toBe(0);
  });
  it('washing reduces carried salt but also costs some acid', () => {
    const a = benzoicBatch(50, 75, 25, 0),
      b = benzoicBatch(50, 75, 25, 5);
    expect(b.productSalt).toBeLessThan(a.productSalt);
    expect(b.productAcid).toBeLessThan(a.productAcid);
    expect(b.productMass).toBeCloseTo(0.7206);
    expect(b.purity).toBeGreaterThan(a.purity);
    expect(b.chloridePrecipitate).toBeGreaterThan(0);
  });
  it('extra solvent increases dissolved loss while heating dissolves target', () => {
    expect(benzoicBatch(100).crystals).toBeLessThan(benzoicBatch(50).crystals);
    expect(heatingState(25).solid).toBeCloseTo(0.73);
    expect(heatingState(75).solid).toBe(0);
    expect(benzoicSolubility(NaN)).toBeCloseTo(0.34);
    expect(benzoicDirector(99, Infinity)).toMatchObject({ chapter: 7, p: 0 });
  });
});
