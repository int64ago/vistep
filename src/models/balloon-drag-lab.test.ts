import { describe, it, expect } from 'vitest';
import { BALLOON_DATA, balloonFit, balloonVideo, balloonBalance } from './balloon-drag-lab';
describe('textbook balloon data investigation', () => {
  it('preserves all seven source weights and frame displacements without inventing a frame rate', () => {
    expect(BALLOON_DATA.map((q) => q.weight)).toEqual([
      0.045, 0.055, 0.065, 0.075, 0.085, 0.095, 0.105,
    ]);
    expect(BALLOON_DATA.map((q) => q.stepCm)).toEqual([13.6, 16.3, 19.8, 23.8, 26.6, 28.8, 32.8]);
  });
  it('linear origin fit is independently consistent with normal equation and better than quadratic for this dataset', () => {
    const f = balloonFit(1),
      q = balloonFit(2);
    expect(f.coefficient).toBeCloseTo(0.0032375925230670537, 12);
    expect(f.rmse).toBeCloseTo(0.0015440651763794393, 12);
    expect(f.rmse).toBeLessThan(q.rmse / 10);
    expect(f.residuals.reduce((s, r, i) => s + r * BALLOON_DATA[i].stepCm, 0)).toBeCloseTo(0, 12);
  });
  it('terminal reconstructed frames have equal spacing and recover the source displacement', () => {
    const s = balloonVideo(3, 5.5);
    expect(s.positions).toHaveLength(6);
    for (const d of s.spacings) expect(d).toBeCloseTo(23.8);
    expect(s.average).toBeCloseTo(23.8);
    expect(s.positionCm).toBeCloseTo(130.9);
  });
  it('accelerating illustrative frames do not masquerade as equal spacing', () => {
    const s = balloonVideo(2, 5, true);
    for (let i = 1; i < s.spacings.length; i++)
      expect(s.spacings[i]).toBeGreaterThan(s.spacings[i - 1]);
    expect(s.terminal).toBe(false);
    expect(s.average).toBeLessThan(19.8);
  });
  it('buoyancy and acceleration are subtracted from downward weight when inferring drag', () => {
    expect(balloonBalance(0.065, 0.01).drag).toBeCloseTo(0.055);
    expect(balloonBalance(0.065, 0.01, 2).drag).toBeCloseTo(0.055 - (0.065 / 9.8) * 2);
    expect(balloonFit(1, 0.01).points[0].drag).toBeCloseTo(0.035);
  });
  it('rejects unsupported measurement indices and impossible correction', () => {
    expect(() => balloonVideo(7, 1)).toThrow();
    expect(() => balloonFit(1, 0.05)).toThrow();
  });
});
