import { describe, it, expect } from 'vitest';
import {
  ammoniumLiberation,
  litmusEvidence,
  solidAmmoniaPreparation,
  ammoniaCollection,
  ammoniaAbsorber,
} from './chem-ammonium-cycle';
describe('ammonium liberation and collection', () => {
  it('tracks ammonium nitrogen while base limits each salt', () => {
    for (const salt of ['chloride', 'nitrate', 'sulfate'] as const)
      for (const base of [0, 0.5, 3]) {
        const s = ammoniumLiberation(salt, base, 0.7, 0.4);
        expect(s.ammoniumRemaining + s.ammoniaGas + s.ammoniaAqueous).toBeCloseTo(
          s.ammoniumInitial,
          12,
        );
        expect(s.hydroxideRemaining).toBeGreaterThanOrEqual(0);
      }
    expect(ammoniumLiberation('sulfate').ammoniaGas).toBe(2);
    expect(ammoniumLiberation('nitrate').ammoniaGas).toBe(1);
  });
  it('separates wet gas evidence from an alkaline-liquid false positive', () => {
    expect(litmusEvidence(1, false).blue).toBe(false);
    expect(litmusEvidence(1, true).validGasEvidence).toBe(true);
    expect(litmusEvidence(0, true, true)).toMatchObject({ blue: true, validGasEvidence: false });
  });
  it('balances N, Cl and calcium in the preparation case', () => {
    const s = solidAmmoniaPreparation(2, 0.4, 0.8);
    expect(s.ammoniumChloride + s.ammonia).toBeCloseTo(2, 12);
    expect(s.ammoniumChloride + 2 * s.calciumChloride).toBeCloseTo(2, 12);
    expect(s.calciumHydroxide + s.calciumChloride).toBeCloseTo(0.4, 12);
    expect(solidAmmoniaPreparation(0, 1).ammonia).toBe(0);
  });
  it('conserves introduced gas with a delayed mouth signal', () => {
    for (const q of [0, 0.4, 1, 1.6, 3]) {
      const s = ammoniaCollection(q);
      expect(s.retained + s.escaped).toBeCloseTo(q, 10);
      expect(Math.min(...s.cells)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...s.cells)).toBeLessThanOrEqual(1);
    }
    expect(ammoniaCollection(0.4).mouthFraction).toBeLessThan(0.05);
    expect(ammoniaCollection(1.6).mouthFraction).toBeGreaterThan(0.95);
  });
  it('distinguishes an air-break limit from liquid entering the stem', () => {
    expect(ammoniaAbsorber(30)).toMatchObject({ water: 5, airAdmitted: true, stemReached: false });
    expect(ammoniaAbsorber(30, false).water).toBeCloseTo(
      ((Math.PI * 0.025 ** 2 * 0.03) / 3) * 1e6,
      10,
    );
    expect(ammoniaAbsorber(30, false)).toMatchObject({
      airAdmitted: false,
      stemReached: true,
    });
  });
});
