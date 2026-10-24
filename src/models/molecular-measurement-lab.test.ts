import { describe, expect, it } from 'vitest';
import {
  carbonDiffusion,
  carbonPosition,
  carbonImpacts,
  mixtureStructure,
  waterViscosity,
  molecularShot,
  carbonTrack,
  waterAlcoholMix,
  oilFilm,
  oilBoundary,
  oilPowder,
} from './molecular-measurement-lab';
describe('molecular measurement experiments', () => {
  it('uses Stokes-Einstein size and temperature trends with deterministic seeking', () => {
    expect(carbonDiffusion(293.15, 1e-6)).toBeCloseTo(carbonDiffusion(293.15, 0.5e-6) / 2, 20);
    expect(carbonDiffusion(323.15)).toBeGreaterThan(carbonDiffusion(293.15));
    expect(carbonTrack(17, 293.15, 0.5e-6, 30)).toEqual(
      carbonTrack(17, 293.15, 0.5e-6, 60).slice(0, 31),
    );
  });
  it('approaches ensemble two-dimensional mean square displacement 4Dt', () => {
    const n = 1200,
      t = 40,
      observed =
        Array.from({ length: n }, (_, i) => carbonTrack(i, 293.15, 0.5e-6, t).at(-1)!).reduce(
          (sum, p) => sum + p.x * p.x + p.y * p.y,
          0,
        ) / n,
      expected = 4 * carbonDiffusion() * t * 1e12;
    expect(observed / expected).toBeGreaterThan(0.9);
    expect(observed / expected).toBeLessThan(1.1);
  });
  it('retains mass while showing a calibrated contraction example', () => {
    expect(waterAlcoholMix(0).totalMass).toBe(waterAlcoholMix(1).totalMass);
    expect(waterAlcoholMix(1).mixture).toBe(96);
  });
  it('converts diluted drops and centimetres consistently into a nanometre thickness', () => {
    expect(oilFilm().thickness).toBeCloseTo(2e-9, 18);
    expect(oilFilm(1, 50, 500, 220).thickness).toBeLessThan(oilFilm().thickness);
    const p = oilBoundary();
    const area =
      Math.abs(
        p.reduce((s, a, i) => {
          const b = p[(i + 1) % p.length];
          return s + a.x * b.y - b.x * a.y;
        }, 0),
      ) / 2;
    expect(area).toBeCloseTo(200, 8);
  });
});

describe('principle-first mechanisms', () => {
  it('uses an independent water-viscosity benchmark and finite supported boundaries', () => {
    // Liquid water at 20°C is approximately 1.002 mPa·s; r=.5 μm gives D≈.429 μm²/s.
    expect(waterViscosity(293.15) * 1000).toBeCloseTo(1.002, 2);
    expect(carbonDiffusion() * 1e12).toBeCloseTo(0.429, 2);
    for (const value of [NaN, Infinity, -Infinity, -1e5, 1e5]) {
      expect(Number.isFinite(carbonDiffusion(value, value))).toBe(true);
      expect(Number.isFinite(oilFilm(value, value, value, value).thickness)).toBe(true);
      expect(carbonTrack(137, 293.15, 0.5e-6, value).length).toBeLessThanOrEqual(301);
    }
  });
  it('links the imbalance direction to the same increment, without turning position links into molecular trajectories', () => {
    const track = carbonTrack(137);
    for (const time of [0, 1, 12.4, 29.9, 100, 299]) {
      const i = Math.floor(time),
        p = carbonPosition(track, time),
        cue = carbonImpacts(137, time),
        dx = track[i + 1].x - track[i].x,
        dy = track[i + 1].y - track[i].y;
      expect((cue.left - cue.right) * dx).toBeGreaterThanOrEqual(0);
      expect((cue.top - cue.bottom) * dy).toBeGreaterThanOrEqual(0);
      expect(cue.x * dy - cue.y * dx).toBeCloseTo(0, 10);
      expect(p.x).toBeCloseTo(track[i].x + (time - i) * dx, 10);
    }
    expect(carbonPosition(track, 300)).toEqual(track[300]);
    expect(carbonImpacts(137, 300)).toEqual(carbonImpacts(137, 299));
  });
  it('preserves every molecule and species across pouring, rearrangement and reverse seeking', () => {
    const identities = mixtureStructure(0).map((m) => [m.id, m.species]);
    for (const progress of [1, 0.7, 0.6, 0.2, 0]) {
      const molecules = mixtureStructure(progress);
      expect(molecules.map((m) => [m.id, m.species])).toEqual(identities);
      expect(molecules.filter((m) => m.species === 'water')).toHaveLength(12);
      expect(molecules.filter((m) => m.species === 'ethanol')).toHaveLength(4);
      expect(
        waterAlcoholMix(progress).water +
          waterAlcoholMix(progress).mixture +
          waterAlcoholMix(progress).contraction,
      ).toBeCloseTo(100, 10);
      expect(waterAlcoholMix(progress).totalMass).toBeCloseTo(89.35, 10);
    }
    expect(mixtureStructure(0.8)).toEqual(mixtureStructure(0.8));
    expect(mixtureStructure(0)[0].x).not.toBe(mixtureStructure(1)[0].x);
  });
  it('keeps zero oil distinct from a monolayer, and predicts reciprocal readout error', () => {
    expect(oilFilm(0).thickness).toBe(0);
    expect(oilFilm(1, 50, 500, 400).thickness).toBeCloseTo(1e-9, 18);
    expect(oilFilm(1, 100, 500, 200).thickness).toBeCloseTo(1e-9, 18);
    expect(oilFilm(1, 50, 1000, 200).thickness).toBeCloseTo(1e-9, 18);
  });
});

it('powder markers remain identifiable and move outward as the shared film outline spreads', () => {
  const before = oilPowder(0),
    after = oilPowder(1);
  expect(after.map((p) => p.id)).toEqual(before.map((p) => p.id));
  expect(after).toHaveLength(150);
  expect(after.some((p, i) => Math.hypot(p.x - before[i].x, p.y - before[i].y) > 10)).toBe(true);
  for (let i = 0; i < after.length; i++)
    expect(Math.hypot(after[i].x - 140, after[i].y - 96)).toBeGreaterThanOrEqual(
      Math.hypot(before[i].x - 140, before[i].y - 96) - 1e-9,
    );
});

it('shows the settled observation by the earliest measured 96mL spoken cue', () => {
  expect(waterAlcoholMix(molecularShot(3, 2.79 / 28, 2.79).progress).mixture).toBe(96);
  expect(waterAlcoholMix(molecularShot(3, 4.05 / 28, 4.05).progress).mixture).toBe(96);
  expect(molecularShot(3, 0, 0).progress).toBe(0);
  expect(molecularShot(3, 1, 28).progress).toBe(1);
});
