import { describe, it, expect } from 'vitest';
import {
  ATOMIC_LINES,
  photonEnergyEv,
  cobaltTransmission,
  flameLines,
  flameDirector,
} from './chem-flame-spectra';
describe('atomic line and filter model', () => {
  it('matches known photon-energy scale and inverse wavelength', () => {
    expect(photonEnergyEv(500)).toBeCloseTo(2.479684, 5);
    expect(photonEnergyEv(400) / photonEnergyEv(800)).toBe(2);
    expect(photonEnergyEv(588.995)).toBeCloseTo(2.10501, 4);
  });
  it('retains the sodium doublet spacing from NIST air wavelengths', () => {
    expect(ATOMIC_LINES.Na[1].nm - ATOMIC_LINES.Na[0].nm).toBeCloseTo(0.5974, 6);
  });
  it('filters by wavelength and cannot create optical power', () => {
    expect(cobaltTransmission(589)).toBeLessThan(0.04);
    expect(cobaltTransmission(404)).toBeGreaterThan(0.6);
    for (const x of flameLines('K', 1, true)) {
      expect(x.observed).toBeLessThanOrEqual(x.weight);
      expect(x.observed).toBeGreaterThan(0);
    }
  });
  it('removes interference at zero input and keeps seeking deterministic', () => {
    expect(
      flameLines('K', 0)
        .filter((x) => x.nm > 580 && x.nm < 600)
        .every((x) => x.observed === 0),
    ).toBe(true);
    expect(flameDirector(2, 0.5).filter).toBe(true);
    expect(flameDirector(6, 0.9).element).toBe('Hg');
  });
});
