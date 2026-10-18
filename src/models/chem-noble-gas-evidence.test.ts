import { describe, it, expect } from 'vitest';
import {
  heliumLine,
  sodiumLines,
  spectrum,
  matchDistance,
  densityEvidence,
  separation,
  onPath,
  separationPath,
  xenonMarker,
  xenonObservation,
  ionizationEV,
} from './chem-noble-gas-evidence';
describe('noble-gas evidence', () => {
  it('distinguishes calibrated He from sodium and broadens unresolved peaks', () => {
    expect(matchDistance([heliumLine], [heliumLine])).toBe(0);
    expect(matchDistance(sodiumLines, [heliumLine])).toBeGreaterThan(1.4);
    expect(spectrum(heliumLine, [heliumLine], 0.15)).toBe(1);
    expect(spectrum(heliumLine + 0.6, [heliumLine], 1.8)).toBeGreaterThan(
      spectrum(heliumLine + 0.6, [heliumLine], 0.15),
    );
  });
  it('recovers the textbook 6.4 mg difference per litre and exposes unmatched temperature', () => {
    expect(densityEvidence(1).differenceMg).toBeCloseTo(6.4);
    expect(densityEvidence(2).differenceMg).toBeCloseTo(12.8);
    expect(densityEvidence(1, 2).differenceMg).toBeLessThan(0);
  });
  it('conserves gas plus captured components with unchanged argon', () => {
    for (let i = 0; i <= 100; i++) {
      const s = separation(i / 100);
      expect(s.gas + s.oxygenProduct + s.nitrogenProduct).toBeCloseTo(100);
      expect(s.argon).toBe(1);
    }
    expect(separation(1).gas).toBe(1);
    expect(onPath(separationPath, 0)).toEqual(onPath(separationPath, 1));
  });
  it('moves xenon only through joined bulb and neck geometry without teleportation', () => {
    for (let i = 0; i < 6; i++)
      for (let k = 0; k < 1000; k++) {
        const p = xenonMarker(i, k / 1000, true),
          q = xenonMarker(i, (k + 1) / 1000, true);
        expect(Math.hypot(q.x - p.x, q.y - p.y)).toBeLessThan(0.6);
        const inLeft = Math.hypot(p.x - 100, p.y - 125) <= 55.01,
          inRight = Math.hypot(p.x - 260, p.y - 125) <= 55.01,
          inNeck = p.x >= 145 && p.x <= 215 && Math.abs(p.y - 125) <= 10;
        expect(inLeft || inRight || inNeck).toBe(true);
      }
  });
  it('does not react across a closed seal, and compares molecular O2 with atomic Xe', () => {
    expect(xenonObservation(1, false).orangeSolid).toBe(0);
    expect(xenonObservation(1, true).orangeSolid).toBe(1);
    expect(ionizationEV.xenonAtom - ionizationEV.oxygenMolecule).toBeCloseTo(0.06014);
  });
});
