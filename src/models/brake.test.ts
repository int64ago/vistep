import { describe, expect, it } from 'vitest';
import { BRAKE, area, brakeAtPressure, brakeShot, brakeState, brakeStop } from './brake';
describe('hydraulic brake', () => {
  it('keeps the compensation port open before effective travel and takes up both gaps', () => {
    expect(brakeState(0.2).portOpen).toBe(true);
    expect(brakeState(0.2).swept).toBe(0);
    const s = brakeState(0.8);
    expect(s.pressure).toBe(0);
    expect(s.padTravel * 2 * s.pistonArea).toBeCloseTo(s.swept, 10);
    const touch = brakeState(s.deadStroke);
    expect(touch.padTravel).toBeCloseTo(BRAKE.padGap, 10);
    expect(touch.pressure).toBeCloseTo(0, 10);
  });
  it('balances displaced liquid, elastic compression and air across the full range', () => {
    for (const diameter of [8, 10, 14])
      for (const bubble of [0, 80, 150])
        for (let x = 0; x <= 6; x += 0.03125) {
          const s = brakeState(x, { masterDiameter: diameter, bubbleVolume: bubble });
          expect(
            2 * s.pistonArea * s.padTravel + s.fluidVolume + s.padVolume + s.bubbleCompressed,
          ).toBeCloseTo(s.swept, 9);
          expect(s.padForce / s.pistonArea).toBeCloseTo(s.masterForce / s.masterArea, 10);
          expect((BRAKE.atmosphericPressure + s.pressure) * s.bubbleRemaining).toBeCloseTo(
            BRAKE.atmosphericPressure * bubble,
            9,
          );
        }
  });
  it('trades force for stroke, without creating work', () => {
    const small = brakeAtPressure(3),
      large = brakeAtPressure(3, { masterDiameter: 14 });
    expect(large.padForce).toBeCloseTo(small.padForce, 10);
    expect(large.handForce / small.handForce).toBeCloseTo(area(14) / area(10), 10);
    expect((small.stroke - 0.4) / (large.stroke - 0.4)).toBeCloseTo(area(14) / area(10), 10);
    for (const bubbleVolume of [0, 80]) {
      const end = 3.8,
        n = 12000,
        dx = end / n;
      let work = 0;
      for (let i = 0; i < n; i++)
        work += (brakeState((i + 0.5) * dx, { bubbleVolume }).masterForce * dx) / 1000;
      const s = brakeState(end, { bubbleVolume });
      expect(work).toBeCloseTo(s.storedJoules, 6);
      expect(s.storedJoules).toBeCloseTo(
        s.fluidStoredJoules + s.padStoredJoules + s.airStoredJoules,
        10,
      );
    }
  });
  it('reduces pressure at the same stroke with trapped air and conserves braking work', () => {
    expect(brakeState(3, { bubbleVolume: 80 }).pressure).toBeLessThan(brakeState(3).pressure);
    const torque = brakeAtPressure(4).torque;
    for (const seconds of [0, 0.1, 0.5, 1, 2, 4, 20]) {
      const s = brakeStop(torque, seconds);
      expect(torque * s.angle).toBeCloseTo(s.heatJoules, 9);
      expect(s.heatJoules + s.kineticJoules).toBeCloseTo(1250, 10);
      expect(s.speed).toBeGreaterThanOrEqual(0);
    }
    expect(brakeStop(torque, 20).speed).toBe(0);
    expect(brakeStop(0, 2).speed).toBe(5);
  });
  it('reconstructs chapters independently and rejects unsupported inputs', () => {
    for (let c = 0; c < 8; c++)
      for (const p of [0, 0.3, 0.8, 1]) expect(brakeShot(c, p)).toEqual(brakeShot(c, p));
    expect(brakeShot(7, 1).state.portOpen).toBe(true);
    expect(brakeShot(6, 1).stop.speed).toBe(0);
    expect(() => brakeState(NaN)).toThrow();
    expect(() => brakeState(-1)).toThrow();
    expect(() => brakeState(3, { masterDiameter: 0 })).toThrow();
    expect(() => brakeState(3, { bubbleVolume: -1 })).toThrow();
    expect(() => brakeAtPressure(9)).toThrow();
    expect(() => brakeStop(-1, 2)).toThrow();
  });
});
