import { describe, it, expect } from 'vitest';
import { chlorineBleaching, bleachColour, bleachingDirector } from './chem-chlorine-bleaching';
describe('water-controlled bleaching comparison', () => {
  it('retains the dry-paper control while wet paper fades', () => {
    expect(chlorineBleaching('dry-paper', 1).colourRemaining).toBe(1);
    expect(chlorineBleaching('wet-paper', 1).colourRemaining).toBe(0);
  });
  it('fresh tissue contains water even in the dry-gas jar', () => {
    expect(chlorineBleaching('flower', 1).changed).toBe(1);
    expect(chlorineBleaching('flower', 1, false).changed).toBe(0);
  });
  it('tracks normalized coloured and oxidized units without creating or deleting sites', () => {
    for (const extent of [0, 0.25, 0.5, 1]) {
      const m = chlorineBleaching('wet-paper', extent);
      expect(m.colourRemaining + m.changed).toBe(1);
      expect(m.units).toHaveLength(24);
      expect(m.units.filter((x) => x.oxidized)).toHaveLength(24 * extent);
    }
  });
  it('clamps extent and reconstructs mechanism when seeking', () => {
    expect(chlorineBleaching('wet-paper', 2).changed).toBe(1);
    expect(bleachColour(0)).toBe('rgb(234,230,212)');
    expect(bleachingDirector(2, 0)).toMatchObject({ micro: true, extent: 0 });
  });
});

describe('retained bleaching bounds and timing', () => {
  it('keeps both controls independent: no water or no chlorine means no change', () => {
    for (const x of [-1, 0, 0.5, 1, NaN, Infinity]) {
      expect(chlorineBleaching('dry-paper', x).changed).toBe(0);
      expect(chlorineBleaching('flower', x, false).changed).toBe(0);
      expect(bleachColour(x)).not.toContain('NaN');
    }
  });
  it('keeps 24 same schematic sites through continuous shape changes', () => {
    for (let n = 0; n <= 100; n++) {
      const m = chlorineBleaching('wet-paper', n / 100);
      expect(m.units.map((x) => x.index)).toEqual(Array.from({ length: 24 }, (_, i) => i));
      expect(m.units.reduce((sum, u) => sum + u.change, 0) / 24).toBeCloseTo(m.changed);
    }
  });
  it('holds the unbleached initial comparison then finishes alongside the spoken observation', () => {
    expect(bleachingDirector(0, 0, 4, 'en').extent).toBe(0);
    expect(bleachingDirector(0, 0, 9, 'en').extent).toBe(1);
    expect(bleachingDirector(0, 0, 11.5, 'zh').extent).toBe(1);
    expect(bleachingDirector(2, 0, 16.3, 'zh').extent).toBe(1);
  });
});
