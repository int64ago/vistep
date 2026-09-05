import { describe, expect, it } from 'vitest';
import {
  RECTIFIER_EDGES,
  rectifierDefaults,
  rectifierLoop,
  rectifierManualDefaults,
  rectifierReset,
  rectifierSample,
  rectifierShot,
  rectifierState,
  rectifierStatistics,
  rectifierTrace,
  type RectifierParameters,
} from './rectifier';

describe('single-phase bridge with continuous capacitor storage', () => {
  it('selects the correct two diodes, with a common positive-to-negative load path', () => {
    const p = { ...rectifierDefaults(), capacitor: false };
    for (const phase of [0.1, 0.25, 0.4, 0.6, 0.75, 0.9]) {
      const s = rectifierState(p, phase / p.frequency, 0);
      const pair = Object.entries(s.diodes)
        .filter(([, current]) => current > 0)
        .map(([id]) => id)
        .sort();
      expect(pair).toEqual(phase < 0.5 ? ['D1', 'D4'] : ['D2', 'D3']);
      expect(s.output).toBeGreaterThan(0);
      expect(s.loadCurrent).toBeGreaterThan(0);
      const loop = rectifierLoop(s.mode);
      expect(loop[0]).toBe(loop.at(-1));
      expect(loop.slice(1, 3)).toEqual(['P', 'N']);
      expect(RECTIFIER_EDGES[pair[0] as keyof typeof RECTIFIER_EDGES]).toEqual([loop[0], 'P']);
      expect(RECTIFIER_EDGES[pair[1] as keyof typeof RECTIFIER_EDGES]).toEqual(['N', loop[3]]);
    }
  });
  it('recovers the unfiltered algebraic solution and twice-line-frequency symmetry', () => {
    const p = { ...rectifierDefaults(), capacitor: false, diodeDrop: 0, diodeResistance: 0 };
    const tr = rectifierTrace(p),
      q = rectifierStatistics(tr);
    expect(q.meanOutput).toBeCloseTo(
      (((2 * p.peak) / Math.PI) * p.load) / (p.load + p.sourceResistance),
      7,
    );
    for (const phase of [0.03, 0.19, 0.31, 0.47]) {
      const a = rectifierSample(tr, phase * tr.duration).state,
        b = rectifierSample(tr, (phase + 0.5) * tr.duration).state;
      expect(a.source).toBeCloseTo(-b.source, 10);
      expect(a.output).toBeCloseTo(b.output, 10);
    }
  });
  it('conducts only above the capacitor plus two diode drops, never with negative diode current', () => {
    const tr = rectifierTrace();
    for (const point of tr.points) {
      const s = rectifierState(tr.parameters, point.time, point.y[0]);
      expect(Object.values(s.diodes).every((i) => i >= 0)).toBe(true);
      if (s.bridgeCurrent > 1e-9) {
        expect(Math.abs(s.source)).toBeGreaterThan(s.threshold);
        expect(Math.abs(s.source) - s.threshold).toBeCloseTo(
          (tr.parameters.sourceResistance + 2 * tr.parameters.diodeResistance) * s.bridgeCurrent,
          10,
        );
        expect(Object.values(s.diodes).filter((i) => i > 0)).toHaveLength(2);
      } else expect(Math.abs(s.source)).toBeLessThanOrEqual(s.threshold + 1e-8);
    }
    expect(rectifierStatistics(tr).conductionFraction).toBeGreaterThan(0.25);
    expect(rectifierStatistics(tr).conductionFraction).toBeLessThan(0.31);
  });
  it('locates four non-grid conduction events per AC cycle without charge teleportation', () => {
    const tr = rectifierTrace();
    expect(tr.events).toHaveLength(4);
    expect(tr.events.map((e) => e.conducting)).toEqual([true, false, true, false]);
    for (const event of tr.events) {
      const s = rectifierState(tr.parameters, event.time, event.voltage);
      expect(Math.abs(Math.abs(s.source) - s.threshold)).toBeLessThan(1e-9);
      const before = rectifierSample(tr, event.time - 1e-9),
        after = rectifierSample(tr, event.time + 1e-9);
      expect(Math.abs(before.state.output - after.state.output)).toBeLessThan(1e-5);
      expect(
        Math.abs(
          event.time * tr.parameters.frequency * tr.steps -
            Math.round(event.time * tr.parameters.frequency * tr.steps),
        ),
      ).toBeGreaterThan(1e-3);
    }
  });
  it('uses the exact RC discharge law while every bridge diode blocks', () => {
    const tr = rectifierTrace(),
      off = tr.events[1],
      on = tr.events[2];
    const t = off.time + 0.37 * (on.time - off.time),
      s = rectifierSample(tr, t).state;
    expect(s.mode).toBe('blocked');
    expect(s.bridgeCurrent).toBe(0);
    expect(s.output).toBeCloseTo(
      off.voltage * Math.exp(-(t - off.time) / (tr.parameters.load * tr.parameters.capacitance)),
      10,
    );
    expect(s.capacitorCurrent).toBeCloseTo(-s.loadCurrent, 12);
  });
  it('obeys instantaneous KCL and passive energy balance in every mode', () => {
    for (const capacitor of [false, true]) {
      const p = { ...rectifierDefaults(), capacitor },
        tr = rectifierTrace(p, true);
      for (const fraction of [0, 0.03, 0.1, 0.25, 0.42, 0.83, 1]) {
        const s = rectifierSample(tr, fraction * tr.duration).state;
        expect(s.bridgeCurrent).toBeCloseTo(s.loadCurrent + s.capacitorCurrent, 12);
        expect(s.inputPower - s.loadPower - s.diodePower - s.resistancePower).toBeCloseTo(
          s.storagePower,
          10,
        );
        for (const value of [s.diodePower, s.resistancePower, s.loadPower, s.inputPower])
          expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('closes both charge and energy ledgers in periodic and startup operation', () => {
    for (const startup of [false, true]) {
      const tr = rectifierTrace(rectifierDefaults(), startup),
        q = rectifierStatistics(tr);
      expect(Math.abs(q.energyResidual)).toBeLessThan(1e-9);
      expect(Math.abs(q.chargeResidual)).toBeLessThan(1e-10);
      expect(q.inputEnergy).toBeGreaterThan(q.loadEnergy);
      if (!startup) {
        expect(Math.abs(q.storageChange)).toBeLessThan(1e-11);
        expect(q.positiveCharge + q.negativeCharge).toBeCloseTo(0, 7);
      } else {
        expect(tr.points[0].y[0]).toBe(0);
        expect(q.storageChange).toBeGreaterThan(0.04);
        expect(q.sourceCharge).toBeGreaterThan(q.loadCharge);
      }
    }
  });
  it('agrees with an independent fine-step RK4 integration of the clamped-current ODE', () => {
    const p = rectifierDefaults(),
      tr = rectifierTrace(p, true),
      n = 120_000,
      dt = tr.duration / n;
    const f = (time: number, voltage: number) =>
      (Math.max(
        0,
        (Math.abs(p.peak * Math.sin(2 * Math.PI * p.frequency * time)) -
          2 * p.diodeDrop -
          voltage) /
          (p.sourceResistance + 2 * p.diodeResistance),
      ) -
        voltage / p.load) /
      p.capacitance;
    let v = 0;
    for (let i = 0; i < n; i++) {
      const t = i * dt,
        a = f(t, v),
        b = f(t + dt / 2, v + (dt * a) / 2),
        c = f(t + dt / 2, v + (dt * b) / 2),
        d = f(t + dt, v + dt * c);
      v += (dt * (a + 2 * b + 2 * c + d)) / 6;
    }
    expect(v).toBeCloseTo(tr.points.at(-1)!.y[0], 7);
  });
  it('keeps exact propagated voltage stable and refines the numerical energy quadrature', () => {
    const traces = [128, 256, 512, 1024].map((n) => rectifierTrace(rectifierDefaults(), true, n));
    const reference = rectifierSample(traces[3], traces[3].duration * 0.371).state.output;
    for (const tr of traces)
      expect(rectifierSample(tr, tr.duration * 0.371).state.output).toBeCloseTo(reference, 8);
    const errors = traces.map((tr) => Math.abs(rectifierStatistics(tr).energyResidual));
    expect(errors[1]).toBeLessThan(errors[0]);
    expect(errors[2]).toBeLessThan(errors[1]);
    expect(errors[3]).toBeLessThan(errors[2]);
  });
  it('reduces ripple with capacitance and frequency, and increases it with load demand', () => {
    const small = rectifierShot(5, 0.2).statistics,
      large = rectifierShot(5, 0.7).statistics;
    expect(small.ripple).toBeGreaterThan(2.5);
    expect(large.ripple).toBeLessThan(0.4);
    const light = rectifierShot(6, 0.1).statistics,
      heavy = rectifierShot(6, 0.5).statistics,
      fast = rectifierShot(6, 0.9).statistics;
    expect(heavy.ripple).toBeGreaterThan(light.ripple * 2.5);
    expect(fast.ripple / heavy.ripple).toBeGreaterThan(0.45);
    expect(fast.ripple / heavy.ripple).toBeLessThan(0.55);
    expect(rectifierShot(6, 0.1).trace.duration).toBe(rectifierShot(6, 0.9).trace.duration);
    expect(rectifierShot(6, 0.9).trace.events).toHaveLength(8);
  });
  it('bounds inrush by source resistance while preserving zero initial capacitor voltage', () => {
    const low = rectifierShot(7, 0),
      high = rectifierShot(7, 0.5);
    for (const sh of [low, high]) {
      const p = sh.sample.parameters;
      expect(sh.sample.state.output).toBe(0);
      expect(sh.statistics.peakCurrent).toBeCloseTo(
        (p.peak - 2 * p.diodeDrop) / (p.sourceResistance + 2 * p.diodeResistance),
        10,
      );
      expect(sh.sample.state.dv).toBeGreaterThan(0);
    }
    expect(high.statistics.peakCurrent).toBeLessThan(low.statistics.peakCurrent / 7);
  });
  it('handles source below diode threshold and an already charged capacitor', () => {
    for (const capacitor of [false, true]) {
      const p = { ...rectifierDefaults(), peak: 1, capacitor },
        q = rectifierStatistics(rectifierTrace(p));
      expect(q.peakCurrent).toBe(0);
      expect(q.max).toBe(0);
      expect(q.inputEnergy).toBe(0);
    }
    const p = { ...rectifierDefaults(), peak: 0 },
      tr = rectifierTrace(p, true, 512, 12);
    expect(rectifierStatistics(tr).peakCurrent).toBe(0);
    expect(tr.points.at(-1)!.y[0]).toBeCloseTo(
      12 * Math.exp(-tr.duration / (p.load * p.capacitance)),
      10,
    );
    expect(Math.abs(rectifierStatistics(tr).energyResidual)).toBeLessThan(1e-10);
  });
  it('remains passive and finite at 64 parameter corners, in steady and startup states', () => {
    for (const peak of [1, 18])
      for (const frequency of [25, 100])
        for (const capacitance of [100e-6, 2200e-6])
          for (const load of [50, 300])
            for (const sourceResistance of [0.5, 8])
              for (const phase of [0, Math.PI / 2])
                for (const startup of [false, true]) {
                  const p: RectifierParameters = {
                      ...rectifierDefaults(),
                      peak,
                      frequency,
                      capacitance,
                      load,
                      sourceResistance,
                      phase,
                    },
                    tr = rectifierTrace(p, startup),
                    q = rectifierStatistics(tr);
                  expect(q.min).toBeGreaterThanOrEqual(-1e-9);
                  expect(q.max).toBeLessThanOrEqual(peak + 1e-9);
                  expect(q.peakCurrent).toBeLessThanOrEqual(
                    Math.max(
                      0,
                      (peak - 2 * p.diodeDrop) / (sourceResistance + 2 * p.diodeResistance),
                    ) + 1e-8,
                  );
                  expect(tr.points.every((p) => p.y.every(Number.isFinite))).toBe(true);
                  if (q.inputEnergy > 0)
                    expect(Math.abs(q.energyResidual) / q.inputEnergy).toBeLessThan(2e-7);
                }
  }, 20_000);
  it('reconstructs chapter seeks independently of traversal history', () => {
    const stops = Array.from({ length: 8 }, (_, c) =>
      [0, 0.23, 0.61, 1].map((u) => ({ c, u, shot: rectifierShot(c, u) })),
    ).flat();
    for (const stop of stops.toReversed()) expect(rectifierShot(stop.c, stop.u)).toEqual(stop.shot);
  });
  it('fully resets all parameters, phase, time, startup and observation without shared references', () => {
    const changed = rectifierManualDefaults();
    Object.assign(changed.parameters, {
      peak: 18,
      frequency: 100,
      capacitance: 2200e-6,
      load: 300,
      sourceResistance: 8,
      phase: Math.PI / 2,
      capacitor: false,
      diodeDrop: 0.2,
      diodeResistance: 0.5,
    });
    changed.time = 0.9;
    changed.startup = true;
    changed.view = 'current';
    const reset = rectifierReset();
    expect(reset).toEqual(rectifierManualDefaults());
    expect(changed.time).toBe(0.9);
    reset.parameters.peak = 3;
    expect(rectifierReset().parameters.peak).toBe(12);
  });
  it('rejects nonpassive or nonfinite numerical inputs', () => {
    expect(() => rectifierTrace({ ...rectifierDefaults(), sourceResistance: 0 })).toThrow(
      RangeError,
    );
    expect(() => rectifierTrace({ ...rectifierDefaults(), capacitance: -1 })).toThrow(RangeError);
    expect(() => rectifierTrace({ ...rectifierDefaults(), diodeDrop: -1 })).toThrow(RangeError);
    expect(() => rectifierTrace({ ...rectifierDefaults(), frequency: NaN })).toThrow(RangeError);
    expect(() => rectifierTrace(rectifierDefaults(), true, 20)).toThrow(RangeError);
    expect(() => rectifierTrace(rectifierDefaults(), true, 512, -1)).toThrow(RangeError);
  });
});
