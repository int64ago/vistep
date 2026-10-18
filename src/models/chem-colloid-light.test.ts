import { describe, it, expect } from 'vitest';
import { colloidOptics, rayleighSideIntensity, colloidDirector } from './chem-colloid-light';
describe('dilute colloid optics', () => {
  it('conserves incident power and reaches the clear limit', () => {
    for (const n of [0, 1, 120, 500]) {
      const s = colloidOptics(18, n);
      expect(s.transmitted + s.scattered).toBeCloseTo(1, 14);
      expect(s.transmitted).toBeGreaterThanOrEqual(0);
    }
    expect(colloidOptics(18, 0).transmitted).toBe(1);
    expect(colloidOptics(18, 120, 633, 0).scattered).toBe(0);
  });
  it('matches independently known Rayleigh scaling', () => {
    expect(colloidOptics(20).crossSection / colloidOptics(10).crossSection).toBeCloseTo(64, 10);
    expect(colloidOptics(20).coefficient / colloidOptics(10).coefficient).toBeCloseTo(8, 10);
    expect(
      colloidOptics(18, 120, 450).coefficient / colloidOptics(18, 120, 633).coefficient,
    ).toBeCloseTo((633 / 450) ** 4, 10);
    expect(rayleighSideIntensity(90)).toBeCloseTo(0.5, 12);
  });
  it('keeps the analogy small-particle and does not inherit exploration', () => {
    expect(colloidOptics(24, 500, 450).sizeParameter).toBeLessThan(0.45);
    expect(colloidDirector(1, 0.5).volumePpm).toBe(120);
    expect(colloidDirector(3, 1).volumePpm).toBeCloseTo(18);
  });
});
