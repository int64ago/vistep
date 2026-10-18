import { describe, it, expect } from 'vitest';
import { metalRoutes, metalExtraction, metalAtomMap, metalDirector } from './chem-metal-extraction';
describe('metallurgy accounting', () => {
  it('conserves every element in all six textbook routes', () => {
    for (const route of metalRoutes) {
      const m = metalExtraction(route, 1);
      expect(m.outputAtoms).toEqual(m.inputAtoms);
      expect(m.electronsAccepted).toBe(m.electronsReleased);
    }
  });
  it('pins electron and product stoichiometry independently', () => {
    expect(metalExtraction('carbon-monoxide', 1)).toMatchObject({
      electronsAccepted: 6,
      metalProduced: 2,
    });
    expect(metalExtraction('aluminium-electrolysis', 1)).toMatchObject({
      electronsAccepted: 12,
      metalProduced: 4,
    });
    expect(metalExtraction('magnesium', 1)).toMatchObject({
      electronsAccepted: 2,
      metalProduced: 1,
    });
  });
  it('requires electrical and molten conditions for the selected ionic route', () => {
    expect(metalExtraction('sodium', 1, { power: false }).extent).toBe(0);
    expect(metalExtraction('sodium', 1, { molten: false }).extent).toBe(0);
    expect(metalExtraction('mercury', 1, { heat: false }).extent).toBe(0);
  });
  it('tracks each atom identity through illustrative rearrangement', () => {
    for (const r of metalRoutes) {
      const a = metalAtomMap(r, 0),
        b = metalAtomMap(r, 1);
      expect(a.map((n) => [n.id, n.element])).toEqual(b.map((n) => [n.id, n.element]));
      expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
      for (const atom of [...a, ...b]) {
        expect(atom.x).toBeGreaterThanOrEqual(20);
        expect(atom.x).toBeLessThanOrEqual(300);
        expect(atom.y).toBeLessThanOrEqual(260);
      }
    }
  });
  it('keeps atom labels distinct during the pedagogical rearrangement', () => {
    for (const r of metalRoutes)
      for (const p of [0.2, 0.4, 0.6, 0.8]) {
        const a = metalAtomMap(r, p);
        for (let i = 0; i < a.length; i++)
          for (let j = i + 1; j < a.length; j++)
            expect(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y)).toBeGreaterThan(32);
      }
  });
  it('bounds progress and reconstructs the overview', () => {
    expect(metalExtraction('sodium', Infinity).extent).toBe(0);
    expect(metalDirector(0, 0.9).progress).toBe(0);
    expect(metalDirector(99, 2)).toEqual(metalDirector(6, 1));
  });
});
