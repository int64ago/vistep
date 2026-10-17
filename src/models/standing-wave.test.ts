import { describe, it, expect } from 'vitest';
import { standingDefault, standingWave, standingNodes, standingShot } from './standing-wave';
describe('standing wave', () => {
  it('obeys both fixed endpoints for all modes and times', () => {
    for (let mode = 1; mode <= 5; mode++)
      for (const time of [0, 0.031, 0.41]) {
        const c = { ...standingDefault, mode };
        expect(standingWave(c, 0, time).displacement).toBeCloseTo(0, 12);
        expect(standingWave(c, 1, time).displacement).toBeCloseTo(0, 12);
      }
  });
  it('preserves every node', () => {
    for (const n of standingNodes(standingDefault))
      expect(standingWave(standingDefault, n, 0.037).displacement).toBeCloseTo(0, 12);
  });
  it('sums its two traveling fields', () => {
    const s = standingWave(standingDefault, 0.23, 0.071);
    expect(s.displacement).toBe(s.incident + s.reflected);
  });
  it('conserves integrated energy', () => {
    const energy = (time: number) =>
      Array.from(
        { length: 1000 },
        (_, i) => standingWave(standingDefault, (i + 0.5) / 1000, time).energy,
      ).reduce((a, b) => a + b) / 1000;
    expect(energy(0)).toBeCloseTo(energy(0.013), 10);
  });
  it('follows square-root tension scaling', () => {
    expect(
      standingWave({ ...standingDefault, tension: 16 }, 0, 0).frequency /
        standingWave(standingDefault, 0, 0).frequency,
    ).toBeCloseTo(2);
  });
  it('reconstructs every chapter', () => {
    for (let i = 0; i < 8; i++) expect(standingShot(i, 0.6)).toEqual(standingShot(i, 0.6));
  });
});
