import { describe, it, expect } from 'vitest';
import {
  alkaliWater,
  peroxideWater,
  immersedSphere,
  sodiumDirector,
} from './chem-sodium-reactions';
describe('alkali reaction bookkeeping', () => {
  it('conserves mass for both alkali metals at partial extent', () => {
    for (const metal of ['Na', 'K'] as const)
      for (const x of [0, 0.25, 1]) {
        const s = alkaliWater(x, metal),
          initial = alkaliWater(0, metal).metalMass;
        expect(s.metalMass + s.hydroxideMass + s.hydrogenMass).toBeCloseTo(
          initial + s.waterConsumed,
          10,
        );
      }
  });
  it('keeps hydrogen and oxygen tests distinct', () => {
    expect(alkaliWater(1).hydrogenMoles).toBe(0.5);
    expect(alkaliWater(1).hydroxideMoles).toBe(1);
    expect(peroxideWater(1).oxygenMoles).toBe(0.5);
    expect(peroxideWater(1).hydroxideMoles).toBe(2);
  });
  it('uses displaced volume rather than arbitrary half-submergence', () => {
    expect(immersedSphere(0.5)).toBeCloseTo(0.5, 12);
    const z = immersedSphere(0.97) * 2;
    expect((3 * z * z - z * z * z) / 4).toBeCloseTo(0.97, 10);
    expect(immersedSphere(1)).toBeCloseTo(1, 7);
    expect(immersedSphere(0)).toBeCloseTo(0, 10);
  });
  it('retains zero and full-reaction boundaries and deterministic chapters', () => {
    expect(alkaliWater(0).hydrogenMoles).toBe(0);
    expect(alkaliWater(1).radiusFraction).toBe(0);
    expect(sodiumDirector(5, 0.1).extent).toBe(1);
    expect(sodiumDirector(0, 0.3).oxidation).toBe(0);
  });
});
