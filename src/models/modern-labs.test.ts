import { describe, it, expect } from 'vitest';
import {
  photoelectric,
  thomsonTrajectory,
  oilDrop,
  electronBeam,
  comptonShift,
  planckRadiance,
  wienPeakNM,
  balmerWavelength,
  electronWavelengthPM,
  braggAngle,
  rutherfordAngle,
  rutherfordTrajectory,
  decayFraction,
  muonSurvival,
  lorentzGamma,
} from './modern-labs';
describe('textbook modern-physics benchmarks', () => {
  it('separates photon threshold, intensity and stopping voltage', () => {
    expect(photoelectric(400, 2, 1).emitted).toBe(false);
    const s = photoelectric(800, 1, 0);
    expect(s.excessEV).toBeCloseTo(1.208534157, 6);
    expect(photoelectric(800, 1, -s.stoppingVoltage).current).toBeCloseTo(0, 12);
    expect(photoelectric(800, 2, 0).stoppingVoltage).toBe(s.stoppingVoltage);
    expect(photoelectric(800, 2, 0).current).toBe(2 * s.current);
  });
  it('preserves the straight path when electric and magnetic forces balance', () => {
    const speed = electronBeam(200, 0).speed,
      b = 0.00025;
    const balanced = thomsonTrajectory(speed * b, b);
    expect(Math.max(...balanced.points.map((p) => Math.abs(p.y)))).toBeLessThan(1e-10);
    expect(balanced.points.at(-1)!.x).toBeCloseTo(0.1, 10);
    expect(thomsonTrajectory(speed * b, 0).points.at(-1)!.y).toBeLessThan(0);
    expect(thomsonTrajectory(0, b).points.at(-1)!.y).toBeGreaterThan(0);
    const c = comptonShift(90);
    expect(c.incidentEnergyEV).toBeCloseTo(c.scatteredEnergyEV + c.recoilEnergyEV, 10);
    expect(c.recoilAngle).toBeLessThan(0);
  });
  it('balances an oil drop and recovers Stokes fall when the field is off', () => {
    const s = oilDrop(1, 4, 0),
      balanced = oilDrop(1, 4, s.balanceVoltage);
    expect(balanced.terminalDown).toBeCloseTo(0, 12);
    expect(s.terminalDown).toBe(s.fallWithoutField);
    expect(oilDrop(1, 8, 0).balanceVoltage).toBeCloseTo(s.balanceVoltage / 2, 10);
  });
  it('matches electron and photon reference scales', () => {
    expect(electronBeam(200, 1).radius).toBeCloseTo(0.04769, 4);
    expect(electronBeam(200, 0).radius).toBe(Infinity);
    expect(comptonShift(0).shiftPM).toBe(0);
    expect(comptonShift(180).shiftPM).toBeCloseTo(4.85262047, 6);
    expect(electronWavelengthPM(150)).toBeCloseTo(100.13, 1);
    expect(braggAngle(300, 100)).toBe(null);
  });
  it('retains absolute blackbody scale and hydrogen line positions', () => {
    expect(wienPeakNM(5800)).toBeCloseTo(499.61585, 4);
    expect(planckRadiance(500, 5800)).toBeGreaterThan(planckRadiance(600, 5800));
    expect(planckRadiance(500, 5800)).toBeGreaterThan(planckRadiance(500, 3000));
    expect(balmerWavelength(3)).toBeCloseTo(656.47, 1);
    expect(balmerWavelength(4)).toBeCloseTo(486.27, 1);
  });
  it('reconstructs finite repulsive trajectories and large-angle scattering', () => {
    expect(rutherfordAngle(1)).toBeCloseTo(Math.PI / 2, 12);
    expect(rutherfordAngle(0.1)).toBeGreaterThan(rutherfordAngle(10));
    for (const b of [0.05, 0.5, 3, 20]) {
      const points = rutherfordTrajectory(b);
      expect(points.length).toBeGreaterThan(100);
      expect(points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      expect(Math.min(...points.map((p) => Math.hypot(p.x, p.y)))).toBeGreaterThan(1);
    }
  });
  it('uses lifetime dilation instead of a fabricated survival histogram', () => {
    expect(decayFraction(3)).toBe(0.125);
    expect(lorentzGamma(0)).toBe(1);
    const s = muonSurvival(2000, 0.998);
    expect(s.relativistic).toBeGreaterThan(s.classical * 10);
  });
});
