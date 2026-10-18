import { describe, it, expect } from 'vitest';
import {
  phoneMotion,
  phoneSamples,
  phoneShot,
  phoneForceMeter,
  PHONE_G,
  phoneWorldGeometry,
  phoneSensor,
  phoneElectrodes,
  phoneSensorSamples,
  phoneMeterInference,
  phoneCausalShot,
  PHONE_SENSOR_OMEGA,
} from './phone-accelerometer-lab';
describe('phone specific force and coordinate acceleration', () => {
  it('distinguishes supported rest and free fall', () => {
    expect(phoneMotion('drop', 0.2).raw).toBe(PHONE_G);
    expect(phoneMotion('drop', 0.2).corrected).toBe(0);
    expect(phoneMotion('drop', 0.55).raw).toBe(0);
    expect(phoneMotion('drop', 0.55).corrected).toBe(-PHONE_G);
  });
  it('preserves position and velocity across release, catch, and rest', () => {
    for (const t of [0.4, 0.7, 0.86]) {
      const a = phoneMotion('drop', t - 1e-8),
        b = phoneMotion('drop', t + 1e-8);
      expect(Math.abs(a.z - b.z)).toBeLessThan(1e-6);
      expect(Math.abs(a.v - b.v)).toBeLessThan(1e-6);
    }
  });
  it('the catch impulse removes exactly the downward momentum', () => {
    expect(phoneMotion('drop', 0.78).a * 0.16).toBeCloseTo(9.8 * 0.3, 12);
    expect(phoneMotion('drop', 0.9).v).toBe(0);
  });
  it('a rising lift can have positive, zero, or negative coordinate acceleration', () => {
    expect(phoneMotion('lift', 2).a).toBe(1);
    expect(phoneMotion('lift', 4).a).toBe(0);
    expect(phoneMotion('lift', 6).a).toBe(-1);
    expect(phoneMotion('lift', 6).v).toBeGreaterThan(0);
    expect(phoneMotion('lift', 8).z).toBe(8);
  });
  it('spring force measurements recover lift acceleration at all stages', () => {
    for (const time of [0, 2, 4, 6, 8]) {
      const s = phoneMotion('lift', time),
        m = phoneForceMeter(s.a);
      expect(m.force / m.mass - 9.8).toBeCloseTo(s.a, 12);
      expect(m.extension).toBeCloseTo(m.force / 20, 12);
    }
  });
  it('reconstructs samples and obeys raw-corrected=g throughout', () => {
    for (const s of phoneSamples('drop')) expect(s.raw - s.corrected).toBeCloseTo(PHONE_G, 10);
    expect(phoneShot(4, 0.5)).toEqual(phoneShot(4, 0.5));
    expect(() => phoneSamples('drop', 0)).toThrow();
  });
});

