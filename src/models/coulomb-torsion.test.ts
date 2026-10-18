import { describe, expect, it } from 'vitest';
import {
  chargeSharing,
  coulombForce,
  suspendedCharge,
  torsionState,
  TORSION_ARM,
  TORSION_STIFFNESS,
} from './coulomb-torsion';
describe('Coulomb measurement apparatus', () => {
  it('matches the independent 1nC, 10cm benchmark and inverse square ratio', () => {
    expect(coulombForce(1e-9, 1e-9, 0.1)).toBeCloseTo(8.9875517923e-7, 18);
    expect(coulombForce(1e-9, 1e-9, 0.05) / coulombForce(1e-9, 1e-9, 0.1)).toBe(4);
  });
  it('null balancing returns the arm and converts twist into force', () => {
    for (const distance of [0.04, 0.08, 0.16]) {
      const s = torsionState(distance);
      expect(s.angle).toBe(0);
      expect((TORSION_STIFFNESS * s.topAngle) / TORSION_ARM).toBeCloseTo(s.targetForce, 14);
      expect(s.restoringTorque + s.torque).toBeCloseTo(0, 16);
    }
  });
  it('free deflection changes actual separation and still balances torques', () => {
    const s = torsionState(0.08, 1, 0);
    expect(s.angle).toBeLessThan(0);
    expect(s.r).toBeGreaterThan(0.08);
    expect(s.restoringTorque + s.torque).toBeCloseTo(0, 14);
  });
  it('changes a suspended sphere angle through the full force geometry', () => {
    const a = suspendedCharge(0.07),
      b = suspendedCharge(0.14);
    expect(a.angle).toBeGreaterThan(b.angle);
    expect(a.torque).toBeCloseTo(a.mass * 9.8 * a.length * Math.sin(a.angle), 14);
    expect(suspendedCharge(0.1, 0).angle).toBe(0);
  });
  it('shares charge only after contact and conserves the amount', () => {
    expect(chargeSharing(0.3).probe).toBe(0);
    expect(chargeSharing(1).a).toBe(1.5e-9);
    for (const p of [0, 0.4, 0.5, 0.6, 1]) {
      const q = chargeSharing(p);
      expect(q.a + q.probe).toBe(3e-9);
    }
    expect(torsionState(0.08, 0.5).targetForce / torsionState(0.08).targetForce).toBe(0.5);
  });
});
