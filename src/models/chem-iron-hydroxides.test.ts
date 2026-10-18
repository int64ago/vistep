import { describe, it, expect } from 'vitest';
import { ironHydroxides, hydroxideColour, hydroxideDirector } from './chem-iron-hydroxides';
describe('iron hydroxides', () => {
  it('requires two and three hydroxides per precipitated iron', () => {
    const m = ironHydroxides(1, 0);
    expect(m.ferrousRemaining).toBe(0.5);
    expect(m.ferricSolid).toBeCloseTo(1 / 3);
  });
  it('has the independent four-iron-per-oxygen benchmark', () => {
    const m = ironHydroxides(3, 0.1);
    expect(m.oxidized).toBeCloseTo(0.4);
    expect(m.ferrousRemaining).toBeCloseTo(0.6);
    expect(m.waterUsed).toBeCloseTo(0.2);
  });
  it('conserves iron across limits and blocks without base or oxygen', () => {
    for (const oh of [0, 0.5, 2, 3, 4])
      for (const oxygen of [0, 0.01, 0.25, 2])
        for (const p of [0, 0.3, 1]) {
          const m = ironHydroxides(oh, oxygen, p);
          expect(m.totalFerrousIron).toBeCloseTo(1);
          expect(m.ferricSolid + m.ferricDissolved).toBeCloseTo(1);
          expect(m.oxidized).toBeLessThanOrEqual(4 * oxygen);
          expect(m.ferrousRemaining).toBeGreaterThanOrEqual(0);
        }
    expect(ironHydroxides(0).oxidized).toBe(0);
    expect(ironHydroxides(3, 0).oxidized).toBe(0);
  });
  it('reconstructs direct seeks and distinct colour evidence', () => {
    expect(hydroxideDirector(0, 0).add).toBe(0);
    expect(hydroxideDirector(2, 0.1).extent).toBe(0.1);
    expect(hydroxideDirector(3, 1).oxygen).toBe(0.25);
    expect(new Set([0, 0.25, 1].map(hydroxideColour)).size).toBe(3);
  });
});
