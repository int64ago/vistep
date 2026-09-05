import { describe, it, expect } from 'vitest';
import {
  airfoilCirculation,
  airfoilField,
  airfoilForcePrefix,
  airfoilGeometry,
  airfoilMap,
  airfoilPair,
  airfoilParameters,
  airfoilPreimage,
  airfoilShot,
  airfoilSurface,
  airfoilTrailingLimit,
  sampleAirfoilPath,
  solveAirfoil,
  traceAirfoil,
} from './airfoil';

describe('Kutta-selected Joukowski airfoil', () => {
  it('has a closed finite symmetric section, specified chord, and invertible exterior map', () => {
    const p = airfoilParameters({ angle: 0 });
    const front = airfoilGeometry(p, Math.PI),
      tail = airfoilGeometry(p, 0),
      close = airfoilGeometry(p, 2 * Math.PI);
    expect(tail.x - front.x).toBeCloseTo(p.chord, 13);
    expect(Math.hypot(close.x - tail.x, close.y - tail.y)).toBeLessThan(1e-14);
    for (let i = 1; i < 50; i++) {
      const a = airfoilGeometry(p, (i * Math.PI) / 50),
        b = airfoilGeometry(p, (-i * Math.PI) / 50);
      expect(a.x).toBeCloseTo(b.x, 13);
      expect(a.y).toBeCloseTo(-b.y, 13);
      expect(a.y).toBeGreaterThan(0);
      const zeta = { x: p.center + 1.6 * p.radius * Math.cos(i), y: 1.6 * p.radius * Math.sin(i) };
      const mapped = airfoilMap(p, zeta),
        inverse = airfoilPreimage(p, mapped);
      expect(inverse.x).toBeCloseTo(zeta.x, 12);
      expect(inverse.y).toBeCloseTo(zeta.y, 12);
    }
  });
  it('satisfies surface impermeability and excludes the solid interior and exact cusp', () => {
    const model = solveAirfoil(),
      p = model.parameters;
    for (const s of model.surface) expect(s.u * s.nx + s.v * s.ny).toBeCloseTo(0, 10);
    expect(airfoilField(p, { x: 0, y: 0 }).valid).toBe(false);
    expect(airfoilField(p, airfoilGeometry(p, 0))).toEqual({
      valid: false,
      reason: 'mapping-singularity',
    });
    expect(() => airfoilSurface(p, 0)).toThrow();
    expect(() => airfoilMap(p, { x: 0, y: 0 })).toThrow();
  });
  it('satisfies the Kutta numerator cancellation and common finite trailing-edge limit', () => {
    for (const angle of [-8, 0, 8]) {
      const p = airfoilParameters({ angle }),
        limit = airfoilTrailingLimit(p);
      // Tangential cylinder velocity at θ=0 must vanish before dividing by the map derivative.
      expect(2 * p.speed * Math.sin(p.alpha) + p.gamma / (2 * Math.PI * p.radius)).toBeCloseTo(
        0,
        12,
      );
      const errors = [0.01, 0.001, 0.0001].map((d) =>
        Math.max(
          ...[d, -d].map((t) => {
            const s = airfoilSurface(p, t);
            return Math.hypot(s.u - limit.u, s.v - limit.v);
          }),
        ),
      );
      expect(errors[1]).toBeLessThan(errors[0] * 0.11);
      expect(errors[2]).toBeLessThan(errors[1] * 0.11);
      expect(errors[2]).toBeLessThan(0.002);
    }
  });
  it('gives symmetric pressure and zero integrated lift at zero incidence', () => {
    const m = solveAirfoil({ angle: 0 });
    for (let i = 0; i < m.surface.length / 2; i++)
      expect(m.surface[i].cp).toBeCloseTo(m.surface.at(-i - 1)!.cp, 11);
    expect(m.lift).toBeCloseTo(0, 9);
    expect(m.drag).toBeCloseTo(0, 9);
    expect(m.parameters.gamma).toBe(0);
  });
  it('matches pressure-force integration against Kutta–Joukowski and has ideal zero drag', () => {
    for (const angle of [-8, -3, 0, 3, 8])
      for (const offset of [0.08, 0.1, 0.16]) {
        const m = solveAirfoil({ angle, offset, panels: 768 });
        expect(m.lift).toBeCloseTo(
          -m.parameters.density * m.parameters.speed * m.parameters.gamma,
          8,
        );
        expect(m.drag).toBeCloseTo(0, 8);
        const f = airfoilForcePrefix(m, 1);
        expect(f.y).toBe(m.lift);
        expect(f.x).toBe(m.drag);
        expect(airfoilForcePrefix(m, 0)).toMatchObject({ x: 0, y: 0 });
      }
  });
  it('converges the pressure quadrature toward the independent circulation lift', () => {
    const errors = [64, 128, 256].map((panels) => {
      const m = solveAirfoil({ angle: 8, offset: 0.08, panels });
      return Math.abs(m.lift - m.predictedLift);
    });
    expect(errors[0]).toBeGreaterThan(0.001);
    expect(errors[1]).toBeLessThan(errors[0] * 0.001);
    expect(errors[2]).toBeLessThan(errors[1] * 0.001);
    expect(errors[2]).toBeLessThan(1e-9);
  });
  it('reverses lift and mirrored pressure when incidence changes sign', () => {
    const a = solveAirfoil({ angle: 6 }),
      b = solveAirfoil({ angle: -6 });
    expect(a.lift).toBeCloseTo(-b.lift, 10);
    for (let i = 0; i < a.surface.length; i++)
      expect(a.surface[i].cp).toBeCloseTo(b.surface.at(-i - 1)!.cp, 10);
  });
  it('gives U² load scaling, speed-independent Cp and linear density/chord scaling', () => {
    const a = solveAirfoil({ speed: 15 }),
      b = solveAirfoil({ speed: 30 });
    expect(b.lift / a.lift).toBeCloseTo(4, 12);
    expect(b.parameters.gamma / a.parameters.gamma).toBeCloseTo(2, 12);
    a.surface.forEach((s, i) => expect(s.cp).toBeCloseTo(b.surface[i].cp, 12));
    expect(
      solveAirfoil({ speed: 15, density: 2 * a.parameters.density }).lift / a.lift,
    ).toBeCloseTo(2, 12);
    expect(solveAirfoil({ speed: 15, chord: 2 }).lift / a.lift).toBeCloseTo(2, 12);
  });
  it('integrates the same circulation on different exterior contours', () => {
    const p = airfoilParameters();
    for (const radius of [1.2, 1.7, 2.5])
      expect(airfoilCirculation(p, radius, 512).gamma).toBeCloseTo(p.gamma, 10);
  });
  it('recovers the specified uniform flow and pressure in the far field', () => {
    const p = airfoilParameters();
    for (const point of [
      { x: -1000, y: 600 },
      { x: 1000, y: -600 },
    ]) {
      const f = airfoilField(p, point);
      expect(f.valid).toBe(true);
      if (!f.valid) continue;
      expect(f.u / p.speed).toBeCloseTo(1, 4);
      expect(f.v / p.speed).toBeCloseTo(0, 4);
      expect(f.cp).toBeCloseTo(0, 3);
    }
  });
  it('advects nearby simultaneous parcels without a forced equal arrival', () => {
    const p = airfoilParameters(),
      [top, bottom] = airfoilPair(p);
    expect(top.points[0].time).toBe(0);
    expect(bottom.points[0].time).toBe(0);
    expect(top.points[0].x).toBe(bottom.points[0].x);
    expect(top.arrival).not.toBeNull();
    expect(bottom.arrival).not.toBeNull();
    expect(top.arrival!).toBeLessThan(bottom.arrival! - 0.008);
    expect(top.reason).toBe('exit');
    expect(bottom.reason).toBe('exit');
    for (const path of [top, bottom]) {
      const first = airfoilField(p, path.points[0]);
      if (!first.valid) throw Error('seed');
      for (let i = 0; i < path.points.length; i += 9) {
        const f = airfoilField(p, path.points[i]);
        expect(f.valid).toBe(true);
        if (f.valid) expect(f.stream).toBeCloseTo(first.stream, 6);
      }
      expect(sampleAirfoilPath(path, path.points.at(-1)!.time + 1).visible).toBe(false);
    }
    const [s0, s1] = airfoilPair(airfoilParameters({ angle: 0 }));
    expect(s0.arrival).toBeCloseTo(s1.arrival!, 12);
  });
  it('converges parcel travel time under time-step refinement and uses the actual local velocity', () => {
    const p = airfoilParameters(),
      seed = airfoilPair(p)[0].points[0];
    const coarse = traceAirfoil(p, seed, 0.004),
      fine = traceAirfoil(p, seed, 0.002),
      ref = traceAirfoil(p, seed, 0.0005);
    expect(Math.abs(fine.arrival! - ref.arrival!)).toBeLessThan(
      Math.abs(coarse.arrival! - ref.arrival!),
    );
    expect(Math.abs(fine.arrival! - ref.arrival!)).toBeLessThan(1e-7);
    const a = fine.points[350],
      b = fine.points[351],
      f = airfoilField(p, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    if (!f.valid) throw Error('sample');
    expect((b.x - a.x) / (b.time - a.time)).toBeCloseTo(f.u, 3);
    expect((b.y - a.y) / (b.time - a.time)).toBeCloseTo(f.v, 3);
  });
  it('is deterministic after arbitrary chapter seeks and resets', () => {
    const a = airfoilShot(4, 0.47),
      path = airfoilPair(a.model.parameters),
      expected = path.map((p) => sampleAirfoilPath(p, a.physicalTime));
    for (let c = 7; c >= 0; c--)
      for (const q of [0, 0.5, 1]) expect(Number.isFinite(airfoilShot(c, q).model.lift)).toBe(true);
    const b = airfoilShot(4, 0.47);
    expect(b).toEqual(a);
    expect(
      airfoilPair(b.model.parameters).map((p) => sampleAirfoilPath(p, b.physicalTime)),
    ).toEqual(expected);
  });
  it('rejects unsupported angles, degenerate geometry and nonfinite requests', () => {
    for (const options of [
      { angle: 12 },
      { speed: 0 },
      { speed: Infinity },
      { offset: 0 },
      { chord: -1 },
      { panels: 127.5 },
    ])
      expect(() => solveAirfoil(options)).toThrow(RangeError);
    expect(() => airfoilField(airfoilParameters(), { x: NaN, y: 0 })).toThrow();
    expect(() => airfoilShot(1, NaN)).toThrow();
    expect(() => airfoilCirculation(airfoilParameters(), 1)).toThrow();
  });
});
