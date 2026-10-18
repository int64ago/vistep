import { describe, it, expect } from 'vitest';
import {
  phenolBalance,
  carbonDioxide,
  bromination,
  substitutedSites,
  acidSolution,
  acidComparison,
  comparisonMarker,
  comparisonGeometry,
} from './chem-phenol-properties';
describe('phenol evidence', () => {
  it('solves charge, mass and neutral-phase capacity throughout base/acid reversal', () => {
    for (let b = 0; b <= 1.5; b += 0.05)
      for (const a of [0, 0.5, 1.2]) {
        const s = phenolBalance(b, a);
        expect(s.neutral + s.anion + s.separated).toBeCloseTo(s.total, 9);
        expect(s.h + s.charge - s.anion - s.oh).toBeCloseTo(0, 8);
        expect(s.neutral).toBeLessThanOrEqual(0.9776001);
      }
    expect(phenolBalance(0).separated).toBeGreaterThan(0);
    expect(phenolBalance(1.1).separated).toBe(0);
    expect(phenolBalance(1.1, 1.1).separated).toBeGreaterThan(0);
  });
  it('conserves every bromine and carbon skeleton and uses 2,4,6 sites', () => {
    for (const br of [0, 1, 3, 4.5])
      for (const p of [0, 0.4, 1]) {
        const s = bromination(br, p);
        expect(s.phenol + s.product).toBe(1);
        expect(2 * s.br2 + s.attachedBromine + s.hBr).toBeCloseTo(2 * br);
      }
    expect(substitutedSites().map((s) => s.id)).toEqual([2, 4, 6]);
    const c = carbonDioxide(0.8);
    expect(c.phenol + c.phenolate).toBe(1);
    expect(c.bicarbonate).toBe(c.phenol);
  });
  it('distinguishes carboxylic acids from phenol and rejects unwashed comparison', () => {
    expect(acidSolution('oxalic').co2Equivalent).toBe(0.02);
    expect(acidSolution('benzoic').pH).toBeLessThan(4);
    expect(acidSolution('phenol').co2Equivalent).toBe(0);
    expect(acidComparison(false, true, false).turbid).toBe(true);
    expect(acidComparison(false, true, true).turbid).toBe(false);
    expect(acidComparison(true, true, true).validCarbonicEvidence).toBe(true);
  });
  it('never teleports captured acid or CO2 between vessels in either layout', () => {
    for (const mobile of [false, true])
      for (const acetic of [false, true])
        for (const washed of [false, true]) {
          let prev = comparisonMarker(mobile, 0, acetic, washed);
          for (let n = 1; n <= 2000; n++) {
            const p = comparisonMarker(mobile, n / 2000, acetic, washed);
            expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(2);
            prev = p;
          }
          const g = comparisonGeometry(mobile),
            end = acetic && washed ? g.feed.at(-1)! : g.out.at(-1)!;
          expect(prev.x).toBeCloseTo(end.x);
          expect(prev.y).toBeCloseTo(end.y);
        }
  });
});
