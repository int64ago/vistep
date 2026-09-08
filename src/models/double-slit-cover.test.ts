import { describe, expect, it } from 'vitest';
import { doubleSlitAt } from './double-slit';
import { doubleSlitCover } from './double-slit-cover';

describe('double-slit cover geometry and receiving screen', () => {
  it('starts each coherent front at its own open aperture without snapping wave segments', () => {
    const cover = doubleSlitCover();
    const separation = cover.openings[1].y - cover.openings[0].y;
    for (const [i, opening] of cover.openings.entries()) {
      expect(opening.height / separation).toBeCloseTo(
        cover.parameters.slitWidthM / cover.parameters.separationM,
        12,
      );
      expect(cover.segments[i].bottom).toBeCloseTo(opening.y - opening.height / 2, 12);
      expect(cover.segments[i + 1].top).toBeCloseTo(opening.y + opening.height / 2, 12);
    }
    for (const front of cover.fronts) {
      const source = cover.openings[front.source];
      for (const point of front.points) {
        expect(Math.hypot(point.x - source.x, point.y - source.y)).toBeCloseTo(front.radius, 10);
        expect(point.x).toBeGreaterThan(source.x);
        expect(point.x).toBeLessThan(cover.target.x);
      }
    }
    const lengths = cover.openings.map((p) =>
      Math.hypot(cover.target.x - p.x, cover.target.y - p.y),
    );
    expect(lengths[0]).toBeCloseTo(lengths[1], 12);
  });

  it('preserves every visible interference null in a gap-free intensity sampling of the screen', () => {
    const cover = doubleSlitCover(),
      peak = doubleSlitAt(cover.parameters, 0).intensity;
    expect(peak).toBe(4);
    expect(cover.rows[0].lowerM).toBe(-cover.halfSpanM);
    expect(cover.rows.at(-1)!.upperM).toBe(cover.halfSpanM);
    for (const [i, row] of cover.rows.entries()) {
      expect(row.lowerM).toBeLessThan(row.yM + 1e-12);
      expect(row.upperM).toBeGreaterThan(row.yM - 1e-12);
      expect(row.intensity).toBeCloseTo(
        doubleSlitAt(cover.parameters, row.yM).intensity / peak,
        12,
      );
      if (i) expect(row.lowerM).toBe(cover.rows[i - 1].upperM);
    }
    expect(cover.nodes).toHaveLength(8);
    for (const yM of cover.nodes) {
      const row = cover.rows.find((row) => Math.abs(row.yM - yM) < 1e-12)!;
      expect(row.intensity).toBeLessThan(1e-24);
      expect(row.fill).toBe('rgb(6,18,27)');
      expect(row.lowerM).toBeLessThan(yM);
      expect(row.upperM).toBeGreaterThan(yM);
    }
    expect(cover.rows.find((row) => row.yM === 0)!.intensity).toBe(1);
  });

  it('keeps the apertures, continuous fronts and entire screen within catalog and social viewBox margins', () => {
    const cover = doubleSlitCover();
    const points = [
      ...cover.openings,
      ...cover.fronts.flatMap((front) => front.points),
      ...cover.rows.flatMap((row) => row.polygon),
      ...cover.screen,
    ];
    for (const point of points) {
      expect(Number.isFinite(point.x + point.y)).toBe(true);
      expect(point.x).toBeGreaterThan(28);
      expect(point.x).toBeLessThan(372);
      expect(point.y).toBeGreaterThan(28);
      expect(point.y).toBeLessThan(202);
    }
  });
});
