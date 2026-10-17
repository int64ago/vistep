import { describe, it, expect } from 'vitest';
import { telescope, telescopeRay, telescopePupil, pupilCoupling } from './telescope';
describe('Kepler image and exit pupil', () => {
  it('independently focuses parallel objective rays to fo times field angle', () => {
    for (const height of [-20, -10, 0, 10, 20]) {
      const r = telescopeRay(height, 0.5);
      expect(r.at(400)).toBeCloseTo((400 * 0.5 * Math.PI) / 180, 12);
    }
  });
  it('produces parallel output with angular magnification minus ten', () => {
    const slopes = [-20, 0, 20].map((y) => telescopeRay(y, 0.5).outputSlope);
    for (const u of slopes) expect(u).toBeCloseTo((-10 * 0.5 * Math.PI) / 180, 12);
    expect(telescope().magnification).toBe(-10);
  });
  it('images the 40 mm objective into a 4 mm exit pupil 44 mm after the eyepiece', () => {
    const s = telescope();
    expect(s.pupilDiameter).toBe(4);
    expect(s.pupilDistance).toBe(44);
    expect(1 / s.separation + 1 / s.pupilDistance).toBeCloseTo(1 / s.fe, 12);
    for (const y of [-20, 0, 20])
      for (const a of [-0.6, 0, 0.6])
        expect(telescopeRay(y, a).at(s.separation + s.pupilDistance)).toBeCloseTo(-0.1 * y, 12);
  });
  it('reveals incorrect lens spacing instead of forcing parallel output', () => {
    expect(telescopeRay(-20, 0.5, {}, 450).outputSlope).not.toBeCloseTo(
      telescopeRay(20, 0.5, {}, 450).outputSlope,
      6,
    );
  });
  it('uses independently known circle-overlap limits', () => {
    expect(pupilCoupling(2, 2, 4)).toBe(0);
    expect(pupilCoupling(2, 3, 0)).toBe(1);
    expect(pupilCoupling(2, 1, 0)).toBe(0.25);
    expect(pupilCoupling(2, 2, 2)).toBeCloseTo(
      ((2 * Math.PI) / 3 - Math.sqrt(3) / 2) / Math.PI,
      12,
    );
  });
  it('keeps all fields coincident at the pupil but clips off-axis fields away from it', () => {
    expect(telescopePupil(0.6, 44).coupling).toBe(1);
    expect(telescopePupil(0, 14).coupling).toBe(1);
    expect(telescopePupil(0.6, 14).coupling).toBeLessThan(0.5);
    expect(telescopePupil(0.6, 44, 4).coupling).toBe(0);
    expect(() => telescope({ eyepieceFocal: 0 })).toThrow(RangeError);
  });
});
