import { describe, it, expect } from 'vitest';
import {
  sourceDisplacement,
  mechanicalDisplacement,
  springMaterialPoint,
  springHelix,
  humanWavePose,
} from './mechanical-wave-lab';
describe('textbook mechanical waves', () => {
  it('propagates the exact source history with x/c delay and no disturbance ahead of the front', () => {
    for (const drive of ['up', 'down', 'train'] as const) {
      expect(mechanicalDisplacement(4, 1, drive)).toBe(0);
      expect(mechanicalDisplacement(4, 2.4, drive)).toBeCloseTo(sourceDisplacement(0.4, drive), 12);
      expect(mechanicalDisplacement(3, 4, drive)).toBeCloseTo(
        mechanicalDisplacement(4, 4.5, drive),
        12,
      );
    }
    expect(sourceDisplacement(0.625, 'up')).toBeCloseTo(0.12);
    expect(sourceDisplacement(0.625, 'down')).toBeCloseTo(-0.12);
  });
  it('satisfies the wave equation away from the finite front', () => {
    const x = 2,
      t = 4,
      h = 1e-4,
      y = (q: number, s: number) => mechanicalDisplacement(q, s),
      dtt = (y(x, t + h) - 2 * y(x, t) + y(x, t - h)) / h ** 2,
      dxx = (y(x + h, t) - 2 * y(x, t) + y(x - h, t)) / h ** 2;
    expect(dtt).toBeCloseTo(4 * dxx, 5);
  });
  it('keeps material identities and positive spring pitch through every allowed frequency', () => {
    for (const f of [0.4, 0.8, 1.2])
      for (const time of [0, 0.7, 3, 6, 12]) {
        const a = springHelix(time, f);
        expect(a.every((p, i) => i === 0 || p.x > a[i - 1].x)).toBe(true);
        expect(Math.abs(springMaterialPoint(4, time, f).displacement)).toBeLessThanOrEqual(
          0.200001,
        );
      }
    expect(springMaterialPoint(4, 6).position).toBeCloseTo(
      springMaterialPoint(4, 7.25).position,
      10,
    );
  });
  it('delays crouching without relocating any person', () => {
    for (let i = 0; i < 13; i++) {
      expect(humanWavePose(i, 1).x).toBe(i);
      expect(humanWavePose(i, 1 + i * 0.22).crouch).toBeCloseTo(humanWavePose(0, 1).crouch, 12);
    }
    expect(humanWavePose(12, 1).started).toBe(false);
  });
});
