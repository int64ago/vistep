import { describe, expect, it } from 'vitest';
import {
  BUZZER_DEFAULT,
  buzzerArrival,
  buzzerObservation,
  buzzerFronts,
  queueDoppler,
} from './doppler-lab';
describe('rotating buzzer and queue Doppler experiments', () => {
  it('recovers a stationary frequency and equal arrival intervals', () => {
    const a = { ...BUZZER_DEFAULT, turnsPerSecond: 0 };
    const s = buzzerObservation(0.3, a);
    expect(s.frequency).toBe(600);
    expect(s.interval).toBeCloseTo(1 / 600, 12);
    expect(buzzerArrival(s.emittedAt, a)).toBeCloseTo(0.3, 12);
  });
  it('matches an independent derivative of actual wave-arrival times throughout rotation', () => {
    for (let i = 0; i <= 120; i++) {
      const time = i / 240,
        s = buzzerObservation(time),
        h = 1e-7;
      const derivative =
        (buzzerArrival(s.emittedAt + h) - buzzerArrival(s.emittedAt - h)) / (2 * h);
      expect(s.frequency).toBeCloseTo(600 / derivative, 4);
      expect(buzzerArrival(s.emittedAt)).toBeCloseTo(time, 12);
      expect(s.arrivedAt).toBeLessThanOrEqual(time + 1e-10);
      expect(s.nextArrival).toBeGreaterThan(time - 1e-10);
      if (s.radialSpeed > 1) expect(s.frequency).toBeGreaterThan(600);
      if (s.radialSpeed < -1) expect(s.frequency).toBeLessThan(600);
    }
  });
  it('keeps emitted wave centres fixed and advances each radius at sound speed', () => {
    const a = buzzerFronts(0.2),
      b = buzzerFronts(0.201);
    for (const f of a) {
      expect(f.radius).toBeGreaterThanOrEqual(0);
      const next = b.find((x) => x.id === f.id);
      if (!next) continue;
      expect(next.x).toBe(f.x);
      expect(next.y).toBe(f.y);
      expect(next.radius - f.radius).toBeCloseTo(0.34, 10);
    }
  });
  it('keeps UI extremes subsonic and rejects non-monotonic sonic inputs', () => {
    for (const radius of [0.8, 1.5])
      for (const turnsPerSecond of [0, 0.3, 2])
        for (let i = 0; i <= 100; i++) {
          const s = buzzerObservation(i / 100, { ...BUZZER_DEFAULT, radius, turnsPerSecond });
          expect(s.frequency).toBeGreaterThan(550);
          expect(s.frequency).toBeLessThan(650);
        }
    expect(() => buzzerObservation(0, { ...BUZZER_DEFAULT, turnsPerSecond: 50 })).toThrow(
      RangeError,
    );
  });
  it('reproduces 30, 45 and 15 encounters/minute from identifiable moving people', () => {
    for (const [v, rate] of [
      [0, 30],
      [-0.5, 45],
      [0.5, 15],
    ]) {
      const s = queueDoppler(60, v);
      expect(s.perMinute).toBe(rate);
      expect(s.encounters).toBe(rate);
      const first = queueDoppler(s.period, v);
      expect(first.people.find((p) => p.id === -1)?.x).toBeCloseTo(first.observerX, 12);
    }
    expect(queueDoppler(60, 0.999).perMinute).toBeCloseTo(0.03);
    expect(() => queueDoppler(1, 1)).toThrow(RangeError);
  });
});
