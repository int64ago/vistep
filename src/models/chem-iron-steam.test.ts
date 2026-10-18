import { describe, it, expect } from 'vitest';
import { ironSteam, ironSteamDirector, steamPoint } from './chem-iron-steam';
describe('steam over hot iron', () => {
  it('conserves total mass and 3:4:1:4 stoichiometry', () => {
    for (const p of [0, 0.3, 1]) {
      const m = ironSteam(1, 0.5, p);
      expect(m.massAfter).toBeCloseTo(m.massBefore, 12);
      expect(m.hydrogen).toBeCloseTo(4 * m.oxide);
      expect(m.ironLeft + 3 * m.oxide).toBeCloseTo(1 / 55.845);
    }
  });
  it('gives the independent one-gram iron yield and respects water limitation', () => {
    const m = ironSteam();
    expect(m.oxideGrams).toBeCloseTo((3 * 55.845 + 4 * 15.999) / (3 * 55.845));
    expect(m.hydrogen).toBeCloseTo(4 / (3 * 55.845));
    expect(ironSteam(1, 0.05).hydrogen).toBeCloseTo(0.05 / (2 * 1.008 + 15.999));
  });
  it('requires both reactants and the demonstrated hot condition', () => {
    expect(ironSteam(1, 0.5, 1, false).hydrogen).toBe(0);
    expect(ironSteam(0, 0.5).hydrogen).toBe(0);
    expect(ironSteam(1, 0).hydrogen).toBe(0);
  });
  it('rebuilds gas evidence and keeps tube paths connected', () => {
    expect(ironSteamDirector(2, 0)).toMatchObject({ test: true, extent: 1, hot: true });
    expect(
      steamPoint(
        [
          [0, 0],
          [20, 0],
          [20, 30],
        ],
        0.5,
      ),
    ).toEqual({ x: 20, y: 5 });
  });
});
