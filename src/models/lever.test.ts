import { describe, expect, it } from 'vitest';
import { leverState, leverDefaults, leverShot } from './lever';
describe('lever: signed torque and virtual work', () => {
  it('balances 120 N at one metre with 60 N at two metres', () => {
    const s = leverState(leverDefaults());
    expect(s.netTorque).toBeCloseTo(0);
    expect(s.reaction.y).toBe(180);
  });
  it('computes a perpendicular foot rather than using rod length', () => {
    const s = leverState({ ...leverDefaults(), direction: 60 });
    expect(s.arm).toBeCloseTo(1);
    expect(s.netTorque).toBeCloseTo(-60);
    expect(s.foot.x * s.unit.x + s.foot.y * s.unit.y).toBeCloseTo(0);
  });
  it('has no finite balancing force when the force line crosses the pivot', () => {
    const s = leverState({ ...leverDefaults(), direction: 90 });
    expect(s.arm).toBeCloseTo(0);
    expect(s.requiredEffort).toBeNull();
    expect(s.netTorque).toBeCloseTo(-120);
  });
  it('conserves work for finite vertical displacement at balance', () => {
    for (const u of [0, 0.2, 0.7, 1]) {
      const s = leverState(leverShot(5, u));
      expect(s.inputWork).toBeCloseTo(s.outputWork, 10);
      expect(s.inputTravel).toBeCloseTo(2 * s.outputTravel);
      expect(s.netTorque).toBeCloseTo(0);
    }
  });
  it('projects displacement onto an oblique fixed force for work', () => {
    const p = { ...leverDefaults(), direction: 60, rotation: 0.18 };
    const s = leverState(p);
    const independent =
      p.effort * p.effortArm * (0.5 * Math.sin(0.18) - (Math.sqrt(3) / 2) * (1 - Math.cos(0.18)));
    expect(s.inputWork).toBeCloseTo(independent, 10);
    expect(s.inputWork).toBeLessThan(p.effort * s.inputTravel);
  });
  it('rejects invalid geometry and reconstructs any shot without history', () => {
    expect(() => leverState({ ...leverDefaults(), effortArm: 0 })).toThrow();
    expect(leverShot(2, 0.4)).toEqual(leverShot(2, 0.4));
  });
});
