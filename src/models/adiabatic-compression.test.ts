import { describe, expect, it } from 'vitest';
import { gasProcess } from './adiabatic-compression';
describe('Ideal-gas work and thermal boundaries', () => {
  it('matches the independent six-to-one textbook compression benchmark', () => {
    const s = gasProcess({ volume0: 240e-6, ratio: 1 / 6, temperature0: 293 });
    expect(s.pressure / 1e6).toBeCloseTo(1.2286, 3);
    expect(s.temperature).toBeCloseTo(599.97, 0);
    expect(s.workOn).toBeCloseTo(62.9, 0);
  });
  it('independently integrates piston pressure work and satisfies the first law', () => {
    for (const process of ['adiabatic', 'isothermal'] as const)
      for (const ratio of [0.4, 0.7, 1.5]) {
        const s = gasProcess({ process, ratio }),
          steps = 10000,
          dV = (s.volume - s.volume0) / steps;
        let work = 0;
        for (let i = 0; i < steps; i++) {
          const V = s.volume0 + (i + 0.5) * dV;
          work -= gasProcess({ process, ratio: V / s.volume0 }).pressure * dV;
        }
        expect(work).toBeCloseTo(s.workOn, 5);
        expect(s.heatIn + s.workOn).toBeCloseTo(s.deltaU, 12);
      }
  });
  it('preserves reversible adiabatic invariants and has a steeper slope than isothermal', () => {
    const a = gasProcess({ ratio: 0.5 }),
      b = gasProcess({ ratio: 0.5, process: 'isothermal' });
    expect(a.pressure * a.volume ** a.gamma).toBeCloseTo(a.pressure0 * a.volume0 ** a.gamma, 10);
    expect(a.entropy).toBeCloseTo(0, 12);
    expect(a.heatIn).toBe(0);
    expect(a.pressure).toBeGreaterThan(b.pressure);
    expect(a.workOn).toBeGreaterThan(b.workOn);
  });
  it('returns to the initial state by reversing the same adiabatic path', () => {
    const a = gasProcess(),
      b = gasProcess({
        ratio: 2,
        volume0: a.volume,
        temperature0: a.temperature,
        pressure0: a.pressure,
      });
    expect(b.temperature).toBeCloseTo(300, 12);
    expect(b.pressure).toBeCloseTo(1e5, 8);
    expect(b.workOn).toBeCloseTo(-a.workOn, 10);
  });
  it('distinguishes no-heat free expansion from reversible expansion', () => {
    const f = gasProcess({ process: 'free', ratio: 2 }),
      a = gasProcess({ ratio: 2 });
    expect(f.heatIn).toBe(0);
    expect(f.workOn).toBe(0);
    expect(f.temperature).toBe(300);
    expect(f.pressure).toBe(50000);
    expect(f.entropy).toBeGreaterThan(0);
    expect(a.temperature).toBeLessThan(f.temperature);
  });
  it('links heat capacity to gamma and rejects invalid cases', () => {
    expect(gasProcess({ gamma: 5 / 3 }).temperature).toBeGreaterThan(
      gasProcess({ gamma: 1.4 }).temperature,
    );
    for (const o of [
      { gamma: 1 },
      { ratio: 0 },
      { process: 'free' as const, ratio: 0.5 },
      { temperature0: NaN },
    ])
      expect(() => gasProcess(o)).toThrow(RangeError);
  });
});
