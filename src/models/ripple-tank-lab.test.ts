import { describe, it, expect } from 'vitest';
import {
  RIPPLE_DEFAULT,
  RIPPLE_SPEED,
  refractionParameters,
  rippleComplex,
  rippleValue,
  paperRipple,
  movingRipples,
  movingWavelengths,
  quietProbe,
} from './ripple-tank-lab';
describe('textbook ripple-tank models', () => {
  it('reflects from a rigid wall with zero normal slope', () => {
    const p = { ...RIPPLE_DEFAULT, mode: 'reflection' as const };
    for (const y of [0.1, 0.22, 0.37]) {
      const a = rippleComplex(p, 0.47 - 1e-5, y),
        b = rippleComplex(p, 0.47, y);
      expect(Math.abs(a[0] - b[0])).toBeLessThan(1e-6);
      expect(Math.abs(a[1] - b[1])).toBeLessThan(1e-6);
    }
  });
  it('matches elevation, normal depth-weighted flux and Snell geometry at the depth boundary', () => {
    const p = { ...RIPPLE_DEFAULT, mode: 'refraction' as const },
      q = refractionParameters(p),
      h = 1e-6,
      a = rippleComplex(p, 0.3 - h, 0.2),
      b = rippleComplex(p, 0.3, 0.2),
      c = rippleComplex(p, 0.3 + h, 0.2);
    expect(Math.sin(q.theta) / q.c1).toBeCloseTo(Math.sin(q.transmitted) / q.c2, 12);
    expect(q.wavelength2 / p.wavelength).toBeCloseTo(q.c2 / q.c1, 12);
    expect(b[0]).toBeCloseTo(c[0], 3);
    expect((q.c1 ** 2 * (b[0] - a[0])) / h).toBeCloseTo((q.c2 ** 2 * (c[0] - b[0])) / h, 3);
  });
  it('narrows the far-field diffraction pattern as the aperture becomes wider', () => {
    const at = (gap: number, angle: number) => {
      const p = { ...RIPPLE_DEFAULT, mode: 'diffraction' as const, gap, wavelength: 0.06 },
        c = rippleComplex(p, 0.23 + 10 * Math.cos(angle), 0.22 + 10 * Math.sin(angle));
      return Math.hypot(c[0], c[1]);
    };
    const wide = at(0.18, 0.35) / at(0.18, 0),
      narrow = at(0.03, 0.35) / at(0.03, 0);
    expect(narrow).toBeGreaterThan(wide * 5);
  });
  it('keeps coherent cancellation fixed but changes it under detuning', () => {
    const p = { ...RIPPLE_DEFAULT, mode: 'interference' as const, phase: Math.PI },
      c = rippleComplex(p, 0.43, 0.22);
    for (const time of [0, 0.1, 0.7]) expect(rippleValue(c, time, p)).toBeCloseTo(0, 12);
    const d = { ...p, frequencyDifference: 0.3 },
      dc = rippleComplex(d, 0.43, 0.22);
    expect(Math.abs(rippleValue(dc, 1.1, d))).toBeGreaterThan(0.1);
    expect(quietProbe({ ...p, phase: 0 }).amplitude).toBeLessThan(0.2);
  });
  it('returns a floating tracer after a pulse and retains each emitted crest centre', () => {
    expect(paperRipple(0.38, 0.22, 0)).toEqual({ height: 0, radial: 0 });
    expect(paperRipple(0.38, 0.22, 3)).toEqual({ height: 0, radial: 0 });
    const before = movingRipples(1),
      after = movingRipples(2);
    expect(after[0].x).toBe(before[0].x);
    expect(after[0].radius - before[0].radius).toBeCloseTo(RIPPLE_SPEED);
    const w = movingWavelengths(0.1);
    expect(w.front).toBeLessThan(w.back);
    expect(movingWavelengths(0).front).toBe(movingWavelengths(0).back);
  });
});
