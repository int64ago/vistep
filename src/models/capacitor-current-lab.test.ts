import { describe, it, expect } from 'vitest';
import { dischargeState, sensorSamples, capacitorSharing } from './capacitor-current-lab';
describe('current sensor and capacitor charge sharing', () => {
  it('matches an independent RC time-constant benchmark', () => {
    const s = dischargeState(2);
    expect(s.tau).toBe(2);
    expect(s.current).toBeCloseTo(0.003 / Math.E, 14);
    expect(s.voltage).toBeCloseTo(6 / Math.E, 12);
    expect(s.releasedCharge + s.remainingCharge).toBe(0.006);
  });
  it('integrates sampled current to the independently known charge difference', () => {
    const s = dischargeState(8),
      samples = sensorSamples(8);
    expect(Math.abs(samples.integrated - s.releasedCharge) / s.releasedCharge).toBeLessThan(
      0.00006,
    );
    expect(sensorSamples(0).integrated).toBe(0);
  });
  it('leaves a finite tail rather than claiming full discharge at a finite time', () => {
    const s = dischargeState(8);
    expect(s.remainingCharge).toBeGreaterThan(0);
    expect(s.releasedCharge).toBeLessThan(s.initialCharge);
  });
  it('halves voltage and charge in successive identical empty capacitors', () => {
    for (const round of [1, 2] as const) {
      const s = capacitorSharing(1, round);
      expect(s.a).toBe(6 / 2 ** round);
      expect(s.b).toBe(s.a);
      expect(s.chargeA + s.chargeB).toBe(0.006 / 2 ** (round - 1));
    }
  });
  it('conserves charge while dissipating half the initial energy', () => {
    const s = capacitorSharing(1);
    expect(s.energyAfter / s.energyBefore).toBe(0.5);
    expect(s.dissipated).toBeGreaterThan(0);
    expect(capacitorSharing(0.2).b).toBe(0);
  });
});
