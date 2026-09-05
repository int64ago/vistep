import { describe, it, expect } from 'vitest';
import {
  BERNOULLI,
  bernoulliAt,
  bernoulliGeometry,
  bernoulliParcels,
  bernoulliParameters,
  bernoulliPosition,
  bernoulliShot,
  bernoulliVolume,
  solveBernoulli,
} from './bernoulli';

describe('steady Bernoulli streamtube', () => {
  it('has connected circular sections and exact finite volume coordinates', () => {
    const p = bernoulliParameters();
    expect(bernoulliGeometry(p, 0).area).toBeCloseTo((Math.PI * 0.06 ** 2) / 4, 14);
    expect(bernoulliGeometry(p, p.length * 0.45).area / p.area).toBeCloseTo(0.36, 14);
    for (let i = 1; i < 100; i++) {
      const s = (p.length * i) / 100,
        h = 1e-6,
        g = bernoulliGeometry(p, s);
      expect((bernoulliVolume(p, s + h) - bernoulliVolume(p, s - h)) / (2 * h)).toBeCloseTo(
        g.area,
        10,
      );
      expect(bernoulliPosition(p, bernoulliVolume(p, s))).toBeCloseTo(s, 12);
      expect((Math.PI * g.diameter ** 2) / 4).toBeCloseTo(g.area, 14);
    }
    const incline = bernoulliParameters({ rise: 0.45 }),
      g = bernoulliGeometry(incline, incline.length);
    expect(Math.hypot(g.x, g.z)).toBeCloseTo(incline.length, 14);
  });
  it('conserves flow and inviscid energy; throat pressure matches the independent two-section equation', () => {
    const run = solveBernoulli(),
      p = run.parameters,
      inlet = bernoulliAt(run, 0),
      throat = bernoulliAt(run, 0.45 * p.length);
    for (const s of run.stations) {
      expect(s.area * s.velocity).toBeCloseTo(p.flow, 14);
      expect(s.totalHead).toBeCloseTo(inlet.totalHead, 12);
    }
    expect(inlet.pressure - throat.pressure).toBeCloseTo(
      (p.density / 2) * (throat.velocity ** 2 - inlet.velocity ** 2),
      8,
    );
    expect(throat.velocity / inlet.velocity).toBeCloseTo(1 / p.areaRatio, 12);
    expect(bernoulliAt(run, p.length).pressure).toBeCloseTo(inlet.pressure, 8);
  });
  it('moves material boundaries at Q/A with conserved parcel volume and persistent identity', () => {
    const run = solveBernoulli(),
      p = run.parameters,
      width = run.totalVolume * 0.065;
    for (const time of [0.05, 0.22, 0.42, 0.65]) {
      const parcel = bernoulliParcels(run, time, true)[0];
      expect(parcel.id).toBe(0);
      expect(parcel.complete).toBe(true);
      expect(bernoulliVolume(p, parcel.end) - bernoulliVolume(p, parcel.start)).toBeCloseTo(
        width,
        13,
      );
      const dt = 1e-6,
        later = bernoulliParcels(run, time + dt, true)[0];
      expect((later.start - parcel.start) / dt).toBeCloseTo(
        bernoulliAt(run, parcel.start).velocity,
        3,
      );
    }
    expect(bernoulliParcels(run, run.transit! + 1, true)).toEqual([]);
    for (const parcel of bernoulliParcels(run, 4)) {
      expect(parcel.start).toBeGreaterThanOrEqual(0);
      expect(parcel.end).toBeLessThanOrEqual(p.length);
    }
  });
  it('retains equal velocity while elevation alone changes pressure', () => {
    const run = solveBernoulli({ areaRatio: 1, rise: 0.45 }),
      p = run.parameters,
      a = run.stations[0],
      b = run.stations.at(-1)!;
    expect(a.velocity).toBe(b.velocity);
    expect(a.pressure - b.pressure).toBeCloseTo(p.density * p.gravity * 0.45, 8);
    for (const s of run.stations) expect(s.totalHead).toBeCloseTo(a.totalHead, 12);
  });
  it('reduces to hydrostatics at Q=0 including flat piezometer levels', () => {
    const run = solveBernoulli({ flow: 0, rise: 0.45, friction: 0.04 });
    expect(run.transit).toBeNull();
    for (const s of run.stations) {
      expect(s.velocity).toBe(0);
      expect(s.loss).toBe(0);
      expect(s.hydraulicHead).toBeCloseTo(run.stations[0].hydraulicHead, 12);
    }
    expect(bernoulliParcels(run, 0)).toEqual(bernoulliParcels(run, 12));
  });
  it('matches Darcy-Weisbach for a uniform tube and accounts for lost mechanical power', () => {
    const run = solveBernoulli({ areaRatio: 1, friction: 0.035 }),
      p = run.parameters,
      a = run.stations[0],
      b = run.stations.at(-1)!;
    const expected = (((p.friction * p.length) / p.diameter) * a.velocity ** 2) / (2 * p.gravity);
    expect(b.loss).toBeCloseTo(expected, 12);
    expect(p.density * p.gravity * p.flow * (a.totalHead - b.totalHead)).toBeCloseTo(
      p.density * p.gravity * p.flow * expected,
      9,
    );
    const variable = solveBernoulli({ friction: 0.035 });
    variable.stations.forEach((s, i) => {
      expect(s.totalHead + s.loss).toBeCloseTo(variable.stations[0].totalHead, 11);
      if (i) expect(s.loss).toBeGreaterThanOrEqual(variable.stations[i - 1].loss);
    });
  });
  it('converges in integrated variable-diameter loss when the spatial grid is refined', () => {
    const ref = solveBernoulli({ friction: 0.035, cells: 1920 }).stations.at(-1)!.loss;
    const errors = [60, 120, 240].map((cells) =>
      Math.abs(solveBernoulli({ friction: 0.035, cells }).stations.at(-1)!.loss - ref),
    );
    expect(errors[1]).toBeLessThan(errors[0]);
    expect(errors[2]).toBeLessThan(errors[1]);
    expect(errors[2]).toBeLessThan(1e-7);
  });
  it('stops the requested steady family at vapor pressure, including exact equality', () => {
    const original = solveBernoulli();
    for (const pressure of [original.limitingInletPressure, 3000]) {
      const run = solveBernoulli({ inletPressure: pressure });
      expect(run.status).toBe('vapor-boundary');
      expect(run.minimumPressure).toBeCloseTo(BERNOULLI.vapor, 7);
      expect(run.stations.every((s) => s.pressure >= BERNOULLI.vapor)).toBe(true);
      expect(bernoulliParcels(run, 0)).toEqual(bernoulliParcels(run, 9));
    }
    expect(solveBernoulli({ inletPressure: original.limitingInletPressure + 1 }).status).toBe(
      'valid',
    );
  });
  it('does not hide sub-vapor pressure between grid stations in an inclined lossy case', () => {
    const run = solveBernoulli({ inletPressure: 3000, rise: 0.37, friction: 0.031, cells: 80 });
    for (let i = 0; i <= 5000; i++)
      expect(bernoulliAt(run, (run.parameters.length * i) / 5000).pressure).toBeGreaterThanOrEqual(
        BERNOULLI.vapor - 1e-6,
      );
  });
  it('reconstructs all chapters independent of seek history', () => {
    const expected = bernoulliShot(1, 0.58);
    for (let c = 7; c >= 0; c--)
      for (const q of [0, 0.25, 0.5, 0.75, 1]) {
        const shot = bernoulliShot(c, q);
        expect(shot.run.minimumPressure).toBeGreaterThanOrEqual(BERNOULLI.vapor);
      }
    expect(bernoulliShot(1, 0.58)).toEqual(expected);
  });
  it('keeps the full exploration boundary matrix finite and above the liquid threshold', () => {
    for (const flow of [0, 0.004, 0.006])
      for (const areaRatio of [0.25, 1])
        for (const rise of [-0.45, 0, 0.45])
          for (const friction of [0, 0.06])
            for (const inletPressure of [3000, 150000]) {
              const run = solveBernoulli({ flow, areaRatio, rise, friction, inletPressure });
              for (let i = 0; i <= 300; i++) {
                const s = bernoulliAt(run, (run.parameters.length * i) / 300);
                expect(s.pressure).toBeGreaterThanOrEqual(BERNOULLI.vapor - 1e-6);
                expect(Number.isFinite(s.velocity + s.pressure + s.loss)).toBe(true);
                expect(s.area * s.velocity).toBeCloseTo(flow, 13);
              }
            }
  });
  it('rejects reverse flow, invalid parameters and out-of-domain material coordinates', () => {
    for (const options of [
      { flow: -1 },
      { areaRatio: 0 },
      { rise: 4 },
      { inletPressure: 1000 },
      { friction: -0.1 },
      { cells: 40.5 },
      { flow: NaN },
    ])
      expect(() => solveBernoulli(options)).toThrow(RangeError);
    const p = bernoulliParameters();
    expect(() => bernoulliGeometry(p, -0.1)).toThrow();
    expect(() => bernoulliPosition(p, 1)).toThrow();
    expect(() => bernoulliParcels(solveBernoulli(), -1)).toThrow();
  });
});
