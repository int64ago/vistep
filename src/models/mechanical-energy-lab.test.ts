import { describe, it, expect } from 'vitest';
import {
  fallingEnergy,
  tapeEnergy,
  gateMeasurement,
  inclinedEnergy,
  hangerEnergy,
  energyPendulum,
} from './mechanical-energy-lab';
describe('mechanical energy measurements', () => {
  it('derives instantaneous speeds independently from equal-time tape positions', () => {
    for (const r of [0, 0.08, 0.16]) {
      const s = tapeEnergy(r);
      expect(s.v1).toBeCloseTo(fallingEnergy(s.t1, r).v, 12);
      expect(s.v2).toBeCloseTo(fallingEnergy(s.t2, r).v, 12);
      expect(s.potentialLoss - s.kineticGain).toBeCloseTo((r / s.mass) * s.height, 12);
    }
  });
  it('air/paper resistance removes mechanical energy by its work', () => {
    const s = fallingEnergy(0.4, 0.12);
    expect(s.potentialLoss - s.kinetic).toBeCloseTo(s.dissipation, 12);
  });
  it('finite flag measures mean speed and tends to instantaneous speed as width vanishes', () => {
    const a = gateMeasurement(0.3, 0.08, 2),
      b = gateMeasurement(0.3, 0.001, 2);
    expect(a.meanSpeed).toBeLessThan(a.trueSpeed);
    expect(Math.abs(b.meanSpeed - b.trueSpeed)).toBeLessThan(1e-6);
    expect(a.centerCorrection).toBeCloseTo(a.trueSpeed, 12);
  });
  it('gate entry/exit positions match exact leading/trailing edges', () => {
    const s = gateMeasurement(0.3, 0.02, 2);
    expect(s.enter * s.enter).toBeCloseTo(0.29);
    expect(s.exit * s.exit).toBeCloseTo(0.31);
  });
  it('inclined track separates dissipative loss from finite-gate error', () => {
    for (const r of [0, 0.04, 0.1]) {
      const s = inclinedEnergy(1, r);
      expect(s.potentialLoss - s.trueGain).toBeCloseTo(s.frictionLoss, 12);
      expect(Math.abs(s.kineticGain - s.trueGain)).toBeLessThan(0.00005);
    }
  });
  it('hanger system includes both masses and consistent tension', () => {
    const s = hangerEnergy(0.5);
    expect(s.hangerMass * 9.8 - s.tension).toBeCloseTo(s.hangerMass * s.a);
    expect(s.cartOnly).toBeLessThan(s.kineticGain);
    expect(Math.abs(s.potentialLoss - s.kineticGain)).toBeLessThan(0.00003);
  });
  it('pendulum independently integrates gravity while conserving energy and string length', () => {
    for (const t of [0, 0.3, 0.8, 1.6, 3]) {
      const s = energyPendulum(t);
      expect(s.potential + s.kinetic).toBeCloseTo(s.total, 9);
      expect(Math.hypot(s.x, s.y)).toBeCloseTo(s.length, 12);
    }
  });
  it('rejects invalid gates and stops bodies before apparatus ends', () => {
    expect(() => gateMeasurement(0.01, 0.1, 2)).toThrow();
    expect(inclinedEnergy(100).x).toBeCloseTo(1.05);
    expect(hangerEnergy(100).x).toBeCloseTo(0.82);
  });
});
