import { describe, it, expect } from 'vitest';
import {
  cookerSaturation,
  cookerBoiling,
  cookerMixture,
  cookerNozzle,
  cookerParameters,
  cookerState,
} from './pressure-cooker';
describe('weighted regulator and rigid two-phase vessel', () => {
  it('matches IAPWS Table35 and inverse Table36 independent references', () => {
    for (const [T, MPa] of [
      [300, 0.00353658941],
      [500, 2.63889776],
      [600, 12.3443146],
    ])
      expect(cookerSaturation(T - 273.15) / 1e6).toBeCloseTo(MPa, 7);
    for (const [MPa, T] of [
      [0.1, 372.755919],
      [1, 453.035632],
      [10, 584.149488],
    ])
      expect(cookerBoiling(MPa * 1e6) + 273.15).toBeCloseTo(T, 6);
    expect(cookerSaturation(120) / 1000).toBeCloseTo(198.67, 1);
  });
  it('pressure times actual seat area balances weight, not absolute pressure force', () => {
    const p = cookerParameters();
    expect(p.gauge * p.area).toBeCloseTo(0.033 * 9.81, 12);
    const q = cookerState({ time: p.heatToSet / p.power + 100 });
    expect(q.upForce).toBeCloseTo(q.weightForce, 10);
    expect(q.contact).toBeCloseTo(0, 10);
    expect(q.lift).toBeGreaterThan(0);
    expect(q.temperature).toBeCloseTo(120.9, 1);
  });
  it('sealed warming stores energy, retains mass, and keeps valve seated', () => {
    const p = cookerParameters(),
      s = cookerState({ time: (p.heatToSet / p.power) * 0.5 });
    expect(s.energy - p.start.energy).toBeCloseTo(s.input, 7);
    expect(s.mass).toBe(1);
    expect(s.flow).toBe(0);
    expect(s.upForce).toBeLessThan(s.weightForce);
    expect(s.lift).toBe(0);
    expect(s.vapor).toBeGreaterThan(p.start.vapor);
  });
  it('venting obeys full rigid-volume mass and energy balance, including headspace change', () => {
    const p = cookerParameters(),
      s = cookerState({ time: p.heatToSet / p.power + 200 });
    expect(s.energy - p.start.energy + s.out * p.set.hv).toBeCloseTo(s.input, 7);
    expect(s.liquid * s.vl + s.vapor * s.vg).toBeCloseTo(0.002, 14);
    expect(s.liquid + s.vapor + s.out).toBeCloseTo(1, 14);
    expect(s.flow * (p.set.hv - p.set.dUdM)).toBeCloseTo(p.power, 10);
    expect(s.flow).toBeLessThan(p.power / p.set.latent);
  });
  it('more heater power increases vent flow/lift at same regulated temperature and pressure', () => {
    const p = cookerParameters(),
      a = cookerState({ power: 300, time: p.heatToSet / 300 + 100 }),
      b = cookerState({ power: 900, time: p.heatToSet / 900 + 100 });
    expect(b.temperature).toBe(a.temperature);
    expect(b.pressure).toBe(a.pressure);
    expect(b.flow / a.flow).toBeCloseTo(3, 12);
    expect(b.lift / a.lift).toBeCloseTo(3, 12);
    const noHeat = cookerState({ power: 0, time: 900 });
    expect(noHeat.input).toBe(0);
    expect(noHeat.flow).toBe(0);
    expect(noHeat.temperature).toBeCloseTo(p.startTemperature, 12);
  });
  it('same gauge pressure gives a lower boiling temperature at lower ambient pressure', () => {
    const a = cookerParameters(),
      b = cookerParameters({ ambient: 70000 });
    expect(a.gauge).toBe(b.gauge);
    expect(b.setPressure).toBeLessThan(a.setPressure);
    expect(b.setTemperature).toBeLessThan(a.setTemperature);
    const open = cookerState({ sealed: false, time: 200 });
    expect(open.gauge).toBeCloseTo(0, 7);
    expect(open.temperature).toBeCloseTo(a.startTemperature, 12);
  });
  it('nozzle has correct zero/subcritical/choked limits and regulator fits allowed corners', () => {
    expect(cookerNozzle(200000, 200000, 120)).toBe(0);
    expect(cookerNozzle(200000, 50000, 120)).toBe(cookerNozzle(200000, 0, 120));
    const g = 1.3,
      r = (2 / (g + 1)) ** (g / (g - 1)),
      left = cookerNozzle(200000, 200000 * (r - 1e-7), 120),
      right = cookerNozzle(200000, 200000 * (r + 1e-7), 120);
    expect(left).toBeCloseTo(right, 8);
    for (const ambient of [70000, 105000])
      for (const weight of [0.02, 0.04]) {
        const p = cookerParameters({ ambient, weight, power: 900 }),
          s = cookerState({ ambient, weight, power: 900, time: p.heatToSet / 900 + 600 });
        expect(s.lift).toBeLessThan(0.0005);
        expect(s.liquid).toBeGreaterThan(0);
      }
    expect(() => cookerMixture(120, 0.001)).toThrow();
    expect(() => cookerParameters({ power: -1 })).toThrow();
  });
});
