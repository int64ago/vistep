import { describe, it, expect } from 'vitest';
import {
  shapeMolecule,
  shapeDot,
  shapeNorm,
  shapeUnit,
  shapeDipoles,
  shapeProject,
  SHAPE_TETRA,
  balloonSurface,
  shapeDirector,
} from './chem-molecular-shapes';
describe('molecular geometry from textbook inputs', () => {
  it('reproduces independent book bond-length and angle benchmarks', () => {
    const benchmark: [string, number, number | null][] = [
      ['carbon-dioxide', 1.16, 180],
      ['water', 0.96, 105],
      ['ammonia', 1.01, 107],
      ['methane', 1.09, (Math.acos(-1 / 3) * 180) / Math.PI],
    ];
    for (const [key, length, angle] of benchmark) {
      const m = shapeMolecule(key),
        a = m.atoms[1],
        b = m.atoms[2];
      expect(shapeNorm(a)).toBeCloseTo(length, 10);
      expect(
        (Math.acos(Math.max(-1, Math.min(1, shapeDot(shapeUnit(a), shapeUnit(b))))) * 180) /
          Math.PI,
      ).toBeCloseTo(angle!, 9);
      expect(m.bonds.length + m.lonePairs.length).toBe(m.domains);
    }
    for (const [k, l] of [
      ['hydrogen', 0.74],
      ['chlorine', 1.98],
    ] as const) {
      const a = shapeMolecule(k).atoms;
      expect(a[1].x - a[0].x).toBe(l);
    }
  });
  it('distinguishes molecular shape, electron domains and bond order', () => {
    expect(shapeMolecule('carbon-dioxide').bonds.reduce((n, b) => n + b.order, 0)).toBe(4);
    expect(shapeMolecule('carbon-dioxide').domains).toBe(2);
    expect(shapeMolecule('water').lonePairs).toHaveLength(2);
    expect(shapeMolecule('ammonia').lonePairs).toHaveLength(1);
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        expect(shapeDot(SHAPE_TETRA[i], SHAPE_TETRA[j])).toBeCloseTo(-1 / 3, 12);
  });
  it('cancels symmetric bond vectors but preserves bent and substituted resultants under rotation', () => {
    for (const key of ['carbon-dioxide', 'methane'])
      expect(shapeDipoles(shapeMolecule(key)).magnitude).toBeLessThan(1e-14);
    const w = shapeDipoles(shapeMolecule('water'));
    expect(w.magnitude).toBeCloseTo(2 * Math.cos((52.5 * Math.PI) / 180), 12);
    expect(w.resultant.y).toBeLessThan(0);
    const c = shapeDipoles(shapeMolecule('chloromethane'));
    expect(c.magnitude).toBeCloseTo(1.6, 12);
    expect(c.resultant.y).toBeLessThan(0);
    expect(shapeNorm(shapeProject(w.resultant, 1.7, 0.9))).toBeCloseTo(w.magnitude, 12);
  });
  it('keeps balloon necks tied, tips finite, and watch endpoints independent of exploration', () => {
    for (const d of SHAPE_TETRA)
      for (const t of [0, 0.1, 0.5, 1])
        for (const a of [0, 1, 3])
          expect(Number.isFinite(shapeNorm(balloonSurface(d, t, a)))).toBe(true);
    for (const d of SHAPE_TETRA) expect(shapeNorm(balloonSurface(d, 0, 2))).toBeCloseTo(0.06, 12);
    expect(shapeDirector(0, 0).key).toBe('hydrogen');
    expect(shapeDirector(0, 1).key).toBe('chlorine');
    expect(shapeDirector(9, 0).key).toBe('methane');
    expect(shapeDirector(9, 1).key).toBe('chloromethane');
  });
});
