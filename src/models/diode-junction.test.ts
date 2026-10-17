import { describe, it, expect } from 'vitest';
import { diodeJunction, junctionDefaults } from './diode-junction';
describe('abrupt PN junction, Poisson profile and terminal load', () => {
  it('has an equilibrium barrier but zero terminal current', () => {
    const s = diodeJunction(junctionDefaults());
    expect(s.thermalVoltage).toBeCloseTo(0.025852, 6);
    expect(s.builtIn).toBeCloseTo(0.74271, 4);
    expect(s.current).toBe(0);
    expect(s.potential(-s.pWidth)).toBe(0);
    expect(s.potential(s.nWidth)).toBeCloseTo(s.barrier, 12);
  });
  it('depletion charges balance and less doped side depletes farther', () => {
    const s = diodeJunction(junctionDefaults());
    expect(s.acceptors * s.pWidth).toBeCloseTo(s.donors * s.nWidth, 0);
    expect(s.pWidth / s.nWidth).toBeCloseTo(3, 12);
  });
  it('satisfies E=-dφ/dx and dE/dx=ρ/ε independently', () => {
    const s = diodeJunction(junctionDefaults()),
      h = 1e-12;
    for (const x of [-s.pWidth * 0.7, -s.pWidth * 0.2, s.nWidth * 0.3, s.nWidth * 0.7]) {
      const numericalField = -(s.potential(x + h) - s.potential(x - h)) / (2 * h);
      expect(numericalField / s.field(x)).toBeCloseTo(1, 8);
      const derivative = (s.field(x + h) - s.field(x - h)) / (2 * h);
      expect(derivative / (s.chargeDensity(x) / s.permittivity)).toBeCloseTo(1, 8);
    }
    expect(s.potential(-1e-16)).toBeCloseTo(s.potential(1e-16), 7);
  });
  it('forward bias narrows the width while reverse bias widens it', () => {
    const p = junctionDefaults(),
      zero = diodeJunction(p),
      forward = diodeJunction({ ...p, applied: 0.5 }),
      reverse = diodeJunction({ ...p, applied: -1 });
    expect(forward.width).toBeLessThan(zero.width);
    expect(reverse.width).toBeGreaterThan(zero.width);
    expect(reverse.current).toBeCloseTo(-p.saturationCurrent, 22);
    expect(forward.width ** 2 / zero.width ** 2).toBeCloseTo(forward.barrier / zero.barrier, 12);
  });
  it('60 mV produces about one decade without a hard threshold', () => {
    const p = junctionDefaults(),
      a = diodeJunction({ ...p, applied: 0.3 }),
      b = diodeJunction({ ...p, applied: 0.36 });
    expect(a.current).toBeGreaterThan(0);
    expect((b.current + p.saturationCurrent) / (a.current + p.saturationCurrent)).toBeCloseTo(
      10.18487,
      4,
    );
  });
  it('series resistance obeys KVL rather than using terminal voltage in the exponential', () => {
    const p = { ...junctionDefaults(), applied: 1, seriesResistance: 100 },
      s = diodeJunction(p);
    expect(s.junctionVoltage + s.current * 100).toBeCloseTo(1, 12);
    expect(s.current).toBeLessThan(0.01);
    expect(s.junctionVoltage).toBeLessThan(0.6);
    expect(() => diodeJunction({ ...p, seriesResistance: 0 })).toThrow(RangeError);
  });
});
