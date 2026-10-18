import { describe, it, expect } from 'vitest';
import { environments, integral, signal, fid, hydrogenGeometry } from './chem-nmr-hydrogen';
describe('proton environments and model NMR signals', () => {
  it('counts every hydrogen once and preserves 3:2:1 versus 6', () => {
    const e = environments('ethanol'),
      d = environments('ether');
    expect(e.map((g) => g.hydrogens.length)).toEqual([3, 2, 1]);
    expect(d.map((g) => g.hydrogens.length)).toEqual([6]);
    for (const m of ['ethanol', 'ether'] as const) {
      const ids = environments(m).flatMap((g) => g.hydrogens);
      expect(new Set(ids).size).toBe(6);
      expect(
        hydrogenGeometry(m)
          .atoms.filter((a) => a.element === 'H')
          .map((a) => a.id),
      ).toEqual(ids);
    }
    for (const g of e) expect(integral(-1e6, 1e6, [g])).toBeCloseTo(g.area, 5);
    expect(fid(0, e).real).toBe(6);
  });
  it('splits lines without changing integrated proton counts', () => {
    const g = environments('ethanol', 2.2, 0, true);
    expect(g.map((x) => x.lines.length)).toEqual([3, 4, 1]);
    expect(g.map((x) => x.lines.reduce((a, b) => a + b.area, 0))).toEqual([3, 2, 1]);
    expect((g[0].lines[1].shift - g[0].lines[0].shift) * 400).toBeCloseTo(7, 10);
    // Peak height depends on width, whereas integrated area does not.
    const changed = environments('ethanol', 2.2, 0, true, 12)[0];
    expect((changed.lines[1].shift - changed.lines[0].shift) * 400).toBeCloseTo(12, 10);
    const wide = { ...g[2], width: 0.2 };
    expect(signal(2.2, [wide])).toBeLessThan(signal(2.2, [g[2]]));
    expect(integral(-1e6, 1e6, [wide])).toBeCloseTo(1, 5);
  });
  it('moves or exchanges only OH without changing the carbon-bound proton evidence', () => {
    const initial = environments('ethanol'),
      moved = environments('ethanol', 4.8),
      exchanged = environments('ethanol', 2.2, 1);
    expect(moved.slice(0, 2)).toEqual(initial.slice(0, 2));
    expect(exchanged.slice(0, 2)).toEqual(initial.slice(0, 2));
    expect(exchanged[2].area).toBe(0);
    expect(fid(0, exchanged).real).toBe(5);
    expect(integral(-1e6, 1e6, exchanged)).toBeCloseTo(5, 5);
    expect(Math.hypot(...Object.values(fid(1, initial)))).toBeLessThan(0.001);
  });
});
