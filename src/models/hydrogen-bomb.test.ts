import { describe, expect, it } from 'vitest';
import {
  BINDING_CURVE,
  BINDING_MEV,
  DT_ALPHA_MEV,
  DT_BARRIER_MEV,
  DT_CONTACT_FM,
  DT_MEV_PER_NUCLEON,
  DT_NEUTRON_MEV,
  DT_Q_MEV,
  FISSION_MEV_PER_NUCLEON,
  LI6_BREEDING_Q_MEV,
  approachSeparationFm,
  burnFraction,
  burnParameterGPerCm2,
  compressedFuel,
  coulombPotentialMeV,
  erfc,
  gamowEnergyKeV,
  gamowIntegrand,
  gamowPeak,
  ionSoundSpeedCmPerS,
  kelvinToKeV,
  keVToKelvin,
  maxwellEnergyDensity,
  maxwellTailFraction,
  reactivity,
  reactivityIsExtrapolated,
  tunnellingProbability,
  turningPointFm,
} from './hydrogen-bomb';

describe('reaction energies from binding energies', () => {
  it('reproduces the textbook D–T Q value and neutron share', () => {
    expect(DT_Q_MEV).toBeCloseTo(17.59, 2);
    expect(DT_NEUTRON_MEV).toBeCloseTo(14.05, 1);
    expect(DT_ALPHA_MEV).toBeCloseTo(3.54, 1);
    expect(DT_NEUTRON_MEV + DT_ALPHA_MEV).toBeCloseTo(DT_Q_MEV, 12);
    expect(LI6_BREEDING_Q_MEV).toBeCloseTo(4.78, 2);
  });
  it('releases more per nucleon than fission and keeps helium the most bound light nucleus', () => {
    expect(DT_MEV_PER_NUCLEON).toBeGreaterThan(4 * FISSION_MEV_PER_NUCLEON);
    const light = BINDING_CURVE.filter((n) => n.A <= 12);
    const helium = light.find((n) => n.symbol === '⁴He')!;
    for (const n of light)
      if (n.A < 12) expect(n.perNucleon).toBeLessThanOrEqual(helium.perNucleon);
    expect(helium.perNucleon).toBeCloseTo(BINDING_MEV.He4 / 4, 3);
    const iron = BINDING_CURVE.find((n) => n.symbol === '⁵⁶Fe')!;
    for (const n of BINDING_CURVE)
      if (n.symbol !== '⁶²Ni') expect(n.perNucleon).toBeLessThanOrEqual(iron.perNucleon + 1e-9);
  });
});

describe('Coulomb barrier and tunnelling', () => {
  it('places the barrier top near 0.44 MeV at the touching distance', () => {
    expect(DT_CONTACT_FM).toBeCloseTo(3.24, 2);
    expect(DT_BARRIER_MEV).toBeCloseTo(0.444, 3);
    expect(coulombPotentialMeV(DT_CONTACT_FM)).toBeCloseTo(DT_BARRIER_MEV, 12);
    expect(coulombPotentialMeV(DT_CONTACT_FM * 0.5)).toBeLessThan(0);
    expect(coulombPotentialMeV(100)).toBeCloseTo(0.0144, 4);
    expect(() => coulombPotentialMeV(0)).toThrow(RangeError);
  });
  it('turns back at e²/(4πε₀E)', () => {
    expect(turningPointFm(10)).toBeCloseTo(144, 0);
    expect(turningPointFm(kelvinToKeV(3000) * 1.5)).toBeGreaterThan(1e6);
    expect(() => turningPointFm(-1)).toThrow(RangeError);
  });
  it('uses the published Gamow energies', () => {
    expect(gamowEnergyKeV('dt')).toBeCloseTo(1182, 0);
    expect(gamowEnergyKeV('dd')).toBeCloseTo(986, 0);
    expect(tunnellingProbability(10)).toBeCloseTo(Math.exp(-Math.sqrt(1182.44 / 10)), 6);
    expect(tunnellingProbability(30)).toBeGreaterThan(tunnellingProbability(10) * 50);
    expect(() => tunnellingProbability(0)).toThrow(RangeError);
  });
});

