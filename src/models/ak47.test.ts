import { describe, expect, it } from 'vitest';
import {
  AK47_MODEL,
  AK47_COMPARE_RANGE,
  ak47State,
  ak47Compare,
  ak47Shot,
  ak47Drive,
} from './ak47';
describe('dimensionless, non-operational energy explanation', () => {
  it('closes the work ledger over the whole excursion', () => {
    for (let i = 0; i <= 4000; i++) {
      const s = ak47State(i / 4000);
      expect(Math.abs(s.input - s.kinetic - s.elastic - s.loss)).toBeLessThan(2e-9);
      expect(s.x).toBeGreaterThanOrEqual(-1e-10);
      expect(s.loss).toBeGreaterThanOrEqual(0);
    }
  });
  it('integrates motion and the spring force independently of presentation', () => {
    for (const p of [0.1, 0.2, 0.35, 0.65, 0.8, 0.95]) {
      const h = 1e-5,
        a = ak47State(p - h),
        s = ak47State(p),
        b = ak47State(p + h);
      expect((b.x - a.x) / (2 * h * AK47_MODEL.duration)).toBeCloseTo(s.velocity, 6);
      expect((b.velocity - a.velocity) / (2 * h * AK47_MODEL.duration)).toBeCloseTo(
        s.drive - s.x - 0.16 * s.velocity,
        6,
      );
    }
  });
  it('needs no sustained input while the spring returns the mass', () => {
    const peak = ak47State(AK47_MODEL.peakProgress),
      back = ak47State(0.8),
      end = ak47State(1);
    expect(peak.elastic).toBeGreaterThan(back.elastic);
    expect(back.drive).toBe(0);
    expect(back.velocity).toBeLessThan(0);
    expect(end.x).toBe(0);
    expect(end.velocity).toBe(0);
    expect(end.loss).toBeCloseTo(end.input, 8);
    expect(end.complete).toBe(true);
  });
  it('compares the same displacement with opposite direction and equal spring energy', () => {
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const { outward: a, returning: b } = ak47Compare(p);
      expect(a.x).toBeCloseTo(b.x, 9);
      expect(a.elastic).toBeCloseTo(b.elastic, 9);
      expect(a.velocity).toBeGreaterThan(0);
      expect(b.velocity).toBeLessThan(0);
      expect(b.loss).toBeGreaterThan(a.loss);
    }
  });
  it('isolates dissipation in every displayed equal-position comparison', () => {
    const positions = Array.from(
      { length: 101 },
      (_, i) =>
        AK47_COMPARE_RANGE.min + ((AK47_COMPARE_RANGE.max - AK47_COMPARE_RANGE.min) * i) / 100,
    );
    for (let i = 0; i <= 100; i++) positions.push(ak47Shot(5, i / 100).comparePosition);
    for (const p of positions) {
      const { outward: a, returning: b } = ak47Compare(p);
      expect(a.drive).toBe(0);
      expect(b.drive).toBe(0);
      expect(a.input).toBeCloseTo(b.input, 9);
      expect(a.kinetic).toBeGreaterThan(b.kinetic);
      expect(a.kinetic - b.kinetic).toBeCloseTo(b.loss - a.loss, 9);
    }
  });
  it('reconstructs arbitrary seeks, including closure, with no accumulated UI history', () => {
    const x = ak47State(0.72);
    ak47State(0.03);
    ak47State(1);
    expect(ak47State(0.72)).toEqual(x);
    expect(ak47Shot(6, 1).progress).toBe(1);
    expect(ak47Shot(0, 0).progress).toBe(0);
    expect(ak47Shot(4, 0).progress).toBe(AK47_MODEL.peakProgress);
    expect(ak47Shot(4, 1).progress).toBe(1);
  });
  it('rejects undefined model states and clamps presentation endpoints', () => {
    expect(() => ak47State(NaN)).toThrow();
    expect(() => ak47Compare(Infinity)).toThrow();
    expect(() => ak47Shot(2, NaN)).toThrow();
    expect(() => ak47Drive(Infinity)).toThrow();
    expect(ak47State(-1)).toEqual(ak47State(0));
    expect(ak47State(2)).toEqual(ak47State(1));
  });
});
