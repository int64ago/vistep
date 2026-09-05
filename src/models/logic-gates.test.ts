import { describe, expect, it } from 'vitest';
import {
  CMOS_TOPOLOGIES,
  cmosCascade,
  cmosCrossings,
  cmosDefaults,
  cmosLevel,
  cmosManualDefaults,
  cmosManualTrace,
  cmosNetwork,
  cmosReset,
  cmosSample,
  cmosShot,
  cmosTrace,
  type CmosBit,
  type CmosKind,
} from './logic-gates';

describe('CMOS graph and continuous RC state', () => {
  it('derives every inverter/NAND/NOR input combination with exactly one driven rail', () => {
    const p = cmosDefaults();
    for (const kind of ['inverter', 'nand', 'nor'] as const)
      for (const a of [0, 1] as const)
        for (const b of [0, 1] as const) {
          const n = cmosNetwork(kind, p, [a, b], 0.6);
          const expected = kind === 'inverter' ? !a : kind === 'nand' ? !(a && b) : !(a || b);
          expect(n.pullup).toBe(expected);
          expect(n.pulldown).toBe(!expected);
          expect(n.target).toBe(expected ? p.vdd : 0);
          expect(n.devices).toHaveLength(CMOS_TOPOLOGIES[kind].length);
          for (const device of n.devices)
            expect(device.on).toBe(
              device.type === 'p' ? [a, b][device.input] === 0 : [a, b][device.input] === 1,
            );
        }
  });
  it('calculates series and parallel resistances from the resistor graph', () => {
    const p = { ...cmosDefaults(), resistanceP: 7000, resistanceN: 4000 };
    expect(cmosNetwork('nand', p, [0, 0]).resistance).toBeCloseTo(3500, 9);
    expect(cmosNetwork('nand', p, [1, 0]).resistance).toBeCloseTo(7000, 9);
    expect(cmosNetwork('nand', p, [1, 1]).resistance).toBeCloseTo(8000, 9);
    expect(cmosNetwork('nor', p, [0, 0]).resistance).toBeCloseTo(14000, 9);
    expect(cmosNetwork('nor', p, [0, 1]).resistance).toBeCloseTo(4000, 9);
    expect(cmosNetwork('nor', p, [1, 1]).resistance).toBeCloseTo(2000, 9);
  });
  it('obeys internal-node KCL and preserves truly floating nodes', () => {
    const p = cmosDefaults(),
      n = cmosNetwork('nand', p, [1, 1], 0.8),
      r = cmosNetwork('nor', p, [0, 0], 0.4);
    expect(n.nodes.N1).toBeCloseTo(0.4, 12);
    expect(r.nodes.P1).toBeCloseTo(0.8, 12);
    expect(n.devices.find((d) => d.id === 'nA')!.current).toBeCloseTo(
      n.devices.find((d) => d.id === 'nB')!.current,
      12,
    );
    expect(cmosNetwork('nand', p, [0, 0]).nodes.N1).toBeNull();
    expect(cmosNetwork('nor', p, [1, 1]).nodes.P1).toBeNull();
    expect(cmosNetwork('nand', p, [1, 0], 0.8).nodes.N1).toBeCloseTo(0.8, 12);
  });
  it('separates gate target, analog voltage and the unknown logic interval', () => {
    const p = cmosDefaults(),
      tr = cmosTrace('inverter', p, 0, [{ at: 0, inputs: [0, 0] }], 1e-9);
    const initial = cmosSample(tr, 0);
    expect(initial.voltage).toBe(0);
    expect(initial.level).toBe('0');
    expect(initial.targetLevel).toBe('1');
    const mid = cmosSample(tr, 100e-12);
    expect(mid.voltage).toBeCloseTo(p.vdd * (1 - Math.exp(-1)), 12);
    expect(mid.level).toBe('X');
    expect(cmosLevel(0.3 * p.vdd, p.vdd)).toBe('0');
    expect(cmosLevel(0.7 * p.vdd, p.vdd)).toBe('1');
    expect(cmosLevel(0.5 * p.vdd, p.vdd)).toBe('X');
  });
  it('has the analytic RC limits and half-voltage delay', () => {
    const p = cmosDefaults(),
      tau = p.capacitance * p.resistanceN;
    const rise = cmosTrace('inverter', p, 0, [{ at: 0, inputs: [0, 0] }], 100 * tau),
      fall = cmosTrace('inverter', p, p.vdd, [{ at: 0, inputs: [1, 0] }], 100 * tau);
    expect(cmosSample(rise, tau).voltage).toBeCloseTo(p.vdd * (1 - Math.exp(-1)), 12);
    expect(cmosSample(fall, tau).voltage).toBeCloseTo(p.vdd * Math.exp(-1), 12);
    expect(cmosCrossings(rise)[0].at / tau).toBeCloseTo(Math.log(2), 12);
    expect(cmosCrossings(fall)[0].at / tau).toBeCloseTo(Math.log(2), 12);
    expect(cmosSample(rise, rise.duration).voltage).toBe(p.vdd);
    expect(cmosSample(fall, fall.duration).voltage).toBeLessThan(1e-40);
  });
  it('never teleports capacitor charge at multiple simultaneous input events', () => {
    const p = cmosDefaults();
    const tr = cmosTrace(
      'nand',
      p,
      p.vdd,
      [
        { at: 0, inputs: [0, 0] },
        { at: 100e-12, inputs: [1, 1] },
        { at: 210e-12, inputs: [0, 1] },
      ],
      1e-9,
    );
    for (let i = 1; i < tr.segments.length; i++) {
      const prev = tr.segments[i - 1],
        next = tr.segments[i];
      const end =
        prev.target +
        (prev.initial - prev.target) *
          Math.exp(-(prev.end - prev.start) / (prev.resistance * p.capacitance));
      expect(next.initial).toBe(end);
      expect(cmosSample(tr, next.start).charge).toBeCloseTo(p.capacitance * end, 26);
    }
  });
  it('closes instantaneous energy balance for every topology and input', () => {
    const p = cmosDefaults();
    for (const kind of ['inverter', 'nand', 'nor'] as const)
      for (const a of [0, 1] as const)
        for (const b of [0, 1] as const)
          for (const voltage of [0, 0.3, 0.7, 1.2]) {
            const s = cmosNetwork(kind, p, [a, b], voltage);
            expect(s.sourcePower - s.heatPower).toBeCloseTo(s.storagePower, 14);
            expect(s.heatPower).toBeGreaterThanOrEqual(0);
            expect(s.sourceCurrent).toBeGreaterThanOrEqual(0);
            expect(s.devices.filter((d) => !d.on).every((d) => d.current === 0)).toBe(true);
          }
  });
  it('draws no permanent DC current in this ideal steady CMOS model', () => {
    const p = cmosDefaults();
    for (const kind of ['inverter', 'nand', 'nor'] as const)
      for (const a of [0, 1] as const)
        for (const b of [0, 1] as const) {
          const target = cmosNetwork(kind, p, [a, b]).target,
            tr = cmosTrace(kind, p, target, [{ at: 0, inputs: [a, b] }], 1);
          const s = cmosSample(tr, 1);
          expect(s.network.current).toBe(0);
          expect(s.network.sourceCurrent).toBe(0);
          expect(s.heatEnergy).toBe(0);
          expect(s.sourceEnergy).toBe(0);
        }
  });
  it('accounts for CV² supply energy and half-CV² charging heat/storage', () => {
    const p = cmosDefaults(),
      tau = p.capacitance * p.resistanceP,
      e = p.capacitance * p.vdd ** 2;
    const tr = cmosTrace(
      'inverter',
      p,
      0,
      [
        { at: 0, inputs: [0, 0] },
        { at: 40 * tau, inputs: [1, 0] },
      ],
      80 * tau,
    );
    const charged = cmosSample(tr, 40 * tau),
      complete = cmosSample(tr, 80 * tau);
    expect(charged.sourceEnergy / e).toBeCloseTo(1, 12);
    expect(charged.energy / e).toBeCloseTo(0.5, 12);
    expect(charged.heatEnergy / e).toBeCloseTo(0.5, 12);
    expect(complete.heatEnergy / e).toBeCloseTo(1, 12);
    expect(complete.energy / e).toBeLessThan(1e-30);
    expect(Math.abs(complete.energyResidual)).toBeLessThan(1e-27);
    expect(Math.abs(complete.transferredCharge - p.capacitance * complete.voltage)).toBeLessThan(
      1e-28,
    );
  });
  it('scales delay with R and C, and switching energy with C and VDD squared', () => {
    const p = cmosDefaults();
    const make = (scaleR: number, scaleC: number, scaleV: number) =>
      cmosTrace(
        'inverter',
        {
          ...p,
          resistanceP: p.resistanceP * scaleR,
          capacitance: p.capacitance * scaleC,
          vdd: p.vdd * scaleV,
        },
        0,
        [{ at: 0, inputs: [0, 0] }],
        100e-9,
      );
    const base = make(1, 1, 1),
      changed = make(2, 3, 2);
    expect(cmosCrossings(changed)[0].at / cmosCrossings(base)[0].at).toBeCloseTo(6, 12);
    expect(
      cmosSample(changed, changed.duration).sourceEnergy /
        cmosSample(base, base.duration).sourceEnergy,
    ).toBeCloseTo(12, 12);
  });
  it('propagates a real voltage crossing through two physically represented stages', () => {
    const p = cmosDefaults(),
      first = cmosTrace('inverter', p, p.vdd, [{ at: 0, inputs: [1, 0] }], 1e-9),
      second = cmosCascade(first);
    const crossing = cmosCrossings(first)[0].at;
    expect(second.events[1].at).toBe(crossing);
    expect(cmosSample(second, crossing * 0.99).voltage).toBe(0);
    expect(cmosSample(second, crossing).voltage).toBe(0);
    expect(cmosCrossings(second)[0].at / crossing).toBeCloseTo(2, 12);
    expect(cmosSample(first, crossing).level).toBe('X');
    expect(cmosSample(second, crossing * 1.1).voltage).toBeGreaterThan(0);
  });
  it('does not invent a cascade event for a pulse too short to cross the model boundary', () => {
    const p = cmosDefaults(),
      tr = cmosTrace(
        'inverter',
        p,
        p.vdd,
        [
          { at: 0, inputs: [1, 0] },
          { at: 20e-12, inputs: [0, 0] },
        ],
        1e-9,
      );
    expect(cmosCrossings(tr)).toEqual([]);
    const second = cmosCascade(tr);
    expect(second.events).toHaveLength(1);
    expect(cmosSample(second, second.duration).voltage).toBe(0);
  });
  it('keeps all exposed parameter corners finite and passive', () => {
    for (const vdd of [0.8, 1.8])
      for (const capacitance of [5e-15, 80e-15])
        for (const resistance of [2000, 20000])
          for (const kind of ['inverter', 'nand', 'nor'] as const)
            for (const a of [0, 1] as const)
              for (const b of [0, 1] as const) {
                const p = { vdd, capacitance, resistanceP: resistance, resistanceN: resistance },
                  tr = cmosTrace(kind, p, 0.5 * vdd, [{ at: 0, inputs: [a, b] }], 1.2e-9);
                for (const time of [0, 0.1e-9, 1.2e-9]) {
                  const s = cmosSample(tr, time);
                  expect(s.voltage).toBeGreaterThanOrEqual(0);
                  expect(s.voltage).toBeLessThanOrEqual(vdd);
                  expect(Number.isFinite(s.network.resistance)).toBe(true);
                  expect(s.heatEnergy).toBeGreaterThanOrEqual(0);
                  expect(Math.abs(s.energyResidual)).toBeLessThan(1e-27);
                }
              }
  });
  it('reconstructs all eight chapters from progress without traversal history', () => {
    const stops = Array.from({ length: 8 }, (_, c) =>
      [0, 0.23, 0.64, 1].map((u) => ({ c, u, shot: cmosShot(c, u) })),
    ).flat();
    for (const stop of stops.toReversed()) expect(cmosShot(stop.c, stop.u)).toEqual(stop.shot);
  });
  it('resets every manual input, topology, parameter, time and cascade setting', () => {
    const s = cmosManualDefaults();
    s.kind = 'nor';
    s.before = [1, 1];
    s.after = [0, 1];
    s.parameters = { vdd: 1.8, capacitance: 80e-15, resistanceP: 20000, resistanceN: 20000 };
    s.time = 0.9;
    s.cascade = true;
    expect(cmosReset()).toEqual(cmosManualDefaults());
    expect(s.kind).toBe('nor');
    const fresh = cmosReset();
    fresh.after[0] = 0;
    expect(cmosReset().after).toEqual([1, 0]);
    expect(cmosManualTrace(cmosReset()).initial).toBe(1.2);
  });
  it('rejects invalid voltages, parameters, controls and event schedules', () => {
    const p = cmosDefaults();
    expect(() => cmosNetwork('bad' as CmosKind, p, [0, 0])).toThrow(RangeError);
    expect(() => cmosNetwork('nand', p, [2 as CmosBit, 0])).toThrow(RangeError);
    expect(() => cmosNetwork('inverter', { ...p, capacitance: 0 }, [0, 0])).toThrow(RangeError);
    expect(() => cmosLevel(NaN, p.vdd)).toThrow(RangeError);
    expect(() => cmosLevel(2, p.vdd)).toThrow(RangeError);
    expect(() => cmosTrace('inverter', p, 0, [{ at: 1, inputs: [0, 0] }], 2)).toThrow(RangeError);
    expect(() =>
      cmosTrace(
        'inverter',
        p,
        0,
        [
          { at: 0, inputs: [0, 0] },
          { at: 0, inputs: [1, 0] },
        ],
        1,
      ),
    ).toThrow(RangeError);
    expect(() => cmosSample(cmosShot(0, 0).trace, NaN)).toThrow(RangeError);
  });
});
