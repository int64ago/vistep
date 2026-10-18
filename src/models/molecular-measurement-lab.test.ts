import { describe, expect, it } from 'vitest';
import {
  carbonDiffusion,
  carbonTrack,
  waterAlcoholMix,
  oilFilm,
  oilBoundary,
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
