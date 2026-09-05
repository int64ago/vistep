import { describe, it, expect } from 'vitest';
import {
  diffusionField,
  diffusionValue,
  diffusionGradient,
  diffusionFlux,
  diffusionIntegral,
  diffusionTimeDerivative,
  diffusionDiagnostics,
  diffusionSamples,
  diffusionShot,
  diffusionColor,
  diffusionBoundaryBudget,
} from './diffusion';
const close = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol);
describe('exact concentration diffusion in a finite strip', () => {
  it('reconstructs the normalized sin^8 initial pulse without a truncated discontinuity', () => {
    const f = diffusionField();
    for (let i = 0; i <= 100; i++)
      close(diffusionValue(f, i / 100), (128 / 35) * Math.sin((Math.PI * i) / 100) ** 8);
    close(diffusionIntegral(f), 1);
    close(diffusionDiagnostics(f).mean, 0.5);
  });
  it('conserves each closed species and satisfies exact zero end flux at every requested time', () => {
    for (const kind of ['pulse', 'mix'] as const)
      for (const length of [0.5, 1, 2])
        for (const time of [0, 0.01, 0.5, 4, 40, 120])
          for (const species of kind === 'mix' ? (['A', 'B'] as const) : (['A'] as const)) {
            const f = diffusionField({ kind, length, D: 0.1, mass: 0.7 }, time, species);
            close(diffusionIntegral(f), 0.7);
            expect(diffusionFlux(f, 0)).toBe(0);
            expect(diffusionFlux(f, length)).toBe(0);
            close(diffusionDiagnostics(f).massResidual, 0);
          }
  });
  it('preserves nonnegative concentrations and the initial maximum across supported extremes', () => {
    for (const kind of ['pulse', 'mix', 'reservoir'] as const)
      for (const length of [0.5, 2])
        for (const time of [0, 0.0001, 0.1, 1, 10, 120]) {
          const initial = diffusionField({ kind, length, D: 0.1 }),
            f = diffusionField({ kind, length, D: 0.1 }, time),
            max = kind === 'pulse' ? 128 / 35 / length : kind === 'mix' ? 1.95 / length : 1;
          for (let i = 0; i <= 300; i++) {
            const c = diffusionValue(f, (i * length) / 300);
            expect(c).toBeGreaterThanOrEqual(-1e-14);
            expect(c).toBeLessThanOrEqual(max + 1e-13);
          }
          close(diffusionIntegral(initial), diffusionDiagnostics(f).initialMass);
        }
  });
  it('has flux down the independently differentiated concentration gradient, not a bulk velocity', () => {
    const f = diffusionField({}, 0.7),
      h = 1e-5;
    for (const x of [0.17, 0.33, 0.5, 0.67, 0.83]) {
      const slope = (diffusionValue(f, x + h) - diffusionValue(f, x - h)) / (2 * h);
      close(diffusionGradient(f, x), slope, 1e-8);
      close(diffusionFlux(f, x), -f.p.D * slope, 1e-9);
    }
    expect(diffusionFlux(f, 0.33)).toBeLessThan(0);
    expect(diffusionFlux(f, 0.67)).toBeGreaterThan(0);
    close(diffusionFlux(f, 0.5), 0);
  });
  it('satisfies the PDE independently through spatial and temporal differences', () => {
    for (const kind of ['pulse', 'mix', 'reservoir'] as const) {
      const f = diffusionField({ kind }, 0.7),
        dx = 1e-4,
        dt = 1e-5;
      for (const x of [0.15, 0.43, 0.72]) {
        const numerical =
            (f.p.D *
              (diffusionValue(f, x + dx) - 2 * diffusionValue(f, x) + diffusionValue(f, x - dx))) /
            (dx * dx),
          temporal =
            (diffusionValue(diffusionField({ kind }, 0.7 + dt), x) -
              diffusionValue(diffusionField({ kind }, 0.7 - dt), x)) /
            (2 * dt);
        close(numerical, temporal, 2e-7);
        close(temporal, diffusionTimeDerivative(f, x), 1e-9);
      }
    }
  });
  it('balances a changing subvolume against its two section fluxes', () => {
    const f = diffusionField({}, 0.5),
      dt = 1e-5,
      a = 0.55,
      b = 0.85,
      rate =
        (diffusionIntegral(diffusionField({}, 0.5 + dt), a, b) -
          diffusionIntegral(diffusionField({}, 0.5 - dt), a, b)) /
        (2 * dt);
    close(rate, diffusionFlux(f, a) - diffusionFlux(f, b), 1e-9);
    expect(rate).toBeGreaterThan(0);
  });
  it('grows pulse variance toward the finite uniform limit and obeys the wall correction to 2Dt', () => {
    const times = [0, 0.001, 0.1, 0.5, 1, 3, 8, 18, 40];
    let prior = -1;
    for (const time of times) {
      const f = diffusionField({}, time),
        d = diffusionDiagnostics(f);
      expect(d.variance + 1e-13).toBeGreaterThanOrEqual(prior);
      prior = d.variance;
      expect(d.variance).toBeLessThanOrEqual(1 / 12 + 1e-13);
    }
    close(prior, 1 / 12, 1e-10);
    const dt = 1e-5;
    for (const time of [0.05, 1, 5]) {
      const f = diffusionField({}, time),
        rate =
          (diffusionDiagnostics(diffusionField({}, time + dt)).variance -
            diffusionDiagnostics(diffusionField({}, time - dt)).variance) /
          (2 * dt);
      close(rate, 2 * f.p.D - f.p.D * (diffusionValue(f, 0) + diffusionValue(f, 1)), 1e-9);
    }
    close(
      (diffusionDiagnostics(diffusionField({}, 0.001)).variance -
        diffusionDiagnostics(diffusionField({}, 0)).variance) /
        0.001,
      0.03,
      1e-7,
    );
  });
  it('reduces macroscopic concentration nonuniformity with the exact dissipation rate', () => {
    for (const kind of ['pulse', 'mix', 'reservoir'] as const) {
      const f = diffusionField({ kind }, 1),
        d = diffusionDiagnostics(f),
        dt = 1e-5;
      expect(d.smoothingRate).toBeLessThan(0);
      const difference =
        (diffusionDiagnostics(diffusionField({ kind }, 1 + dt)).smoothingEnergy -
          diffusionDiagnostics(diffusionField({ kind }, 1 - dt)).smoothingEnergy) /
        (2 * dt);
      close(difference, d.smoothingRate, 1e-9);
      expect(diffusionDiagnostics(diffusionField({ kind }, 4)).smoothingEnergy).toBeLessThan(
        d.smoothingEnergy,
      );
    }
  });
  it('scales D times time and length squared while holding total closed mass fixed', () => {
    const a = diffusionField({ D: 0.01 }, 4),
      b = diffusionField({ D: 0.02 }, 2),
      long = diffusionField({ D: 0.01, length: 2 }, 16);
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      close(diffusionValue(a, x), diffusionValue(b, x));
      close(diffusionValue(a, x), 2 * diffusionValue(long, 2 * x));
      close(diffusionFlux(long, 2 * x), diffusionFlux(a, x) / 4);
    }
    close(diffusionDiagnostics(long).variance, 4 * diffusionDiagnostics(a).variance);
    close(diffusionIntegral(long), 1);
  });
  it('mixes two independently conserved species without reaction or lost color mass', () => {
    for (const time of [0, 1, 5, 30, 120]) {
      const a = diffusionField({ kind: 'mix' }, time, 'A'),
        b = diffusionField({ kind: 'mix' }, time, 'B');
      close(diffusionIntegral(a), 1);
      close(diffusionIntegral(b), 1);
      for (let i = 0; i <= 100; i++)
        close(diffusionValue(a, i / 100) + diffusionValue(b, i / 100), 2);
      close(diffusionFlux(a, 0.5), -diffusionFlux(b, 0.5));
    }
    expect(diffusionColor(1, 1)).not.toBe(diffusionColor(0, 0));
  });
  it('accounts for mass entering fixed reservoirs and retains nonzero steady diffusive flux', () => {
    const initial = diffusionField({ kind: 'reservoir' }),
      late = diffusionField({ kind: 'reservoir' }, 120),
      d = diffusionDiagnostics(late);
    close(diffusionValue(late, 0), 1);
    close(diffusionValue(late, 1), 0);
    expect(d.mass).toBeGreaterThan(diffusionIntegral(initial));
    close(d.massResidual, 0, 1e-13);
    close(d.massRate, d.leftFlux - d.rightFlux);
    close(d.leftFlux, 0.015, 1e-9);
    close(d.rightFlux, 0.015, 1e-9);
    close(d.mass, 0.5, 1e-8);
    for (const time of [0, 0.1, 1, 5, 40]) {
      const f = diffusionField({ kind: 'reservoir' }, time),
        b = diffusionBoundaryBudget(f);
      close(diffusionIntegral(f) - diffusionIntegral(initial), b.leftIn - b.rightOut, 1e-13);
    }
  });
  it('matches an independent conservative finite-volume diffusion scheme under mesh refinement', () => {
    const error = (n: number, kind: 'pulse' | 'reservoir') => {
      const D = 0.015,
        T = 0.8,
        dx = 1 / n,
        steps = Math.ceil(T / ((0.15 * dx * dx) / D)),
        dt = T / steps,
        start = diffusionField({ kind }),
        exact = diffusionField({ kind }, T);
      let c = diffusionSamples(start, n).map((s) => s.concentration);
      for (let k = 0; k < steps; k++) {
        const j = Array(n + 1).fill(0);
        if (kind === 'reservoir') {
          j[0] = (-D * (c[0] - 1)) / (dx / 2);
          j[n] = (-D * (0 - c[n - 1])) / (dx / 2);
        }
        for (let i = 1; i < n; i++) j[i] = (-D * (c[i] - c[i - 1])) / dx;
        c = c.map((v, i) => v + (dt / dx) * (j[i] - j[i + 1]));
      }
      return Math.sqrt(
        c.reduce(
          (e, v, i) => e + (v - diffusionIntegral(exact, i * dx, (i + 1) * dx) / dx) ** 2,
          0,
        ) / n,
      );
    };
    for (const kind of ['pulse', 'reservoir'] as const) {
      const a = error(32, kind),
        b = error(64, kind),
        c = error(128, kind);
      expect(b).toBeLessThan(a * 0.3);
      expect(c).toBeLessThan(b * 0.3);
      expect(c).toBeLessThan(0.0001);
    }
  });
  it('makes cell-average rendering conserve mass and quadrature converge to exact moments', () => {
    const f = diffusionField({}, 0.5),
      exact = diffusionDiagnostics(f);
    let previous = Infinity;
    for (const n of [16, 32, 64, 128]) {
      const samples = diffusionSamples(f, n),
        dx = 1 / n;
      close(
        samples.reduce((sum, s) => sum + s.concentration * dx, 0),
        1,
      );
      const variance = samples.reduce((sum, s) => sum + (s.x - 0.5) ** 2 * s.concentration * dx, 0),
        error = Math.abs(variance - exact.variance);
      expect(error).toBeLessThan(previous);
      previous = error;
    }
    expect(previous).toBeLessThan(0.00001);
  });
  it('is static at D zero and reconstructs every seek independently of call order', () => {
    const initial = diffusionField({ D: 0 });
    for (const t of [0, 1, 120]) {
      const f = diffusionField({ D: 0 }, t);
      expect(f.modes).toEqual(initial.modes);
      expect(diffusionFlux(f, 0.67)).toBe(0);
    }
    const a = diffusionField({}, 3.4);
    diffusionField({}, 20);
    diffusionField({ kind: 'reservoir' }, 4);
    expect(diffusionField({}, 3.4)).toEqual(a);
    expect(diffusionField({}, 0)).toEqual(diffusionField());
    for (let i = 0; i < 8; i++)
      for (const q of [0, 0.5, 1]) {
        const shot = diffusionShot(i, q);
        expect(() => diffusionDiagnostics(diffusionField(shot.options, shot.time))).not.toThrow();
      }
  });
  it('rejects invalid domains, negative time, unknown species and reversed intervals', () => {
    for (const o of [
      { D: -0.01 },
      { D: NaN },
      { length: 0 },
      { length: 3 },
      { mass: 0 },
      { kind: 'unknown' },
    ])
      expect(() => diffusionField(o as never)).toThrow(RangeError);
    expect(() => diffusionField({}, -1)).toThrow();
    expect(() => diffusionField({}, Infinity)).toThrow();
    expect(() => diffusionField({}, 0, 'B')).toThrow();
    const f = diffusionField();
    expect(() => diffusionValue(f, 1.1)).toThrow();
    expect(() => diffusionIntegral(f, 0.8, 0.2)).toThrow();
    expect(() => diffusionSamples(f, 2)).toThrow();
    expect(() => diffusionShot(1, NaN)).toThrow();
    expect(() => diffusionShot(8, 0)).toThrow();
    expect(() => diffusionColor(-1)).toThrow();
  });
});
