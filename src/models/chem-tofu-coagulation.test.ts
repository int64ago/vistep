import { describe, it, expect } from 'vitest';
import {
  tofuNetwork,
  tofuBalance,
  tofuDirector,
  soyBeanRadius,
  tofuEdges,
} from './chem-tofu-coagulation';
describe('tofu material and network model', () => {
  it('conserves protein, other solids, water and coagulant separately', () => {
    for (const h of [0, 0.3, 1])
      for (const d of [0, 0.4, 1])
        for (const p of [0, 0.5, 1]) {
          const m = tofuBalance(h, d, p);
          for (const k of ['protein', 'other', 'water'] as const)
            expect(m.okara[k] + m.curd[k] + m.serum[k]).toBeCloseTo(m.input[k]);
          expect(m.curd.salt + m.serum.salt).toBeCloseTo(m.salt);
          expect(m.outputTotal).toBeCloseTo(m.inputTotal);
        }
  });
  it('does not equate visible filtration with dissolved-protein removal', () => {
    const m = tofuBalance(1, 1, 0);
    expect(m.milk.protein).toBe(36);
    expect(m.okara.protein).toBe(4);
    expect(m.proteinRecovery).toBeLessThan(0.9);
  });
  it('requires both thermal preparation and ion drive in this selected gel pathway', () => {
    expect(tofuNetwork(0, 1).gel).toBe(0);
    expect(tofuNetwork(1, 0).gel).toBe(0);
    expect(tofuNetwork(1, 1).gel).toBe(1);
    expect(tofuEdges.every((e) => e.a !== e.b && e.a >= 0 && e.b < 20)).toBe(true);
  });
  it('pressing transfers water rather than creating protein', () => {
    const a = tofuBalance(1, 1, 0),
      b = tofuBalance(1, 1, 1);
    expect(a.curd.protein).toBe(b.curd.protein);
    expect(a.curd.water - b.curd.water).toBeCloseTo(b.serum.water - a.serum.water);
    expect(b.curdMass).toBeLessThan(a.curdMass);
  });
  it('bounds inputs and reconstructs chapters', () => {
    expect(tofuBalance(NaN, Infinity, -1).network.gel).toBe(0);
    expect(soyBeanRadius(1) ** 3 / soyBeanRadius(0) ** 3).toBeCloseTo(2.8);
    expect(tofuDirector(4, 0.5)).toMatchObject({ heat: 1, dose: 0.5, press: 0 });
    expect(tofuDirector(99, 2)).toEqual(tofuDirector(6, 1));
  });
});
