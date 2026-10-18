import { describe, it, expect } from 'vitest';
import {
  methaneSubstitution,
  substitutionStep,
  methaneDirector,
} from './chem-methane-substitution';
describe('methane substitution bookkeeping', () => {
  it('preserves carbon, hydrogen and chlorine throughout every partial event', () => {
    for (const cl of [0, 1, 8, 12.5, 32])
      for (let i = 0; i <= 64; i++) {
        const m = methaneSubstitution(i / 64, true, cl);
        expect(m.atoms.C).toBeCloseTo(8, 12);
        expect(m.atoms.H).toBeCloseTo(32, 12);
        expect(m.atoms.Cl).toBeCloseTo(2 * cl, 12);
        expect(m.sites.every((n) => n >= 0 && n <= 4)).toBe(true);
        expect(m.products.every((n) => n >= 0)).toBe(true);
      }
  });
  it('keeps a fresh dark control unchanged', () => {
    const m = methaneSubstitution(1, false);
    expect(m.used).toBe(0);
    expect(m.products).toEqual([8, 0, 0, 0, 0]);
    expect(m.colour).toBe(1);
    expect(m.levelRise).toBe(0);
  });
  it('can yield several substituted classes without inventing extra chlorine', () => {
    const m = methaneSubstitution(1);
    expect(m.used).toBe(8);
    expect(m.products.filter((n) => n > 0).length).toBeGreaterThan(2);
    expect(m.hcl).toBe(8);
    const all = methaneSubstitution(1, true, 32);
    expect(all.products).toEqual([0, 0, 0, 0, 8]);
    expect(all.organicH).toBe(0);
  });
  it('a single substitution uses one Cl2 and produces one HCl', () => {
    for (let r = 0; r < 4; r++) {
      const s = substitutionStep(r);
      expect(s.before.H).toBe(s.after.H + s.hcl.H);
      expect(s.before.Cl + s.chlorineReactant).toBe(s.after.Cl + s.hcl.Cl);
      expect(s.after.C).toBe(s.before.C);
    }
  });
  it('has deterministic chapter boundaries', () => {
    expect(methaneDirector(0, 1).reactionProgress).toBe(0);
    expect(methaneDirector(2, 1).reactionProgress).toBe(1);
    expect(methaneSubstitution(0.75)).toEqual(methaneSubstitution(0.75));
  });
});
