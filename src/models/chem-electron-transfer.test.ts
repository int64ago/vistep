import { describe, it, expect } from 'vitest';
import {
  electronLedger,
  transferPosition,
  bondDensity,
  electronDirector,
} from './chem-electron-transfer';
describe('electron allocation', () => {
  it('preserves eight tracked valence electrons and neutral total charge', () => {
    for (const type of ['ionic', 'polar'] as const)
      for (const formed of [false, true]) {
        const s = electronLedger(type, formed);
        expect(s.assignedLeft + s.assignedRight).toBe(8);
        expect(s.leftOxidation + s.rightOxidation).toBe(0);
      }
  });
  it('distinguishes covalent sharing from ionic transfer despite equal formal oxidation states', () => {
    const ionic = electronLedger('ionic', true),
      polar = electronLedger('polar', true);
    expect(polar.sharedPair).toBe(2);
    expect(ionic.sharedPair).toBe(0);
    expect(polar.leftOxidation).toBe(1);
    expect(polar.rightOxidation).toBe(-1);
  });
  it('preserves tracked electron endpoints and a bounded schematic cloud', () => {
    expect(transferPosition(0).x).toBe(163);
    expect(transferPosition(1).x).toBe(402);
    expect(bondDensity(0.64, 1)).toBe(1);
    expect(bondDensity(0.75, 1)).toBeGreaterThan(bondDensity(0.25, 1));
    expect(electronDirector(2, 0.5).bond).toBe('polar');
  });
});
