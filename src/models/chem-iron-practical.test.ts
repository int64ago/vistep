import { describe, it, expect } from 'vitest';
import { IRON_PRACTICAL_CASES, ironPractical, ironPracticalDirector } from './chem-iron-practical';
describe('iron chapter-end practical', () => {
  it('conserves all tracked elements in every experiment and limit', () => {
    for (const c of IRON_PRACTICAL_CASES)
      for (const p of [0, 0.4, 1])
        for (const a of [0, 0.3, 1, 2]) {
          const m = ironPractical(c, p, a);
          expect(m.fe0 + m.fe2 + m.fe3).toBeCloseTo(m.initialIron);
          expect(m.cu0 + m.cu2).toBeCloseTo(m.initialCopper);
          expect(m.zn0 + m.zn2).toBeCloseTo(m.initialZinc);
          expect(m.iodide + 2 * m.iodine).toBeCloseTo(m.initialIodine);
          expect(m.mn7 + m.mn2).toBeCloseTo(m.initialManganese);
        }
  });
  it('preserves independent stoichiometric benchmarks', () => {
    expect(ironPractical('ferric-copper').cu2).toBe(0.5);
    expect(ironPractical('ferric-iodide').iodine).toBe(0.5);
    expect(ironPractical('permanganate').mn2).toBe(0.2);
    expect(ironPractical('iron-test').fe2).toBe(1.5);
  });
  it('distinguishes oxidation-state conversion from thiocyanate detection', () => {
    expect(ironPractical('ferric-test', 1, 1, false).red).toBeCloseTo(0);
    expect(ironPractical('ferric-test').red).toBeGreaterThan(0.5);
    expect(ironPractical('iron-test').red).toBeCloseTo(0);
    expect(ironPractical('iron-test', 1, 0.5).red).toBeGreaterThan(0);
  });
  it('waits for permanganate disappearance and adds starch later', () => {
    expect(ironPractical('permanganate', 1, 2).diagnostic).toBe(false);
    expect(ironPractical('permanganate').diagnostic).toBe(true);
    expect(ironPracticalDirector(2, 0.5).test).toBe(false);
    expect(ironPracticalDirector(2, 0.9).test).toBe(true);
  });
});
