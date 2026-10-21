import { describe, it, expect } from 'vitest';
import {
  solutionPreparation,
  flaskLevel,
  mixingLayers,
  preparationDirector,
  preparationTracer,
} from './chem-solution-preparation';
describe('quantitative preparation', () => {
  it('reproduces the textbook 100 mL, 1.00 M recipe and 50 mL dilution', () => {
    const m = solutionPreparation();
    expect(m.targetMass).toBeCloseTo(5.85);
    expect(m.concentration).toBeCloseTo(1);
    expect(solutionPreparation(5.85, 1, 100, 50).concentration).toBeCloseTo(0.5);
  });
  it('conserves solute across transfer and gives correct directions of error', () => {
    const m = solutionPreparation(5.85, 0.96, 100);
    expect(m.inputMoles).toBeCloseTo(m.deliveredMoles + m.residueMoles);
    expect(m.concentration).toBeCloseTo(0.96);
    expect(solutionPreparation(5.85, 1, 101).concentration).toBeLessThan(1);
    expect(solutionPreparation(5.85, 1, 99).concentration).toBeGreaterThan(1);
  });
  it('calibrates geometry at the line and raises the level when volume increases', () => {
    expect(flaskLevel(100)).toBeCloseTo(100, 4);
    expect(flaskLevel(99)).toBeGreaterThan(flaskLevel(100));
    expect(flaskLevel(101)).toBeLessThan(100);
  });
  it('mixing changes local concentrations without changing their volume-weighted mean', () => {
    for (const mixing of [0, 0.3, 1])
      expect(mixingLayers(1, mixing).reduce((a, b) => a + b) / 10).toBeCloseTo(1);
    expect(new Set(mixingLayers(0.5, 1)).size).toBe(1);
    expect(preparationDirector(2, 1).recovery).toBe(1);
  });
});

describe('measured preparation direction', () => {
  it('retains each solute parcel during the two measured transfers', () => {
    for (const lang of ['zh', 'en'])
      for (const c of [1, 2])
        for (let t = 0; t <= 27; t += 0.2) {
          const d = preparationDirector(c, t / 27, t, lang),
            m = solutionPreparation(d.mass, d.recovery, d.volume);
          expect(m.deliveredMoles + m.residueMoles).toBeCloseTo(0.1, 12);
          expect(d.recovery).toBeGreaterThanOrEqual(c === 2 ? 0.95 : 0);
          expect(d.recovery).toBeLessThanOrEqual(c === 1 ? 0.95 : 1);
        }
  });
  it('aligns the line before introducing the independent high/low comparisons', () => {
    for (const lang of ['zh', 'en']) {
      expect(preparationDirector(3, 0.5, 18, lang).volume).toBe(100);
      expect(preparationDirector(3, 0.8, 22, lang).volume).toBe(100.8);
      expect(preparationDirector(3, 0.8, 22, lang).stage).toBe('high-volume-case');
      expect(preparationDirector(3, 1, 27, lang).volume).toBe(99.2);
      expect(preparationDirector(3, 1, 27, lang).stage).toBe('low-volume-case');
    }
  });
  it('does not add solute as the dilution volume changes, and rejects non-finite input', () => {
    for (const lang of ['zh', 'en'])
      for (let t = 0; t < 36; t += 0.5) {
        const d = preparationDirector(5, t / 36, t, lang),
          m = solutionPreparation(d.mass, d.recovery, d.volume, d.stockMl);
        expect(m.deliveredMoles).toBe(0.05);
        expect((m.concentration * d.volume) / 1000).toBeCloseTo(0.05);
      }
    for (const x of [NaN, Infinity, -Infinity]) {
      const d = preparationDirector(x, x, x),
        m = solutionPreparation(x, x, x, x);
      expect(
        Object.values(d)
          .filter((x) => typeof x === 'number')
          .every(Number.isFinite),
      ).toBe(true);
      expect(Object.values(m).every(Number.isFinite)).toBe(true);
    }
  });
});

it('keeps the selected rinsed residue identity continuous from vessel to flask', () => {
  const a = preparationTracer(0.95, 40),
    z = preparationTracer(1, 55);
  expect(a.phase).toBe('source');
  expect(z.phase).toBe('flask');
  for (let n = 0; n <= 200; n++) {
    const f = 0.95 + (0.05 * n) / 200,
      t = preparationTracer(f, 40 + (15 * n) / 200);
    expect(t.id).toBe(a.id);
    expect(Number.isFinite(t.x + t.y)).toBe(true);
    if (n) {
      const old = preparationTracer(0.95 + (0.05 * (n - 1)) / 200, 40 + (15 * (n - 1)) / 200);
      expect(Math.hypot(t.x - old.x, t.y - old.y)).toBeLessThan(5);
    }
  }
});
