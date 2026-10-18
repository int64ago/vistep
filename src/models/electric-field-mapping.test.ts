import { describe, it, expect } from 'vitest';
import { fieldAt, fieldLines, fragmentAngle, potentialContours } from './electric-field-mapping';
describe('field patterns from shared E and potential', () => {
  it('matches the independent 0.8nC, 10cm Coulomb benchmark', () => {
    const s = fieldAt('single', 0.1, 0);
    expect(s.ex).toBeCloseTo(719.004143384, 8);
    expect(s.ey).toBe(0);
    expect(s.potential).toBeCloseTo(71.9004143384, 8);
  });
  it('distinguishes zero potential from zero field', () => {
    const dipole = fieldAt('dipole', 0, 0),
      like = fieldAt('like', 0, 0);
    expect(dipole.potential).toBe(0);
    expect(dipole.ex).toBeGreaterThan(0);
    expect(like.ex).toBe(0);
    expect(like.ey).toBe(0);
    expect(like.potential).toBeGreaterThan(0);
  });
  it('matches E = minus gradient V independently', () => {
    for (const mode of ['single', 'dipole', 'like', 'plates'] as const) {
      const x = 0.035,
        y = 0.06,
        h = 1e-6,
        s = fieldAt(mode, x, y);
      expect(
        -(fieldAt(mode, x + h, y).potential - fieldAt(mode, x - h, y).potential) / (2 * h),
      ).toBeCloseTo(s.ex, 3);
      expect(
        -(fieldAt(mode, x, y + h).potential - fieldAt(mode, x, y - h).potential) / (2 * h),
      ).toBeCloseTo(s.ey, 3);
    }
  });
  it('aligns an undirected fragment without inventing charge direction', () => {
    const a = fragmentAngle(0.8, 500, 0, 30),
      b = fragmentAngle(0.8, -500, 0, 30);
    expect(Math.abs(Math.sin(a))).toBeLessThan(1e-5);
    expect(Math.abs(Math.sin(a - b))).toBeLessThan(1e-10);
    expect(fragmentAngle(0.8, 0, 0, 30)).toBe(0.8);
  });
  it('keeps traces and contours finite and masks charge singularities', () => {
    expect(fieldAt('single', 0, 0).valid).toBe(false);
    for (const mode of ['single', 'dipole', 'like', 'plates'] as const) {
      expect(fieldLines(mode).length).toBeGreaterThan(0);
      expect(potentialContours(mode).length).toBeGreaterThan(0);
      for (const p of fieldLines(mode).flat()) expect(Number.isFinite(p.x + p.y)).toBe(true);
    }
  });
});
