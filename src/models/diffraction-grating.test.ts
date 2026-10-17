import { describe, it, expect } from 'vitest';
import { grating, gratingOrders, gratingIntensity } from './diffraction-grating';
describe('finite-width Fraunhofer grating', () => {
  it('matches the fast curve formula to the independent finite phasor sum', () => {
    for (const slits of [2, 12, 24])
      for (const u of [-0.7, -0.1833, -1e-9, 0, 0.1833, 0.512])
        expect(gratingIntensity(u, { slits }).normalized).toBeCloseTo(
          grating(u, { slits }).normalized,
          10,
        );
  });
  it('gives N squared coherent central power before normalization', () => {
    for (const slits of [1, 2, 12, 24]) {
      const s = grating(0, { slits });
      expect(s.peak).toBe(slits ** 2);
      expect(s.normalized).toBeCloseTo(1, 12);
      expect(s.amplitude).toBeCloseTo(slits, 12);
    }
  });
  it('matches independent two-slit and single-slit formulas', () => {
    const u = 0.137,
      d = 3000,
      lambda = 550;
    expect(grating(u, { slits: 2 }).interference).toBeCloseTo(
      Math.cos((Math.PI * d * u) / lambda) ** 2,
      12,
    );
    expect(grating(u, { slits: 1 }).normalized).toBeCloseTo(grating(u, { slits: 1 }).envelope, 12);
  });
  it('closes the phasor polygon at the first null and narrows it with more slits', () => {
    for (const slits of [2, 12, 24]) {
      const u = ((1 + 1 / slits) * 550) / 3000,
        s = grating(u, { slits });
      expect(s.interference).toBeLessThan(1e-26);
      expect(Math.hypot(s.phasors.at(-1)!.x, s.phasors.at(-1)!.y)).toBeLessThan(1e-12);
    }
  });
  it('removes the second principal order when width is half the spacing', () => {
    expect(grating((2 * 550) / 3000, { width: 1500 }).normalized).toBeLessThan(1e-28);
    expect(grating(550 / 3000, { width: 1500 }).normalized).toBeCloseTo(4 / Math.PI ** 2, 12);
  });
  it('moves red farther out, clips impossible orders and rejects invalid dimensions', () => {
    expect(gratingOrders(1000, 600).map((s) => s.order)).toEqual([-1, 0, 1]);
    expect(gratingOrders(3000, 650).find((s) => s.order === 1)!.angle).toBeGreaterThan(
      gratingOrders(3000, 450).find((s) => s.order === 1)!.angle,
    );
    expect(() => grating(0, { width: 4000 })).toThrow(RangeError);
  });
});
