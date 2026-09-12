import { describe, expect, it } from 'vitest';
import { LANDMINE_OBJECT, landmineShot, landmineWeather } from './landmine';
import { landmineCover, landmineExteriorArt } from './landmine-art';
import {
  LANDMINE_SHELL_PROFILE,
  LANDMINE_COVER_PROFILE,
  LANDMINE_HANDLE,
  LANDMINE_DIRT_COUNT,
  landmineCut,
  landminePlant,
  landmineSurface,
} from './landmine-geometry';

describe('non-operational landmine teaching states', () => {
  it('preserves the same object while the observable cover changes', () => {
    const samples = Array.from({ length: 121 }, (_, i) => landmineWeather(i / 120));
    expect(
      Math.max(...samples.map((s) => s.grass)) - Math.min(...samples.map((s) => s.grass)),
    ).toBeGreaterThan(0.649);
    expect(
      Math.max(...samples.map((s) => s.leafSize)) - Math.min(...samples.map((s) => s.leafSize)),
    ).toBeGreaterThan(0.074);
    for (const sample of samples) {
      expect(sample.object).toBe(LANDMINE_OBJECT);
      expect(sample.safety).toBe('unknown');
    }
  });
  it('does not turn elapsed time or a revealed illustration into safety evidence', () => {
    for (let chapter = 0; chapter < 7; chapter++)
      for (const progress of [0, 0.25, 0.5, 0.75, 1, 100]) {
        const shot = landmineShot(chapter, progress);
        expect(shot.safety).toBe('unknown');
        expect(shot.object).toBe(LANDMINE_OBJECT);
      }
  });
  it('reconstructs a paused seek without relying on playback history', () => {
    const first = landmineShot(2, 0.44);
    landmineShot(6, 1);
    landmineShot(0, 0);
    expect(landmineShot(2, 0.44)).toEqual(first);
  });
  it('keeps out-of-range and non-finite inputs bounded without creating NaN paths', () => {
    for (const chapter of [-100, -1, 100, NaN, Infinity])
      for (const p of [-4, 4, NaN, Infinity, -Infinity]) {
        const shot = landmineShot(chapter, p);
        expect(shot.progress).toBeGreaterThanOrEqual(0);
        expect(shot.progress).toBeLessThanOrEqual(1);
        expect(Number.isFinite(landmineWeather(shot.season).grass)).toBe(true);
      }
  });
});

describe('sealed exterior and opaque terrain geometry', () => {
  it('does not expose an exterior through an unopened ground view', () => {
    const art = landmineExteriorArt(244, 320, 0, 0.35, 0);
    expect(
      art.paths.some(
        (p) =>
          p.part.startsWith('exterior') ||
          p.part === 'carry-handle' ||
          p.part.startsWith('shell-soil-trace'),
      ),
    ).toBe(false);
  });
  it('preserves visible leaf identities in the fallback and shares their seasonal scale', () => {
    for (const season of [0, 0.13, 0.5, 0.91, 1]) {
      const art = landmineExteriorArt(314, 320, 0, season, 0),
        leaves = art.paths.filter((p) => p.part.startsWith('leaf-litter-')),
        size = landmineWeather(season).leafSize;
      expect(leaves).toHaveLength(95);
      for (const path of leaves) {
        const i = Number(path.part.replace('leaf-litter-', '')),
          plant = landminePlant(i + 1200);
        if (plant.z > 1.7) continue; // Full ellipses only; the frontmost ones may be clipped.
        const points = [...path.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [
          Number(m[1]),
          Number(m[2]),
        ]);
        expect(points).toHaveLength(12);
        const displayScale = Math.min(314 / 7, 320 / 4.9);
        const center = [
          157 + (plant.x * 0.86 - plant.z * 0.51) * displayScale,
          160 - ((plant.y + 0.02 - 0.7) * 0.85 - plant.x * 0.275 - plant.z * 0.46) * displayScale,
        ];
        for (const k of [0, 1])
          expect(Math.abs(points.reduce((sum, p) => sum + p[k], 0) / 12 - center[k])).toBeLessThan(
            0.0051,
          );
        const firstX =
          center[0] +
          (Math.cos(plant.angle) * 0.86 + Math.sin(plant.angle) * 0.51) * size * displayScale;
        expect(Math.abs(points[0][0] - firstX)).toBeLessThan(0.0051);
      }
    }
    const cut = landmineExteriorArt(314, 320, 1, 0.3, 0);
    expect(cut.paths.filter((p) => p.part.startsWith('leaf-litter-')).length).toBeGreaterThan(10);
    const close = landmineExteriorArt(314, 320, 1, 0.3, 1);
    expect(close.paths.filter((p) => p.part.startsWith('shell-soil-trace-'))).toHaveLength(
      LANDMINE_DIRT_COUNT,
    );
  });
  it('keeps the complete sealed casing below the uncut surface', () => {
    for (const profile of [LANDMINE_SHELL_PROFILE, LANDMINE_COVER_PROFILE])
      for (const [r, y] of profile)
        for (let i = 0; i < 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          expect(y).toBeLessThan(landmineSurface(Math.cos(a) * r, Math.sin(a) * r));
          expect(y).toBeGreaterThan(0);
        }
    expect(landmineCut(0)).toBeGreaterThan(Math.max(...LANDMINE_SHELL_PROFILE.map((p) => p[0])));
    expect(landmineCut(1)).toBeLessThan(0);
  });
  it('keeps external identity through cover and time comparisons', () => {
    for (const width of [244, 314, 660]) {
      const a = landmineExteriorArt(width, 320, 1, 0),
        b = landmineExteriorArt(width, 320, 1, 0.4);
      const body = (art: ReturnType<typeof landmineExteriorArt>) =>
        art.paths.filter((p) => p.part.startsWith('exterior')).map((p) => p.d);
      expect(body(a)).toEqual(body(b));
      expect(a.object).toEqual(b.object);
    }
  });
  it('shares the body profiles and retains the external handle in catalog artwork', () => {
    const cover = landmineCover();
    expect(cover.paths.some((p) => p.part === 'carry-handle')).toBe(true);
    expect(LANDMINE_HANDLE[0][0]).toBeLessThan(-1);
    for (const path of cover.paths) {
      expect(path.d).not.toMatch(/NaN|Infinity/);
      for (const match of path.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
        const x = Number(match[1]),
          y = Number(match[2]);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(400);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(230);
      }
      expect(path.part).not.toMatch(/fuze|wire|detonator|striker/);
    }
  });
});
