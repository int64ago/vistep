import { describe, it, expect } from 'vitest';
import {
  bromineAddition,
  ethynePreparation,
  permanganateEvidence,
  completeCombustion,
  hydrocarbonDirector,
} from './chem-unsaturated-hydrocarbons';
describe('unsaturated hydrocarbon evidence', () => {
  it('limits bromine addition by one or two available pi bonds', () => {
    for (const gas of ['ethene', 'ethyne'] as const)
      for (const br of [0, 0.4, 1, 1.5, 2, 3])
        for (const p of [0, 0.25, 0.6, 1]) {
          const m = bromineAddition(gas, br, p);
          expect(m.used + m.remaining).toBeCloseTo(br);
          expect(m.products.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
          expect(m.organicAtoms.Br + 2 * m.remaining).toBeCloseTo(m.totalBromineAtoms);
          expect(m.bondOrder).toBeGreaterThanOrEqual(1);
        }
    expect(bromineAddition('ethene', 2).remaining).toBe(1);
    expect(bromineAddition('ethyne', 2).remaining).toBe(0);
  });
  it('tracks carbide water calcium and carbon in preparation', () => {
    for (const p of [0, 0.4, 1]) {
      const m = ethynePreparation(p);
      expect(m.carbide + m.calciumHydroxide).toBeCloseTo(1);
      expect(2 * m.carbide + 2 * m.ethyne).toBeCloseTo(2);
      expect(2 * m.water + 2 * m.calciumHydroxide + 2 * m.ethyne).toBeCloseTo(4.4);
      expect(m.water + 2 * m.calciumHydroxide).toBeCloseTo(2.2);
    }
  });
  it('captures sulfur only until the copper capacity is exhausted', () => {
    for (const c of [0, 0.02, 0.08, 0.12]) {
      const m = ethynePreparation(1, c);
      expect(m.captured + m.outletImpurity).toBeCloseTo(0.08);
      expect(m.precipitate + m.copperRemaining).toBeCloseTo(c);
      expect(m.outletImpurity).toBeGreaterThanOrEqual(0);
    }
    expect(ethynePreparation(1, 0.12).outletImpurity).toBe(0);
    expect(ethynePreparation(1, 0).outletImpurity).toBe(0.08);
  });
  it('models five-electron acidic permanganate and interference without specifying organic oxidation products', () => {
    expect(permanganateEvidence(0).remaining).toBe(1);
    expect(permanganateEvidence(1).electronsUsed).toBe(5);
    expect(permanganateEvidence(0, 2).remaining).toBeCloseTo(0.6);
    expect(permanganateEvidence(10).remaining).toBe(0);
  });
  it('conserves complete combustion atoms and keeps learning routes distinct', () => {
    for (const gas of ['ethene', 'ethyne'] as const) {
      const m = completeCombustion(gas);
      expect(2 * m.oxygen).toBe(2 * m.carbonDioxide + m.water);
      expect(2 * m.water).toBe(gas === 'ethene' ? 4 : 2);
    }
    expect(hydrocarbonDirector(3, 0.5).gas).toBe('ethene');
    expect(hydrocarbonDirector(4, 0.5).gas).toBe('ethyne');
  });
});
