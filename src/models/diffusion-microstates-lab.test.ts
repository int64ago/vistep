import { describe, it, expect } from 'vitest';
import {
  dyeHistory,
  dyeFrame,
  dyeBins,
  reflectedUnit,
  gasPositions,
  fourParticleStates,
  halfBoxProbability,
} from './diffusion-microstates-lab';
describe('diffusion and microstates', () => {
  it('retains every dye tracer inside reflecting walls and reproduces a seek', () => {
    const frames = dyeHistory(480);
    for (const frame of frames) {
      expect(Math.min(...frame)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...frame)).toBeLessThanOrEqual(1);
      expect(dyeBins(frame).reduce((a, b) => a + b, 0)).toBe(480);
    }
    expect(Array.from(dyeFrame(frames, 12.71))).toEqual(Array.from(dyeFrame(frames, 12.71)));
    expect(reflectedUnit(-0.2)).toBeCloseTo(0.2);
  });
  it('starts with concentrated dye and approaches an even depth distribution without stopping particles', () => {
    const f = dyeHistory(2000),
      top = (a: Float32Array) => Array.from(a).filter((v, i) => i % 2 && v < 0.25).length / 2000;
    expect(top(f[0])).toBeGreaterThan(0.99);
    expect(top(f.at(-1)!)).toBeGreaterThan(0.2);
    expect(top(f.at(-1)!)).toBeLessThan(0.3);
    expect(f.at(-1)![0]).not.toBe(f.at(-2)![0]);
  });
  it('enumerates every microstate once and gives multiplicities 1,4,6,4,1', () => {
    const s = fourParticleStates();
    expect(new Set(s.map((a) => a.sides.join(''))).size).toBe(16);
    expect(Array.from({ length: 5 }, (_, n) => s.filter((a) => a.left === n).length)).toEqual([
      1, 4, 6, 4, 1,
    ]);
    expect(halfBoxProbability(4).probability).toBe(1 / 16);
    expect(halfBoxProbability(1000).log10).toBeCloseTo(-301.03, 2);
  });
  it('keeps a closed partition impermeable and releases identical initial particles', () => {
    expect(gasPositions(0, true)).toEqual(gasPositions(0, false));
    for (let i = 0; i < 80; i++) expect(gasPositions(i, true).every((a) => a.x <= 0.5)).toBe(true);
    expect(gasPositions(6, false).some((a) => a.x > 0.5)).toBe(true);
  });
});
