import { describe, it, expect } from 'vitest';
import {
  dft,
  fourierSamples,
  inverseReal,
  fourierProjection,
  FOURIER_DEFAULT,
} from './fourier-transform';
describe('real DFT', () => {
  it('recovers amplitudes and reconstructs every original sample', () => {
    const s = fourierSamples(FOURIER_DEFAULT),
      b = dft(s);
    expect(b[1].amplitude).toBeCloseTo(1, 12);
    expect(b[3].amplitude).toBeCloseTo(0.5, 12);
    expect(b[5].amplitude).toBeCloseTo(0.25, 12);
    s.forEach((v, i) => expect(inverseReal(b, 64, i / 64)).toBeCloseTo(v, 11));
  });
  it('phase changes retain amplitude while non-bin frequencies leak', () => {
    const b = dft(fourierSamples({ ...FOURIER_DEFAULT, phase: 1.4 }));
    expect(b[3].amplitude).toBeCloseTo(0.5, 12);
    const leaked = dft(fourierSamples({ ...FOURIER_DEFAULT, frequency: 3.4 }));
    expect(leaked[2].amplitude).toBeGreaterThan(0.01);
  });
  it('preserves every sample even when leakage extends beyond the first five bins', () => {
    for (const frequency of [2.5, 3.4, 3.5])
      for (const phase of [0, 1.7]) {
        const samples = fourierSamples({ ...FOURIER_DEFAULT, frequency, phase });
        const bins = dft(samples);
        samples.forEach((value, index) =>
          expect(inverseReal(bins, samples.length, index / samples.length)).toBeCloseTo(value, 11),
        );
      }
  });
  it('rejects invalid records and matches full projection', () => {
    const s = fourierSamples(FOURIER_DEFAULT),
      b = dft(s),
      p = fourierProjection(s, 3, 1);
    expect(p.im).toBeCloseTo((b[3].im * 2) / 64, 12);
    expect(() => dft([NaN, 1])).toThrow();
  });
});
