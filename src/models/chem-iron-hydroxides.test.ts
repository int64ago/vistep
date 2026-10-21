import { describe, it, expect } from 'vitest';
import { ironHydroxides, hydroxideColour, hydroxideDirector } from './chem-iron-hydroxides';
describe('iron hydroxides', () => {
  it('requires two and three hydroxides per precipitated iron', () => {
    const m = ironHydroxides(1, 0);
    expect(m.ferrousRemaining).toBe(0.5);
    expect(m.ferricSolid).toBeCloseTo(1 / 3);
  });
  it('has the independent four-iron-per-oxygen benchmark', () => {
    const m = ironHydroxides(3, 0.1);
    expect(m.oxidized).toBeCloseTo(0.4);
    expect(m.ferrousRemaining).toBeCloseTo(0.6);
    expect(m.waterUsed).toBeCloseTo(0.2);
  });
  it('conserves iron across limits and blocks without base or oxygen', () => {
    for (const oh of [0, 0.5, 2, 3, 4])
      for (const oxygen of [0, 0.01, 0.25, 2])
        for (const p of [0, 0.3, 1]) {
          const m = ironHydroxides(oh, oxygen, p);
          expect(m.totalFerrousIron).toBeCloseTo(1);
          expect(m.ferricSolid + m.ferricDissolved).toBeCloseTo(1);
          expect(m.oxidized).toBeLessThanOrEqual(4 * oxygen);
          expect(m.ferrousRemaining).toBeGreaterThanOrEqual(0);
        }
    expect(ironHydroxides(0).oxidized).toBe(0);
    expect(ironHydroxides(3, 0).oxidized).toBe(0);
  });
  it('reconstructs direct seeks and distinct colour evidence', () => {
    expect(hydroxideDirector(0, 0).add).toBe(0);
    expect(hydroxideDirector(2, 0.1).extent).toBe(0.1);
    expect(hydroxideDirector(3, 1).oxygen).toBe(0.25);
    expect(new Set([0, 0.25, 1].map(hydroxideColour)).size).toBe(3);
  });
});

describe('measured hydroxide comparison', () => {
  it('introduces limited oxygen as a separately labelled case and no base as a second case', () => {
    for (const lang of ['zh', 'en']) {
      let d = hydroxideDirector(2, 0.4, 12, lang);
      expect(d.extent).toBe(1);
      expect(d.oxygen).toBe(0.25);
      d = hydroxideDirector(2, 0.6, 17, lang);
      expect(d.comparison).toBe('limited-oxygen');
      expect(ironHydroxides(d.oh, d.oxygen, d.extent, d.add).oxidized).toBe(0.5);
      d = hydroxideDirector(2, 0.8, 21, lang);
      expect(d.comparison).toBe('no-precipitate');
      expect(ironHydroxides(d.oh, d.oxygen, d.extent, d.add).oxidized).toBe(0);
    }
  });
  it('uses finite guards and preserves no-O2/no-OH limits', () => {
    for (const x of [NaN, Infinity, -Infinity]) {
      expect(Object.values(ironHydroxides(x, x, x, x)).every(Number.isFinite)).toBe(true);
      const d = hydroxideDirector(x, x, x);
      expect(
        Object.values(d)
          .filter((x) => typeof x === 'number')
          .every(Number.isFinite),
      ).toBe(true);
    }
  });
});

import { hydroxideIronSlots, hydroxideSectorPath } from './chem-iron-hydroxides';
describe('four fixed shares of the complete initial iron inventory', () => {
  it('allocates OH=0,0.1,1,2 and limited oxygen without counting dissolved iron as solid', () => {
    for (const oh of [0, 0.1, 1, 2])
      for (const oxygen of [0, 0.005, 0.025, 0.125, 0.25])
        for (const extent of [0, 0.1, 0.5, 1]) {
          const slots = hydroxideIronSlots(oh, oxygen, extent);
          const sum = (key: 'aqueousII' | 'solidII' | 'solidIII') =>
            slots.reduce((s, x) => s + x[key], 0);
          const precipitated = Math.min(1, oh / 2),
            oxidized = Math.min(precipitated, oxygen * 4) * extent;
          expect(slots.map((x) => x.id)).toEqual(['Fe-0', 'Fe-1', 'Fe-2', 'Fe-3']);
          expect(sum('aqueousII')).toBeCloseTo(1 - precipitated, 12);
          expect(sum('solidII')).toBeCloseTo(precipitated - oxidized, 12);
          expect(sum('solidIII')).toBeCloseTo(oxidized, 12);
          for (const slot of slots) {
            expect(slot.capacity).toBe(0.25);
            expect(slot.aqueousII + slot.solidII + slot.solidIII).toBeCloseTo(0.25, 12);
            for (const sec of slot.sectors) {
              expect((sec.end - sec.start) * 0.25).toBeCloseTo(sec.amount, 12);
              expect(sec.amount).toBeGreaterThanOrEqual(0);
            }
          }
        }
  });
  it('the original low-base counterexample retains 0.95mmol aqueous FeII and only0.05mmol solid FeIII', () => {
    const s = hydroxideIronSlots(0.1, 0.25, 1);
    expect(s[0].solidIII).toBeCloseTo(0.05, 12);
    expect(s[0].aqueousII).toBeCloseTo(0.2, 12);
    expect(
      s.slice(1).every((x) => x.aqueousII === 0.25 && x.solidIII === 0 && x.solidII === 0),
    ).toBe(true);
  });
  it('every nonfinite input and sector boundary produces finite paths and inventories', () => {
    for (const x of [NaN, Infinity, -Infinity, -1, 0, 1]) {
      for (const s of hydroxideIronSlots(x, x, x, x))
        for (const v of [s.capacity, s.aqueousII, s.solidII, s.solidIII])
          expect(Number.isFinite(v)).toBe(true);
      expect(hydroxideSectorPath(x, 1)).not.toMatch(/NaN|Infinity/);
    }
    expect(hydroxideSectorPath(0, 0)).toBe('');
    expect(hydroxideSectorPath(0, 1)).toContain('A24');
  });
});
