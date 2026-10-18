import { describe, it, expect } from 'vitest';
import {
  cellSites,
  sharingCells,
  penrose,
  penrosePoints,
  triangleArea,
  structureIntensity,
  planarPoints,
  powderPoints,
  debyeCurve,
  refineHistory,
  fitLoss,
  artemisinin,
  artemisininBonds,
  atomDistance,
  atomAngle,
  rotate,
} from './chem-crystal-diffraction';
describe('crystal counting and diffraction', () => {
  it('derives shared fractions from adjacent cell counts and checks Cu/NaCl', () => {
    for (const [k, n] of [
      ['corner', 8],
      ['edge', 4],
      ['face', 2],
      ['inside', 1],
    ] as const) {
      const a = sharingCells(k);
      expect(a.cells).toHaveLength(n);
      expect(a.weight * n).toBe(1);
    }
    const cu = cellSites();
    expect(cu).toHaveLength(14);
    expect(cu.reduce((n, a) => n + a.weight, 0)).toBe(4);
    for (const s of ['Na', 'Cl'])
      expect(
        cellSites('nacl')
          .filter((a) => a.species === s)
          .reduce((n, a) => n + a.weight, 0),
      ).toBe(4);
  });
  it('Robinson subdivision conserves area and generates distinct golden triangles', () => {
    const area = penrose(0).reduce((s, t) => s + triangleArea(t), 0);
    for (let i = 1; i <= 4; i++)
      expect(penrose(i).reduce((s, t) => s + triangleArea(t), 0)).toBeCloseTo(area, 10);
    const pts = penrosePoints();
    expect(pts.length).toBeGreaterThan(100);
    for (const p of pts) {
      const a = (Math.PI * 2) / 5,
        x = p.x * Math.cos(a) - p.y * Math.sin(a),
        y = p.x * Math.sin(a) + p.y * Math.cos(a);
      expect(pts.some((q) => Math.hypot(x - q.x, y - q.y) < 1e-7)).toBe(true);
    }
  });
  it('actual amplitude sum gives Bragg peaks, Friedel symmetry and translation invariance', () => {
    const a = planarPoints();
    expect(structureIntensity(a, 1, 0)).toBeCloseTo(1, 12);
    expect(structureIntensity(a, 0.5, 0)).toBeCloseTo(1 / 121, 12);
    for (const q of [
      [0.23, 0.7],
      [1.13, -0.3],
    ]) {
      expect(structureIntensity(a, q[0], q[1])).toBeCloseTo(
        structureIntensity(a, -q[0], -q[1]),
        12,
      );
      expect(structureIntensity(a, q[0], q[1])).toBeCloseTo(
        structureIntensity(
          a.map((p) => ({ x: p.x + 0.27, y: p.y + 0.81 })),
          q[0],
          q[1],
        ),
        12,
      );
    }
    expect(structureIntensity(planarPoints(1), 1, 0)).toBeLessThan(0.05);
  });
  it('random comparisons retain count and minimum separations, powder uses distances', () => {
    const p = planarPoints(1),
      v = powderPoints(1);
    expect(p).toHaveLength(121);
    expect(v).toHaveLength(125);
    for (let i = 0; i < p.length; i++)
      for (let j = 0; j < i; j++)
        expect(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)).toBeGreaterThan(0.58);
    const a = debyeCurve(powderPoints(), 30),
      b = debyeCurve(
        powderPoints().map((p) => rotate(p, 0.7)),
        30,
      );
    a.forEach((v, i) => expect(v.intensity).toBeCloseTo(b[i].intensity, 11));
  });
  it('one-parameter refinement really reduces intensity residual with a stable fixed target', () => {
    const h = refineHistory();
    for (let i = 1; i < h.length; i++) expect(h[i].loss).toBeLessThanOrEqual(h[i - 1].loss + 1e-12);
    expect(h.at(-1)!.distance).toBeCloseTo(1.21, 3);
    expect(fitLoss(1.21)).toBeLessThan(1e-10);
    expect(fitLoss(1.75)).toBeGreaterThan(0.02);
  });
  it('published heavy-atom geometry reproduces independent bond/angle table', () => {
    expect(artemisinin.filter((v) => v.element === 'C')).toHaveLength(15);
    expect(artemisinin.filter((v) => v.element === 'O')).toHaveLength(5);
    expect(artemisininBonds).toHaveLength(23);
    expect(atomDistance('O1', 'O2')).toBeCloseTo(1.492, 2);
    expect(atomDistance('O5', 'C12')).toBeCloseTo(1.194, 2);
    expect(atomAngle('C4', 'O1', 'O2')).toBeCloseTo(109.1, 0);
  });
});
