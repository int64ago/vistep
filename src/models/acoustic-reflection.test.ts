import { describe, it, expect } from 'vitest';
import { acousticInterface, acousticField } from './acoustic-reflection';
describe('lossless normal acoustic interface', () => {
  it('matches independent pressure and energy benchmarks at4:1 impedance', () => {
    const s = acousticInterface();
    expect(s.r).toBe(0.6);
    expect(s.tp).toBe(1.6);
    expect(s.R).toBe(0.36);
    expect(s.T).toBeCloseTo(0.64, 12);
  });
  it('enforces both pressure and normal particle-velocity continuity for arbitrary pulse times and speeds', () => {
    for (const ratio of [0.1, 0.25, 1, 4, 10])
      for (const speedRatio of [0.5, 1, 2])
        for (const time of [0.001, 0.00175, 0.002, 0.003]) {
          const s = acousticInterface({ ratio, speedRatio }),
            p = acousticField(0, time, { ratio, speedRatio });
          expect(p.incident + p.reflected).toBeCloseTo(p.transmitted, 12);
          expect((p.incident - p.reflected) / s.Z1).toBeCloseTo(p.transmitted / s.Z2, 12);
          expect(s.R + s.T).toBeCloseTo(1, 12);
        }
  });
  it('preserves total physical energy in a spatial pulse integral including overlap', () => {
    const options = { ratio: 4, speedRatio: 0.5 },
      s = acousticInterface(options),
      energy = (time: number) => {
        const dx = 4 / 30000;
        let total = 0;
        for (let i = 0; i < 30000; i++) {
          const x = -2 + (i + 0.5) * dx,
            f = acousticField(x, time, options),
            Z = x < 0 ? s.Z1 : s.Z2,
            c = x < 0 ? s.c1 : s.c2;
          total +=
            ((f.pressure * f.pressure) / (2 * Z * c) + (Z * f.velocity * f.velocity) / (2 * c)) *
            dx;
        }
        return total;
      };
    const initial = energy(0);
    for (const time of [0.0015, 0.00175, 0.0035]) expect(energy(time) / initial).toBeCloseTo(1, 6);
  });
  it('reverses low-impedance reflected pressure but reverses its pressure/velocity relation as well', () => {
    const s = acousticInterface({ ratio: 0.25 });
    expect(s.r).toBe(-0.6);
    const p = acousticField(-0.3604, 0.0028, { ratio: 0.25 });
    expect(p.reflected).toBeLessThan(0);
    expect(p.velocity).toBeGreaterThan(0);
  });
  it('has no reflection at matched impedance even with a different speed', () => {
    const s = acousticInterface({ ratio: 1, speedRatio: 0.5 });
    expect(s.r).toBe(0);
    expect(s.T).toBe(1);
    expect(s.density2).toBeCloseTo(2 * s.density1, 12);
    expect(acousticField(0.18, 0.0028, { ratio: 1, speedRatio: 0.5 }).transmitted).toBeGreaterThan(
      0.9,
    );
  });
  it('rejects zero/negative impedances', () => {
    expect(() => acousticInterface({ ratio: 0 })).toThrow(RangeError);
  });
});
