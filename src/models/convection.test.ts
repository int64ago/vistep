import { describe, it, expect } from 'vitest';
import {
  ConvectionRun,
  cloneConvection,
  convectionDiagnostics,
  convectionFaces,
  convectionParameters,
  convectionPlates,
  convectionPoisson,
  convectionScalar,
  convectionShot,
  convectionTargetStep,
  convectionVelocity,
  createConvection,
  stepConvection,
} from './convection';
const advance = (state: ReturnType<typeof createConvection>, n: number) => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepConvection(s);
  return s;
};

describe('closed Boussinesq convection cell', () => {
  it('starts with bounded fields, consistent heat and dye inventories, and deterministic tracers', () => {
    const a = createConvection(),
      b = createConvection(),
      d = convectionDiagnostics(a);
    expect(a).toEqual(b);
    expect(d.minTemperature).toBeGreaterThan(0);
    expect(d.maxTemperature).toBeLessThan(1);
    expect(d.heat).toBeCloseTo(0.75, 12);
    expect(d.energy).toBe(0);
    expect(d.dyeResidual).toBe(0);
    expect(new Set(a.particles.map((p) => p.id)).size).toBe(24);
  });
  it('solves a manufactured discrete Poisson eigenmode with zero wall streamfunction', () => {
    const p = convectionParameters({ nx: 24, ny: 16 }),
      w = new Float64Array((p.nx + 1) * (p.ny + 1));
    const lambda =
      (4 * Math.sin(Math.PI / p.nx) ** 2) / p.dx ** 2 +
      (4 * Math.sin(Math.PI / (2 * p.ny)) ** 2) / p.dy ** 2;
    for (let j = 0; j <= p.ny; j++)
      for (let i = 0; i <= p.nx; i++)
        w[i + (p.nx + 1) * j] =
          lambda * Math.sin((2 * Math.PI * i) / p.nx) * Math.sin((Math.PI * j) / p.ny);
    const psi = convectionPoisson(p, w);
    for (let j = 0; j <= p.ny; j++)
      for (let i = 0; i <= p.nx; i++)
        expect(psi[i + (p.nx + 1) * j]).toBeCloseTo(
          Math.sin((2 * Math.PI * i) / p.nx) * Math.sin((Math.PI * j) / p.ny),
          12,
        );
  });
  it('enforces exact impermeable faces and negligible discrete divergence through nonlinear evolution', () => {
    const s = new ConvectionRun().at(28),
      p = s.p,
      { u, v } = convectionFaces(p, s.psi);
    for (let j = 0; j < p.ny; j++) {
      expect(u[(p.nx + 1) * j]).toBe(0);
      expect(u[p.nx + (p.nx + 1) * j]).toBe(0);
    }
    for (let i = 0; i < p.nx; i++) {
      expect(Math.abs(v[i])).toBe(0);
      expect(Math.abs(v[i + p.nx * p.ny])).toBe(0);
    }
    expect(convectionDiagnostics(s).divergence).toBeLessThan(2e-14);
    for (let j = 0; j <= 10; j++) {
      expect(convectionVelocity(p, s.psi, 0, j / 10).u).toBe(0);
      expect(convectionVelocity(p, s.psi, p.width, j / 10).u).toBe(0);
    }
  });
  it('keeps the exact laterally uniform conductive state motionless', () => {
    const run = new ConvectionRun({ seed: 0 }),
      start = run.at(0),
      s = run.at(20),
      d = convectionDiagnostics(s);
    expect(d.maxSpeed).toBeLessThan(1e-13);
    expect(d.totalFlux).toBeCloseTo(0.01, 12);
    s.temperature.forEach((v, i) => expect(v).toBeCloseTo(start.temperature[i], 12));
  });
  it('warms a uniform fluid by conservative plate flux without inventing spontaneous lateral motion', () => {
    const s = new ConvectionRun({ initial: 'uniform', seed: 0 }).at(8),
      d = convectionDiagnostics(s),
      p = s.p;
    expect(s.temperature[Math.floor(p.nx / 2)]).toBeGreaterThan(0.9);
    expect(s.temperature[Math.floor(p.nx / 2) + p.nx * (p.ny - 1)]).toBeLessThan(0.1);
    expect(d.maxSpeed).toBeLessThan(1e-12);
    expect(d.heatResidual).toBeLessThan(1e-12);
  });
  it('grows the seeded below-heated perturbation but damps the same seed with heating above', () => {
    const below = convectionDiagnostics(new ConvectionRun().at(16)),
      above = convectionDiagnostics(new ConvectionRun({ heating: 'above' }).at(16));
    expect(below.maxSpeed).toBeGreaterThan(0.2);
    expect(above.maxSpeed).toBeLessThan(0.00001);
    expect(below.energy).toBeGreaterThan(above.energy * 1e7);
  });
  it('distinguishes advective heat carriage from conduction at identical elapsed time', () => {
    const active = convectionDiagnostics(new ConvectionRun().at(28)),
      still = convectionDiagnostics(new ConvectionRun({ buoyancy: 0 }).at(28));
    expect(still.convective).toBe(0);
    expect(still.conductive).toBeCloseTo(0.01, 12);
    expect(active.convective).toBeGreaterThan(0.02);
    expect(active.totalFlux).toBeGreaterThan(still.totalFlux * 2.5);
  });
  it('conserves dye and balances a genuinely nonzero heat change against boundary flux', () => {
    const initial = createConvection({ seed: 0 });
    initial.temperature.fill(0.2);
    initial.initialHeat = 0.2 * initial.p.width;
    const s = advance(initial, 160),
      d = convectionDiagnostics(s);
    expect(d.heat - initial.initialHeat).toBeGreaterThan(0.05);
    expect(Math.abs(d.heatResidual)).toBeLessThan(2e-14);
    expect(Math.abs(d.dyeResidual)).toBeLessThan(2e-14);
    expect(s.maxBudgetError).toBeLessThan(2e-14);
  });
  it('maintains the scalar maximum principle and bounds CFL throughout supported strong forcing', () => {
    const s = new ConvectionRun({
        buoyancy: 1.5,
        viscosity: 0.015,
        diffusivity: 0.006,
        seed: 0.04,
      }).at(52),
      d = convectionDiagnostics(s);
    expect(d.minTemperature).toBeGreaterThanOrEqual(0);
    expect(d.maxTemperature).toBeLessThanOrEqual(1);
    expect(Math.min(...s.dye)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...s.dye)).toBeLessThanOrEqual(1);
    expect(s.maxCourant).toBeLessThan(0.5);
    expect(Math.abs(d.dyeResidual)).toBeLessThan(2e-13);
    expect(Math.abs(d.heatResidual)).toBeLessThan(2e-13);
  });
  it('keeps material identities inside closed walls and advects them with the calculated velocity', () => {
    const run = new ConvectionRun(),
      a = run.at(20),
      b = stepConvection(a),
      p = a.p;
    for (const r of b.particles) {
      expect(r.x).toBeGreaterThan(0);
      expect(r.x).toBeLessThan(p.width);
      expect(r.y).toBeGreaterThan(0);
      expect(r.y).toBeLessThan(1);
    }
    for (let i = 0; i < a.particles.length; i++) {
      const r = a.particles[i],
        s = b.particles[i],
        vel = convectionVelocity(p, a.psi, r.x, r.y);
      expect(s.id).toBe(r.id);
      const margin = Math.min(r.x % p.dx, p.dx - (r.x % p.dx), r.y % p.dy, p.dy - (r.y % p.dy));
      if (margin > 0.008) {
        expect((s.x - r.x) / p.dt).toBeCloseTo(vel.u, 2);
        expect((s.y - r.y) / p.dt).toBeCloseTo(vel.v, 2);
      }
    }
    expect(run.at(52).particles.every((a) => a.x > 0 && a.x < 1.5 && a.y > 0 && a.y < 1)).toBe(
      true,
    );
  });
  it('converges material trajectories under time-step refinement across cell faces', () => {
    const start = new ConvectionRun().at(20);
    const states = [1, 2, 4].map((f) => {
      const s = cloneConvection(start);
      s.p.dt /= f;
      return advance(s, 80 * f);
    });
    const error = (k: number) =>
      states[k].particles.reduce(
        (e, p, i) => e + Math.hypot(p.x - states[2].particles[i].x, p.y - states[2].particles[i].y),
        0,
      ) / 24;
    expect(error(1)).toBeLessThan(error(0) * 0.7);
    expect(error(1)).toBeLessThan(0.0002);
  });
  it('converges toward analytic heat diffusion under grid refinement', () => {
    const errors = [12, 24, 48].map((nx) => {
      const ny = (nx * 2) / 3,
        s = new ConvectionRun({ nx, ny, buoyancy: 0 }).at(2),
        p = s.p,
        t = s.step * p.dt,
        rate = p.diffusivity * (((2 * Math.PI) / p.width) ** 2 + Math.PI ** 2);
      let error = 0;
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const x = (i + 0.5) * p.dx,
            y = (j + 0.5) * p.dy,
            exact =
              1 -
              y -
              p.seed *
                Math.cos((2 * Math.PI * x) / p.width) *
                Math.sin(Math.PI * y) *
                Math.exp(-rate * t);
          error += (s.temperature[i + nx * j] - exact) ** 2;
        }
      return Math.sqrt(error / (nx * ny));
    });
    expect(errors[1]).toBeLessThan(errors[0] * 0.4);
    expect(errors[2]).toBeLessThan(errors[1]);
    expect(errors[2]).toBeLessThan(1e-5);
  });
  it('recovers the same qualitative developed rolls on a finer grid without asserting a threshold', () => {
    const a = convectionDiagnostics(new ConvectionRun().at(28)),
      b = convectionDiagnostics(new ConvectionRun({ nx: 42, ny: 28 }).at(28));
    expect(b.maxSpeed / a.maxSpeed).toBeGreaterThan(0.8);
    expect(b.maxSpeed / a.maxSpeed).toBeLessThan(1.4);
    expect(b.totalFlux / a.totalFlux).toBeGreaterThan(0.8);
    expect(b.totalFlux / a.totalFlux).toBeLessThan(1.4);
  });
  it('dissipates kinetic energy without buoyancy and does not instantly stop after removing plate contrast', () => {
    const run = new ConvectionRun(),
      s = run.at(24);
    s.p = { ...s.p, buoyancy: 0 };
    const a = convectionDiagnostics(s),
      b = convectionDiagnostics(advance(s, 80));
    expect(b.energy).toBeLessThan(a.energy);
    expect(a.kineticDissipation).toBeGreaterThan(0);
    const off = new ConvectionRun({ offAt: 24 }),
      before = convectionDiagnostics(off.at(24)),
      just = convectionDiagnostics(off.at(24.1)),
      late = convectionDiagnostics(off.at(52));
    expect(just.energy).toBeGreaterThan(before.energy * 0.8);
    expect(late.energy).toBeLessThan(before.energy * 0.01);
    expect(convectionPlates(s.p, 0)).toEqual({ bottom: 1, top: 0 });
  });
  it('returns exactly the same state after arbitrary seeks and reset reconstruction', () => {
    const run = new ConvectionRun(),
      a = run.at(7.4);
    run.at(31);
    run.at(1.1);
    const b = run.at(7.4);
    expect(b).toEqual(a);
    run.clear();
    expect(run.at(7.4)).toEqual(a);
    expect(new ConvectionRun().at(7.4)).toEqual(a);
  });
  it('does not mutate a retained checkpoint when stepping or cloning', () => {
    const a = createConvection(),
      copy = cloneConvection(a);
    stepConvection(a);
    expect(a).toEqual(copy);
    copy.temperature[0] = 0;
    expect(a.temperature[0]).not.toBe(0);
  });
  it('rejects nonfinite, unsupported, out-of-domain and unsafe requests explicitly', () => {
    for (const o of [
      { nx: 10 },
      { ny: 8.1 },
      { buoyancy: -1 },
      { viscosity: 0 },
      { diffusivity: NaN },
      { seed: 1 },
      { offAt: Infinity },
    ])
      expect(() => createConvection(o)).toThrow(RangeError);
    const s = createConvection();
    expect(() => convectionTargetStep(s.p, -1)).toThrow();
    expect(() => convectionTargetStep(s.p, 61)).toThrow();
    expect(() => convectionVelocity(s.p, s.psi, 2, 0)).toThrow();
    expect(() => convectionScalar(s.p, s.temperature, NaN, 0)).toThrow();
    expect(() => convectionShot(0, NaN)).toThrow();
    s.psi[100] = 100;
    expect(() => stepConvection(s)).toThrow(RangeError);
  });
});
