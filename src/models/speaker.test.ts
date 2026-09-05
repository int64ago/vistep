import { describe, it, expect } from 'vitest';
import {
  SPEAKER_PARAMETERS as P,
  speakerAdvance,
  speakerAir,
  speakerEvaluate,
  speakerFrequencyCurve,
  speakerGeometry,
  speakerResponse,
  speakerShot,
  speakerSine,
  type SpeakerState,
} from './speaker';
const close = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(tol);
describe('reciprocal small-signal speaker', () => {
  it('balances the two coupling powers and instantaneous total energy', () => {
    for (const current of [-0.07, 0, 0.12])
      for (const velocity of [-0.2, 0, 0.1]) {
        const s = speakerEvaluate(P, { current, velocity, position: 0.0002 }, 0.4);
        close(s.force * velocity, s.backEmf * current);
        close(s.inputPower, s.copperLoss + s.mechanicalLoss + s.storedRate);
        close(P.mass * s.acceleration, s.force + s.springForce + s.dampingForce);
      }
  });
  it('matches frequency phasors to both time-domain differential equations', () => {
    const h = 1e-7;
    for (const f of [20, 50, 180, 400])
      for (const phase of [0.2, 1.4, 3.2]) {
        const s = speakerSine(P, f, 0.35, phase),
          a = speakerSine(P, f, 0.35, phase - 2 * Math.PI * f * h),
          b = speakerSine(P, f, 0.35, phase + 2 * Math.PI * f * h);
        close((b.current - a.current) / (2 * h), s.currentRate, 3e-6);
        close((b.position - a.position) / (2 * h), s.velocity, 3e-9);
        close((b.velocity - a.velocity) / (2 * h), s.acceleration, 3e-6);
      }
  });
  it('has correct DC, zero-input, polarity, linearity and uncoupled limits', () => {
    const dc = speakerResponse(P, 0, 0.6);
    close(dc.current.re, 0.1);
    close(dc.position.re, (4 * 0.1) / 1200);
    expect(dc.velocity.re).toBe(0);
    const zero = speakerSine(P, 50, 0, 1);
    expect(zero.storedEnergy).toBe(0);
    close(speakerResponse(P, 50, 0).impedance, speakerResponse(P, 50, 1).impedance);
    const a = speakerSine(P, 50, 0.2, 0.7),
      b = speakerSine(P, 50, 0.4, 0.7),
      c = speakerSine(P, 50, 0.2, 0.7 + Math.PI);
    close(b.position, 2 * a.position);
    close(c.force, -a.force);
    close(c.position, -a.position);
    const noMotor = speakerResponse({ ...P, forceFactor: 0 }, 50, 0.35);
    expect(noMotor.amplitude).toBe(0);
    close(noMotor.impedance, Math.hypot(P.resistance, 2 * Math.PI * 50 * P.inductance));
  });
  it('balances period-averaged input and losses using independent quadrature', () => {
    for (const f of [20, 50, 150, 400]) {
      const r = speakerResponse(P, f, 0.35);
      let input = 0,
        loss = 0;
      for (let j = 0; j < 256; j++) {
        const s = speakerSine(P, f, 0.35, (j * 2 * Math.PI) / 256);
        input += s.inputPower / 256;
        loss += (s.copperLoss + s.mechanicalLoss) / 256;
      }
      close(input, r.averageInput);
      close(input, loss);
      close(loss, r.averageCopper + r.averageMechanical);
    }
  });
  it('direct transient agrees with an independent fixed-step RK4 solution', () => {
    let y: SpeakerState = { current: 0, position: 0, velocity: 0 };
    const dt = 1e-6,
      drive = 0.35;
    const d = (s: SpeakerState) => {
      const z = speakerEvaluate(P, s, drive);
      return { current: z.currentRate, position: z.velocity, velocity: z.acceleration };
    };
    const plus = (a: SpeakerState, b: SpeakerState, h: number) => ({
      current: a.current + h * b.current,
      position: a.position + h * b.position,
      velocity: a.velocity + h * b.velocity,
    });
    for (let n = 0; n < 20000; n++) {
      const a = d(y),
        b = d(plus(y, a, dt / 2)),
        c = d(plus(y, b, dt / 2)),
        e = d(plus(y, c, dt));
      y = {
        current: y.current + (dt * (a.current + 2 * b.current + 2 * c.current + e.current)) / 6,
        position:
          y.position + (dt * (a.position + 2 * b.position + 2 * c.position + e.position)) / 6,
        velocity:
          y.velocity + (dt * (a.velocity + 2 * b.velocity + 2 * c.velocity + e.velocity)) / 6,
      };
    }
    const exact = speakerAdvance(P, { current: 0, position: 0, velocity: 0 }, drive, 0.02);
    close(exact.current, y.current, 1e-10);
    close(exact.position, y.position, 1e-11);
    close(exact.velocity, y.velocity, 1e-10);
  });
  it('independently differentiates transient stored energy against input minus losses', () => {
    const start = { current: 0, position: 0, velocity: 0 },
      h = 1e-7;
    const energy = (s: SpeakerState) =>
      0.5 * P.inductance * s.current ** 2 +
      0.5 * P.mass * s.velocity ** 2 +
      0.5 * P.stiffness * s.position ** 2;
    for (const time of [0.001, 0.006, 0.013, 0.03]) {
      const before = speakerAdvance(P, start, 0.35, time - h),
        after = speakerAdvance(P, start, 0.35, time + h),
        s = speakerAdvance(P, start, 0.35, time);
      close(
        (energy(after) - energy(before)) / (2 * h),
        0.35 * s.current - P.resistance * s.current ** 2 - P.damping * s.velocity ** 2,
        1e-7,
      );
    }
  });
  it('composes propagation, settles to DC and reconstructs a release without history', () => {
    const start = { current: 0.04, position: 0.0001, velocity: 0.02 };
    const one = speakerAdvance(P, start, 0.35, 0.03),
      half = speakerAdvance(P, start, 0.35, 0.015),
      two = speakerAdvance(P, half, 0.35, 0.015);
    close(one.position, two.position, 1e-11);
    close(one.velocity, two.velocity, 1e-10);
    const settled = speakerAdvance(P, { current: 0, position: 0, velocity: 0 }, 0.35, 1);
    close(settled.current, 0.35 / 6);
    close(settled.position, (4 * 0.35) / 7200);
    expect(speakerAdvance(P, { current: 0, position: 0, velocity: 0 }, 0, 1).storedEnergy).toBe(0);
  });
  it('release dissipates stored energy and exhibits mechanical-to-electrical conversion', () => {
    const start = { current: 0.35 / 6, position: (4 * 0.35) / 7200, velocity: 0 };
    let previous = speakerEvaluate(P, start, 0).storedEnergy,
      minPower = 0;
    for (let j = 0; j <= 100; j++) {
      const s = speakerAdvance(P, start, 0, j * 0.0005);
      expect(s.storedEnergy).toBeLessThanOrEqual(previous + 1e-12);
      previous = s.storedEnergy;
      minPower = Math.min(minPower, s.motorPower);
      close(s.inputPower, 0);
    }
    expect(minPower).toBeLessThan(-1e-5);
  });
  it('retains reciprocal resonance and inductive high-frequency limits', () => {
    const fs = Math.sqrt(P.stiffness / P.mass) / (2 * Math.PI),
      res = speakerResponse(P, fs, 1);
    close(
      res.impedance,
      Math.hypot(P.resistance + P.forceFactor ** 2 / P.damping, 2 * Math.PI * fs * P.inductance),
    );
    const high = speakerResponse(P, 1e6, 1);
    close(high.currentAmplitude * 2 * Math.PI * 1e6 * P.inductance, 1, 3e-6);
    expect(speakerResponse({ ...P, damping: 0.3 }, 50, 1).amplitude).toBeGreaterThan(
      speakerResponse({ ...P, damping: 2.5 }, 50, 1).amplitude,
    );
  });
  it('keeps every suspension and lead attached over all supported excursions', () => {
    for (const x of [-0.0004, 0, 0.0004]) {
      const g = speakerGeometry(x);
      expect(g.overhang).toBeGreaterThan(0);
      for (const h of g.halves) {
        expect(h.spider[0]).toEqual(h.cone[0]);
        expect(h.surround[0]).toEqual(h.cone[1]);
        expect(h.surround[3]).toEqual([42, 65 * h.sign]);
        expect(h.leadTail[0]).toEqual(h.lead[3]);
        close(h.leadTail[1][0], h.coil.at(-1)![0]);
        close(h.spider.at(-1)![0], -7);
      }
    }
    for (const f of [20, 30, 40, 50, 80, 200, 400])
      for (const damping of [0.3, 0.8, 2.5])
        expect(
          speakerGeometry(speakerResponse({ ...P, damping }, f, 0.4).amplitude).overhang,
        ).toBeGreaterThan(0);
  });
  it('traces material air points with the retarded cone displacement', () => {
    const a = speakerAir(P, 50, 0.35, 0.7),
      b = speakerAir(P, 50, 0.35, 0.7 + 2 * Math.PI),
      r = speakerResponse(P, 50, 0.35);
    close(a.tracked.position, b.tracked.position);
    close(a.tracked.compression, a.tracked.velocity / 343);
    for (let j = 1; j < a.particles.length; j++)
      expect(a.particles[j].position).toBeGreaterThan(a.particles[j - 1].position);
    expect(a.particles.every((p) => Math.abs(p.displacement) <= r.amplitude + 1e-15)).toBe(true);
    expect(
      speakerAir(P, 50, 0, 1).particles.every((p) => p.position === p.rest && p.shade === 0),
    ).toBe(true);
  });
  it('bounds work and rejects invalid inputs', () => {
    expect(speakerFrequencyCurve(P, 10000)).toHaveLength(321);
    expect(speakerAir(P, 50, 0.35, 0, 1000).particles).toHaveLength(81);
    expect(() =>
      speakerAdvance(P, { current: 0, position: 0, velocity: 0 }, 0, Infinity),
    ).toThrow();
    expect(() => speakerResponse({ ...P, inductance: 0 }, 50)).toThrow();
    expect(() => speakerResponse(P, -1)).toThrow();
    expect(() => speakerAir(P, 0, 0.35, 0)).toThrow();
    expect(() => speakerAir(P, 50, 0.35, Infinity)).toThrow();
  });
  it('reconstructs 808 director states in reverse order with finite connected geometry', () => {
    const states = Array.from({ length: 808 }, (_, i) =>
      speakerShot(Math.floor(i / 101), (i % 101) / 100),
    );
    for (let i = 807; i >= 0; i--) {
      expect(speakerShot(Math.floor(i / 101), (i % 101) / 100)).toEqual(states[i]);
      expect(speakerGeometry(states[i].state.position).overhang).toBeGreaterThan(0);
      expect(Object.values(states[i].state).every(Number.isFinite)).toBe(true);
    }
  });
});
