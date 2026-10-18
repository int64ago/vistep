import { describe, it, expect } from 'vitest';
import {
  motorOscillator,
  measuredDriveFrequency,
  coupledPendulumTrajectory,
} from './forced-oscillation-lab';
describe('driven apparatus', () => {
  it('starts at rest relative to its moving support and obeys its forced ODE', () => {
    const a = motorOscillator(0);
    expect(a.q).toBeCloseTo(0, 12);
    expect(a.v).toBeCloseTo(0, 12);
    const t = 0.37,
      h = 1e-5,
      s = motorOscillator(t),
      acc = (motorOscillator(t + h).v - motorOscillator(t - h).v) / (2 * h);
    expect(acc + 2 * s.beta * s.v + s.w0 ** 2 * s.q).toBeCloseTo(
      s.amplitude * s.w ** 2 * Math.cos(s.w * t),
      7,
    );
  });
  it('measures the same settled frequency in unlike springs, with different amplitudes', () => {
    for (const f of [0.8, 1.2, 1.7])
      for (const k of [12, 26]) expect(measuredDriveFrequency(f, k)).toBeCloseTo(f, 5);
    expect(motorOscillator(30, 1.2, 12).steadyRelativeAmplitude).toBeGreaterThan(
      motorOscillator(30, 1.2, 26).steadyRelativeAmplitude,
    );
  });
  it('conserves total beam plus pendulum energy without damping and keeps A/G symmetry', () => {
    const p = coupledPendulumTrajectory(0.35, 0, 12);
    for (const s of p.samples.filter((_, i) => i % 1000 === 0)) {
      expect(s.energy).toBeCloseTo(p.samples[0].energy, 7);
      expect(s.angles[0]).toBeCloseTo(s.angles[6], 12);
    }
    expect(Math.max(...p.samples.map((s) => Math.abs(s.beam)))).toBeGreaterThan(0);
  });
  it('loses energy with damping and rejects invalid inputs', () => {
    const p = coupledPendulumTrajectory(0.35, 0.015, 8);
    expect(p.samples.at(-1)!.energy).toBeLessThan(p.samples[0].energy);
    expect(() => motorOscillator(NaN)).toThrow();
    expect(() => coupledPendulumTrajectory(0)).toThrow();
  });
});
it('retunes the strongest light pendulum through the actual coupled support', () => {
  for (const L of [0.35, 0.27]) {
    const p = coupledPendulumTrajectory(L),
      peak = Array.from({ length: 7 }, (_, i) =>
        Math.max(...p.samples.filter((s) => s.time > 20).map((s) => Math.abs(s.angles[i]))),
      );
    const matching = L === 0.35 ? [0, 6] : [1];
    for (const i of matching)
      for (const j of [0, 1, 2, 4, 5, 6].filter((x) => !matching.includes(x)))
        expect(peak[i]).toBeGreaterThan(peak[j]);
    expect(Math.max(...peak)).toBeLessThan(0.2);
  }
});
