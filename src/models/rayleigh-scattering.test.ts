import { describe, it, expect } from 'vitest';
import {
  rayleighCross,
  rayleighPhase,
  rayleighSpectrum,
  rayleighPlanck,
  rayleighCie,
  rayleighColor,
} from './rayleigh-scattering';
describe('spectral and angular Rayleigh accounting', () => {
  it('has the independently known 450/650nm cross-section ratio', () => {
    expect(rayleighCross(450) / rayleighCross(650)).toBeCloseTo(28561 / 6561, 12);
    expect(rayleighCross(550)).toBe(1);
  });
  it('normalizes the angular density over the sphere and retains nonzero unpolarized 90-degree scattering', () => {
    const N = 10000,
      h = Math.PI / N;
    let sum = 0;
    for (let i = 0; i <= N; i++) {
      const a = i * h;
      sum +=
        (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) *
        rayleighPhase((a * 180) / Math.PI) *
        2 *
        Math.PI *
        Math.sin(a);
    }
    expect((sum * h) / 3).toBeCloseTo(1, 10);
    expect(rayleighPhase(0)).toBeCloseTo(2 * rayleighPhase(90), 12);
    expect(rayleighPhase(0)).toBe(rayleighPhase(180));
  });
  it('conserves spectral energy between direct and removed channels, with angular density separate', () => {
    for (const column of [0, 1, 8])
      for (const p of rayleighSpectrum({ column, angle: 45 })) {
        expect(p.direct + p.removed).toBeCloseTo(p.source, 14);
        expect(p.direct).toBeGreaterThanOrEqual(0);
        expect(p.removed).toBeGreaterThanOrEqual(0);
        expect(p.toward).toBeCloseTo(p.removed * rayleighPhase(45), 14);
      }
    expect(rayleighSpectrum({ opticalDepth: 0 }).every((p) => p.removed === 0)).toBe(true);
  });
  it('reddens the direct spectrum with column, while scattering cannot create another wavelength', () => {
    const short = rayleighSpectrum({ column: 1 }),
      long = rayleighSpectrum({ column: 8 }),
      ratio = (s: typeof short) =>
        s.find((p) => p.wavelength === 650)!.direct / s.find((p) => p.wavelength === 450)!.direct;
    expect(ratio(long)).toBeGreaterThan(ratio(short));
    const mono = rayleighSpectrum({ mono: true });
    expect(mono.filter((p) => p.removed > 0).map((p) => p.wavelength)).toEqual([650]);
  });
  it('matches Wien peak and independent CIE tabulated anchor values', () => {
    const samples = Array.from({ length: 500 }, (_, i) => ({
        w: i + 300,
        p: rayleighPlanck(i + 300),
      })),
      peak = samples.reduce((a, b) => (a.p > b.p ? a : b));
    expect(peak.w).toBeCloseTo(2.897771955e6 / 5778, 0);
    expect(rayleighCie(555)[1]).toBeCloseTo(1, 2);
    expect(rayleighCie(450)[2]).toBeCloseTo(1.77211, 1);
    expect(rayleighColor(rayleighSpectrum({ opticalDepth: 0 }), 'removed')).toBe('#111b28');
  });
  it('guards invalid inputs', () => {
    expect(() => rayleighSpectrum({ column: -1 })).toThrow(RangeError);
    expect(() => rayleighCross(0)).toThrow(RangeError);
  });
});
