import { describe, expect, it } from 'vitest';
import { plateKinematics, plateSlab } from './plate-boundaries';
describe('plate boundary kinematics', () => {
  it('classifies normal/tangent components and remains invariant under reference translation', () => {
    const examples = [
      { l: { normal: 1, tangent: 0 }, r: { normal: 1, tangent: 0 }, kind: 'none' },
      { l: { normal: -1, tangent: 0 }, r: { normal: 1, tangent: 0 }, kind: 'divergent' },
      { l: { normal: 2, tangent: 0 }, r: { normal: -2, tangent: 0 }, kind: 'convergent' },
      { l: { normal: 0, tangent: -1 }, r: { normal: 0, tangent: 1 }, kind: 'transform' },
      { l: { normal: 1, tangent: -1 }, r: { normal: 0, tangent: 1 }, kind: 'oblique-convergent' },
    ];
    for (const e of examples) {
      const q = plateKinematics(e.l, e.r);
      expect(q.kind).toBe(e.kind);
      expect(
        plateKinematics(
          { normal: e.l.normal + 3, tangent: e.l.tangent - 2 },
          { normal: e.r.normal + 3, tangent: e.r.tangent - 2 },
        ),
      ).toEqual(q);
    }
  });
  it('matches displacement differences without inferring subduction from the velocities', () => {
    for (const time of [0, 2, 8]) {
      const q = plateKinematics({ normal: -1, tangent: -0.5 }, { normal: 1, tangent: 1 }, time);
      expect(q.opening).toBe((1 - -1) * time);
      expect(q.offset).toBe((-0.5 - 1) * time);
      expect(q.consumed).toBe(0);
    }
    expect(plateKinematics({ normal: 2, tangent: 0 }, { normal: -2, tangent: 0 }, 8).consumed).toBe(
      32,
    );
  });
  it('preserves physical streamline arclength, thickness and continuous tangent at bends', () => {
    for (const s of [-80, -1, 0, 5, (12 * Math.PI * 55) / 180, 30, 80]) {
      const q = plateSlab(s),
        h = 1e-5,
        a = plateSlab(s - h),
        b = plateSlab(s + h);
      expect(Math.hypot((b.x - a.x) / (2 * h), (b.z - a.z) / (2 * h))).toBeCloseTo(1, 7);
      expect(Math.hypot(q.upper.x - q.lower.x, q.upper.z - q.lower.z)).toBeCloseTo(8, 12);
      expect(q.tangent.x ** 2 + q.tangent.z ** 2).toBeCloseTo(1, 12);
    }
    const bend = (12 * Math.PI * 55) / 180;
    expect(plateSlab(bend - 1e-6).tangent.x).toBeCloseTo(plateSlab(bend + 1e-6).tangent.x, 6);
    expect(plateSlab(-10).z).toBe(0);
    expect(plateSlab(30).z).toBeGreaterThan(0);
  });
  it('rejects invalid velocity/time and folded offset geometry', () => {
    expect(() => plateKinematics({ normal: NaN, tangent: 0 }, { normal: 0, tangent: 0 })).toThrow();
    expect(() =>
      plateKinematics({ normal: 0, tangent: 0 }, { normal: 0, tangent: 0 }, -1),
    ).toThrow();
    expect(() => plateSlab(0, 2, 55, 8)).toThrow();
    expect(() => plateSlab(0, 12, 90)).toThrow();
  });
});
