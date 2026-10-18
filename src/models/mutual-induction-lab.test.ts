import { describe, expect, it } from 'vitest';
import { mutualResponse, ringResponse, audioResponse } from './mutual-induction-lab';
describe('mutual-induction apparatuses', () => {
  it('matches an independent mutual emf benchmark and zero DC boundary', () => {
    expect(mutualResponse(2, 200, 1, 2.53e-5, 2.53e-5).emf).toBeCloseTo(-0.00506, 10);
    expect(mutualResponse(2, 0).emf).toBe(0);
    expect(mutualResponse(2, 3, 0).emf).toBeCloseTo(0, 10);
  });
  it('reverses the induced emf at closing and opening, but keeps positive primary current', () => {
    expect(ringResponse(0.1, 'close').emf).toBeLessThan(0);
    expect(ringResponse(0.1, 'open').emf).toBeGreaterThan(0);
    expect(ringResponse(0.1, 'open').current).toBeGreaterThan(0);
    expect(ringResponse(10, 'close').emf).toBeCloseTo(0, 10);
  });
  it('computes the time derivative of actual flux linkage and weaker coupling on withdrawal', () => {
    const t = 0.0004,
      e = 1e-8;
    const numerical =
      -(audioResponse(t + e).fluxLinkage - audioResponse(t - e).fluxLinkage) / (2 * e);
    expect(audioResponse(t).emf).toBeCloseTo(numerical, 7);
    expect(Math.abs(audioResponse(0, 0.1).emf)).toBeLessThan(Math.abs(audioResponse(0, 0.9).emf));
    expect(audioResponse(0, 0.9, 0).emf).toBe(0);
  });
});
