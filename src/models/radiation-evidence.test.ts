import { describe, it, expect } from 'vitest';
import {
  radiationTrack,
  plateExposure,
  expansionChamber,
  xrayTransmission,
  xrayCutoffPM,
} from './radiation-evidence';
describe('radiation observations', () => {
  it('bends opposite charges oppositely while photons remain straight', () => {
    expect(radiationTrack('alpha', 0.1).points.at(-1)!.y).toBeLessThan(0);
    expect(radiationTrack('beta', 0.1).points.at(-1)!.y).toBeGreaterThan(0);
    expect(radiationTrack('gamma', 0.1).points.at(-1)!.y).toBe(0);
    expect(radiationTrack('alpha', 0.1).radius).toBeGreaterThan(radiationTrack('beta', 0.1).radius);
  });
  it('flips curvature with field and preserves finite coordinates at zero', () => {
    expect(radiationTrack('beta', -0.1).points.at(-1)!.y).toBeLessThan(0);
    expect(radiationTrack('beta', 0).points.every((p) => Number.isFinite(p.x + p.y))).toBe(true);
  });
  it('ionization becomes visible only after sufficient expansion', () => {
    expect(expansionChamber(1).visibility).toBe(0);
    expect(expansionChamber(1.2).temperature).toBeLessThan(293.15);
    expect(expansionChamber(1.2).supersaturation).toBeGreaterThan(1);
  });
  it('separates exposure and attenuation from a source excitation assumption', () => {
    expect(plateExposure(1, true)).toBeGreaterThan(plateExposure(1, false));
    expect(plateExposure(1, true, 0.2)).toBeLessThan(plateExposure(1, true));
    expect(xrayTransmission(20, true)).toBeLessThan(xrayTransmission(20, false));
    expect(xrayCutoffPM(40)).toBeCloseTo(30.996, 2);
  });
});
