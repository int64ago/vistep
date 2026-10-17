import { describe, it, expect } from 'vitest';
import { organPipe, organField, organNodes } from './organ-pipe';
describe('cylindrical organ resonator boundaries', () => {
  it('matches independent half-wave and quarter-wave fundamentals for the same length', () => {
    expect(organPipe().frequency).toBeCloseTo(343 / 1.2, 12);
    expect(organPipe({ stopped: true }).frequency).toBeCloseTo(343 / 2.4, 12);
  });
  it('has pressure nodes at effective open ends and a stationary particle boundary at a stopped end', () => {
    for (const stopped of [true, false])
      for (const mode of [1, 2, 3]) {
        const o = { stopped, mode, endFactor: 0.61 },
          s = organPipe(o);
        for (const phase of [0, 0.5, Math.PI / 2, 2]) {
          expect(organField(-s.e, phase, o).pressure).toBeCloseTo(0, 12);
          if (stopped) {
            expect(organField(s.L, phase, o).velocity).toBeCloseTo(0, 12);
            expect(organField(s.L, phase, o).displacement).toBeCloseTo(0, 12);
          } else expect(organField(s.L + s.e, phase, o).pressure).toBeCloseTo(0, 12);
        }
        for (const x of organNodes(o)) expect(organField(x, 0, o).pressure).toBeCloseTo(0, 12);
      }
  });
  it('obeys the independent Euler pressure-gradient/acceleration relation', () => {
    const o = { stopped: true, mode: 2 },
      s = organPipe(o),
      x = 0.23,
      phase = 0.7,
      h = 1e-5,
      px = (organField(x + h, phase, o).pressure - organField(x - h, phase, o).pressure) / (2 * h),
      ut =
        (s.omega * (organField(x, phase + h, o).velocity - organField(x, phase - h, o).velocity)) /
        (2 * h);
    expect(px + s.rho * ut).toBeCloseTo(0, 6);
  });
  it('keeps total acoustic energy constant over phase, despite swapping pressure and velocity energy', () => {
    const o = { stopped: true, mode: 2 },
      s = organPipe(o),
      energy = (phase: number) => {
        let sum = 0,
          N = 10000;
        for (let i = 0; i < N; i++) {
          const p = organField((s.L * (i + 0.5)) / N, phase, o);
          sum +=
            (((p.pressure * p.pressure) / (2 * s.rho * s.c * s.c) +
              (s.rho * p.velocity * p.velocity) / 2) *
              s.L) /
            N;
        }
        return sum;
      };
    expect(energy(0)).toBeCloseTo(energy(Math.PI / 2), 12);
  });
  it('selects only odd stopped harmonics, and end correction lowers the same geometric pipe frequency', () => {
    for (const [i, mode] of [1, 2, 3].entries())
      expect(
        organPipe({ stopped: true, mode }).frequency / organPipe({ stopped: true }).frequency,
      ).toBeCloseTo([1, 3, 5][i], 12);
    const s = organPipe({ endFactor: 0.61 });
    expect(s.effectiveLength).toBeCloseTo(0.6305, 12);
    expect(s.frequency).toBeCloseTo(343 / 1.261, 10);
    expect(s.frequency).toBeLessThan(organPipe().frequency);
  });
  it('doubles frequency when physical/effective length halves without correction', () => {
    expect(organPipe({ length: 0.4 }).frequency / organPipe({ length: 0.8 }).frequency).toBe(2);
    expect(() => organPipe({ mode: 1.5 })).toThrow(RangeError);
  });
});
