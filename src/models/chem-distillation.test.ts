import { describe, it, expect } from 'vitest';
import {
  distillationSpecies,
  saturationBar,
  vapourEquilibrium,
  distillationTrace,
  distillationAt,
  total,
  vapourPath,
  distillationDirector,
} from './chem-distillation';
describe('differential teaching distillation', () => {
  it('handles an empty feed and nonfinite progress without imaginary evaporation', () => {
    const t = distillationTrace([0, 0, 0]);
    expect(total(t.at(-1)!.cuts.map(total))).toBe(0);
    expect(t[0].equilibrium.boiling).toBe(false);
    expect(distillationAt(distillationTrace(), NaN).evaporated).toBe(0);
  });
  it('recovers each normal boiling benchmark', () => {
    distillationSpecies.forEach((s, i) => {
      expect(saturationBar(i, s.boilingK)).toBeCloseTo(1.01325, 10);
      expect(vapourEquilibrium([0, 1, 2].map((j) => (j === i ? 1 : 0))).kelvin).toBeCloseTo(
        s.boilingK,
        8,
      );
    });
  });
  it('enriches the lower-boiling species in mixed vapour, without inventing purity', () => {
    const e = vapourEquilibrium([0.45, 0.35, 0.2]);
    expect(e.vapour[0]).toBeGreaterThan(0.45);
    expect(e.vapour[1]).toBeGreaterThan(0);
    expect(e.vapour[2]).toBeGreaterThan(0);
    expect(total(e.vapour)).toBeCloseTo(1);
    expect(e.celsius).toBeGreaterThan(40);
    expect(e.celsius).toBeLessThan(62);
  });
  it('conserves each species across flask and three fractions', () => {
    const trace = distillationTrace();
    for (const s of trace) {
      [0.45, 0.35, 0.2].forEach((n, i) =>
        expect(s.remaining[i] + total(s.cuts.map((c) => c[i]))).toBeCloseTo(n, 10),
      );
      expect(total(s.remaining)).toBeGreaterThan(0.27);
    }
  });
  it('depletes volatile material and increases boiling temperature', () => {
    const t = distillationTrace(),
      a = t[0],
      b = t.at(-1)!;
    expect(b.equilibrium.celsius).toBeGreaterThan(a.equilibrium.celsius);
    expect(b.equilibrium.liquid[0]).toBeLessThan(a.equilibrium.liquid[0]);
    expect(b.cuts[0][0]).toBeGreaterThan(b.cuts[2][0]);
  });
  it('keeps uncondensed material out of collected liquid', () => {
    const t = distillationTrace(),
      m = distillationAt(t, 0.6, false);
    expect(total(m.collected.map(total))).toBe(0);
    expect(total(m.uncondensed.map(total)) + total(m.remaining)).toBeCloseTo(1);
  });
  it('keeps the path continuous and constrains invalid director inputs', () => {
    expect(vapourPath(0)).toMatchObject({ x: 91, y: 157 });
    expect(vapourPath(1).x).toBeCloseTo(261, 10);
    expect(vapourPath(1).y).toBeCloseTo(184, 10);
    for (let i = 1; i <= 100; i++) {
      const a = vapourPath((i - 1) / 100),
        b = vapourPath(i / 100);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(3.1);
    }
    expect(distillationDirector(100, Infinity)).toMatchObject({ chapter: 6, p: 0 });
  });
});
