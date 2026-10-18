import { describe, it, expect } from 'vitest';
import {
  dischargeState,
  sensorSamples,
  capacitorSharing,
  capacitorFilmState,
} from './capacitor-current-lab';
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
  it('holds a charged open circuit, then reveals the recorded curve in both languages', () => {
    for (const locale of ['zh', 'en'] as const) {
      const before = capacitorFilmState(0, 1.8, locale);
      expect(before.dischargeClosed).toBe(false);
      expect(before.physicalTime).toBe(0);
      const record = capacitorFilmState(0, 7, locale);
      expect(record.dischargeClosed).toBe(true);
      expect(record.plotView).toBe(true);
      expect(record.physicalTime).toBeGreaterThan(0);
      expect(dischargeState(record.physicalTime).remainingCharge).toBeGreaterThan(0);
    }
  });
  it('keeps the first receiver charged when the second receiving capacitor is introduced', () => {
    for (const locale of ['zh', 'en'] as const) {
      const first = capacitorFilmState(2, 23, locale);
      const next = capacitorFilmState(3, 0, locale);
      const a = capacitorSharing(first.sharingProgress, first.sharingRound);
      const b = capacitorSharing(next.sharingProgress, next.sharingRound);
      expect(a.connected).toBe(false);
      expect(a.chargeB).toBeCloseTo(0.003, 12);
      expect(b.a).toBe(a.a);
      expect(b.chargeB).toBe(0);
      expect(b.connected).toBe(false);
    }
  });
  it('reconstructs finite, monotonic discharge states when seeking across the film', () => {
    for (const locale of ['zh', 'en'] as const) {
      for (const chapter of [0, 1]) {
        let previous = 0;
        for (let seconds = 0; seconds <= 24; seconds += 0.1) {
          const state = capacitorFilmState(chapter, seconds, locale);
          expect(state.physicalTime).toBeGreaterThanOrEqual(previous);
          expect(state.physicalTime).toBeLessThanOrEqual(8);
          previous = state.physicalTime;
        }
      }
      expect(capacitorFilmState(0, NaN, locale).physicalTime).toBe(0);
      expect(capacitorFilmState(0, -1, locale).physicalTime).toBe(0);
    }
  });
});
