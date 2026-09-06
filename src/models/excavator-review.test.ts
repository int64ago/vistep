import { describe, expect, it } from 'vitest';
import {
  EXCAVATOR_CYLINDERS,
  distance,
  excavatorPose,
  excavatorHydraulics,
  excavatorShot,
} from './excavator';

describe('excavator corrected geometry and deterministic hydraulic motion', () => {
  it('retains a real piston and rod overlap inside each fixed housing', () => {
    for (let boom = 0.6; boom <= 1.05; boom += 0.015) {
      for (let curl = 0.05; curl <= 0.6; curl += 0.015) {
        for (const stick of [-1.5, -1.55, -1.65]) {
          excavatorPose(boom, stick, curl).cylinders.forEach(({ a, b }, i) => {
            const { housing, rod } = EXCAVATOR_CYLINDERS[i];
            const extension = distance(a, b) - housing;
            const pistonFromBase = distance(a, b) - rod;
            expect(extension).toBeGreaterThan(0.1);
            expect(pistonFromBase).toBeGreaterThan(0.08);
            expect(pistonFromBase).toBeLessThan(housing - 0.06);
          });
        }
      }
    }
  });
  it('changes payload moment when the bucket is curled at fixed arm angles', () => {
    const extended = excavatorHydraulics(0.75, 800, 40, 100, -1.55, 0.05);
    const curled = excavatorHydraulics(0.75, 800, 40, 100, -1.55, 0.6);
    expect(curled.moment).not.toBeCloseTo(extended.moment);
    expect(curled.force * curled.lever).toBeCloseTo(curled.moment, 7);
    expect(() => excavatorHydraulics(0.75, 800, 40, 100, NaN)).toThrow();
  });
  it('integrates Q/(2A) in physical seconds and remains inside the shown stroke', () => {
    const duration = 25,
      epsilon = 1e-5;
    for (let progress = 0.01; progress < 0.99; progress += 0.02) {
      const before = excavatorShot(4, progress - epsilon, duration);
      const after = excavatorShot(4, progress + epsilon, duration);
      const now = excavatorShot(4, progress, duration);
      const numericalSpeed = ((after.piston - before.piston) * 0.8) / (2 * epsilon * duration);
      expect(numericalSpeed).toBeCloseTo(excavatorHydraulics(0.75, 800, now.flow).velocity, 8);
    }
    expect(excavatorShot(4, 0).piston).toBe(0.1);
    expect(excavatorShot(4, 1).piston).toBeLessThan(1);
    expect(excavatorShot(4, 0.5, 30).piston - 0.1).toBeCloseTo(
      (excavatorShot(4, 0.5, 25).piston - 0.1) * 1.2,
    );
  });
});
