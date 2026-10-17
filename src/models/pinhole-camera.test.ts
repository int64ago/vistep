import { describe, it, expect } from 'vitest';
import { pinhole, pinholeImage, pinholeRay } from './pinhole-camera';
describe('pinhole geometry and diffraction scales', () => {
  it('inverts a 60 mm object to a 10 mm image at 600/100 mm distances', () => {
    expect(pinholeImage(60)).toBe(-10);
    expect(pinholeRay(60, 0)).toBe(-10);
  });
  it('recovers the geometric spot diameter from the aperture edge rays', () => {
    const options = { aperture: 2 };
    expect(pinholeRay(60, 1, options) - pinholeRay(60, -1, options)).toBeCloseTo(
      pinhole(options).geometric,
      12,
    );
  });
  it('approaches the hole diameter for distant objects', () => {
    expect(pinhole({ aperture: 1, objectDistance: 1e12 }).geometric).toBeCloseTo(1, 8);
  });
  it('shows why shrinking the hole indefinitely is a counterexample', () => {
    const a = pinhole({ aperture: 0.1 }),
      b = pinhole({ aperture: 0.05 });
    expect(b.geometric).toBe(a.geometric / 2);
    expect(b.diffraction).toBe(a.diffraction * 2);
    expect(b.throughput).toBe(a.throughput / 4);
  });
  it('labels the scale balance consistently without claiming an exact optimum', () => {
    const d = pinhole().balanceAperture,
      s = pinhole({ aperture: d });
    expect(s.geometric).toBeCloseTo(s.diffraction, 12);
    expect(s.fresnelNumber).toBeGreaterThan(0.1);
    expect(() => pinhole({ aperture: 0 })).toThrow(RangeError);
  });
});
