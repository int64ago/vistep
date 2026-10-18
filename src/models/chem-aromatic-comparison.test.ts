import { describe, it, expect } from 'vitest';
import {
  partition,
  oxidize,
  ringGeometry,
  tracer,
  tubeInterface,
} from './chem-aromatic-comparison';
describe('arene extraction versus chemical consumption', () => {
  it('conserves bromine while phase concentrations approach the chosen partition ratio', () => {
    for (const k of [0, 1, 8, 12])
      for (const vo of [0.2, 1, 3]) {
        const s = partition(1, vo, 1, k);
        expect(s.organic + s.water).toBeCloseTo(1, 12);
        expect(s.consumed).toBe(0);
        expect(s.organicConcentration / s.waterConcentration).toBeCloseTo(k, 10);
      }
    expect(partition(1, 1, 1, 8, 0).organic).toBe(0);
    expect(partition().organic).toBeCloseTo(8 / 9);
    for (const v of [0.4, 1, 2.5]) {
      const area = 88 * (tubeInterface(v) - 60),
        total = 88 * (247 - 60) + 2640;
      expect(area / (total - area)).toBeCloseTo(v, 12);
    }
    expect(partition(1, 3).organic).toBeGreaterThan(partition(1, 0.2).organic);
  });
  it('balances the 5:6 acidic oxidation and leaves benzene/no-benzylic-H counterexamples unchanged', () => {
    const x = oxidize('toluene', 1);
    expect(x.permanganate).toBeCloseTo(0, 12);
    expect(x.arene + x.benzoicAcid).toBe(1);
    expect(x.manganeseII + x.permanganate).toBeCloseTo(0.6);
    expect(x.benzoicAcid * 6).toBeCloseTo(x.manganeseII * 5);
    for (const kind of ['benzene', 'tertbutyl'] as const) {
      const a = oxidize(kind, 1);
      expect(a.extent).toBe(0);
      expect(a.permanganate).toBe(0.6);
    }
    expect(oxidize('toluene', 1, 0.6, 0).extent).toBe(0);
  });
  it('keeps equal ring bonds and a continuously tracked intact Br2 marker', () => {
    const r = ringGeometry();
    for (let i = 0; i < 6; i++)
      expect(Math.hypot(r[i].x - r[(i + 1) % 6].x, r[i].y - r[(i + 1) % 6].y)).toBeCloseTo(43, 10);
    let prev = tracer(0);
    for (let i = 1; i <= 1000; i++) {
      const x = tracer(i / 1000);
      expect(x.atoms).toEqual(prev.atoms);
      expect(x.atoms[1].offset - x.atoms[0].offset).toBe(12);
      expect(Math.hypot(x.x - prev.x, x.y - prev.y)).toBeLessThan(0.2);
      prev = x;
    }
    expect(tracer(0).y).toBeGreaterThan(165);
    expect(tracer(1).y).toBeLessThan(165);
  });
});