describe('internal proof mass and same-clock signal', () => {
  it('matches the independently derived supported and catch deflections', () => {
    expect(phoneSensor('drop', 0.2).q * 1e6).toBeCloseTo(-0.9929475996949103, 10);
    expect(phoneSensor('drop', 0.78).q * 1e6).toBeCloseTo(-2.854724349122867, 10);
    expect(phoneSensor('drop', 0.55).raw).toBeCloseTo(0, 10);
  });
  it('does not give the case and mass identical acceleration at release', () => {
    const release = phoneSensor('drop', 0.4);
    expect(release.a).toBe(-9.8);
    expect(release.massAcceleration).toBeCloseTo(0, 10);
    expect(release.raw).toBeCloseTo(9.8, 10);
    expect(release.corrected).toBeCloseTo(0, 10);
  });
  it('resolves damping reversal instead of equating elastic and total suspension force', () => {
    const s = phoneSensor('drop', 0.4 + 2 / PHONE_SENSOR_OMEGA);
    expect(s.raw).toBeCloseTo(3.9788573271564136, 9);
    expect(s.suspensionPerMass).toBeCloseTo(-1.3262857757188047, 9);
    expect(s.massAcceleration).toBeCloseTo(-11.126285775718806, 9);
    expect(s.corrected).toBeCloseTo(-5.821142672843587, 9);
  });
  it('keeps displacement and velocity continuous at all case input changes', () => {
    for (const trial of ['drop', 'lift'] as const) {
      const times = trial === 'drop' ? [0.4, 0.7, 0.86] : [1, 3, 5, 7];
      for (const time of times) {
        const before = phoneSensor(trial, time - 1e-10),
          after = phoneSensor(trial, time + 1e-10);
        expect(Math.abs(before.q - after.q)).toBeLessThan(1e-12);
        expect(Math.abs(before.qVelocity - after.qVelocity)).toBeLessThan(1e-7);
      }
    }
  });
  it('has the stated acceleration as the second derivative of relative displacement', () => {
    const t = 0.4007,
      dt = 1e-7,
      s = phoneSensor('drop', t);
    const derivative =
      (phoneSensor('drop', t + dt).qVelocity - phoneSensor('drop', t - dt).qVelocity) / (2 * dt);
    expect(derivative).toBeCloseTo(s.relativeAcceleration, 5);
  });
  it('uses dynamic raw minus g, including transients, and supports deterministic seeking', () => {
    for (const trial of ['drop', 'lift'] as const)
      for (const s of phoneSensorSamples(trial)) {
        expect(s.raw - s.corrected).toBeCloseTo(9.8, 10);
        const replay = phoneSensor(trial, s.t);
        expect(replay).toEqual(s);
        const electrodes = phoneElectrodes(s.q);
        expect(electrodes.topGap).toBeGreaterThan(0);
        expect(electrodes.bottomGap).toBeGreaterThan(0);
      }
  });
  it('derives gap, finite plate edges, capacitance and polarity from the same displacement', () => {
    for (const q of [-2.854724349122867e-6, -0.9929475996949103e-6, 0, 1e-6]) {
      const e = phoneElectrodes(q);
      expect(e.topElectrode - e.massTop).toBeCloseTo(e.topGap, 15);
      expect(e.massBottom - e.bottomElectrode).toBeCloseTo(e.bottomGap, 15);
      expect(e.imbalance).toBeCloseTo(q / 4e-6, 12);
      expect(-(PHONE_SENSOR_OMEGA ** 2) * 4e-6 * e.imbalance).toBeCloseTo(
        -(PHONE_SENSOR_OMEGA ** 2) * q,
        10,
      );
    }
    expect(() => phoneElectrodes(4e-6)).toThrow();
    expect(() => phoneElectrodes(NaN)).toThrow();
    expect(() => phoneSensor('drop', 0.5, 0)).toThrow();
    expect(() => phoneSensor('drop', 0.5, Infinity)).toThrow();
  });
  it('recovers acceleration without known mass only under the equal-magnitude assumption', () => {
    expect(phoneMeterInference(2.16, 1.76).acceleration).toBeCloseTo(1, 12);
    expect(phoneMeterInference(2.16, 1.76).mass).toBeCloseTo(0.2, 12);
    const unequal = phoneMeterInference(phoneForceMeter(2).force, phoneForceMeter(-1).force);
    expect(unequal.acceleration).not.toBeCloseTo(2, 3);
    expect(unequal.acceleration).not.toBeCloseTo(1, 3);
    expect(() => phoneMeterInference(0, 1)).toThrow();
    expect(() => phoneForceMeter(0, Infinity)).toThrow();
    expect(() => phoneForceMeter(0, 0.2, Infinity)).toThrow();
    expect(() => phoneForceMeter(-10)).toThrow();
  });
  it('aligns each voice to the same physical cause without using shared progress cutoffs', () => {
    for (const locale of ['zh', 'en'] as const) {
      const shot = (chapter: number, seconds: number) =>
        phoneCausalShot(chapter, 0, locale, seconds);
      expect(shot(0, 7).view).toBe('sensor');
      expect(shot(1, 3).slowed).toBe(true);
      expect(shot(1, 8).time).toBeGreaterThanOrEqual(0.4);
      expect(shot(1, 8).time).toBeLessThan(0.40004);
      expect(shot(1, 12).time).toBeGreaterThan(0.40004);
      expect(shot(1, 20).view).toBe('handset');
      expect(shot(1, 30.5).prediction).toBe(true);
      expect(shot(2, 2).time).toBeLessThan(0.7);
      expect(shot(2, 6).slowed).toBe(true);
      const sameClock = phoneSensor('drop', shot(2, 12).time);
      expect(sameClock.v).toBeLessThan(0);
      expect(sameClock.a).toBeGreaterThan(0);
      expect(shot(2, 22.1).time).toBe(0.2);
      expect(shot(2, 24).time).toBe(0.55);
      expect(shot(2, 26).time).toBe(0.78);
      expect(shot(2, 31).traceDetail).toBe(true);
      expect(shot(2, 35).traceDetail).toBe(false);
      expect(shot(3, 12).liftDetail).toBe(true);
      expect(phoneSensor('lift', shot(3, 17).time).a).toBe(0);
      expect(phoneSensor('lift', shot(3, 24).time).a).toBe(-1);
      expect(shot(4, 16).prediction).toBe(true);
      expect(shot(4, 23).prediction).toBe(false);
      expect(shot(5, 15).meterStage).toBe('readings');
      expect(shot(5, 25).meterStage).toBe('known');
      expect(shot(5, 32).meterStage).toBe('unknown');
      expect(shot(5, 40).meterStage).toBe(locale === 'en' ? 'difference' : 'ratio');
      expect(shot(5, locale === 'en' ? 44.5 : 41).prediction).toBe(true);
      expect(shot(5, locale === 'en' ? 45.5 : 42).meterStage).toBe('answer');
    }
  });
  it('reconstructs exact speech events deterministically when seeking backward', () => {
    for (const locale of ['zh', 'en'] as const)
      for (const chapter of [0, 1, 2, 3, 4, 5]) {
        const first = phoneCausalShot(chapter, 0, locale, 20);
        phoneCausalShot(chapter, 0, locale, 30);
        expect(phoneCausalShot(chapter, 0, locale, 20)).toEqual(first);
        const s = phoneSensor(first.trial, first.time);
        expect(s.raw - s.corrected).toBeCloseTo(9.8, 10);
      }
  });
});

