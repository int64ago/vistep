import { describe, it, expect } from 'vitest';
import {
  ELEMENT_SYMBOLS,
  PERIOD_LENGTHS,
  periodicCell,
  orbitalOccupancy,
  trendData,
} from './chem-periodic-patterns';
describe('periodic classification and sourced trends', () => {
  it('accounts for all118 unique elements without overlapping either layout', () => {
    expect(ELEMENT_SYMBOLS.length).toBe(118);
    expect(PERIOD_LENGTHS.reduce((a, b) => a + b, 0)).toBe(118);
    for (const t of [0, 1]) {
      const cells = ELEMENT_SYMBOLS.map((_, i) => periodicCell(i + 1, t));
      expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(118);
    }
  });
  it('keeps helium in the s block while closing the first period', () => {
    expect(periodicCell(2).block).toBe('s');
    expect(periodicCell(2).x).toBe(17);
    expect(periodicCell(11).period).toBe(3);
    expect(periodicCell(29).block).toBe('ds');
  });
  it('has physically allowed Hund occupancies and the Cr/Cu exceptions', () => {
    expect(orbitalOccupancy(3, 3)).toEqual([1, 1, 1]);
    expect(orbitalOccupancy(4, 3)).toEqual([2, 1, 1]);
    expect(orbitalOccupancy(5, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(orbitalOccupancy(10, 5)).toEqual([2, 2, 2, 2, 2]);
  });
  it('preserves missing values, textbook rounding and non-monotone ionization energies', () => {
    const e = trendData('period', 'en'),
      i = trendData('period', 'ie');
    expect(e[7].value).toBe(null);
    expect(e[2].value).toBe(1.5);
    expect(i[0].value).toBeCloseTo(496, 0);
    expect(i[2].value!).toBeLessThan(i[1].value!);
    expect(i[5].value!).toBeLessThan(i[4].value!);
    const a = trendData('alkali', 'en');
    expect(a[2].value).toBe(a[3].value);
  });
});
