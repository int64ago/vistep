import { describe, it, expect } from 'vitest';
import { stereoPoint, stereoTriangulate, stereoMatches } from './stereoscopic-vision';
describe('rectified stereo and fixation-relative disparity', () => {
  it('matches independent pinhole projection and triangulates original depth', () => {
    const s = stereoPoint(800, 20);
    expect(s.rawLeft).toBeCloseTo(1.105, 12);
    expect(s.rawRight).toBeCloseTo(-0.255, 12);
    expect(stereoTriangulate(s.left, s.right)).toBeCloseTo(800, 10);
    expect((((s.rawLeft + s.rawRight) / 2) * 800) / 17).toBeCloseTo(20, 12);
  });
  it('uses inverse depth, not depth itself, and removes the fixation reference', () => {
    expect(stereoPoint(800).disparity).toBe(0);
    expect(stereoPoint(400).disparity).toBeCloseTo(1.36, 12);
    expect(stereoPoint(1600).disparity).toBeCloseTo(-0.68, 12);
    expect(stereoPoint(400).angular).toBeGreaterThan(0);
    expect(stereoPoint(1600).angular).toBeLessThan(0);
  });
  it('loses triangulation when baseline vanishes rather than producing zero depth', () => {
    const s = stereoPoint(400, 0, { baseline: 0 });
    expect(s.left).toBe(s.right);
    expect(stereoTriangulate(s.left, s.right, { baseline: 0 })).toBeNull();
  });
  it('shows smaller relative disparity for the same200mm separation farther away', () => {
    expect(Math.abs(stereoPoint(1000, 0, { fixation: 800 }).disparity)).toBeGreaterThan(
      Math.abs(stereoPoint(1800, 0, { fixation: 1600 }).disparity),
    );
  });
  it('requires correspondence: crossed assignments give two different positive false depths', () => {
    for (const d of stereoMatches().depths) expect(d).toBeCloseTo(800, 10);
    const wrong = stereoMatches(true).depths;
    expect(wrong[0]).toBeCloseTo(2133.333333, 5);
    expect(wrong[1]).toBeCloseTo(492.307692, 5);
  });
  it('rejects impossible inputs and nonpositive reconstructed disparity', () => {
    expect(() => stereoPoint(0)).toThrow(RangeError);
    expect(stereoTriangulate(-10, 10)).toBeNull();
  });
});