describe('hand and cabin contact geometry', () => {
  it('uses one persistent catch surface which touches only when deceleration starts', () => {
    for (const compact of [true, false]) {
      for (const t of [0.65, 0.69, 0.6999]) {
        const w = phoneWorldGeometry('drop', t, compact);
        expect(w.catchHandTop).toBeGreaterThan(w.phoneBottom);
      }
      for (const t of [0.7, 0.7035, 0.78, 0.86, 1.2]) {
        const w = phoneWorldGeometry('drop', t, compact);
        expect(w.catchHandTop).toBeCloseTo(w.phoneBottom, 12);
      }
      const before = phoneWorldGeometry('drop', 0.7 - 1e-8, compact),
        after = phoneWorldGeometry('drop', 0.7 + 1e-8, compact);
      expect(Math.abs(before.catchHandY - after.catchHandY)).toBeLessThan(0.00001);
      expect(before.catchHandX).toBe(0);
      expect(after.catchHandX).toBe(0);
    }
  });
  it('withdraws the original support continuously and preserves a case-fixed lift assembly', () => {
    const a = phoneWorldGeometry('drop', 0.34, true),
      b = phoneWorldGeometry('drop', 0.37, true),
      c = phoneWorldGeometry('drop', 0.4, true);
    expect(a.supportHandX).toBeCloseTo(0, 12);
    expect(b.supportHandX).toBeCloseTo(-57, 8);
    expect(c.supportHandX).toBe(-114);
    expect(phoneWorldGeometry('lift', 6, true).cabinY).toBeLessThan(
      phoneWorldGeometry('lift', 2, true).cabinY,
    );
  });
});
