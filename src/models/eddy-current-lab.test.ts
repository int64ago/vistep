import { describe, expect, it } from 'vitest';
import {
  dampedMotion,
  meterDamping,
  discBraking,
  frameDrive,
  tubeFall,
  springDamping,
} from './eddy-current-lab';
describe('electromagnetic damping apparatuses', () => {
  it('preserves oscillator initial conditions and removes energy through viscous loss', () => {
    for (const c of [0.01, 2, 5]) {
      const s = dampedMotion(0, 1, 1, c, 0.5);
      expect(s.position).toBeCloseTo(0.5, 12);
      expect(s.velocity).toBeCloseTo(0, 12);
    }
    const t = 0.2,
      e = 1e-6,
      s = springDamping(t, true);
    const derivative =
      (springDamping(t + e, true).energy - springDamping(t - e, true).energy) / (2 * e);
    expect(-derivative).toBeCloseTo(s.heatPower, 7);
    expect(meterDamping(2, true).energy).toBeLessThan(meterDamping(2, false).energy);
  });
  it('brakes for either field sign, without prescribing rotor speed', () => {
    expect(discBraking(1, 0.3).omega).toBeLessThan(discBraking(1, 0).omega);
    expect(discBraking(1, -0.3).omega).toBe(discBraking(1, 0.3).omega);
    const t = 0.4,
      e = 1e-6;
    expect(-(discBraking(t + e).energy - discBraking(t - e).energy) / (2 * e)).toBeCloseTo(
      discBraking(t).heatPower,
      7,
    );
  });
  it('keeps driven frame below field speed and balances slip power', () => {
    const s = frameDrive(4);
    expect(s.omega).toBeLessThan(1.6);
    expect(s.omega).toBeGreaterThan(0);
    expect(s.inputPower - s.mechanicalPower).toBeCloseTo(s.joulePower, 12);
    expect(frameDrive(4, -1.6).angle).toBeCloseTo(-s.angle, 12);
  });
  it('reduces tube braking with a slit and clamps the magnet at the catch tray', () => {
    expect(tubeFall(0.4, true).position).toBeGreaterThan(tubeFall(0.4, false).position);
    expect(tubeFall(1, false).velocity).toBeCloseTo(0.7, 5);
    expect(tubeFall(10, false).position).toBe(1);
    expect(tubeFall(10, false).velocity).toBe(0);
  });
});
