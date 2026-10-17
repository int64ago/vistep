import { describe, it, expect } from 'vitest';
import { inclineState, inclineDefaults, inclineShot } from './inclined-plane';
describe('inclined plane work and force', () => {
  it('reproduces the 30 degree independent benchmark', () => {
    const s = inclineState({ ...inclineDefaults(), progress: 1 });
    expect(s.length).toBeCloseTo(2);
    expect(s.pull).toBeCloseTo(60);
    expect(s.inputWork).toBeCloseTo(120);
  });
  it('balances force along the plane and energy including friction', () => {
    for (const angle of [12, 30, 60, 90]) {
      const s = inclineState({ ...inclineDefaults(), angle, friction: 0.3, progress: 0.7 });
      expect(s.pull - s.gravityAlong - s.frictionForce).toBeCloseTo(0);
      expect(s.inputWork).toBeCloseTo(s.potential + s.heat);
    }
  });
  it('shows why a longer rough ramp can require more work despite less force', () => {
    const a = inclineState({ ...inclineDefaults(), angle: 30, friction: 0.3, progress: 1 }),
      b = inclineState({ ...inclineDefaults(), angle: 12, friction: 0.3, progress: 1 });
    expect(b.pull).toBeLessThan(a.pull);
    expect(b.inputWork).toBeGreaterThan(a.inputWork);
    expect(b.potential).toBe(a.potential);
  });
  it('reduces to direct lifting at vertical and rejects horizontal finite-height ramps', () => {
    const s = inclineState({ ...inclineDefaults(), angle: 90, friction: 1 });
    expect(s.pull).toBeCloseTo(120);
    expect(s.normal).toBeCloseTo(0);
    expect(() => inclineState({ ...inclineDefaults(), angle: 0 })).toThrow();
  });
  it('reconstructs each authored chapter without history', () => {
    for (let c = 0; c < 6; c++) {
      const p = inclineShot(c, 0.6);
      expect(inclineState(p).inputWork).toBeCloseTo(
        inclineState(p).potential + inclineState(p).heat,
      );
    }
  });
});
