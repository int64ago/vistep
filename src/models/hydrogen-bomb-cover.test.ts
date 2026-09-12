import { describe, expect, it } from 'vitest';
import { coulombPotentialMeV, turningPointFm } from './hydrogen-bomb';
import { hydrogenBombCover, hydrogenBombCoverPath } from './hydrogen-bomb-cover';

describe('hydrogen-bomb cover geometry', () => {
  it('samples the actual Coulomb hill and places the nucleus on the energy line at its turning point', () => {
    const cover = hydrogenBombCover(10);
    expect(cover.hill.length).toBeGreaterThan(50);
    for (let i = 1; i < cover.hill.length; i++) {
      expect(cover.hill[i].x).toBeGreaterThan(cover.hill[i - 1].x);
      expect(cover.hill[i].y).toBeGreaterThanOrEqual(cover.hill[i - 1].y - 1e-9);
    }
    expect(cover.hill[0].x).toBeCloseTo(cover.well.right, 9);
    expect(turningPointFm(cover.energyKeV)).toBeCloseTo(cover.nucleus.rFm, 9);
    expect(coulombPotentialMeV(cover.nucleus.rFm) * 1000).toBeCloseTo(cover.energyKeV, 6);
    expect(cover.nucleus.y).toBeCloseTo(cover.energyLine.y, 9);
    expect(cover.nucleus.x).toBeGreaterThan(cover.well.right);
    expect(cover.nucleus.x).toBeLessThan(cover.energyLine.x2);
    expect(cover.twin.x).toBeGreaterThan(cover.well.left);
    expect(cover.twin.x).toBeLessThan(cover.well.right);
    expect(cover.tunnelProbability).toBeLessThan(1e-3);
  });
  it('keeps every drawn point inside the 400×230 viewport and the inset in its frame', () => {
    const cover = hydrogenBombCover();
    const all = [
      ...cover.hill,
      cover.nucleus,
      cover.twin,
      cover.deuterium,
      ...Object.values(cover.insetCurves).flat(),
    ];
    for (const p of all) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(230);
    }
    for (const curve of Object.values(cover.insetCurves))
      for (const p of curve) {
        expect(p.x).toBeGreaterThanOrEqual(cover.inset.left - 1e-9);
        expect(p.x).toBeLessThanOrEqual(cover.inset.right + 1e-9);
        expect(p.y).toBeGreaterThanOrEqual(cover.inset.top - 1e-9);
        expect(p.y).toBeLessThanOrEqual(cover.inset.bottom + 1e-9);
      }
    const peakIndex = cover.insetCurves.product.reduce(
      (best, p, i, arr) => (p.y < arr[best].y ? i : best),
      0,
    );
    expect(peakIndex).toBeGreaterThan(5);
    expect(peakIndex).toBeLessThan(40);
    expect(hydrogenBombCoverPath(cover.hill.slice(0, 2))).toMatch(
      /^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+$/,
    );
  });
});
