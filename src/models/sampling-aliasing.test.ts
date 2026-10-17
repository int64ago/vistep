import { describe, it, expect } from 'vitest';
import {
  aliasFrequency,
  samplingValue,
  samplingPoints,
  samplingShot,
  SAMPLING_DEFAULT,
} from './sampling-aliasing';
describe('uniform sampling', () => {
  it('all aliases reproduce every measured point for arbitrary phase', () => {
    for (const f of [0.5, 4, 6, 7, 10, 19])
      for (const fs of [4, 8, 12, 24])
        for (const phase of [0, 0.7, Math.PI / 2]) {
          const s = { ...SAMPLING_DEFAULT, frequency: f, sampleRate: fs, phase };
          for (const p of samplingPoints(s))
            expect(samplingValue(s, p.time, true)).toBeCloseTo(p.value, 10);
          expect(Math.abs(aliasFrequency(f, fs))).toBeLessThanOrEqual(fs / 2);
        }
  });
  it('Nyquist equality loses a quadrature sine', () => {
    const s = { ...SAMPLING_DEFAULT, frequency: 6, sampleRate: 12, phase: Math.PI / 2 };
    expect(samplingPoints(s).every((p) => Math.abs(p.value) < 1e-12)).toBe(true);
  });
  it('reconstructs chapter state on a direct seek', () => {
    for (let c = 0; c < 8; c++) expect(samplingShot(c, 0.71)).toEqual(samplingShot(c, 0.71));
    expect(() => aliasFrequency(2, 0)).toThrow();
  });
});
