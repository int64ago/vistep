import { expect, it } from 'vitest';
import {
  membraneUptake,
  lipidArrangement,
  membraneTracer,
  electronContrast,
  interfacePressure,
} from './bio-membrane-evidence';
it('compares permeability without allowing uptake beyond equilibrium', () => {
  expect(membraneUptake(0, true)).toBe(0);
  expect(membraneUptake(10, true)).toBeGreaterThan(membraneUptake(10, false));
  expect(membraneUptake(1e6, true)).toBe(1);
});
it('unfolds both leaflets with particle conservation and twice the molecular footprint', () => {
  const a = Array.from({ length: 40 }, (_, i) => lipidArrangement(i, 0)),
    b = a.map((p) => lipidArrangement(p.id, 1));
  expect(new Set(b.map((p) => p.id)).size).toBe(40);
  expect(new Set(a.map((p) => p.x)).size).toBe(20);
  expect(new Set(b.map((p) => p.x)).size).toBe(40);
  expect(b.every((p) => p.y === 0 && p.angle === 180)).toBe(true);
  // The model's surface is y=0, with water below it. Every final tail stays in air.
  for (const lipid of b) {
    expect(lipid.y + 24 * Math.cos((lipid.angle * Math.PI) / 180)).toBeLessThan(0);
  }
  // Reorientation is rigid: the tail length cannot shrink during extraction.
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const angle = (lipidArrangement(0, p).angle * Math.PI) / 180;
    expect(Math.hypot(24 * Math.sin(angle), 24 * Math.cos(angle))).toBeCloseTo(24);
  }
});
it('retains tracer origin on the membrane and reconstructs seeks', () => {
  for (let i = 0; i < 48; i++) {
    const p = membraneTracer(i, 40);
    expect(p.x * p.x + p.y * p.y).toBeCloseTo(1);
    expect(p.origin).toBe(i < 24 ? 'mouse' : 'human');
    expect(membraneTracer(i, 40)).toEqual(p);
    expect(membraneTracer(i, 40, false).angle).toBe(membraneTracer(i, 0).angle);
  }
});
it('separates image contrast from composition and obeys Laplace pressure scaling', () => {
  expect(electronContrast(2.3, 0.5)).toBeGreaterThan(electronContrast(0, 0.5));
  expect(electronContrast(-2.3, 0.5)).toBeCloseTo(electronContrast(2.3, 0.5));
  expect(interfacePressure(2, 4)).toBe(1);
  expect(interfacePressure(2, 8)).toBe(0.5);
});
