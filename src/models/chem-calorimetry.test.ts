import { describe, it, expect } from 'vitest';
import {
  cupCalorimetry,
  repeatedCups,
  iceCalorimetry,
  calorimetryDirector,
} from './chem-calorimetry';
describe('two ways of measuring heat', () => {
  it('uses limiting water formation and the mean initial temperature', () => {
    const c = cupCalorimetry(120);
    expect(c.waterMoles).toBeCloseTo(0.025, 12);
    expect(c.baseRemaining).toBeCloseTo(0.0025, 12);
    expect(c.initial).toBeCloseTo(20.2);
    expect(cupCalorimetry(120, { baseMolarity: 1 }).released).toBeCloseTo(c.released);
    expect(cupCalorimetry(120, { baseMolarity: 0 }).apparentEnthalpy).toBeNull();
  });
  it('recovers textbook ideal enthalpy and conserves finite-capacity heat', () => {
    const ideal = cupCalorimetry(120, { vesselCapacity: 0, conductance: 0 });
    expect(ideal.apparentEnthalpy).toBeCloseTo(-57.3, 7);
    for (const t of [0, 7, 20, 80, 180])
      for (const k of [0, 1.5, 10])
        expect(Math.abs(cupCalorimetry(t, { conductance: k }).residual)).toBeLessThan(1e-8);
  });
  it('loss and uncounted cup capacity lower the apparent magnitude', () => {
    const ideal = cupCalorimetry(120, { vesselCapacity: 0, conductance: 0 });
    const real = cupCalorimetry(120);
    expect(real.apparentEnthalpy!).toBeGreaterThan(ideal.apparentEnthalpy!);
    expect(real.temperature).toBeLessThan(real.peak);
    expect(real.peakTime).toBeGreaterThan(0);
    expect(real.peakTime).toBeLessThan(25);
    expect(repeatedCups().enthalpy).toBeGreaterThan(-57.3);
  });
  it('counts middle melt only while the guard remains intact', () => {
    const a = iceCalorimetry(1, 0.04, 0),
      b = iceCalorimetry(1, 0.04, 10000);
    expect(a.middleMelt).toBeCloseTo(b.middleMelt, 12);
    expect(b.guardMelt).toBeGreaterThan(a.guardMelt);
    expect(b.measuredHeat).toBeCloseTo(b.sourceHeat, 10);
    expect(iceCalorimetry(1, 0).middleMelt).toBe(0);
    const exhausted = iceCalorimetry(1, 0.04, 50000);
    expect(exhausted.guardIntact).toBe(false);
    expect(exhausted.measuredHeat).toBeGreaterThan(exhausted.sourceHeat);
  });
  it('seeks deterministically and retains independent chapter endpoints', () => {
    expect(calorimetryDirector(0, 1).cupTime).toBe(0);
    expect(calorimetryDirector(4, 1).iceProgress).toBe(0);
    expect(calorimetryDirector(5, 1).iceProgress).toBe(1);
    expect(cupCalorimetry(13)).toEqual(cupCalorimetry(13));
  });
});
