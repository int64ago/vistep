import { describe, it, expect } from 'vitest';
import { inductorDefaults, inductorOn, inductorOff } from './inductor-transient';
describe('RL current and clamped release', () => {
  it('accepts a circuit state as parameters when plotting subsequent samples', () => {
    const s = inductorOn(inductorDefaults(), 0.005);
    expect(inductorOn(s, 0.01).current).toBeCloseTo(0.3 * (1 - Math.exp(-2)), 12);
    const released = inductorOff(s, 0);
    expect(inductorOff(released, released.stopTime).current).toBe(0);
  });
  it('starts at zero current with full supply across the inductor', () => {
    const s = inductorOn(inductorDefaults(), 0);
    expect(s.current).toBe(0);
    expect(s.coilVoltage).toBe(6);
    expect(s.tau).toBe(0.005);
  });
  it('KVL and L di/dt remain consistent throughout energization', () => {
    const p = inductorDefaults(),
      h = 1e-7;
    for (const t of [0.001, 0.005, 0.015]) {
      const s = inductorOn(p, t),
        d = (inductorOn(p, t + h).current - inductorOn(p, t - h).current) / (2 * h);
      expect(s.coilVoltage + s.resistorVoltage).toBeCloseTo(6, 12);
      expect(p.inductance * d).toBeCloseTo(s.coilVoltage, 7);
    }
  });
  it('doubling inductance doubles the time constant without changing the limit', () => {
    const p = inductorDefaults();
    expect(inductorOn({ ...p, inductance: 0.2 }, 0.01).current).toBeCloseTo(
      inductorOn(p, 0.005).current,
      12,
    );
    expect(inductorOn({ ...p, inductance: 0.2 }, 1).steady).toBe(0.3);
  });
  it('release keeps initial current and reverses coil voltage; switch sees supply plus clamp', () => {
    const s = inductorOff(inductorDefaults(), 0);
    expect(s.current).toBeCloseTo(0.3, 12);
    expect(s.coilVoltage).toBeCloseTo(-6.7, 12);
    expect(s.switchVoltage).toBe(6.7);
  });
  it('a higher clamp shortens release and never produces negative diode-loop current', () => {
    const p = inductorDefaults(),
      a = inductorOff(p, 0),
      b = inductorOff({ ...p, clamp: 30 }, 0);
    expect(b.stopTime).toBeLessThan(a.stopTime / 10);
    expect(b.switchVoltage).toBe(36);
    expect(inductorOff(p, a.stopTime * 2).current).toBe(0);
    expect(inductorOff(p, a.stopTime * 2).coilVoltage).toBe(0);
  });
  it('independently integrates resistor and clamp powers to the lost magnetic energy', () => {
    for (const clamp of [0.7, 30]) {
      const p = { ...inductorDefaults(), clamp },
        a = inductorOff(p, 0),
        T = a.stopTime * 0.8,
        N = 600,
        h = T / N;
      let r = 0,
        c = 0;
      for (let i = 0; i <= N; i++) {
        const current = inductorOff(p, i * h).current,
          w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2;
        r += w * p.resistance * current * current;
        c += w * p.clamp * current;
      }
      const s = inductorOff(p, T);
      expect((r * h) / 3).toBeCloseTo(s.resistorHeat, 11);
      expect((c * h) / 3).toBeCloseTo(s.clampHeat, 11);
      expect(s.energy + s.resistorHeat + s.clampHeat).toBeCloseTo(0.0045, 12);
      const end = inductorOff(p, a.stopTime * 2);
      expect(end.resistorHeat + end.clampHeat).toBeCloseTo(0.0045, 12);
    }
  });
});
