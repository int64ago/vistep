import { describe, it, expect } from 'vitest';
import { redox, reagentPreparation, metalMarkers } from './chem-aldehyde-tests';
describe('aldehyde reducing tests', () => {
  it('conserves metal and transfers two electrons per oxidized ethanal', () => {
    for (const metal of ['silver', 'copper'] as const)
      for (const n of [0, 0.6, 2, 3])
        for (const p of [0, 0.4, 1]) {
          const r = redox(metal, 'ethanal', p, n);
          expect(r.oxidizedMetal + r.reducedMetal).toBeCloseTo(n);
          expect(r.electrons).toBeCloseTo(2 * r.carboxylate);
          expect(r.aldehyde + r.carboxylate).toBeCloseTo(1);
          expect(r.solidUnits).toBeCloseTo(metal === 'silver' ? 2 * r.carboxylate : r.carboxylate);
        }
  });
  it('keeps acetone negative and preparation distinct from silver deposition', () => {
    expect(redox('silver', 'acetone', 1).reducedMetal).toBe(0);
    expect(redox('copper', 'ethanal', 1, 2, false).solidUnits).toBe(0);
    expect(reagentPreparation(0.45).oxide).toBeCloseTo(1);
    expect(reagentPreparation(1).oxide).toBe(0);
    expect(reagentPreparation(1).complex).toBe(1);
  });
  it('keeps tracked atoms inside the tube and lands silver exactly on its inner walls', () => {
    for (const metal of ['silver', 'copper'] as const) {
      const ids = metalMarkers(metal, 0).map((x) => x.id);
      let prev = metalMarkers(metal, 0);
      for (let n = 1; n <= 1000; n++) {
        const v = metalMarkers(metal, n / 1000);
        expect(v.map((x) => x.id)).toEqual(ids);
        v.forEach((a, i) => {
          expect(a.x).toBeGreaterThanOrEqual(59);
          expect(a.x).toBeLessThanOrEqual(141);
          expect(Math.hypot(a.x - prev[i].x, a.y - prev[i].y)).toBeLessThan(0.2);
        });
        prev = v;
      }
      if (metal === 'silver') prev.forEach((p) => expect([59, 141]).toContain(p.x));
    }
  });
});
