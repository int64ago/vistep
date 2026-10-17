import { describe, it, expect } from 'vitest';
import { moireSetup, moireAt, moireContour } from './moire';
describe('geometric sinusoidal grating moire', () => {
  it('matches independent one-dimensional beat period p1*p2/|p2-p1|', () => {
    expect(moireSetup().period).toBeCloseTo(44, 10);
    expect(moireSetup({ pitch2: 4.2 }).period).toBeCloseTo(84, 10);
  });
  it('matches independently known equal-pitch rotation formula', () => {
    for (const angle of [2, 6, 12])
      expect(moireSetup({ pitch2: 4, angle }).period).toBeCloseTo(
        4 / (2 * Math.sin((angle * Math.PI) / 360)),
        10,
      );
  });
  it('has an actual low-frequency term in the product identity, not an added painted envelope', () => {
    const s = moireSetup({ angle: 7, offset: 0.7 });
    for (const [x, y] of [
      [0, 0],
      [3, 8],
      [-12, 9],
      [40, -25],
    ]) {
      const p = moireAt(x, y, s),
        expanded =
          0.25 +
          0.25 * Math.cos(p.A) +
          0.25 * Math.cos(p.B) +
          0.125 * Math.cos(p.A + p.B) +
          0.125 * Math.cos(p.A - p.B);
      expect(p.product).toBeCloseTo(expanded, 12);
    }
  });
  it('tracks real translation magnification and returns after one fine period', () => {
    const s = moireSetup({ offset: 1 }),
      slow = moireContour(s.difference, s.offset / s.pitch2),
      fine = moireContour(s.q2, -s.offset / s.pitch2);
    expect(slow[0].x).toBeCloseTo(-10, 10);
    expect(fine[0].x).toBeCloseTo(1, 10);
    expect(moireAt(12.3, 4, s).product).toBeCloseTo(
      moireAt(12.3, 4, moireSetup({ offset: 5.4 })).product,
      12,
    );
  });
  it('has no independent long-period difference when identical gratings align', () => {
    const s = moireSetup({ pitch2: 4 });
    expect(s.period).toBeNull();
    expect(moireAt(1, 0, s).slow).toBe(1);
    expect(moireAt(1, 0, s).product).toBeCloseTo(0.25, 12);
    expect(moireContour(s.difference, 0)).toEqual([]);
  });
  it('keeps transmission bounded and rejects invalid pitch', () => {
    for (let x = -45; x <= 45; x += 0.2) {
      const p = moireAt(x, 3, moireSetup());
      expect(p.product).toBeGreaterThanOrEqual(0);
      expect(p.product).toBeLessThanOrEqual(1);
    }
    expect(() => moireSetup({ pitch1: 0 })).toThrow(RangeError);
  });
});
