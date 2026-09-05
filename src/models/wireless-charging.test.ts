import { describe, it, expect } from 'vitest';
import {
  WIRELESS as W,
  wirelessDefaults,
  wirelessState,
  wirelessShot,
  wirelessCoupling,
  wirelessCapacitance,
  solveWirelessCircuit,
  wcAbs,
  wcAdd,
  wcMul,
  wcInstant,
  wirelessCoilPoint,
  wirelessOuterRadius,
  wirelessWires,
  wirelessPorts,
  wirelessReceiverOffset,
  type CoupledCircuit,
} from './wireless-charging';
const base = wirelessState(wirelessDefaults).circuit;
describe('wireless charging: passive coupled series RLC', () => {
  it('uses a bounded reciprocal coupling proxy that decreases with gap and lateral offset', () => {
    for (const ferrite of [false, true]) {
      let old = 1;
      for (let i = 0; i <= 100; i++) {
        const k = wirelessCoupling(0.002 + i * 0.00022, 0, ferrite);
        expect(k).toBeGreaterThan(0);
        expect(k).toBeLessThan(old);
        expect(k).toBeLessThan(1);
        old = k;
      }
      old = 1;
      for (let i = 0; i <= 100; i++) {
        const x = i * 0.00032,
          k = wirelessCoupling(0.006, x, ferrite);
        expect(k).toBeLessThan(old);
        expect(k).toBeCloseTo(wirelessCoupling(0.006, -x, ferrite), 14);
        old = k;
      }
    }
  });
  it('has no receiver current or power at zero mutual coupling', () => {
    const s = solveWirelessCircuit({ ...base, m: 0 });
    expect(wcAbs(s.i2)).toBe(0);
    expect(s.loadPower).toBe(0);
    expect(wcAbs(s.induced)).toBe(0);
    expect(s.reflected.re).toBe(0);
    expect(s.inputPower).toBeCloseTo(s.sourceLoss + s.txLoss, 12);
  });
  it('separates an open-circuit induced voltage from delivered load power', () => {
    const s = solveWirelessCircuit({ ...base, connected: false });
    expect(wcAbs(s.induced)).toBeGreaterThan(0);
    expect(wcAbs(s.i2)).toBe(0);
    expect(s.loadPower).toBe(0);
    expect(s.efficiency).toBe(0);
    expect(wcAbs(s.i1)).toBeGreaterThan(wcAbs(solveWirelessCircuit(base).i1));
  });
  it('satisfies both complex mesh equations rather than fitting efficiency to distance', () => {
    for (const frequency of [40e3, 85e3, 150e3, 210e3, 1e6]) {
      const p = { ...base, frequency },
        s = solveWirelessCircuit(p),
        w = 2 * Math.PI * frequency;
      const a = wcAdd(
        wcMul({ re: p.sourceR + p.r1, im: w * p.l1 - 1 / (w * p.c1) }, s.i1),
        wcMul({ re: 0, im: w * p.m }, s.i2),
      );
      const b = wcAdd(
        wcMul({ re: p.r2 + p.load, im: w * p.l2 - 1 / (w * p.c2) }, s.i2),
        wcMul({ re: 0, im: w * p.m }, s.i1),
      );
      expect(a.re).toBeCloseTo(p.voltage, 11);
      expect(a.im).toBeCloseTo(0, 11);
      expect(b.re).toBeCloseTo(0, 11);
      expect(b.im).toBeCloseTo(0, 11);
    }
  });
  it('closes source, both winding losses, and AC load power over frequency and placement extremes', () => {
    for (const frequency of [0, 1, 1e3, 40e3, 150e3, 230e3, 1e6, 1e9])
      for (const gap of [0.002, 0.008, 0.024])
        for (const offset of [0, 0.018, 0.032])
          for (const ferrite of [false, true]) {
            const state = wirelessState({ ...wirelessDefaults, gap, offset, ferrite });
            const s = solveWirelessCircuit({ ...state.circuit, frequency });
            expect(s.inputPower).toBeCloseTo(s.sourceLoss + s.txLoss + s.rxLoss + s.loadPower, 10);
            expect(s.efficiency).toBeGreaterThanOrEqual(0);
            expect(s.efficiency).toBeLessThan(1);
            expect(s.reflected.re).toBeGreaterThanOrEqual(0);
            expect(s.magneticDeterminant).toBeGreaterThan(0);
          }
  });
  it('is reciprocal when source and receiver impedances are interchanged', () => {
    const p: CoupledCircuit = {
      ...base,
      l1: 5e-6,
      l2: 9e-6,
      c1: 180e-9,
      c2: 130e-9,
      r1: 0.3,
      r2: 0.2,
      frequency: 170e3,
    };
    const swapped = {
      ...p,
      l1: p.l2,
      l2: p.l1,
      c1: p.c2,
      c2: p.c1,
      r1: p.r2,
      r2: p.r1,
      sourceR: p.load,
      load: p.sourceR,
    };
    const a = solveWirelessCircuit(p),
      b = solveWirelessCircuit(swapped);
    expect(a.i2.re).toBeCloseTo(b.i2.re, 12);
    expect(a.i2.im).toBeCloseTo(b.i2.im, 12);
    const reversed = solveWirelessCircuit({ ...p, m: -p.m });
    expect(reversed.i2.re).toBeCloseTo(-a.i2.re, 12);
    expect(reversed.i2.im).toBeCloseTo(-a.i2.im, 12);
    expect(reversed.loadPower).toBeCloseTo(a.loadPower, 12);
  });
  it('satisfies instantaneous energy balance, including mutual magnetic energy and both capacitors', () => {
    const p = { ...base, frequency: 120e3 },
      s = solveWirelessCircuit(p),
      w = 2 * Math.PI * p.frequency;
    for (let k = 0; k < 180; k++) {
      const phase = (k * Math.PI) / 90,
        i = wcInstant(s.i1, phase),
        j = wcInstant(s.i2, phase);
      const di = wcInstant(wcMul({ re: 0, im: w }, s.i1), phase),
        dj = wcInstant(wcMul({ re: 0, im: w }, s.i2), phase);
      const v1 = wcInstant(wcMul({ re: 0, im: -1 / (w * p.c1) }, s.i1), phase),
        v2 = wcInstant(wcMul({ re: 0, im: -1 / (w * p.c2) }, s.i2), phase);
      const magnetic = 0.5 * p.l1 * i * i + 0.5 * p.l2 * j * j + p.m * i * j;
      const dEnergy = p.l1 * i * di + p.l2 * j * dj + p.m * (di * j + i * dj) + v1 * i + v2 * j;
      expect(magnetic).toBeGreaterThanOrEqual(0);
      expect(Math.SQRT2 * p.voltage * Math.cos(phase) * i).toBeCloseTo(
        (p.sourceR + p.r1) * i * i + (p.r2 + p.load) * j * j + dEnergy,
        9,
      );
    }
  });
  it('implements Faraday polarity and the quarter-cycle relation from the current phasor', () => {
    const s = wirelessState({ ...wirelessDefaults, connected: false, phase: 0.9 }),
      w = 2 * Math.PI * s.input.frequency;
    const derivative = wcInstant(wcMul({ re: 0, im: w }, s.linkedFlux), s.input.phase);
    expect(s.instantEmf).toBeCloseTo(-derivative, 12);
    const h = 1e-5,
      a = wirelessState({ ...s.input, phase: s.input.phase - h }),
      b = wirelessState({ ...s.input, phase: s.input.phase + h });
    expect(s.instantEmf).toBeCloseTo((-(b.instantFlux - a.instantFlux) / (2 * h)) * w, 8);
  });
  it('tunes the individual backed coils, and removing ferrite shifts their self-resonance', () => {
    expect(1 / (2 * Math.PI * Math.sqrt(W.backedL * wirelessCapacitance))).toBeCloseTo(150e3, 7);
    const tuned = wirelessState({ ...wirelessDefaults, gap: 0.006 }),
      detuned = wirelessState({ ...wirelessDefaults, gap: 0.006, frequency: 85e3 });
    expect(tuned.x1).toBeCloseTo(0, 12);
    expect(tuned.x2).toBeCloseTo(0, 12);
    expect(tuned.loadPower).toBeGreaterThan(detuned.loadPower * 10);
    const air = wirelessState({ ...tuned.input, ferrite: false });
    expect(air.resonance1).toBeGreaterThan(tuned.resonance1);
    expect(air.coupling).toBeLessThan(tuned.coupling);
    expect(air.loadPower).toBeLessThan(tuned.loadPower);
  });
  it('contains eight true turns and continuous, electrically distinct terminal paths', () => {
    let angle = 0,
      previous = wirelessCoilPoint(0),
      lastA = 0;
    for (let k = 1; k <= 8192; k++) {
      const p = wirelessCoilPoint(k / 8192),
        a = Math.atan2(-p[2], p[0]);
      let delta = a - lastA;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      angle += delta;
      lastA = a;
      expect(Math.hypot(p[0] - previous[0], p[2] - previous[2])).toBeLessThan(0.00015);
      previous = p;
    }
    expect(angle / (2 * Math.PI)).toBeCloseTo(8, 12);
    expect(Math.hypot(previous[0], previous[2])).toBeCloseTo(wirelessOuterRadius, 12);
    expect(W.pitch).toBeGreaterThan(2 * W.wireRadius);
    for (const receiver of [false, true]) {
      const wire = wirelessWires(receiver);
      expect(wire.inner[0]).toEqual(wirelessCoilPoint(0));
      expect(wire.inner.at(-1)).toEqual(wirelessPorts.capLeft);
      expect(wire.outer[0]).toEqual(wirelessCoilPoint(1));
      expect(wire.outer.at(-1)).toEqual(wirelessPorts.deviceRight);
      expect(wire.bridge).toEqual([wirelessPorts.capRight, wirelessPorts.deviceLeft]);
      expect(Math.abs(wire.inner[1][1])).toBeGreaterThan(2 * W.wireRadius);
    }
  });
  it('uses the same physical offset length in phone and desktop geometry and seeks deterministically', () => {
    for (let chapter = 0; chapter < 8; chapter++)
      for (let k = 0; k <= 40; k++) {
        const a = wirelessShot(chapter, k / 40);
        wirelessShot(7 - chapter, 1 - k / 40);
        expect(wirelessShot(chapter, k / 40)).toEqual(a);
        for (const narrow of [true, false]) {
          const p = wirelessReceiverOffset(a.input, narrow);
          expect(Math.hypot(p[0], p[2])).toBeCloseTo(a.input.offset, 13);
          expect(p[1]).toBe(a.input.gap);
        }
      }
    expect(wirelessShot(0, 0).state.inputPower).toBe(0);
    expect(wirelessShot(2, 0.2).state.loadPower).toBe(0);
    expect(wirelessShot(2, 0.6).state.loadPower).toBeGreaterThan(0);
  });
  it('rejects active or invalid components and has finite DC and zero-source limits', () => {
    expect(() =>
      solveWirelessCircuit({ ...base, m: Math.sqrt(base.l1 * base.l2) * 1.001 }),
    ).toThrow();
    expect(() => solveWirelessCircuit({ ...base, r1: -1 })).toThrow();
    expect(() => solveWirelessCircuit({ ...base, frequency: NaN })).toThrow();
    for (const p of [
      { ...base, frequency: 0 },
      { ...base, voltage: 0 },
    ]) {
      const s = solveWirelessCircuit(p);
      expect(wcAbs(s.i1)).toBe(0);
      expect(wcAbs(s.i2)).toBe(0);
      expect(s.inputPower).toBe(0);
      expect(s.efficiency).toBe(0);
    }
  });
});
