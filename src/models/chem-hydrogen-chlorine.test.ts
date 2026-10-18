import { hydrogenChlorineFilmShot } from './chem-hydrogen-chlorine';
import { describe, it, expect } from 'vitest';
import { hydrogenChlorine, hclAtoms, hydrogenChlorineDirector } from './chem-hydrogen-chlorine';
describe('hydrogen chlorine reaction', () => {
  it('conserves atoms and has 1:1:2 stoichiometry', () => {
    for (const p of [0, 0.2, 1]) {
      const m = hydrogenChlorine(p);
      expect(m.hydrogenAtoms).toBe(2);
      expect(m.chlorineAtoms).toBe(2);
      expect(m.hydrogenChloride).toBe(2 * p);
    }
  });
  it('distinguishes invisible product gas from moisture-dependent fog', () => {
    const dry = hydrogenChlorine(1, false),
      wet = hydrogenChlorine(1, true);
    expect(dry.hydrogenChloride).toBe(wet.hydrogenChloride);
    expect(dry.fog).toBe(false);
    expect(wet.fog).toBe(true);
    expect(wet.flame).toBe(false);
  });
  it('uses the NIST formation enthalpy independently of moisture', () => {
    expect(hydrogenChlorine(1).enthalpyKJ).toBeCloseTo(2 * -92.31);
    expect(hydrogenChlorine(1, false).enthalpyKJ).toBe(hydrogenChlorine(1, true).enthalpyKJ);
  });
  it('retains four atom identities and correct final pairings', () => {
    const atoms = hclAtoms(1);
    expect(atoms.map((a) => a.id)).toEqual(['h1', 'h2', 'cl1', 'cl2']);
    expect(atoms[2].x - atoms[0].x).toBe(30);
    expect(atoms[3].x - atoms[1].x).toBe(30);
    expect(hydrogenChlorineDirector(1, 0).extent).toBe(1);
  });
});

it('holds the completed product while the narrated dry comparison removes the mist', () => {
  for (const locale of ['zh', 'en'] as const) {
    const wet = hydrogenChlorineFilmShot(1, 16, locale),
      dry = hydrogenChlorineFilmShot(1, 19, locale);
    expect(wet.extent).toBe(1);
    expect(dry.extent).toBe(wet.extent);
    expect(wet.moist).toBe(true);
    expect(dry.moist).toBe(false);
    expect(hydrogenChlorineFilmShot(2, 9, locale).extent).toBe(1);
  }
  for (const v of [NaN, Infinity, -Infinity]) {
    expect(hclAtoms(v).every((a) => Number.isFinite(a.x) && Number.isFinite(a.y))).toBe(true);
    expect(Number.isFinite(hydrogenChlorineFilmShot(v, v).extent)).toBe(true);
  }
});
