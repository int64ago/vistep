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
