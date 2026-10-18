import { describe, it, expect } from 'vitest';
import { foodIron, foodIronDirector, foodIronToken, foodIronMarkerPoint } from './chem-food-iron';
describe('food iron evidence', () => {
  it('conserves source iron through extraction and oxidation', () => {
    for (const r of [0, 0.25, 0.75, 1])
      for (const o of [0, 0.5, 1]) {
        const m = foodIron(r, o);
        expect(m.extracted + m.residue).toBe(24);
        expect(m.ferric + m.ferrous).toBeCloseTo(m.extracted);
      }
  });
  it('distinguishes failed recovery from no iron', () => {
    const a = foodIron(0),
      b = foodIron(1, 1, 1, false);
    expect(a.signal).toBe(0);
    expect(a.total).toBe(24);
    expect(b.total).toBe(0);
    expect(b.signal).toBe(0);
  });
  it('requires accessible ferric and reagent for signal', () => {
    expect(foodIron(0.75, 1, 0).signal).toBe(0);
    expect(foodIron(0.75, 0, 1).signal).toBeCloseTo(0.1875);
    expect(foodIron(0.75, 1, 1).signal).toBe(0.75);
  });
  it('keeps every recovered marker inside the funnel stem before entering the receiving liquid', () => {
    for (let id = 0; id < 18; id++) {
      for (const p of [0.35, 0.4, 0.45]) {
        const point = foodIronMarkerPoint(id, 0.75, p);
        expect(point.x).toBe(180);
        expect(point.y).toBeGreaterThanOrEqual(154);
        expect(point.y).toBeLessThanOrEqual(225);
        expect(point.collected).toBe(false);
      }
      const final = foodIronMarkerPoint(id, 0.75, 1);
      expect(final.x).toBeGreaterThan(118);
      expect(final.x).toBeLessThan(242);
      expect(final.y).toBeGreaterThan(260);
      expect(final.y).toBeLessThan(312);
      expect(final.collected).toBe(true);
    }
    expect(
      Array.from({ length: 24 }, (_, i) => foodIronMarkerPoint(i, 0.75, 1)).filter(
        (m) => m.collected,
      ),
    ).toHaveLength(18);
  });
  it('retains object identities and restores a chapter state', () => {
    expect(
      Array.from({ length: 24 }, (_, i) => foodIronToken(i, 0.75)).filter((t) => t.inFiltrate)
        .length,
    ).toBe(18);
    expect(foodIronDirector(3, 0).oxidation).toBe(1);
    expect(foodIronDirector(3, 0).scn).toBe(0);
  });
});
