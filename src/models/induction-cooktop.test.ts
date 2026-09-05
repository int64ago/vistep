import { describe, it, expect } from 'vitest';
import {
  INDUCTION as G,
  INDUCTION_DEFAULT as D,
  INDUCTION_MATERIALS as M,
  inductionGeometry,
  inductionBounds,
  inductionMutual,
  inductionSkin,
  inductionResponse,
  inductionInstant,
  inductionDepthLoss,
  inductionThermalParameters,
  inductionThermalAdvance,
  inductionThermalRate,
  inductionThermalProgram,
  inductionShot,
} from './induction-cooktop';
const close = (a: number, b: number, tolerance = 1e-9) =>
  expect(Math.abs(a - b)).toBeLessThan(tolerance);
describe('induction cooktop: reciprocal electrical and thermal models', () => {
  it('has a closed primary with a below-plane return and a closed pan loop', () => {
    const g = inductionGeometry();
    expect(g.circuit[0]).toEqual(g.circuit.at(-1));
    expect(g.supply.at(-1)).toEqual(g.spiral[0]);
    expect(g.returnPath[0]).toEqual(g.spiral.at(-1));
    expect(g.returnPath.at(-1)).toEqual(g.terminalB);
    expect(g.loop[0]).toEqual(g.loop.at(-1));
    expect(g.supply.slice(0, -1).every((p) => p[1] < -2 * G.wireRadius)).toBe(true);
    expect((G.outer - G.inner) / G.turns).toBeGreaterThan(2 * G.wireRadius);
    expect(g.panBottom).toBe(G.glassTop);
  });
  it('includes the actual base, source and lifted pan in physical camera-fit bounds', () => {
    for (const lift of [0, 0.015]) {
      const b = inductionBounds(lift),
        g = inductionGeometry(lift),
        min = [0, 1, 2].map((k) => Math.min(...b.map((p) => p[k]))),
        max = [0, 1, 2].map((k) => Math.max(...b.map((p) => p[k])));
      for (const p of [...g.circuit, ...g.loop])
        for (const k of [0, 1, 2]) {
          expect(p[k]).toBeGreaterThanOrEqual(min[k]);
          expect(p[k]).toBeLessThanOrEqual(max[k]);
        }
      expect(max[1]).toBeGreaterThanOrEqual(G.glassTop + lift + G.panHeight);
    }
  });
  it('converges independent mutual-inductance quadrature and weakens with spacing', () => {
    const a = inductionMutual(0),
      b = inductionMutual(0, 2),
      c = inductionMutual(0, 4);
    expect(Math.abs(b - c)).toBeLessThan(Math.abs(a - b));
    expect(Math.abs(a - c) / c).toBeLessThan(0.003);
    expect(inductionMutual(0.015)).toBeLessThan(a);
    expect(a * a).toBeLessThan(G.primaryL * G.secondaryL);
  });
  it('has DC sheet resistance and thick-skin asymptotes in actual units', () => {
    for (const material of ['steel', 'stainless', 'aluminum'] as const) {
      const dc = inductionSkin(material, 0);
      close(dc.resistance, 1 / (M[material].conductivity * G.panThickness));
      const low = inductionSkin(material, 0.001);
      close(low.resistance, dc.resistance, 1e-12);
      const high = inductionSkin(material, 2e6);
      close(high.resistance * M[material].conductivity * high.depth, 1, 0.0003);
      close(inductionSkin(material, 40000).depth / inductionSkin(material, 10000).depth, 0.5);
    }
  });
  it('balances real RMS source power with pan and winding losses for every material', () => {
    for (const material of ['steel', 'stainless', 'aluminum'] as const)
      for (const frequency of [15000, 25000, 60000]) {
        const r = inductionResponse({ ...D, material, frequency });
        close(r.inputPower, r.panPower + r.coilPower, 1e-8);
        expect(r.panPower).toBeGreaterThan(0);
        expect(r.efficiency).toBeLessThan(1);
      }
  });
  it('obeys both instantaneous coupled equations and electromagnetic energy balance', () => {
    const r = inductionResponse(D);
    for (let j = 0; j < 48; j++) {
      const s = inductionInstant(r, (2 * Math.PI * j) / 48);
      close(s.u, G.coilResistance * s.i1 + G.primaryL * s.di1 + r.mutual * s.di2, 1e-9);
      close(0, r.panR * s.i2 + r.secondaryL * s.di2 + r.mutual * s.di1, 1e-8);
      close(s.inputPower, s.panLoss + s.coilLoss + s.storageRate, 1e-7);
      expect(s.stored).toBeGreaterThanOrEqual(-1e-12);
    }
  });
  it('gets the Faraday sign from an independent flux finite difference', () => {
    const r = inductionResponse(D),
      p = 0.8,
      h = 1e-9;
    const a = inductionInstant(r, p - r.omega * h),
      b = inductionInstant(r, p + r.omega * h),
      s = inductionInstant(r, p);
    close(-(b.flux - a.flux) / (2 * h), s.emf, 1e-6);
  });
  it('integrates depth-resolved Joule loss back to circuit pan power', () => {
    for (const material of ['steel', 'stainless', 'aluminum'] as const) {
      const r = inductionResponse({ ...D, material }),
        n = 4000,
        dz = G.panThickness / n;
      let q = 0;
      for (let j = 0; j < n; j++) q += inductionDepthLoss(r, (j + 0.5) * dz) * dz;
      const integral = q * 2 * Math.PI * G.loopRadius * G.loopWidth;
      expect(Math.abs(integral - r.panPower) / r.panPower).toBeLessThan(5e-6);
    }
  });
  it('handles zero drive, zero coupling, DC and quadratic power scaling', () => {
    expect(inductionResponse({ ...D, current: 0 }).panPower).toBe(0);
    expect(inductionResponse(D, 0).panPower).toBe(0);
    expect(inductionResponse({ ...D, frequency: 0 }).panPower).toBe(0);
    close(
      inductionResponse({ ...D, current: D.current * 2 }).panPower,
      inductionResponse(D).panPower * 4,
    );
    const off = inductionInstant(inductionResponse(D), 0.7, false);
    expect(Object.values(off).every((v) => v === 0)).toBe(true);
  });
  it('has exact two-node thermal conservation and initial glass lag', () => {
    const s = { pan: 20, glass: 20 },
      p = inductionThermalParameters(D),
      rate = inductionThermalRate(D, s, 140);
    close(rate.panRate, 140 / p.panCapacity);
    expect(rate.glassRate).toBe(0);
    for (const state of [s, { pan: 80, glass: 30 }, { pan: 35, glass: 50 }]) {
      const z = inductionThermalRate(D, state, 140);
      close(z.storageRate + z.panAmbient + z.glassAmbient, 140);
    }
  });
  it('matches the closed-form thermal advance to independent RK4 and heat-loss quadrature', () => {
    let y = { pan: 20, glass: 20 },
      loss = 0;
    const dt = 0.01,
      power = 140,
      derivative = (s: typeof y) => {
        const p = inductionThermalParameters(D);
        return {
          pan:
            (power - p.contact * (s.pan - s.glass) - p.panAmbient * (s.pan - 20)) / p.panCapacity,
          glass:
            (p.contact * (s.pan - s.glass) - p.glassAmbient * (s.glass - 20)) / p.glassCapacity,
        };
      },
      plus = (s: typeof y, d: typeof y, h: number) => ({
        pan: s.pan + h * d.pan,
        glass: s.glass + h * d.glass,
      });
    for (let j = 0; j < 18000; j++) {
      const old = y,
        a = derivative(y),
        b = derivative(plus(y, a, dt / 2)),
        c = derivative(plus(y, b, dt / 2)),
        d = derivative(plus(y, c, dt));
      y = {
        pan: y.pan + (dt * (a.pan + 2 * b.pan + 2 * c.pan + d.pan)) / 6,
        glass: y.glass + (dt * (a.glass + 2 * b.glass + 2 * c.glass + d.glass)) / 6,
      };
      loss +=
        dt *
        (G.panAmbient * ((old.pan + y.pan) / 2 - 20) +
          G.glassAmbient * ((old.glass + y.glass) / 2 - 20));
    }
    const exact = inductionThermalAdvance(D, { pan: 20, glass: 20 }, power, 180),
      p = inductionThermalParameters(D);
    close(exact.pan, y.pan, 1e-8);
    close(exact.glass, y.glass, 1e-8);
    close(
      power * 180,
      p.panCapacity * (y.pan - 20) + p.glassCapacity * (y.glass - 20) + loss,
      1e-4,
    );
  });
  it('cools total energy after switch-off even when the glass initially warms', () => {
    const r = inductionResponse(D),
      warm = inductionThermalProgram(D, 180, r);
    expect(inductionThermalRate(D, warm, 0).glassRate).toBeGreaterThan(0);
    let previous = Infinity;
    for (let time = 0; time <= 600; time += 10) {
      const s = inductionThermalAdvance(D, warm, 0, time),
        e = inductionThermalRate(D, s, 0).energy;
      expect(e).toBeLessThan(previous);
      previous = e;
      expect(s.pan).toBeGreaterThanOrEqual(20);
      expect(s.glass).toBeGreaterThanOrEqual(20);
    }
  });
  it('reconstructs burst duty exactly, with lower temperature and input energy', () => {
    const input = { ...D, duty: 0.35 },
      r = inductionResponse(input),
      t = inductionThermalProgram(input, 24, r),
      full = inductionThermalProgram(D, 24);
    close(t.onTime, 8.4);
    close(t.inputEnergy, r.panPower * 8.4);
    expect(t.pan).toBeLessThan(full.pan);
    const a = inductionThermalAdvance(D, { pan: 31, glass: 24 }, 100, 17),
      b = inductionThermalAdvance(
        D,
        inductionThermalAdvance(D, { pan: 31, glass: 24 }, 100, 8),
        100,
        9,
      );
    close(a.pan, b.pan);
    close(a.glass, b.glass);
  });
  it('bounds work and rejects nonfinite or active material inputs', () => {
    expect(inductionGeometry(0, 10000).spiral).toHaveLength(769);
    expect(() => inductionResponse({ ...D, duty: 2 })).toThrow();
    expect(() => inductionThermalProgram(D, 601)).toThrow();
    expect(() => inductionSkin('steel', -1)).toThrow();
    expect(() => inductionInstant(inductionResponse(D), Infinity)).toThrow();
    expect(() => inductionResponse(D, 0.001)).toThrow();
  });
  it('reconstructs 168 nonsequential chapter states without frame history', () => {
    const states = Array.from({ length: 168 }, (_, i) =>
      inductionShot(Math.floor(i / 21), (i % 21) / 20),
    );
    for (let i = 167; i >= 0; i--) {
      const s = inductionShot(Math.floor(i / 21), (i % 21) / 20);
      expect(s).toEqual(states[i]);
      expect(Object.values(s.instant).every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(s.thermal.pan + s.thermal.glass)).toBe(true);
    }
  });
});
