import { describe, expect, it } from 'vitest';
import {
  voronoiCells,
  voronoiCircumcenter,
  voronoiDistance,
  voronoiOwners,
  voronoiSites,
  voronoiWallRoute,
} from './voronoi';
describe('Euclidean Voronoi clipping', () => {
  it('matches nearest-owner inequalities across a dense independent point grid', () => {
    const cells = voronoiCells(voronoiSites);
    for (const cell of cells)
      for (const p of cell.polygon) {
        const d = voronoiDistance(
          p,
          voronoiSites.find((s) => s.id === cell.id)!,
        );
        for (const other of voronoiSites)
          expect(d).toBeLessThanOrEqual(voronoiDistance(p, other) + 1e-8);
      }
    for (let x = 1; x < 360; x += 7)
      for (let y = 1; y < 260; y += 7) {
        const query = { x, y },
          owner = voronoiOwners(query, voronoiSites).owners[0],
          poly = cells.find((c) => c.id === owner)!.polygon;
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i],
            b = poly[(i + 1) % poly.length];
          expect((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)).toBeGreaterThanOrEqual(-1e-8);
        }
      }
  });
  it('conserves rectangle area, handles duplicates without fake unique geometric ownership', () => {
    for (const sites of [voronoiSites, [...voronoiSites, { ...voronoiSites[0], id: 'E' }]]) {
      const cells = voronoiCells(sites),
        area = cells.reduce(
          (total, c) =>
            total +
            Math.abs(
              c.polygon.reduce((v, p, i) => {
                const q = c.polygon[(i + 1) % c.polygon.length];
                return v + p.x * q.y - p.y * q.x;
              }, 0),
            ) /
              2,
          0,
        );
      expect(area).toBeCloseTo(360 * 260, 8);
    }
    const duplicate = [voronoiSites[0], { ...voronoiSites[0], id: 'B' }];
    expect(voronoiCells(duplicate)[1].polygon).toEqual([]);
    expect(voronoiOwners({ x: 70, y: 70 }, duplicate).owners).toEqual(['A', 'B']);
  });
  it('finds a genuine shared edge and three-way vertex, with a collinear boundary', () => {
    const [a, b, c] = voronoiSites,
      mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    expect(voronoiOwners(mid, voronoiSites).owners).toEqual(['A', 'B']);
    const vertex = voronoiCircumcenter(a, b, c)!;
    expect(voronoiOwners(vertex, voronoiSites).owners).toEqual(['A', 'B', 'C']);
    expect(voronoiCircumcenter({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBeNull();
  });
  it('demonstrates a wall changing the nearest route rather than the straight-line diagram', () => {
    const query = { x: 135, y: 145 },
      [a, b] = voronoiSites,
      ra = voronoiWallRoute(query, a),
      rb = voronoiWallRoute(query, b);
    expect(voronoiDistance(query, a)).toBeLessThan(voronoiDistance(query, b));
    expect(ra.distance).toBeGreaterThan(rb.distance);
    expect(ra.points[1]).toEqual({ x: 100, y: 20 });
    expect(ra.distance).toBeCloseTo(Math.hypot(35, 125) + Math.hypot(25, 55), 12);
    expect(rb.points).toHaveLength(2);
    expect(voronoiWallRoute({ x: 50, y: 0 }, { x: 150, y: 0 }).points).toHaveLength(2);
  });
  it('rejects invalid geometry', () => {
    expect(() => voronoiCells([])).toThrow();
    expect(() => voronoiCells([voronoiSites[0], voronoiSites[0]])).toThrow();
    expect(() => voronoiOwners({ x: NaN, y: 0 }, voronoiSites)).toThrow();
    expect(() =>
      voronoiWallRoute({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, top: 2, bottom: 1 }),
    ).toThrow();
  });
});
