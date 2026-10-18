import { describe, it, expect } from 'vitest';
import {
  diamond,
  diamondA,
  diamondBulk,
  quartz,
  quartzBasis,
  quartzBulk,
  water,
  iodine,
  components,
  cleave,
  cutBonds,
  length,
  sub,
} from './chem-crystal-bonding';
const coords = (s: typeof diamond, id: string) => s.atoms.find((a) => a.id === id)!.p;
const distance = (s: typeof diamond, a: string, b: string) =>
  length(sub(coords(s, a), coords(s, b)));
describe('covalent connectivity versus molecular identity', () => {
  it('retains all nine I2 units and their internuclear distances through continuous separation', () => {
    for (let k = 0; k <= 100; k++) {
      const s = iodine(k / 100);
      expect(components(s).map((c) => c.length)).toEqual(Array(9).fill(2));
      for (const b of s.bonds.filter((b) => b.kind === 'covalent'))
        expect(distance(s, b.a, b.b)).toBeCloseTo(2.666, 10);
      if (k) {
        const prev = iodine((k - 1) / 100);
        for (const a of s.atoms) expect(length(sub(a.p, coords(prev, a.id)))).toBeLessThan(0.055);
      }
    }
    expect(
      iodine(1)
        .bonds.filter(
          (b) => b.kind !== 'covalent' && (b.a.startsWith('2:0') || b.b.startsWith('2:0')),
        )
        .every((b) => b.opacity === 0),
    ).toBe(true);
  });
  it('distinguishes five water molecules from the four hydrogen bonds around the selected molecule', () => {
    expect(components(water).map((c) => c.length)).toEqual([3, 3, 3, 3, 3]);
    expect(water.bonds.filter((b) => b.kind === 'hydrogen')).toHaveLength(4);
    const central = water.bonds.filter((b) => b.kind === 'covalent' && b.a === water.focus);
    expect(central).toHaveLength(2);
    for (const b of central) expect(distance(water, b.a, b.b)).toBeCloseTo(0.96, 10);
    const a = sub(coords(water, central[0].b), coords(water, water.focus)),
      b = sub(coords(water, central[1].b), coords(water, water.focus));
    expect(
      (Math.acos((a.x * b.x + a.y * b.y + a.z * b.z) / 0.96 ** 2) * 180) / Math.PI,
    ).toBeCloseTo(104.5, 8);
  });
  it('has diamond coordination four, 154 pm bonds and tetrahedral angles from a cubic lattice', () => {
    const bulk = diamondBulk(),
      bs = bulk.bonds.filter((b) => b.a === bulk.focus || b.b === bulk.focus);
    expect(bs).toHaveLength(4);
    expect(diamondA).toBeCloseTo(3.556477658, 8);
    const ns = bs.map((b) =>
      sub(coords(bulk, b.a === bulk.focus ? b.b : b.a), coords(bulk, bulk.focus)),
    );
    for (const n of ns) expect(length(n)).toBeCloseTo(1.54, 10);
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        expect((ns[i].x * ns[j].x + ns[i].y * ns[j].y + ns[i].z * ns[j].z) / 1.54 ** 2).toBeCloseTo(
          -1 / 3,
          10,
        );
    expect(components(diamond)).toHaveLength(1);
  });
  it('reconstructs published quartz coordinates with Si4 and O2 neighbours, not discrete SiO2', () => {
    expect(quartzBasis.filter((a) => a[0] === 'Si')).toHaveLength(3);
    expect(quartzBasis.filter((a) => a[0] === 'O')).toHaveLength(6);
    const bulk = quartzBulk();
    for (const a of bulk.atoms.filter((a) => a.id.startsWith('0:0:0:'))) {
      const bonds = bulk.bonds.filter((b) => b.a === a.id || b.b === a.id);
      expect(bonds).toHaveLength(a.element === 'Si' ? 4 : 2);
      for (const b of bonds) {
        expect(distance(bulk, b.a, b.b)).toBeGreaterThan(1.59);
        expect(distance(bulk, b.a, b.b)).toBeLessThan(1.63);
      }
    }
    expect(components(quartz)).toHaveLength(1);
  });
  it('only breaks crossing bonds and preserves intact bond lengths through cleavage', () => {
    expect(cutBonds.length).toBeGreaterThan(0);
    expect(cleave(0).broken).toBe(0);
    expect(cleave(1).broken).toBe(cutBonds.length);
    expect(components(diamond, cutBonds)).toHaveLength(2);
    for (let i = 0; i <= 100; i++) {
      const s = cleave(i / 100);
      for (const b of s.structure.bonds) {
        if (!cutBonds.some((c) => c.a === b.a && c.b === b.b))
          expect(distance(s.structure, b.a, b.b)).toBeCloseTo(1.54, 9);
        else if (s.gap > 0) expect(b.opacity).toBe(0);
      }
      if (i)
        for (const a of s.structure.atoms)
          expect(length(sub(a.p, coords(cleave((i - 1) / 100).structure, a.id)))).toBeLessThan(
            0.043,
          );
    }
  });
});
