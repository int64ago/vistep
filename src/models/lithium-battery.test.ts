import { describe, it, expect } from 'vitest';
import {
  LITHIUM as B,
  LITHIUM_FILM,
  lithiumInitial,
  lithiumOcv,
  lithiumChemicalEnergy,
  lithiumInventory,
  lithiumReadout,
  lithiumAdvance,
  lithiumProgram,
  lithiumShot,
  lithiumTracer,
  lithiumGeometry,
  lithiumPath,
} from './lithium-battery';
const near = (a: number, b: number, t = 1e-8) => expect(Math.abs(a - b)).toBeLessThan(t);
describe('graphite/LFP cell charge, energy and identity', () => {
  it('conserves lithium and gives one Faraday of external charge per mole transferred', () => {
    const a = lithiumInitial(0.85),
      b = lithiumAdvance(a, 1.3, 500),
      n0 = lithiumInventory(a.soc),
      n1 = lithiumInventory(b.soc);
    near(n0.negativeMoles + n0.positiveMoles, n1.totalMoles);
    near(n1.negativeMoles + n1.positiveMoles, n0.totalMoles);
    near((n0.negativeMoles - n1.negativeMoles) * B.faraday, b.chargeOut);
    near((n1.positiveMoles - n0.positiveMoles) * B.faraday, b.chargeOut);
    expect(n1.x).toBeLessThan(n0.x);
    expect(n1.y).toBeGreaterThan(n0.y);
  });
  it('has a monotone plateau and an independently differentiated energy primitive', () => {
    for (let k = 1; k < 100; k++) {
      const z = k / 100,
        h = 1e-5;
      near(
        (lithiumChemicalEnergy(z + h) - lithiumChemicalEnergy(z - h)) / (2 * h),
        B.charge * lithiumOcv(z),
        1e-4,
      );
      expect(lithiumOcv(z)).toBeGreaterThan(lithiumOcv(z - 0.01));
    }
    near(lithiumChemicalEnergy(0), 0);
    near(lithiumChemicalEnergy(1), 11880);
  });
  it('obeys instantaneous passive electrical energy balance for both current signs', () => {
    for (const current of [-2, -1, 0, 1, 2])
      for (const polarization of [-0.05, 0, 0.05]) {
        const s = { ...lithiumInitial(0.5), current, polarization },
          v = lithiumReadout(s);
        near(v.chemicalRate + v.polarizationRate + v.terminalPower + v.heatPower, 0);
        expect(v.heatPower).toBeGreaterThanOrEqual(0);
        near(v.voltage, v.ocv - B.r0 * current - polarization);
      }
  });
  it('matches an independent RK4 integration of state, terminal power and heat', () => {
    let z = 0.65,
      p = -0.012,
      work = 0,
      heat = 0;
    const I = 1.7,
      dt = 0.02,
      n = 6000,
      deriv = (s: number[]) => {
        const U = 3.3 + 0.08 * (2 * s[0] - 1) + 0.14 * (2 * s[0] - 1) ** 9;
        return [
          -I / 3600,
          (I - s[1] / 0.03) / 1500,
          I * (U - 0.04 * I - s[1]),
          0.04 * I * I + (s[1] * s[1]) / 0.03,
        ];
      };
    let state = [z, p, work, heat];
    for (let j = 0; j < n; j++) {
      const k1 = deriv(state),
        k2 = deriv(state.map((x, k) => x + (dt * k1[k]) / 2)),
        k3 = deriv(state.map((x, k) => x + (dt * k2[k]) / 2)),
        k4 = deriv(state.map((x, k) => x + dt * k3[k]));
      state = state.map((x, k) => x + (dt * (k1[k] + 2 * k2[k] + 2 * k3[k] + k4[k])) / 6);
    }
    const actual = lithiumAdvance({ ...lithiumInitial(z), polarization: p }, I, dt * n);
    near(actual.soc, state[0], 1e-10);
    near(actual.polarization, state[1], 1e-10);
    near(actual.energyOut, state[2], 1e-7);
    near(actual.heat, state[3], 1e-8);
  });
  it('charges with the opposite signs and stores less energy than supplied', () => {
    const a = lithiumInitial(0.25),
      b = lithiumAdvance(a, -1, 800),
      v = lithiumReadout(b);
    expect(b.soc).toBeGreaterThan(a.soc);
    expect(v.voltage).toBeGreaterThan(v.ocv);
    expect(v.terminalPower).toBeLessThan(0);
    expect(b.energyIn).toBeGreaterThan(lithiumChemicalEnergy(b.soc) - lithiumChemicalEnergy(a.soc));
    expect(b.chargeOut).toBe(-800);
  });
  it('recovers voltage at rest without adding SOC, lithium or chemical energy', () => {
    const a = lithiumAdvance(lithiumInitial(0.5), 2, 90),
      b = lithiumAdvance(a, 0, 180),
      x = lithiumReadout(a),
      y = lithiumReadout(b);
    expect(y.voltage).toBeGreaterThan(x.voltage);
    expect(b.soc).toBe(a.soc);
    expect(b.chargeOut).toBe(a.chargeOut);
    expect(y.chemicalEnergy).toBe(x.chemicalEnergy);
    near(x.polarizationEnergy - y.polarizationEnergy, b.heat - a.heat);
    expect(b.energyOut).toBe(a.energyOut);
    expect(b.energyIn).toBe(a.energyIn);
  });
  it('integrates charge and terminal energy continuously when a current step occurs', () => {
    const a = lithiumAdvance(lithiumInitial(), 1, 100),
      b = lithiumAdvance(a, 2, 0);
    expect(b.soc).toBe(a.soc);
    expect(b.polarization).toBe(a.polarization);
    near(lithiumReadout(a).voltage - lithiumReadout(b).voltage, B.r0);
    expect(b.energyOut).toBe(a.energyOut);
  });
  it('is a semigroup while no cutoff occurs', () => {
    const a = lithiumInitial(0.7),
      once = lithiumAdvance(a, 1.2, 250),
      split = lithiumAdvance(lithiumAdvance(a, 1.2, 70), 1.2, 180);
    for (const key of [
      'soc',
      'polarization',
      'heat',
      'chargeOut',
      'energyOut',
      'energyIn',
    ] as const)
      near(once[key], split[key], 1e-8);
  });
  it('cuts off exact usable capacity and permits current reversal', () => {
    const empty = lithiumAdvance(lithiumInitial(0.1), 1, 800);
    expect(empty.soc).toBe(0);
    expect(empty.current).toBe(0);
    expect(empty.cutoff).toBe('empty');
    near(empty.chargeOut, 360);
    const full = lithiumAdvance(lithiumInitial(0.9), -1, 800);
    expect(full.soc).toBe(1);
    expect(full.current).toBe(0);
    expect(full.cutoff).toBe('full');
    expect(lithiumAdvance(full, 1, 50).soc).toBeLessThan(1);
  });
  it('finds a voltage cutoff before full SOC at high charging rate', () => {
    const b = lithiumAdvance(lithiumInitial(0.8), -2.5, 1000);
    expect(b.cutoff).toBe('voltage-high');
    expect(b.soc).toBeLessThan(1);
    expect(b.current).toBe(0);
    expect(b.soc).toBeGreaterThan(0.8);
    const start = lithiumAdvance(lithiumInitial(1), -2.5, 10);
    expect(start.chargeOut).toBe(0);
  });
  it('balances every authored chapter including endpoint rest and returns tracers backwards', () => {
    const start = lithiumReadout(lithiumInitial());
    for (let c = 0; c < 8; c++)
      for (const p of [0, 0.2, 0.5, 0.8, 1]) {
        const s = lithiumShot(c, p),
          v = s.values;
        near(
          start.chemicalEnergy + s.state.energyIn,
          v.chemicalEnergy + v.polarizationEnergy + s.state.energyOut + s.state.heat,
          1e-7,
        );
        expect(s.state.soc).toBeGreaterThanOrEqual(0);
        expect(s.state.soc).toBeLessThanOrEqual(1);
      }
    for (let c = 0; c < 7; c++) {
      const a = lithiumShot(c, 1).state,
        b = lithiumShot(c + 1, 0).state;
      near(a.soc, b.soc);
      near(a.polarization, b.polarization);
      near(a.chargeOut, b.chargeOut);
    }
    expect(lithiumShot(7, 1).state.cutoff).toBe('full');
  });
  it('gives continuous bounded non-wrapping identities that retrace on charge', () => {
    for (let id = 0; id < B.tracers; id++) {
      const a = lithiumTracer(id, 0.85),
        b = lithiumTracer(id, 0);
      expect(a.fraction).toBe(0);
      expect(b.fraction).toBe(1);
      expect(a.id).toBe(b.id);
      let last = a;
      for (let k = 1; k <= 1000; k++) {
        const next = lithiumTracer(id, 0.85 * (1 - k / 1000));
        expect(next.fraction).toBeGreaterThanOrEqual(last.fraction);
        expect(Math.hypot(...next.ion.map((v, j) => v - last.ion[j]))).toBeLessThan(0.08);
        expect(next).toEqual(lithiumTracer(id, 0.85 * (1 - k / 1000)));
        last = next;
      }
      const middle = lithiumTracer(id, 0.45);
      expect(lithiumTracer(id, 0.45).ion).toEqual(middle.ion);
    }
  });
  it('keeps the external electron path out of the separator and shares exact collector connections', () => {
    const g = lithiumGeometry();
    expect(g.external[0]).toEqual([-1.25, 1.5, 0]);
    expect(g.external.at(-1)).toEqual([1.25, 1.5, 0]);
    for (let id = 0; id < 18; id++) {
      const t = lithiumTracer(id, 0.5);
      for (let k = 0; k <= 200; k++) {
        const [x, y] = lithiumPath(t.electronPath, k / 200);
        if (Math.abs(x) < 0.12) expect(y).toBeGreaterThan(1.25);
      }
    }
  });
  it('routes ions through modeled pores and contains meaningful physical bounds', () => {
    const g = lithiumGeometry();
    for (let id = 0; id < 18; id++) {
      const m = lithiumTracer(id, 0.5);
      const channel = m.ionPath[2];
      expect(
        g.pores.some(
          (p) => Math.hypot(channel[1] - p.center[1], channel[2] - p.center[2]) + 0.068 < p.radius,
        ),
      ).toBe(true);
      for (const point of [...m.ionPath, ...m.electronPath])
        for (let k = 0; k < 3; k++) {
          expect(point[k]).toBeGreaterThanOrEqual(Math.min(...g.bounds.map((p) => p[k])));
          expect(point[k]).toBeLessThanOrEqual(Math.max(...g.bounds.map((p) => p[k])));
        }
    }
  });
  it('reconstructs direct seeking and rejects invalid or unbounded work', () => {
    const states = Array.from({ length: 168 }, (_, i) =>
      lithiumShot(Math.floor(i / 21), (i % 21) / 20),
    );
    for (let i = 167; i >= 0; i--)
      expect(lithiumShot(Math.floor(i / 21), (i % 21) / 20)).toEqual(states[i]);
    expect(() => lithiumInitial(NaN)).toThrow();
    expect(() => lithiumAdvance(lithiumInitial(), 3, 5)).toThrow();
    expect(() => lithiumAdvance(lithiumInitial(), 1, 7201)).toThrow();
    expect(() => lithiumProgram(0.5, Array(25).fill({ current: 0, seconds: 0 }))).toThrow();
    expect(LITHIUM_FILM).toHaveLength(8);
  });
});
