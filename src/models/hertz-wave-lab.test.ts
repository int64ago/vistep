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
import { hertzFilmState, hertzProjection } from './hertz-wave-lab';
it('isolates orientation at one packet instant and retains cos squared power', () => {
  const a = hertzFilmState(4, 2, 'en'),
    b = hertzFilmState(4, 7, 'en'),
    c = hertzFilmState(4, 13, 'en');
  expect(a.time).toBe(b.time);
  expect(b.time).toBe(c.time);
  expect(hertzProjection(c.angle).power).toBeLessThan(1e-28);
  expect(hertzProjection(Math.PI / 3).power).toBeCloseTo(0.25, 14);
  expect(hertzProjection(b.angle).received / hertzProjection(0).received).toBeCloseTo(
    Math.cos(b.angle),
    14,
  );
});
it('uses actual spoken transition windows without changing reception causality', () => {
  expect(hertzFilmState(1, 7, 'en').view).toBe('apparatus');
  expect(hertzFilmState(1, 8, 'en').view).toBe('signal');
  expect(hertzFilmState(5, 4).width).toBe(2);
  expect(hertzFilmState(5, 10).width).toBeCloseTo(0.7);
  for (const t of [0, 1, 3, 5]) {
    const s = hertzFilmState(1, t);
    if (s.time < 3 / LIGHT_SPEED) expect(hertzPulse(s.time, 3).received).toBe(0);
  }
});
it('rejects nonfinite or invalid wave scales without generating NaN', () => {
  for (const x of [NaN, Infinity, -Infinity]) {
    expect(() => hertzPulse(x)).toThrow();
    expect(() => standingField(1, x)).toThrow();
    expect(() => slitIntensity(x)).toThrow();
    expect(() => hertzFilmState(0, x)).toThrow();
  }
  expect(() => hertzPulse(1, 1, 0, 0)).toThrow();
  expect(() => slitIntensity(1, 1, 0)).toThrow();
  expect(() => standingField(1e308, 1e308)).toThrow();
  expect(slitIntensity(0, 0)).toBe(1);
});
