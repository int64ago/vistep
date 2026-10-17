import { describe, it, expect } from 'vitest';
import { refraction } from './refraction';
describe('Snell interface', () => {
  it('matches air/glass 30 degrees to 19.4712 degrees', () => {
    expect(refraction(30).transmitted).toBeCloseTo(19.4712206345, 8);
  });
  it('preserves tangential wave number over both directions', () => {
    for (const n1 of [1, 1.33, 1.5])
      for (const n2 of [1, 1.4, 1.8])
        for (const a of [-40, 0, 30, 50]) {
          const s = refraction(a, n1, n2);
          if (s.transmitted !== null)
            expect(n2 * Math.sin((s.transmitted * Math.PI) / 180)).toBeCloseTo(s.tangential, 12);
        }
  });
  it('has no bending at normal incidence despite changed wavelength and speed', () => {
    const s = refraction(0);
    expect(s.transmitted).toBe(0);
    expect(s.wavelength2).toBeCloseTo(550 / 1.5, 12);
    expect(s.speedRatio).toBeCloseTo(2 / 3, 12);
  });
  it('is reversible below the critical angle and handles its domain boundary', () => {
    const a = refraction(30, 1, 1.5);
    expect(refraction(a.transmitted!, 1.5, 1).transmitted).toBeCloseTo(30, 12);
    expect(refraction(60, 1.5, 1).total).toBe(true);
    expect(refraction(20, 1.2, 1.2).transmitted).toBeCloseTo(20, 12);
    expect(() => refraction(90)).toThrow(RangeError);
  });
});
