import { describe, it, expect } from 'vitest';
import { bjtDefaults, bjtPoint, bjtBias } from './bjt-amplifier';
describe('Ebers–Moll common-emitter amplifier', () => {
  it('biases the output midway between rails with and without emitter resistance', () => {
    for (const emitterResistance of [0, 100]) {
      const p = { ...bjtDefaults(), emitterResistance },
        s = bjtPoint(p, bjtBias(p));
      expect(s.collectorVoltage).toBeCloseTo(2.5, 10);
      expect(s.collectorCurrent).toBeCloseTo(2.5 / 2200, 12);
    }
  });
  it('satisfies both resistor load lines and terminal current conservation', () => {
    for (const emitterResistance of [0, 100])
      for (const base of [0.5, 0.65, 0.8]) {
        const p = { ...bjtDefaults(), emitterResistance },
          s = bjtPoint(p, base);
        expect(s.collectorVoltage + p.collectorResistance * s.collectorCurrent).toBeCloseTo(5, 7);
        expect(s.emitterVoltage).toBeCloseTo(p.emitterResistance * s.emitterCurrent, 8);
        expect(s.baseCurrent + s.collectorCurrent).toBeCloseTo(s.emitterCurrent, 12);
      }
  });
  it('small-signal inversion agrees with independent gm estimate', () => {
    const p = bjtDefaults(),
      bias = bjtBias(p),
      q = bjtPoint(p, bias),
      h = 1e-6,
      numerical =
        (bjtPoint(p, bias + h).collectorVoltage - bjtPoint(p, bias - h).collectorVoltage) / (2 * h);
    expect(
      numerical / ((-p.collectorResistance * q.collectorCurrent) / p.thermalVoltage),
    ).toBeCloseTo(1, 6);
  });
  it('a large drive enters saturation by forward-biasing the base-collector junction', () => {
    const p = bjtDefaults(),
      s = bjtPoint(p, bjtBias(p) + 0.08);
    expect(s.vbc).toBeGreaterThan(0);
    expect(s.region).toBe('saturation');
    expect(s.collectorVoltage).toBeGreaterThan(0);
    expect(s.collectorCurrent / s.baseCurrent).toBeLessThan(p.beta / 10);
  });
  it('emitter feedback reduces gain at the same collector operating point', () => {
    const p = bjtDefaults(),
      r = { ...p, emitterResistance: 100 },
      b = bjtBias(p),
      br = bjtBias(r),
      h = 1e-5,
      g = (bjtPoint(p, b + h).collectorVoltage - bjtPoint(p, b - h).collectorVoltage) / (2 * h),
      gr = (bjtPoint(r, br + h).collectorVoltage - bjtPoint(r, br - h).collectorVoltage) / (2 * h),
      q = bjtPoint(r, br),
      gm = q.collectorCurrent / r.thermalVoltage;
    expect(gr).toBeCloseTo(
      (-r.collectorResistance * gm) / (1 + gm * r.emitterResistance * (1 + 1 / r.beta)),
      4,
    );
    expect(Math.abs(gr)).toBeLessThan(Math.abs(g) / 4);
  });
  it('power from both supplies equals resistor and transistor dissipation even in saturation', () => {
    for (const emitterResistance of [0, 100])
      for (const base of [0.5, 0.65, 0.8]) {
        const s = bjtPoint({ ...bjtDefaults(), emitterResistance }, base);
        expect(s.collectorPower + s.basePower).toBeCloseTo(s.resistorPower + s.transistorPower, 9);
        expect(s.transistorPower).toBeGreaterThanOrEqual(0);
      }
  });
});
