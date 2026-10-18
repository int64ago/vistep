import { describe, expect, it } from 'vitest';
import {
  LIGHT_SPEED,
  hertzPulse,
  standingField,
  snellAngle,
  slitIntensity,
} from './hertz-wave-lab';
describe('Hertz wave models', () => {
  it('keeps reception causal and gives the vacuum delay', () => {
    const r = 3,
      t = r / LIGHT_SPEED;
    expect(hertzPulse(t * 0.99, r).received).toBe(0);
    expect(hertzPulse(t, r).delay).toBeCloseTo(1.0006922856e-8, 16);
  });
  it('creates a zero tangential electric field at the conducting wall', () => {
    expect(standingField(6, 13e-9)).toBeCloseTo(0, 12);
    expect(Math.abs(standingField(6 - LIGHT_SPEED / 1e8 / 4, 13e-9))).toBeGreaterThan(0.1);
  });
  it('obeys Snell and polarization projections', () => {
    const theta = 0.6,
      a = snellAngle(theta);
    expect(Math.sin(theta)).toBeCloseTo(1.5 * Math.sin(a), 12);
    expect(hertzPulse(15e-9, 1, Math.PI / 2).received).toBeCloseTo(0, 12);
  });
  it('normalizes central diffraction and moves the first zero with aperture width', () => {
    expect(slitIntensity(0)).toBe(1);
    expect(slitIntensity(Math.asin(0.5), 2, 1)).toBeCloseTo(0, 12);
    expect(slitIntensity(0.5, 0.7)).toBeGreaterThan(slitIntensity(0.5, 2));
  });
});
