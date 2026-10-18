import { describe, it, expect } from 'vitest';
import {
  METER_HEAD,
  voltageNetwork,
  currentNetwork,
  ohmNetwork,
  ohmmeterState,
  diodeOhmmeter,
  lampMeter,
  faultProbeState,
  multimeterDirector,
  meterNeedle,
} from './multimeter-lab';
describe('same moving-coil head and loaded circuit', () => {
  it('derives the 5V series and .5A shunt independently from 50uA and2kohm', () => {
    const v = voltageNetwork(5, 5);
    expect(v.seriesResistance).toBe(98000);
    expect(v.headCurrent).toBeCloseTo(50e-6, 14);
    expect(v.headVoltage).toBeCloseTo(0.1, 14);
    expect(v.seriesVoltage).toBeCloseTo(4.9, 14);
    const a = currentNetwork(0.5, 0.5);
    expect(a.shuntResistance).toBeCloseTo(0.2000200020002, 12);
    expect(a.totalResistance).toBeCloseTo(0.2, 14);
    expect(a.shuntCurrent).toBeCloseTo(0.49995, 14);
    expect(a.headCurrent).toBeCloseTo(50e-6, 14);
  });
  it('satisfies KCL, equal branch voltage and power across signed current ranges', () => {
    for (const range of [50e-6, 0.0001, 0.1, 0.5, 10])
      for (const current of [-0.5, 0, 0.1, 0.5]) {
        const s = currentNetwork(range, current);
        expect(s.headCurrent + s.shuntCurrent).toBeCloseTo(current, 13);
        expect(s.headCurrent * 2000).toBeCloseTo(s.voltage, 13);
        if (Number.isFinite(s.shuntResistance))
          expect(s.shuntCurrent * s.shuntResistance).toBeCloseTo(s.voltage, 10);
        expect(current * s.voltage).toBeCloseTo(
          s.headCurrent ** 2 * 2000 +
            (Number.isFinite(s.shuntResistance) ? s.shuntCurrent ** 2 * s.shuntResistance : 0),
          10,
        );
      }
  });
  it('keeps every voltmeter series drop and head current on the same circuit', () => {
    for (const range of [0.1, 2.5, 5, 10, 1200])
      for (const u of [-2, 0, 2.5]) {
        const s = voltageNetwork(range, u);
        expect(s.seriesVoltage + s.headVoltage).toBeCloseTo(u, 14);
        expect(s.headCurrent * s.totalResistance).toBeCloseTo(u, 14);
        expect(s.totalResistance / range).toBe(20000);
      }
  });
  it('realizes all four ohm multipliers with one physical head, including low-ohm shunting', () => {
    for (const m of [1, 10, 100, 1000])
      for (const gain of [0.7, 1, 1.1])
        for (const r of [0, 20 * m, 470, Infinity]) {
          const s = ohmmeterState(r, m, gain);
          expect(s.headCurrent + s.shuntCurrent).toBeCloseTo(s.current, 13);
          expect(s.parallelResistance + s.seriesResistance).toBeCloseTo(s.internal, 9);
          expect(s.headCurrent * 2000).toBeCloseTo(s.shuntCurrent * s.shuntResistance, 12);
          expect(s.seriesVoltage + s.headVoltage + s.specimenVoltage).toBeCloseTo(1.5, 12);
          if (Number.isFinite(r)) expect(s.current * r).toBeCloseTo(s.specimenVoltage, 12);
          if (r === 0) expect(s.deflection).toBeCloseTo(gain, 12);
        }
    expect(ohmNetwork(1).parallelResistance).toBeCloseTo(4 / 3, 12);
    expect(ohmNetwork(1000).shuntResistance).toBeCloseTo(4000, 8);
  });
  it('predicts the nonlinear scale, rather than dividing its geometric span uniformly', () => {
    expect(ohmmeterState(0).deflection).toBeCloseTo(1, 14);
    expect(ohmmeterState(200).deflection).toBeCloseTo(0.5, 14);
    expect(ohmmeterState(400).deflection).toBeCloseTo(1 / 3, 14);
    expect(ohmmeterState(Infinity).deflection).toBe(0);
    expect(ohmmeterState(470).indicated).toBeCloseTo(470, 12);
    expect(ohmmeterState(470, 10, 0.86).indicated).toBeGreaterThan(470);
  });
  it('jointly solves the diode and meter and preserves model-specific polarity', () => {
    for (const m of [1, 10, 100, 1000]) {
      const f = diodeOhmmeter(true, m),
        r = diodeOhmmeter(false, m);
      expect(f.current).toBeCloseTo(1e-9 * Math.expm1(f.drop / 0.0517), 11);
      expect(f.current * f.internal + f.drop).toBeCloseTo(1.5, 12);
      expect(f.headCurrent + f.shuntCurrent).toBeCloseTo(f.current, 13);
      expect(f.current).toBeGreaterThan(r.current * 1000);
      expect(r.drop).toBeLessThan(0);
    }
    expect(diodeOhmmeter(true, 100).indicated).not.toBeCloseTo(
      diodeOhmmeter(true, 10).indicated,
      0,
    );
  });
  it('loads the lamp from the derived internal resistance, not a separate arbitrary burden', () => {
    const a = lampMeter('current', 0.5);
    expect(a.burden).toBeCloseTo(0.2, 14);
    expect(a.current).toBeCloseTo(3 / 20.7, 14);
    expect(a.current).toBeLessThan(a.unmeteredCurrent);
    expect(a.lampVoltage + a.current * a.burden + a.current * 0.5).toBeCloseTo(3, 14);
    const v = lampMeter('voltage', 5);
    expect(v.sourceCurrent).toBeCloseTo(v.lampCurrent + v.meterCurrent, 14);
    expect(v.lampVoltage + v.sourceCurrent * 0.5).toBeCloseTo(3, 14);
    expect(lampMeter('voltage', 5, true).value).toBeLessThan(0);
    expect(lampMeter('current', 0.1).overRange).toBe(true);
  });
  it('retains finite bad contacts with explicit voltage-meter loading and source conservation', () => {
    for (const fault of ['battery', 'wire', 'switch', 'socket'] as const)
      for (const probe of ['battery', 'wire', 'switch', 'lamp'] as const) {
        const s = faultProbeState(fault, probe);
        expect(s.meterCurrent + s.sectionCurrent).toBeCloseTo(s.sourceCurrent, 13);
        expect(s.partVoltages.reduce((a, b) => a + b, 0) + s.sourceCurrent * 0.5).toBeCloseTo(
          s.source,
          12,
        );
        expect(s.nodeVoltages.at(-1)).toBeCloseTo(0, 12);
        s.partCurrents.forEach((i) => expect(i).toBeGreaterThanOrEqual(0));
      }
    const w = faultProbeState('wire', 'wire');
    expect(w.voltage).toBeGreaterThan(1.49);
    expect(w.meterCurrent).toBeGreaterThan(w.sectionCurrent * 10000);
    expect(w.lampCurrent).toBeCloseTo(w.sourceCurrent, 14);
    expect(w.lampPower).toBeLessThan(1e-7);
    const s = faultProbeState('socket', 'lamp');
    expect(s.lampCurrent).toBeLessThan(2e-9);
    expect(s.voltage).toBeGreaterThan(1.49);
    expect(faultProbeState('socket', 'switch').voltage).toBeLessThan(0.001);
  });
  it('rejects unsupported or nonfinite circuits, preserving infinity only for a physical open', () => {
    for (const x of [NaN, Infinity, -Infinity, -1]) expect(() => voltageNetwork(x, 1)).toThrow();
    expect(() => currentNetwork(0.00001, 1)).toThrow();
    expect(() => ohmNetwork(1500)).toThrow();
    expect(() => ohmNetwork(10, Infinity)).toThrow();
    expect(() => ohmmeterState(NaN)).toThrow();
    expect(() => diodeOhmmeter(true, -1)).toThrow();
    expect(() => faultProbeState('wire', 'wire', 0)).toThrow();
    expect(ohmmeterState(Infinity).current).toBe(0);
  });
  it('keeps predictions unrevealed before the new range/resistance and supports rewind', () => {
    const before = multimeterDirector(0, 26),
      after = multimeterDirector(0, 32);
    expect(before.reveal).toBe(false);
    expect(before.range).toBe(5);
    expect(after.range).toBe(10);
    expect(multimeterDirector(0, 26)).toEqual(before);
    expect(multimeterDirector(1, 25).reveal).toBe(false);
    expect(multimeterDirector(1, 29).range).toBe(0.1);
    expect(multimeterDirector(3, 11).resistance).toBe(200);
    expect(multimeterDirector(3, 15).resistance).toBe(400);
  });
  it('clamps only the physical needle stop, not the electrical calculation', () => {
    const s = currentNetwork(0.1, 0.5);
    expect(s.headCurrent).toBeCloseTo(0.00025, 14);
    expect(s.deflection).toBeCloseTo(5, 14);
    expect(meterNeedle(s.deflection)).toEqual(meterNeedle(1.05));
    expect(multimeterDirector(NaN, Infinity)).toEqual(multimeterDirector(0, 0));
    expect(METER_HEAD.fullScaleCurrent).toBe(50e-6);
  });
  it('holds the English ohm prediction until its full question finishes', () => {
    const question = multimeterDirector(3, 12.4, 'en');
    expect(question.reveal).toBe(false);
    expect(question.resistance).toBe(200);
    const answer = multimeterDirector(3, 13, 'en');
    expect(answer.reveal).toBe(true);
    expect(ohmmeterState(answer.resistance).deflection).toBeCloseTo(1 / 3, 12);
    expect(multimeterDirector(3, 21.9, 'en').resistance).toBe(400);
    expect(multimeterDirector(3, 22.3, 'en').resistance).toBe(470);
  });
  it('keeps narrated open, short and good-contact comparisons electrically distinct', () => {
    for (const [locale, open, short, good, bad, wire] of [
      ['en', 13, 17, 5, 6, 10],
      ['zh', 16, 19, 5, 6, 10],
    ] as const) {
      expect(multimeterDirector(2, open, locale).resistance).toBe(Infinity);
      expect(multimeterDirector(2, short, locale).resistance).toBe(0);
      const first = multimeterDirector(8, good, locale),
        second = multimeterDirector(8, bad, locale),
        last = multimeterDirector(8, wire, locale);
      expect(faultProbeState(first.fault, first.probe).voltage).toBeLessThan(0.001);
      expect(faultProbeState(second.fault, second.probe).voltage).toBeGreaterThan(1.49);
      expect(last.probe).toBe('wire');
    }
  });
});
