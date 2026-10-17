import { describe, it, expect } from 'vitest';
import { totalReflection } from './total-internal-reflection';
describe('critical angle and lossless Fresnel powers', () => {
  it('matches the 41.8103 degree glass-air critical angle', () => {
    expect(totalReflection().critical).toBeCloseTo(41.8103148958, 8);
    const s = totalReflection((Math.asin(1 / 1.5) * 180) / Math.PI);
    expect(s.regime).toBe('critical');
    expect(s.transmittedAngle).toBeCloseTo(90, 6);
    expect(s.reflectance).toBeCloseTo(1, 6);
  });
  it('matches normal-incidence 4 percent reflection and conserves power', () => {
    expect(totalReflection(0).reflectance).toBeCloseTo(0.04, 12);
    for (let a = 0; a < 90; a += 0.5) {
      const s = totalReflection(a);
      expect(s.reflectance + s.transmittance).toBeCloseTo(1, 12);
      expect(s.reflectance).toBeGreaterThanOrEqual(0);
      expect(s.reflectance).toBeLessThanOrEqual(1);
    }
  });
  it('requires a higher-to-lower index transition', () => {
    expect(totalReflection(70, 1, 1.5).regime).toBe('transmitted');
    expect(totalReflection(70, 1, 1.5).critical).toBeNull();
    expect(totalReflection(52, 1.5, 1.4).regime).toBe('transmitted');
    expect(totalReflection(52).regime).toBe('total');
  });
  it('has a decaying external field without propagating normal power', () => {
    const s = totalReflection(60);
    expect(s.transmittance).toBe(0);
    expect(s.penetration).toBeCloseTo(550 / (2 * Math.PI * Math.sqrt(1.5 ** 2 * 0.75 - 1)), 10);
    expect(Math.exp(-s.penetration! / s.penetration!)).toBeCloseTo(1 / Math.E, 12);
    expect(totalReflection(70).penetration!).toBeLessThan(s.penetration!);
    expect(() => totalReflection(90)).toThrow(RangeError);
  });
});
