import { describe, it, expect } from 'vitest';
import {
  basisValue,
  gaussianOverlap,
  overlapField,
  ionicBookkeeping,
  ROCK_SALT_NEIGHBORS,
  basisAxes,
} from './chem-bond-overlap';
function integrate(f: (x: number, y: number, z: number) => number) {
  let sum = 0;
  const dx = 0.2;
  for (let x = -4 + dx / 2; x < 4; x += dx)
    for (let y = -4 + dx / 2; y < 4; y += dx)
      for (let z = -4 + dx / 2; z < 4; z += dx) sum += f(x, y, z) * dx ** 3;
  return sum;
}
describe('bond symmetry and electron accounts', () => {
  it('normalizes Gaussian s and p bases independently in3D', () => {
    for (const axis of [null, { x: 0, y: 1, z: 0 }])
      expect(integrate((x, y, z) => basisValue({ x, y, z }, axis) ** 2)).toBeCloseTo(1, 6);
  });
  it('matches analytic overlaps to independent volume integration', () => {
    for (const kind of ['ss', 'sp', 'sigma', 'pi'] as const) {
      const r = 1.8,
        [a, b] = basisAxes(kind);
      expect(
        integrate(
          (x, y, z) =>
            basisValue({ x: x + r / 2, y, z }, a) * basisValue({ x: x - r / 2, y, z }, b),
        ),
      ).toBeCloseTo(gaussianOverlap(kind, r), 6);
      expect(integrate((x, y, z) => overlapField(kind, r, x, y, z))).toBeCloseTo(1, 5);
    }
  });
  it('retains a pi nodal plane and zero orthogonal-p overlap', () => {
    expect(overlapField('pi', 1.8, 0, 0, 0)).toBe(0);
    expect(overlapField('pi', 1.8, 0, 1, 0)).toBeGreaterThan(0);
    expect(gaussianOverlap('pi', 1.8, Math.PI / 2)).toBeCloseTo(0, 12);
    expect(gaussianOverlap('ss', 8)).toBeLessThan(1e-10);
  });
  it('conserves electron count and has six equal-distance ionic neighbors', () => {
    for (const flag of [false, true]) {
      const s = ionicBookkeeping(flag);
      expect(s.naElectrons + s.clElectrons).toBe(28);
      expect(s.naCharge + s.clCharge).toBe(0);
    }
    expect(ROCK_SALT_NEIGHBORS.length).toBe(6);
    for (const p of ROCK_SALT_NEIGHBORS) expect(p.x * p.x + p.y * p.y + p.z * p.z).toBe(1);
  });
});