describe('Maxwell distribution and the Gamow peak', () => {
  it('normalises to one and matches the incomplete-gamma tail', () => {
    const T = 7;
    let integral = 0,
      dE = 0.01;
    for (let e = dE / 2; e < 400; e += dE) integral += maxwellEnergyDensity(e, T) * dE;
    expect(integral).toBeCloseTo(1, 4);
    let tail = 0;
    for (let e = 21 + dE / 2; e < 400; e += dE) tail += maxwellEnergyDensity(e, T) * dE;
    expect(maxwellTailFraction(21, T)).toBeCloseTo(tail, 4);
    expect(maxwellTailFraction(0, T)).toBeCloseTo(1, 6);
    expect(erfc(0)).toBeCloseTo(1, 7);
    expect(erfc(1)).toBeCloseTo(0.1572992, 6);
  });
  it('peaks where the integrand is maximal', () => {
    const T = 10;
    const peak = gamowPeak(T);
    expect(peak.energyKeV).toBeCloseTo(30.9, 0);
    const scan = Array.from({ length: 2000 }, (_, i) => (i + 1) * 0.1);
    const best = scan.reduce((a, b) => (gamowIntegrand(a, T) >= gamowIntegrand(b, T) ? a : b));
    expect(Math.abs(best - peak.energyKeV)).toBeLessThan(0.2);
    expect(() => gamowPeak(0)).toThrow(RangeError);
  });
});

describe('Bosch–Hale reactivity', () => {
  it('matches the Bosch & Hale 1992 D–T table within 0.5% (1.5% at the 100 keV boundary)', () => {
    const table: [number, number][] = [
      [1, 6.857e-21],
      [2, 2.977e-19],
      [5, 1.366e-17],
      [10, 1.136e-16],
      [20, 4.33e-16],
      [50, 8.649e-16],
    ];
    for (const [T, expected] of table) expect(reactivity(T, 'dt') / expected).toBeCloseTo(1, 2);
    expect(Math.abs(reactivity(100, 'dt') / 8.54e-16 - 1)).toBeLessThan(0.015);
  });
  it('keeps D–D about two orders of magnitude below D–T near 10 keV', () => {
    const ratio = reactivity(10, 'dt') / reactivity(10, 'dd');
    expect(ratio).toBeGreaterThan(50);
    expect(ratio).toBeLessThan(200);
  });
  it('rises steeply and extrapolates continuously below the fit range', () => {
    expect(reactivity(10) / reactivity(kelvinToKeV(1.5e7))).toBeGreaterThan(1000);
    expect(reactivity(0.2 - 1e-9) / reactivity(0.2)).toBeCloseTo(1, 3);
    expect(reactivity(0.1)).toBeLessThan(reactivity(0.2));
    expect(reactivity(kelvinToKeV(3000))).toBeLessThan(1e-100);
    expect(reactivity(150)).toBe(reactivity(100));
    expect(reactivityIsExtrapolated(0.1)).toBe(true);
    expect(reactivityIsExtrapolated(10)).toBe(false);
    expect(() => reactivity(0)).toThrow(RangeError);
  });
});

describe('inertial burn scaling', () => {
  it('derives H_B of order 7–10 g/cm² near 20–40 keV', () => {
    expect(burnParameterGPerCm2(20)).toBeGreaterThan(7);
    expect(burnParameterGPerCm2(20)).toBeLessThan(10);
    expect(burnParameterGPerCm2(40)).toBeLessThan(burnParameterGPerCm2(20));
    expect(ionSoundSpeedCmPerS(20)).toBeCloseTo(1.24e8, -6);
  });
  it('burns more of the same fuel mass under compression, with ρR ∝ C^{2/3}', () => {
    const a = compressedFuel(1, 10),
      b = compressedFuel(1000, 10);
    expect(b.rhoR / a.rhoR).toBeCloseTo(100, 6);
    expect(b.radiusCm / a.radiusCm).toBeCloseTo(0.1, 12);
    expect(b.numberDensity / a.numberDensity).toBeCloseTo(1000, 9);
    expect(b.ratePerCm3 / a.ratePerCm3).toBeCloseTo(1e6, 3);
    expect(b.burn).toBeGreaterThan(a.burn * 50);
    expect(b.burn).toBeLessThan(1);
    expect(burnFraction(0, 10)).toBe(0);
    expect(() => compressedFuel(0.5, 10)).toThrow(RangeError);
    expect(() => burnFraction(-1, 10)).toThrow(RangeError);
  });
});

describe('units and approach kinematics', () => {
  it('converts kelvin and keV both ways', () => {
    expect(kelvinToKeV(1.160451812e7)).toBeCloseTo(1, 9);
    expect(keVToKelvin(kelvinToKeV(12345))).toBeCloseTo(12345, 6);
  });
  it('reaches the turning point at mid phase and returns symmetrically', () => {
    const far = 9e6;
    expect(approachSeparationFm(0, 10, far)).toBeCloseTo(far, 6);
    expect(approachSeparationFm(1, 10, far)).toBeCloseTo(far, 6);
    expect(approachSeparationFm(0.5, 10, far)).toBeCloseTo(turningPointFm(10), 9);
    expect(approachSeparationFm(0.3, 10, far)).toBeCloseTo(approachSeparationFm(0.7, 10, far), 9);
    for (let u = 0; u <= 1; u += 0.05)
      expect(approachSeparationFm(u, 10, far)).toBeGreaterThanOrEqual(turningPointFm(10) - 1e-9);
  });
});
