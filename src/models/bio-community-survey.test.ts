import { it, expect } from 'vitest';
import {
  wetlandBirds,
  habitatBreadth,
  coreVolumeMl,
  coreState,
  soilExtraction,
  extractionCounts,
  aspiratorState,
  aspiratorPath,
  successionState,
  groupedRecord,
} from './bio-community-survey';
it('preserves the exact textbook table without converting stomach contents into nutritional intake', () => {
  expect(wetlandBirds.map((b) => b.count)).toEqual([2120, 1513, 1678, 1517]);
  for (const b of wetlandBirds) {
    expect(b.habitat.reduce((a, b) => a + b, 0)).toBe(100);
    expect(b.contents.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  }
  expect(wetlandBirds[2].contents[4]).toBe(25);
  expect(habitatBreadth(wetlandBirds[3].habitat)).toBeGreaterThan(
    habitatBreadth(wetlandBirds[1].habitat),
  );
});
it('derives the approximate100mL sampling volume from cylinder dimensions', () => {
  expect(coreVolumeMl()).toBeCloseTo(98.17477042);
  expect(coreVolumeMl(0, 5)).toBe(0);
  expect(coreState(0.4).top).toBe(110);
  expect(coreState(1).top).toBe(35);
});
it('preserves extracted identities and makes light response affect detection', () => {
  expect(soilExtraction(0).map((c) => c.id)).toEqual(soilExtraction(1).map((c) => c.id));
  expect(extractionCounts(1)).toEqual({
    counts: { mite: 8, springtail: 6, unknown: 4 },
    total: 18,
    groups: 3,
  });
  expect(extractionCounts(1, false).total).toBe(0);
  expect(extractionCounts(0.65).groups).toBeLessThan(3);
});
it('routes every specimen through mesh openings, funnel and actual neck', () => {
  for (let i = 0; i <= 1000; i++)
    for (const c of soilExtraction(i / 1000)) {
      if (c.y >= 146 && c.y <= 156)
        expect((c.x + 24) / 8).toBeCloseTo(Math.round((c.x + 24) / 8), 5);
      if (c.y > 156 && c.y < 218) {
        const half = 50 - ((c.y - 156) * 43) / 62;
        expect(Math.abs(c.x) + 3.5).toBeLessThan(half);
      }
      if (c.y >= 218 && c.y <= 249) expect(Math.abs(c.x) + 3.5).toBeLessThan(7);
      if (c.collected) {
        expect(Math.abs(c.x) + 3.5).toBeLessThan(20);
        expect(c.y).toBeGreaterThan(277);
      }
    }
});
it('aspirated animals end inside the collecting vial, never in its air outlet', () => {
  expect(aspiratorState(0)).toMatchObject({ x: -90, y: 246, collected: false });
  expect(aspiratorState(1).x).toBeCloseTo(-12);
  expect(aspiratorState(1).y).toBeCloseTo(229);
  expect(aspiratorState(1).collected).toBe(true);
  expect(aspiratorState(1, false)).toMatchObject({ x: -90, y: 246 });
  expect(aspiratorPath.at(-2)).toEqual([-20, 185]);
});
it('distinguishes retained substrate and propagules and rejects an inevitable forest endpoint', () => {
  const p = successionState(0),
    s = successionState(0, true);
  expect(p.soil).toBe(0);
  expect(s.soil).toBe(0.65);
  expect(s.seedBank).toBe(0.8);
  expect(successionState(0.35, true).tree).toBeGreaterThan(successionState(0.35).tree);
  expect(successionState(1, false, 0.25).tree).toBe(0);
  for (let i = 0; i < 101; i++)
    for (const k of ['soil', 'pioneer', 'herb', 'shrub', 'tree'] as const) {
      const v = successionState(i / 100)[k];
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  expect(successionState(1).pioneer).toBeGreaterThan(0);
});
it('does not count missing observations as zero or broad groups as species', () => {
  expect(groupedRecord([null, null, null])).toEqual({ recorded: 0, total: 0, groups: 0 });
  expect(groupedRecord([8, 6, 4])).toEqual({ recorded: 3, total: 18, groups: 3 });
  expect(groupedRecord([0, null, 4])).toEqual({ recorded: 2, total: 4, groups: 1 });
});
