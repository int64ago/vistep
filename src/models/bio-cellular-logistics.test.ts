import { expect, it } from 'vitest';
import {
  secretoryPopulation,
  secretoryCargo,
  cellProjection,
  erLumen,
  golgiLumen,
  groupTime,
  fusionGeometry,
  cellBoundaryFromFusions,
  membranePoint,
  membraneMetric,
  transportCenter,
  historicalLocalization,
  gatedProgress,
  routeClock,
  transportModel,
  lumenHandoff,
  cargoPermittedAtJunction,
  logisticsDirector,
  logisticsDurations,
} from './bio-cellular-logistics';
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
it('conserves 24 teaching identities along the retained geometric route', () => {
  expect(secretoryPopulation(0).counts.er).toBe(24);
  expect(secretoryPopulation(20).counts.golgi).toBe(24);
  expect(secretoryPopulation(120).counts.outside).toBe(24);
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

it('keeps three independent textbook sample diagrams immutable and marks both late locations', () => {
  const snapshots = [0, 1, 2].map(historicalLocalization);
  expect(snapshots.map((s) => s.minutes)).toEqual([3, 17, 117]);
  expect(new Set(snapshots.flatMap((s) => s.spots.map((p) => p.id))).size).toBe(38);
  expect(snapshots[2].locations.toSorted()).toEqual(['near-surface', 'outside']);
  for (const gate of [{}, { closeAt: 0 }, { closeAt: 0.245 }, { closeAt: 0, reopenAt: 0.8 }])
    transportModel(1.5, gate);
  expect([0, 1, 2].map(historicalLocalization)).toEqual(snapshots);
});
it('holds only arrivals at a closed ER exit and preserves every cohort identity', () => {
  expect(transportModel(1.5).counts.outside).toBe(24);
  expect(transportModel(1.5, { closeAt: 0 }).counts.er).toBe(24);
  expect(transportModel(1.5, { closeAt: 0.245 }).counts).toEqual({
    er: 12,
    golgi: 0,
    vesicle: 0,
    outside: 12,
  });
  expect(transportModel(2, { closeAt: 0, reopenAt: 0.8 }).counts.outside).toBe(24);
  for (const gate of [{}, { closeAt: 0 }, { closeAt: 0.245 }, { closeAt: 0, reopenAt: 0.8 }])
    for (let t = 0; t < 2; t += 0.01) {
      const s = transportModel(t, gate);
      expect(s.cargo.map((c) => c.id)).toEqual(Array.from({ length: 24 }, (_, i) => i));
      expect(Object.values(s.counts).reduce((a, b) => a + b, 0)).toBe(24);
    }
});
it('has continuous nondecreasing transport clocks across closure and recovery, with no retrograde reset', () => {
  for (const gate of [{ closeAt: 0.245 }, { closeAt: 0, reopenAt: 0.8 }])
    for (let g = 0; g < 4; g++)
      for (let t = 0; t < 2; t += 0.001) {
        const a = gatedProgress(g, t, gate).progress,
          b = gatedProgress(g, t + 0.001, gate).progress;
        expect(b - a).toBeGreaterThanOrEqual(-1e-12);
        expect(b - a).toBeLessThanOrEqual(0.00100001);
      }
  expect(routeClock(0.2)).toBe(8);
  expect(routeClock(0.36)).toBe(14);
  expect(routeClock(0.88)).toBe(108);
  for (const t of [0.2, 0.23, 0.8, 0.83])
    for (let id = 0; id < 24; id++)
      expect(
        distance(
          transportModel(t - 1e-7, { closeAt: 0, reopenAt: 0.8 }).cargo[id],
          transportModel(t + 1e-7, { closeAt: 0, reopenAt: 0.8 }).cargo[id],
        ),
      ).toBeLessThan(0.001);
});
it('closed docking cannot release cargo, while the same fusion geometry permits only opening crossings', () => {
  const closed = transportModel(1.5, {}, false);
  expect(closed.counts.outside).toBe(0);
  expect(closed.fusions.every((g) => !g.active)).toBe(true);
  for (let t = 0.88; t < 1.2; t += 0.001) {
    const a = transportModel(t),
      b = transportModel(t + 0.001);
    a.cargo.forEach((c, i) => {
      if (membraneMetric(c) <= 1 && membraneMetric(b.cargo[i]) > 1) {
        const f = a.fusions[c.group],
          theta = Math.atan2(c.y / (108 / 0.88), c.x / 143);
        expect(f.active).toBe(true);
        expect(theta).toBeGreaterThan(f.low);
        expect(theta).toBeLessThan(f.high);
      }
    });
  }
});
it('derives bud and fusion necks from the actual carrier circle and retains cargo in the connected space', () => {
  for (const kind of ['bud', 'fuse'] as const)
    for (let p = 0; p <= 1; p += 0.005) {
      const s = lumenHandoff(kind, p);
      expect(cargoPermittedAtJunction(s, s.cargo)).toBe(true);
      for (const endpoint of [s.arc[0], s.arc.at(-1)!]) {
        expect(endpoint.x).toBeCloseTo(s.wall, 10);
        expect(distance(endpoint, s.center)).toBeCloseTo(s.radius, 10);
      }
      expect(s.opening).toBeCloseTo(2 * Math.sqrt(s.radius ** 2 - (s.center.x - s.wall) ** 2), 8);
      if (Math.abs(s.cargo.x - s.wall) < 0.01) expect(s.connected).toBe(true);
    }
  expect(lumenHandoff('bud', 1).closedCarrier).toBe(true);
  expect(lumenHandoff('fuse', 0).closedCarrier).toBe(true);
  expect(lumenHandoff('fuse', 0).connected).toBe(false);
});
it('distinguishes evidence, inferred paths and explanatory model and handles finite boundaries', () => {
  expect(logisticsDirector(0, 28).shot).toBe('sample-summary');
  expect(logisticsDirector(1, 17).shot).toBe('inferred-route');
  expect(logisticsDirector(1, 24).shot).toBe('explanatory-cargo');
  for (const n of [NaN, Infinity, -1]) {
    expect(Number.isFinite(gatedProgress(0, n).progress)).toBe(true);
    expect(Number.isFinite(routeClock(n))).toBe(true);
    expect(historicalLocalization(n).spots.length).toBeGreaterThan(0);
  }
});

it('holds the actual fusion opening throughout both measured rotation phrases, then relaxes', () => {
  for (const [locale, start, end, complete] of [
    ['zh', 17.5, 20.4, 21.2],
    ['en', 18.2, 21.4, 22.2],
  ] as const) {
    const a = logisticsDirector(4, start, locale),
      b = logisticsDirector(4, end, locale);
    expect(a.shot).toBe('connected-fusion');
    expect(b.shot).toBe('connected-fusion');
    expect(a.structureFusion).toBeCloseTo(b.structureFusion);
    expect(a.rotation).not.toBe(b.rotation);
    const state = transportModel(a.structureFusion).fusions[0];
    expect(state.active).toBe(true);
    const middle = state.arc[Math.floor(state.arc.length / 2)];
    expect(membraneMetric(middle)).toBeLessThan(0.99);
    expect(logisticsDirector(4, complete, locale).structureFusion).toBe(1);
  }
});
it('shows the measured spoken referents, including earlier English inference and the short Golgi observation', () => {
  expect(logisticsDurations.reduce((a, b) => a + b, 0)).toBe(170);
  for (const locale of ['zh', 'en']) {
    expect(logisticsDirector(0, 15, locale).shot).toBe('sample-B');
    expect(logisticsDirector(0, 19, locale).sample).toBe(2);
    expect(logisticsDirector(0, 23, locale).shot).toBe('sample-summary');
    expect(logisticsDirector(2, 8, locale).shot).toBe('golgi-fusion');
    expect(logisticsDirector(2, 14, locale).shot).toBe('separate-compartments');
    expect(logisticsDirector(2, 20, locale).shot).toBe('secretory-carrier');
    expect(logisticsDirector(3, 15, locale).shot).toBe('block-question');
    expect(logisticsDirector(3, 26, locale).shot).toBe('early-block');
    expect(logisticsDirector(3, 30, locale).shot).toBe('late-block');
  }
  // The zh voice is still explaining the limits of three observations at20 s;
  // the en voice is already introducing the explanatory cargo model.
  expect(logisticsDirector(1, 20, 'zh').shot).toBe('inferred-route');
  expect(logisticsDirector(1, 20, 'en').shot).toBe('explanatory-cargo');
  expect(logisticsDirector(4, 13.4, 'en').shot).toBe('closed-contact');
  expect(logisticsDirector(4, 13.4, 'zh').shot).toBe('connected-fusion');
});
it('keeps measured local handoffs and each separate transport comparison monotonic', () => {
  for (const locale of ['zh', 'en']) {
    for (let t = 0; t < 39; t += 0.02) {
      const a = logisticsDirector(2, t, locale),
        b = logisticsDirector(2, t + 0.02, locale);
      if (a.shot === b.shot) expect(b.handoff).toBeGreaterThanOrEqual(a.handoff - 1e-12);
      const before = logisticsDirector(3, t, locale),
        after = logisticsDirector(3, t + 0.02, locale);
      expect(after.comparison).toBeGreaterThanOrEqual(before.comparison - 1e-12);
      expect(after.lateComparison).toBeGreaterThanOrEqual(before.lateComparison - 1e-12);
    }
    const blocked = transportModel(logisticsDirector(3, 28, locale).comparison, { closeAt: 0 });
    expect(blocked.counts.er).toBe(24);
    const late = transportModel(logisticsDirector(3, 34, locale).lateComparison, {
      closeAt: 0.245,
    });
    expect(late.counts).toEqual({ er: 12, golgi: 0, vesicle: 0, outside: 12 });
  }
});

it('uses the fused boundary for cytosol fill and leaves the open lumen on the exterior side', () => {
  const inside = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) => {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        result = !result;
    }
    return result;
  };
  for (const t of [110, 112, 114, 116]) {
    const f = fusionGeometry(0, t),
      boundary = cellBoundaryFromFusions([f]);
    const mid = f.arc[Math.floor(f.arc.length / 2)];
    const outward = { x: mid.x + 1, y: mid.y, z: 0 };
    expect(membraneMetric(outward)).toBeLessThan(1);
    expect(inside(outward, boundary)).toBe(false);
    expect(inside({ x: mid.x - 1, y: mid.y }, boundary)).toBe(true);
    expect(inside({ x: 0, y: 0 }, boundary)).toBe(true);
  }
  expect(cellBoundaryFromFusions([]).every((p) => Math.abs(membraneMetric(p) - 1) < 1e-10)).toBe(
    true,
  );
});
