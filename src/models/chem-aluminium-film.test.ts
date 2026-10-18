import { describe, it, expect } from 'vitest';
import { aluminiumFilm, aluminiumDirector } from './chem-aluminium-film';
describe('aluminium film', () => {
  it('oxide consumes acid without producing hydrogen', () => {
    const m = aluminiumFilm('acid', 0.1, 0.3);
    expect(m.oxideConsumed).toBeCloseTo(0.05);
    expect(m.hydrogen).toBe(0);
    expect(m.dissolvedAl).toBeCloseTo(0.1);
  });
  it('gives the independent metal hydrogen and reagent benchmarks', () => {
    const a = aluminiumFilm('acid', 0.1, 3.6),
      b = aluminiumFilm('base', 0.1, 1.2);
    for (const m of [a, b]) {
      expect(m.hydrogen).toBeCloseTo(1.5);
      expect(m.dissolvedAl).toBeCloseTo(1.2);
    }
    expect(a.reagentUsed).toBeCloseTo(3.6);
    expect(b.reagentUsed).toBeCloseTo(1.2);
  });
  it('bare metal produces gas before coated comparison in the ideal sequence', () => {
    expect(aluminiumFilm('base', 0.1, 1.2, 0.1).hydrogen).toBe(0);
    expect(aluminiumFilm('base', 0, 1.2, 0.1).hydrogen).toBeGreaterThan(0);
  });
  it('conserves aluminium and reagent at boundaries and direct seeks', () => {
    for (const medium of ['acid', 'base'] as const)
      for (const film of [0, 0.1, 0.3])
        for (const r of [0, 0.1, 1, 5])
          for (const p of [0, 0.2, 1]) {
            const m = aluminiumFilm(medium, film, r, p);
            expect(m.initialAl).toBeCloseTo(m.finalAl);
            expect(m.reagentUsed + m.reagentLeft).toBeCloseTo(r);
            expect(m.hydrogen).toBeLessThanOrEqual(1.5);
          }
    expect(aluminiumDirector(0, 1).progress).toBeCloseTo(1 / 6);
    expect(aluminiumDirector(2, 0).medium).toBe('base');
  });
});
