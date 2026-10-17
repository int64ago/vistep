import { describe, expect, it } from 'vitest';
import { relayAt, relayConstants as k, relayMagnet, relayTrace } from './relay';
const base = {
  voltage: 5,
  afterVoltage: 5,
  switchAt: 0.04,
  turns: 800,
  loadVoltage: 5,
  loadResistance: 100,
};
describe('normally-open plunger relay', () => {
  it('matches an independent blocked-armature RL exponential and force gradient', () => {
    const trace = relayTrace({ ...base, blocked: true });
    const L = k.leakInductance + (k.mu0 * 800 ** 2 * k.area) / k.gap;
    for (const time of [0.0001, 0.0005, 0.001, 0.004]) {
      const q = relayAt(trace, time);
      expect(q.current).toBeCloseTo((5 / 125) * (1 - Math.exp((-125 * q.time) / L)), 7);
      expect(q.closed).toBe(false);
    }
    const x = 0.0002,
      h = 1e-8,
      i = 0.03,
      m = relayMagnet(800, x, i),
      numeric =
        (relayMagnet(800, x + h, i).inductance - relayMagnet(800, x - h, i).inductance) / (2 * h);
    expect(m.force).toBeCloseTo(0.5 * i * i * numeric, 8);
  });
  it('has pickup versus holding hysteresis from the same moving air-gap model', () => {
    expect(relayAt(relayTrace({ ...base, voltage: 2, afterVoltage: 2 }), 0.08).closed).toBe(false);
    const held = relayAt(relayTrace({ ...base, afterVoltage: 2, switchAt: 0.03 }), 0.08);
    expect(held.closed).toBe(true);
    expect(held.current).toBeCloseTo(2 / 125, 8);
    const off = relayAt(relayTrace({ ...base, afterVoltage: 0, switchAt: 0.04 }), 0.08);
    expect(off.closed).toBe(false);
    expect(off.closure).toBeCloseTo(0, 8);
    expect(off.current).toBeCloseTo(0, 8);
  });
  it('keeps coil and load energy sources independent and represents a blocked mechanism', () => {
    const a = relayAt(relayTrace(base), 0.04),
      b = relayAt(relayTrace({ ...base, loadVoltage: 12 }), 0.04);
    expect(a.closed).toBe(true);
    expect(b.current).toBe(a.current);
    expect(b.closure).toBe(a.closure);
    expect(a.loadPower).toBeCloseTo(0.25, 10);
    expect(b.loadPower).toBeCloseTo(1.44, 10);
    const blocked = relayAt(relayTrace({ ...base, blocked: true }), 0.04);
    expect(blocked.current).toBeGreaterThan(0);
    expect(blocked.loadPower).toBe(0);
    expect(blocked.magneticForce).toBeGreaterThan(blocked.springForce);
  });
  it('converges under refinement, releases with a recirculating diode current, and rejects invalid inputs', () => {
    const a = relayTrace({ ...base, afterVoltage: 0 }),
      b = relayTrace({ ...base, afterVoltage: 0 }, 0.12, 0.00001);
    for (const time of [0.003, 0.006, 0.009, 0.041, 0.044]) {
      const x = relayAt(a, time),
        y = relayAt(b, time);
      expect(Math.abs(x.closure - y.closure)).toBeLessThan(0.000015);
      expect(Math.abs(x.current - y.current)).toBeLessThan(0.001);
    }
    expect(relayAt(a, 0.0401).diodeConducting).toBe(true);
    for (const turns of [500, 800, 1000])
      for (const voltage of [0, 2, 6]) {
        expect(
          relayTrace({ ...base, turns, voltage, afterVoltage: voltage }).every(
            (q) =>
              Number.isFinite(q.current) &&
              q.current >= 0 &&
              q.closure >= 0 &&
              q.closure <= k.travel,
          ),
        ).toBe(true);
      }
    for (const invalid of [{ turns: 0 }, { voltage: NaN }, { loadResistance: 0 }])
      expect(() => relayTrace({ ...base, ...invalid })).toThrow();
  });
});
