import { describe, expect, it } from 'vitest';
import { atomicBombCover } from './atomic-bomb-cover';
import { multiplication } from './atomic-bomb';

describe('fission cover geometry', () => {
  it('keeps every projected track inside the section and every leak on its rim', () => {
    const cover = atomicBombCover(),
      { cx, cy, r } = cover.sphere;
    expect(cover.tracks.length).toBeGreaterThan(40);
    for (const track of cover.tracks)
      for (const p of track.points)
        expect(Math.hypot(p.x - cx, p.y - cy)).toBeLessThanOrEqual(r + 1e-6);
    expect(cover.leaks.length).toBeGreaterThan(3);
    for (const p of cover.leaks)
      expect(Math.hypot(p.x - cx, p.y - cy)).toBeLessThanOrEqual(r + 1e-6);
    expect(cover.bursts.length).toBeGreaterThan(10);
    for (const b of cover.bursts) expect(Math.hypot(b.x - cx, b.y - cy)).toBeLessThan(r);
    expect(cover.heads.length).toBeGreaterThan(0);
  });
  it('places the marker on the multiplication curve above the k = 1 line', () => {
    const cover = atomicBombCover();
    const ys = cover.curve.map((p) => p.y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeLessThanOrEqual(ys[i - 1] + 1e-9);
    expect(cover.marker.y).toBeLessThan(cover.unity.y);
    expect(cover.critical.y).toBeCloseTo(cover.unity.y, 9);
    const near = cover.curve.reduce((best, p) =>
      Math.abs(p.x - cover.marker.x) < Math.abs(best.x - cover.marker.x) ? p : best,
    );
    expect(Math.abs(near.y - cover.marker.y)).toBeLessThan(2);
    expect(multiplication(cover.chain.radius)).toBeGreaterThan(1);
    for (const m of cover.bindingMarks) {
      expect(m.x).toBeGreaterThanOrEqual(cover.graph.left);
      expect(m.x).toBeLessThanOrEqual(cover.graph.right);
    }
    for (const p of [...cover.curve, ...cover.bindingLine, cover.marker]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(230);
    }
  });
});
