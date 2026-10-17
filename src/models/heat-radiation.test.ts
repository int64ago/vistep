import { describe, expect, it } from 'vitest';
import { heatRadiation, radiationConstants, spectralExitance } from './heat-radiation';
describe('Grey-body radiation in a black enclosure', () => {
  it('matches an independent textbook human-surface benchmark without a body simulator', () => {
    const s = heatRadiation({ temperature: 306, surroundings: 295, area: 1.5, emissivity: 0.97 });
    expect(s.netOut).toBeCloseTo(98.54, 0);
  });
  it('keeps two positive equal powers at thermal equilibrium', () => {
    const s = heatRadiation({ temperature: 400, surroundings: 400 });
    expect(s.emitted).toBeGreaterThan(20);
    expect(s.absorbed).toBeCloseTo(s.emitted, 12);
    expect(s.netOut).toBe(0);
  });
  it('conserves incident energy and reverses net direction when temperatures swap', () => {
    const a = heatRadiation({ temperature: 500, surroundings: 300, emissivity: 0.15 });
    const b = heatRadiation({ temperature: 300, surroundings: 500, emissivity: 0.15 });
    expect(a.absorbed + a.reflected).toBeCloseTo(a.incident, 12);
    expect(b.netOut).toBeCloseTo(-a.netOut, 12);
    expect(heatRadiation({ emissivity: 0 }).netOut).toBe(0);
  });
  it('uses kelvin to give the fourth-power law and emissivity on both exchange terms', () => {
    expect(
      heatRadiation({ temperature: 600 }).emitted / heatRadiation({ temperature: 300 }).emitted,
    ).toBeCloseTo(16, 12);
    const a = heatRadiation({ emissivity: 0.9 }),
      b = heatRadiation({ emissivity: 0.3 });
    expect(a.emitted / b.emitted).toBeCloseTo(3, 12);
    expect(a.absorbed / b.absorbed).toBeCloseTo(3, 12);
  });
  it('independently integrates Planck spectral exitance to Stefan-Boltzmann power', () => {
    for (const T of [300, 600]) {
      const n = 20000,
        lo = Math.log(1e-8),
        dx = (Math.log(0.02) - lo) / n;
      let integral = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.exp(lo + (i + 0.5) * dx);
        integral += spectralExitance(w, T) * w * dx;
      }
      expect(integral / (radiationConstants.sigma * T ** 4)).toBeCloseTo(1, 7);
      const peak = radiationConstants.wien / T;
      expect(spectralExitance(peak, T)).toBeGreaterThan(spectralExitance(peak * 0.99, T));
      expect(spectralExitance(peak, T)).toBeGreaterThan(spectralExitance(peak * 1.01, T));
    }
  });
  it('rejects Celsius-like zero and invalid surface data', () => {
    for (const o of [{ temperature: 0 }, { surroundings: -1 }, { area: NaN }, { emissivity: 1.1 }])
      expect(() => heatRadiation(o)).toThrow(RangeError);
    expect(() => spectralExitance(0, 300)).toThrow(RangeError);
  });
});
