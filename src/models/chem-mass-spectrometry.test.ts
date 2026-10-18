import { describe, it, expect } from 'vitest';
import {
  ionRadius,
  fieldForMass,
  collectorR,
  sector,
  sectorPoint,
  AMU,
  E,
  isotopeRelative,
  formulaEvidence,
  ionization,
  hydrogenFragment,
} from './chem-mass-spectrometry';
describe('magnetic mass spectrometry', () => {
  it('satisfies qV kinetic energy and magnetic curvature, with equal m/z degeneracy', () => {
    const r = ionRadius(92, 1, 1000, 0.3),
      v = Math.sqrt((2 * E * 1000) / (92 * AMU));
    expect(r).toBeCloseTo((92 * AMU * v) / (E * 0.3));
    expect(ionRadius(92, 2, 1000, 0.3)).toBeCloseTo(ionRadius(46, 1, 1000, 0.3));
    expect(ionRadius(92, 1, 2000, 0.3) / r).toBeCloseTo(Math.SQRT2);
  });
  it('collects the selected mass and resolves 91 from 92 at the defined narrow slit', () => {
    for (const m of [31, 46, 65, 91, 92])
      expect(sector(m, 1, 1000, fieldForMass(m, 1, 1000)).hit).toBe(true);
    expect(sector(91, 1, 1000, 0.3).hit).toBe(false);
    expect(sectorPoint(collectorR, 0)).toEqual({ x: 60, y: 200 });
    expect(sectorPoint(collectorR, Math.PI).y).toBeCloseTo(200);
  });
  it('stops oversized trajectories at a physical chamber wall instead of cropping them', () => {
    for (const mass of [31, 65, 92])
      for (const voltage of [500, 1500])
        for (const field of [0.08, 0.18, 0.45]) {
          const a = sector(mass, 1, voltage, field);
          a.points.forEach((p) => {
            expect(p.x).toBeLessThanOrEqual(330.001);
            expect(p.y).toBeGreaterThanOrEqual(19.999);
          });
        }
    expect(sector(92, 1, 1500, 0.18).hitWall).toBe(true);
  });
  it('distinguishes fragments, molecular mass and isotope peaks', () => {
    expect(formulaEvidence(31, 1).integral).toBe(false);
    expect(formulaEvidence(46, 1).formula).toEqual({ C: 2, H: 6, O: 1 });
    expect(formulaEvidence(47, 1).integral).toBe(false);
    expect(formulaEvidence(46, 2).ordinaryNeutralValence).toBe(false);
    expect(isotopeRelative(7).M1).toBeCloseTo(0.0757, 3);
  });
  it('balances charge in electron ionization and mass in hydrogen loss', () => {
    expect(ionization(0.1).charged).toBe(false);
    expect(ionization(1).outgoing).toHaveLength(2);
    expect(1 - 2).toBe(-1);
    const f = hydrogenFragment(1);
    expect(f.ionMass + f.neutralMass).toBe(f.totalMass);
    expect(f.charge).toBe(1);
  });
});
