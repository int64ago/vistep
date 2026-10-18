import { expect, it } from 'vitest';
import {
  secretoryPopulation,
  secretoryCargo,
  cellProjection,
  erLumen,
  golgiLumen,
  groupTime,
  fusionGeometry,
  membranePoint,
  membraneMetric,
  transportCenter,
} from './bio-cellular-logistics';
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
it('matches textbook pulse-chase landmarks and conserves 24 identities', () => {
  expect(secretoryPopulation(3).counts.er).toBe(24);
  expect(secretoryPopulation(17).counts.golgi).toBe(24);
  expect(secretoryPopulation(117).counts.outside).toBe(24);
  for (let time = 0; time <= 120; time += 0.25) {
    const s = secretoryPopulation(time);
    expect(Object.values(s.counts).reduce((a, b) => a + b, 0)).toBe(24);
    expect(new Set(s.cargo.map((c) => c.id)).size).toBe(24);
  }
});
it('uses exactly the rendered ER and Golgi lumen curves', () => {
  for (let id = 0; id < 24; id++) {
    const group = Math.floor(id / 6),
      member = id % 6;
    for (const minutes of [0, 3, 7]) {
      const time = groupTime(group, minutes),
        u = 0.2 + member * 0.1 + ((1 - (0.2 + member * 0.1)) * time) / 8;
      expect(distance(secretoryCargo(id, minutes), erLumen(group, u))).toBeLessThan(1e-10);
    }
    for (const minutes of [17, 22, 30]) {
      const p = (groupTime(group, minutes) - 14) / 21,
        u = 0.15 + 0.79 * p + (member - 2.5) * 0.025 * Math.sin(Math.PI * p);
      expect(distance(secretoryCargo(id, minutes), golgiLumen(group, u))).toBeLessThan(1e-10);
    }
  }
});
it('has no positional jumps at any compartment boundary or rendered frame', () => {
  for (let id = 0; id < 24; id++) {
    const delay = Math.floor(id / 6) * 0.2;
    for (const event of [8, 14, 35, 108, 114])
      expect(
        distance(
          secretoryCargo(id, event + delay - 1e-6),
          secretoryCargo(id, event + delay + 1e-6),
        ),
      ).toBeLessThan(0.0001);
    for (let time = 0; time < 120; time += 0.05)
      expect(distance(secretoryCargo(id, time), secretoryCargo(id, time + 0.05))).toBeLessThan(1.1);
  }
});
it('derives matching opening endpoints and retains vesicle membrane inside the cell at every view', () => {
  for (let group = 0; group < 4; group++)
    for (let time = 108.05 + group * 0.2; time <= 120 + group * 0.2; time += 0.1) {
      const g = fusionGeometry(group, time);
      expect(g.active).toBe(true);
      expect(distance(g.arc[0], membranePoint(g.low))).toBeLessThan(1e-9);
      expect(distance(g.arc.at(-1)!, membranePoint(g.high))).toBeLessThan(1e-9);
      expect(membraneMetric(transportCenter(group, time))).toBeLessThanOrEqual(1.000001);
      for (const v of g.arc) expect(membraneMetric(v)).toBeLessThanOrEqual(1.000001);
      for (const angle of [-40, 0, 40]) {
        const a = g.arc[0],
          b = membranePoint(g.low);
        expect(cellProjection(a.x, a.y, a.z, angle).x).toBeCloseTo(
          cellProjection(b.x, b.y, b.z, angle).x,
        );
      }
    }
});
it('every cargo crossing of the plasma membrane occurs within its derived fusion opening', () => {
  for (let id = 0; id < 24; id++)
    for (let time = 108; time < 115; time += 0.01) {
      const a = secretoryCargo(id, time),
        b = secretoryCargo(id, time + 0.01);
      if (membraneMetric(a) <= 1 && membraneMetric(b) > 1) {
        const g = fusionGeometry(a.group, time),
          theta = Math.atan2(a.y / (108 / 0.88), a.x / 143);
        expect(g.active).toBe(true);
        expect(theta).toBeGreaterThan(g.low);
        expect(theta).toBeLessThan(g.high);
      }
    }
});
