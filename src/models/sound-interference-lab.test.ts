import { describe, it, expect } from 'vitest';
import { soundInterferencePoint, soundFlagTargets } from './sound-interference-lab';
describe('coherent speaker experiment', () => {
  it('preserves symmetric paths and constructive interference on the bisector', () => {
    expect(soundInterferencePoint(0, 0).intensity).toBeCloseTo(1, 12);
    expect(soundInterferencePoint(0.6, 0.3).intensity).toBeCloseTo(
      soundInterferencePoint(-0.6, 0.3).intensity,
      12,
    );
  });
  it('makes the half-wavelength path difference quiet without falsely forcing unequal amplitudes to cancel', () => {
    const p = soundInterferencePoint(0.125, 0);
    expect(Math.abs(p.pathDifference)).toBeCloseTo(0.25);
    expect(p.intensity).toBeLessThan(0.005);
    expect(p.intensity).toBeGreaterThan(0);
  });
  it('finds local loud and quiet positions using the actual field, not decorative flag placement', () => {
    for (const a of soundFlagTargets()) {
      expect(Math.abs(a.target - a.x0)).toBeLessThanOrEqual(0.160001);
      const start = soundInterferencePoint(a.x0, a.y).intensity;
      if (a.group === 'loud') expect(a.intensity).toBeGreaterThanOrEqual(start - 1e-10);
      else expect(a.intensity).toBeLessThanOrEqual(start + 1e-10);
    }
  });
  it('changes a formerly quiet fixed receiver when frequency changes', () => {
    expect(soundInterferencePoint(0.125, 0, 340).intensity).toBeGreaterThan(0.4);
    expect(soundInterferencePoint(0.125, 0, 680).intensity).toBeLessThan(0.005);
  });
});
