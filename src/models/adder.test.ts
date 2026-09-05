import { describe, expect, it } from 'vitest';
import {
  adderShot,
  fullAdder,
  inputSignal,
  known,
  logicGate,
  rippleAdder,
  type Bit,
} from './adder';
describe('binary arithmetic and signal dependencies', () => {
  it('covers the complete full-adder truth table and weighted carry', () => {
    for (const a of [0, 1] as Bit[])
      for (const b of [0, 1] as Bit[])
        for (const c of [0, 1] as Bit[]) {
          const s = fullAdder(a, b, inputSignal(c));
          expect(s.sum.value + 2 * s.cout.value).toBe(a + b + c);
          expect(s.p.value).toBe(a ^ b);
          expect(s.h.value).toBe((a ^ b) & c);
        }
  });
  it('agrees with integer arithmetic for all 65536 eight-bit operand pairs', () => {
    for (let a = 0; a < 256; a++)
      for (let b = 0; b < 256; b++) {
        const r = rippleAdder(a, b);
        if (r.sum !== (a + b) % 256 || r.complete !== a + b) throw new Error(`Incorrect ${a}+${b}`);
        const expected = r.signedA + r.signedB;
        expect(r.overflow).toBe(expected < -128 || expected > 127 ? 1 : 0);
      }
  });
  it('propagates the carry chain without reporting an unknown output as zero', () => {
    const r = rippleAdder(255, 1);
    expect(r.stages.map((s) => s.cout.ready)).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(known(r.stages[7].sum, 15.9)).toBeNull();
    expect(known(r.stages[7].sum, 16)).toBe(0);
    expect(r.sum).toBe(0);
    expect(r.carry.value).toBe(1);
    expect(r.complete).toBe(256);
  });
  it('uses controlling inputs while retaining XOR dependence on both inputs', () => {
    const late = { value: 1 as Bit, ready: 20 };
    expect(logicGate('AND', inputSignal(0), late)).toEqual({ value: 0, ready: 1 });
    expect(logicGate('OR', inputSignal(1), late)).toEqual({ value: 1, ready: 1 });
    expect(logicGate('XOR', inputSignal(0), late)).toEqual({ value: 1, ready: 22 });
    const r = rippleAdder(127, 1);
    expect(r.carry.value).toBe(0);
    expect(r.overflow).toBe(1);
    expect(r.signedSum).toBe(-128);
  });
  it('reconstructs the film states and rejects values outside the represented width', () => {
    expect(adderShot(4, 0).time).toBe(0);
    expect(adderShot(4, 1).time).toBe(16);
    expect(adderShot(2, 0.5).cin).toBe(1);
    expect(adderShot(6, 0.3).signed).toBe(false);
    expect(adderShot(6, 0.7).signed).toBe(true);
    expect(adderShot(5, 0.7).truncate).toBe(true);
    expect(adderShot(7, 1).model.sum).toBe(61);
    expect(() => rippleAdder(256, 0)).toThrow();
    expect(() => rippleAdder(NaN, 1)).toThrow();
    expect(() => rippleAdder(1, 1, 0)).toThrow();
  });
});
