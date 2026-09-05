import { describe, expect, it } from 'vitest';
import {
  BUCK_LOSSES,
  buckCoilPoints,
  buckDefaults,
  buckInstant,
  buckLoadStep,
  buckRoutePoint,
  buckSample,
  buckShot,
  buckStatistics,
  buckSteady,
} from './buck-converter';

describe('switched asynchronous buck', () => {
  it('recovers D·Vin only as the ideal CCM periodic solution, with volt-second and charge balance', () => {
    for (const duty of [0.3, 0.45, 0.6]) {
      const p = { ...buckDefaults(), duty },
        tr = buckSteady(p),
        q = buckStatistics(tr);
      expect(q.currentMin).toBeGreaterThan(0);
      expect(q.meanVoltage).toBeCloseTo(duty * p.vin, 7);
      expect(Math.abs(q.positiveVoltSeconds + q.negativeVoltSeconds)).toBeLessThan(1e-12);
      expect(Math.abs(q.positiveCharge + q.negativeCharge)).toBeLessThan(1e-12);
      expect(q.positiveCharge).toBeGreaterThan(0);
      expect(q.negativeCharge).toBeLessThan(0);
    }
  });
  it('uses the switched differential equations, KCL, and instantaneous energy identity', () => {
    const p = { ...buckDefaults(), nonideal: true },
      tr = buckSteady(p);
    for (const phase of [0.1, 0.44, 0.46, 0.8]) {
      const { state: s, mode } = buckSample(tr, phase * tr.duration);
      expect(s.ic + s.vo / p.resistance).toBeCloseTo(s.i, 12);
      expect(s.sw - BUCK_LOSSES.inductorR * s.i - s.vo).toBeCloseTo(p.inductance * s.di, 12);
      expect(s.vc + BUCK_LOSSES.capacitorR * s.ic).toBeCloseTo(s.vo, 12);
      expect(s.sourcePower - s.loadPower - s.loss).toBeCloseTo(s.storageRate, 12);
      if (mode === 'on') {
        expect(s.di).toBeGreaterThan(0);
        expect(s.diodeCurrent).toBe(0);
      } else {
        expect(s.di).toBeLessThan(0);
        expect(s.sourceCurrent).toBe(0);
      }
    }
  });
  it('preserves both storage states at every gate transition', () => {
    const tr = buckLoadStep({ ...buckDefaults(), nonideal: true, resistance: 8 });
    let edges = 0;
    tr.points.forEach((p, i) => {
      const before = tr.points[i - 1];
      if (before && Math.abs(before.time - p.time) < 1e-14 && before.mode !== p.mode) {
        expect(p.y[0]).toBe(before.y[0]);
        expect(p.y[1]).toBe(before.y[1]);
        edges++;
      }
    });
    expect(edges).toBeGreaterThan(40);
  });
  it('locates diode cutoff within a step and never evolves negative diode current', () => {
    const tr = buckSteady({ ...buckDefaults(), resistance: 40, nonideal: true }),
      q = buckStatistics(tr);
    expect(q.idleFraction).toBeGreaterThan(0.3);
    expect(q.currentMin).toBe(0);
    const idle = tr.points.find((p) => p.mode === 'idle')!;
    const before = tr.points[tr.points.indexOf(idle) - 1];
    expect(before.mode).toBe('diode');
    expect(before.time).toBe(idle.time);
    expect(before.y[0]).toBe(0);
    expect(
      Math.abs(
        idle.time * tr.parameters.frequency * tr.steps -
          Math.round(idle.time * tr.parameters.frequency * tr.steps),
      ),
    ).toBeGreaterThan(0.01);
    for (const point of tr.points) {
      const s = buckInstant(tr.parameters, point.y, point.mode);
      expect(s.diodeCurrent).toBeGreaterThanOrEqual(0);
      if (point.mode === 'idle') {
        expect(s.i).toBe(0);
        expect(s.di).toBe(0);
        expect(s.diodeCurrent).toBe(0);
        expect(s.dvc).toBeLessThan(0);
        expect(s.sw).toBeGreaterThan(0);
      }
    }
  });
  it('does not impose the CCM conversion ratio in discontinuous operation', () => {
    const p = { ...buckDefaults(), resistance: 40, nonideal: true },
      q = buckStatistics(buckSteady(p));
    expect(q.meanVoltage).toBeGreaterThan(p.duty * p.vin + 2);
    expect(q.meanVoltage).toBeLessThan(p.vin);
  });
  it('accounts for source, load, four conduction losses and storage change over a cycle', () => {
    const tr = buckSteady({ ...buckDefaults(), nonideal: true }),
      q = buckStatistics(tr);
    expect(Math.abs(q.closure)).toBeLessThan(2e-12);
    expect(Math.abs(q.storageChange)).toBeLessThan(1e-12);
    for (const value of [q.switchEnergy, q.diodeEnergy, q.inductorEnergy, q.capacitorEnergy])
      expect(value).toBeGreaterThan(0);
    expect(q.efficiency).toBeGreaterThan(0.8);
    expect(q.efficiency).toBeLessThan(1);
    expect(q.meanVoltage).toBeLessThan(5.4);
    const ideal = buckStatistics(buckSteady());
    expect(ideal.lossEnergy).toBe(0);
    expect(ideal.efficiency).toBeCloseTo(1, 8);
  });
  it('conserves energy during the load transient, including nonzero stored-energy change', () => {
    const tr = buckLoadStep({ ...buckDefaults(), nonideal: true, resistance: 8 }),
      q = buckStatistics(tr);
    expect(Math.abs(q.closure)).toBeLessThan(1e-11);
    expect(Math.abs(q.storageChange)).toBeGreaterThan(1e-5);
    expect(q.voltageMin).toBeLessThan(4.1);
    const before = tr.points.findLast(
      (p) => p.time <= tr.loadStepAt! + 1e-15 && p.resistance === 8,
    )!;
    const after = tr.points.find((p) => p.resistance === 3)!;
    expect(before.y[0]).toBe(after.y[0]);
    expect(before.y[1]).toBe(after.y[1]);
    const s0 = buckInstant({ ...tr.parameters, resistance: 8 }, before.y, before.mode);
    const s1 = buckInstant({ ...tr.parameters, resistance: 3 }, after.y, after.mode);
    expect(s1.vo).toBeLessThan(s0.vo);
    expect(s1.ic).toBeLessThan(s0.ic);
    expect(s1.vo - s0.vo).toBeCloseTo(BUCK_LOSSES.capacitorR * (s1.ic - s0.ic), 12);
  });
  it('reduces output ripple by increasing actual capacitance', () => {
    const small = buckStatistics(buckSteady({ ...buckDefaults(), capacitance: 47e-6 }));
    const large = buckStatistics(buckSteady({ ...buckDefaults(), capacitance: 220e-6 }));
    expect(small.ripple / large.ripple).toBeGreaterThan(4.5);
    expect(small.ripple / large.ripple).toBeLessThan(5);
    expect(large.meanVoltage).toBeCloseTo(small.meanVoltage, 7);
  });
  it('converges under time-step refinement in CCM, DCM, and the load transient', () => {
    const cases = [
      (n: number) => buckSteady({ ...buckDefaults(), nonideal: true }, n),
      (n: number) => buckSteady({ ...buckDefaults(), resistance: 40, nonideal: true }, n),
      (n: number) => buckLoadStep({ ...buckDefaults(), resistance: 8, nonideal: true }, 3, n),
    ];
    for (const make of cases) {
      const reference = make(1024),
        at = reference.duration * 0.371;
      const truth = buckSample(reference, at).y;
      const errors = [64, 128, 256].map((n) => {
        const s = buckSample(make(n), at).y;
        return Math.hypot(s[0] - truth[0], s[1] - truth[1]);
      });
      expect(errors[1]).toBeLessThan(errors[0]);
      expect(errors[2]).toBeLessThan(errors[1]);
      expect(errors[2]).toBeLessThan(2e-5);
    }
  });
  it('resolves all 64 corners of the exposed steady-state domain without active gain', () => {
    for (const duty of [0.2, 0.7])
      for (const inductance of [75e-6, 300e-6])
        for (const capacitance of [22e-6, 220e-6])
          for (const resistance of [2, 60])
            for (const frequency of [10_000, 40_000])
              for (const nonideal of [false, true]) {
                const p = {
                    ...buckDefaults(),
                    duty,
                    inductance,
                    capacitance,
                    resistance,
                    frequency,
                    nonideal,
                  },
                  tr = buckSteady(p),
                  q = buckStatistics(tr);
                expect(tr.settled).toBe(true);
                expect(tr.warmCycles).toBeLessThan(100);
                expect(q.currentMin).toBeGreaterThanOrEqual(0);
                expect(q.efficiency).toBeLessThanOrEqual(1 + 1e-7);
                expect(q.voltageMin).toBeGreaterThan(0);
                expect(q.meanVoltage).toBeLessThan(p.vin);
                expect(Math.abs(q.closure) / q.inputEnergy).toBeLessThan(1e-7);
                expect(tr.points.every((p) => p.y.every(Number.isFinite))).toBe(true);
              }
  });
  it('resolves all 32 load-step corners without reverse diode current', () => {
    for (const duty of [0.2, 0.7])
      for (const inductance of [75e-6, 300e-6])
        for (const capacitance of [22e-6, 220e-6])
          for (const frequency of [10_000, 40_000])
            for (const nonideal of [false, true]) {
              const tr = buckLoadStep({
                  ...buckDefaults(),
                  resistance: 8,
                  duty,
                  inductance,
                  capacitance,
                  frequency,
                  nonideal,
                }),
                q = buckStatistics(tr);
              expect(q.currentMin).toBeGreaterThanOrEqual(0);
              expect(q.voltageMin).toBeGreaterThan(0);
              expect(Math.abs(q.closure) / q.inputEnergy).toBeLessThan(1e-7);
            }
  });
  it('reconstructs every chapter from chapter/progress without playback history', () => {
    const stops = Array.from({ length: 8 }, (_, chapter) =>
      [0, 0.27, 0.62, 1].map((progress) => ({
        chapter,
        progress,
        shot: buckShot(chapter, progress),
      })),
    ).flat();
    for (const stop of stops.toReversed())
      expect(buckShot(stop.chapter, stop.progress)).toEqual(stop.shot);
    expect(buckShot(1, 1).sample.state.i).toBeCloseTo(buckShot(2, 0).sample.state.i, 6);
  });
  it('ties the single guide to integrated energy and the same continuous coil geometry', () => {
    const trace = buckSteady();
    const a = buckSample(trace, 0.1 * trace.duration),
      b = buckSample(trace, 0.3 * trace.duration);
    expect(a.mode).toBe('on');
    expect(b.mode).toBe('on');
    expect(b.packetProgress).toBeGreaterThan(a.packetProgress);
    const coil = buckCoilPoints(122, 202, 82);
    expect(coil[0]).toEqual([122, 82]);
    expect(coil.at(-1)).toEqual([202, 82]);
    expect(coil.every((p) => p[0] >= 122 && p[0] <= 202 && p[1] >= 58 && p[1] <= 82)).toBe(true);
    expect(buckRoutePoint(coil, 0)).toEqual(coil[0]);
    expect(buckRoutePoint(coil, 1)[0]).toBeCloseTo(202, 10);
  });
  it('rejects invalid or numerically unresolved inputs', () => {
    expect(() => buckSteady({ ...buckDefaults(), duty: 1 })).toThrow(RangeError);
    expect(() => buckSteady({ ...buckDefaults(), capacitance: 0 })).toThrow(RangeError);
    expect(() => buckSteady({ ...buckDefaults(), vin: NaN })).toThrow(RangeError);
    expect(() => buckSteady({ ...buckDefaults(), capacitance: 1e-12 })).toThrow(RangeError);
    expect(() => buckSteady(buckDefaults(), 4)).toThrow(RangeError);
  });
});
