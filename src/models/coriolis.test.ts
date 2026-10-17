import { describe, expect, it } from 'vitest';
import { coriolisFrame, coriolisShot, rotatePoint } from './coriolis';
describe('two observations of a single free trajectory', () => {
  it('preserves the worldline and norm across the coordinate change', () => {
    for (const omega of [-0.8, 0, 0.8])
      for (const offset of [-0.3, 0, 0.3]) {
        const f = coriolisFrame({ omega, offset, speed: 0.1 }, 5);
        const back = rotatePoint(f.table, f.angle);
        expect(back.x).toBeCloseTo(f.laboratory.x, 12);
        expect(back.y).toBeCloseTo(f.laboratory.y, 12);
        expect(f.laboratory.x).toBeCloseTo((0.1 - omega * offset) * 5, 12);
      }
  });
  it('matches both apparent acceleration terms against a numerical derivative', () => {
    const c = { omega: 0.42, speed: 0.105, offset: 0.3 },
      t = 3,
      h = 0.0001;
    const a = coriolisFrame(c, t - h),
      b = coriolisFrame(c, t),
      d = coriolisFrame(c, t + h);
    for (const axis of ['x', 'y'] as const)
      expect((d.table[axis] - 2 * b.table[axis] + a.table[axis]) / h ** 2).toBeCloseTo(
        b.acceleration[axis],
        6,
      );
  });
  it('reverses the central deflection and supports deterministic seeking', () => {
    const a = coriolisFrame({ omega: 0.4, speed: 0.1, offset: 0 }, 3);
    const b = coriolisFrame({ omega: -0.4, speed: 0.1, offset: 0 }, 3);
    expect(a.table.x).toBeCloseTo(b.table.x);
    expect(a.table.y).toBeCloseTo(-b.table.y);
    for (let c = 0; c < 8; c++) expect(coriolisShot(c, 0.6)).toEqual(coriolisShot(c, 0.6));
    expect(() => coriolisFrame({ omega: NaN, speed: 0.1, offset: 0 }, 1)).toThrow();
  });
});
