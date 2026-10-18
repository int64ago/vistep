import { describe, it, expect } from 'vitest';
import {
  colloidOptics,
  rayleighSideIntensity,
  rayleighCollection,
  colloidDirector,
  colloidObservation,
  dipoleField,
  incidentField,
  dipoleRadiation,
  observedRoute,
} from './chem-colloid-light';

describe('dilute colloid optics', () => {
  it('conserves first-event power, including the collector and an intercepted ray', () => {
    for (const volumePpm of [0, 1, 30, 60, 120, 500])
      for (const blocked of [false, true])
        for (const sourceOn of [false, true]) {
          const s = colloidObservation({ volumePpm, blocked, sourceOn });
          expect(s.forwardPower + s.eyePower + s.blockerPower + s.otherScatteredPower).toBeCloseTo(
            Number(sourceOn),
            14,
          );
          expect(s.eyePower).toBeGreaterThanOrEqual(0);
          expect(s.eyePower).toBeLessThanOrEqual(s.scattered);
          if (blocked) expect(s.eyePower).toBe(0);
        }
    const open = colloidObservation(),
      closed = colloidObservation({ blocked: true });
    expect(closed.forwardPower).toBe(open.forwardPower);
    expect(closed.blockerPower).toBe(open.eyePower);
    expect(colloidOptics(18, 0).transmitted).toBe(1);
    expect(colloidOptics(18, 120, 633, 0).scattered).toBe(0);
  });
  it('matches independent Rayleigh scaling and collection-cone integration', () => {
    expect(colloidOptics(20).crossSection / colloidOptics(10).crossSection).toBeCloseTo(64, 10);
    expect(colloidOptics(20).coefficient / colloidOptics(10).coefficient).toBeCloseTo(8, 10);
    expect(
      colloidOptics(18, 120, 450).coefficient / colloidOptics(18, 120, 633).coefficient,
    ).toBeCloseTo((633 / 450) ** 4, 10);
    expect(rayleighSideIntensity(90)).toBeCloseTo(0.5, 12);
    for (const theta of [0, 30, 90, 145, 180]) {
      expect(rayleighCollection(theta, 180)).toBeCloseTo(1, 12);
      expect(rayleighCollection(theta, 90)).toBeCloseTo(0.5, 12);
      expect(rayleighCollection(theta, 0)).toBe(0);
      // Independent midpoint quadrature in cone coordinates, including sin(beta) Jacobian.
      let integral = 0;
      const n = 120,
        m = 240,
        alpha = (8 * Math.PI) / 180,
        t = (theta * Math.PI) / 180;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++) {
          const beta = ((i + 0.5) / n) * alpha,
            phi = ((j + 0.5) / m) * 2 * Math.PI;
          const cosGamma =
            Math.cos(t) * Math.cos(beta) + Math.sin(t) * Math.sin(beta) * Math.cos(phi);
          integral +=
            (((((3 * (1 + cosGamma ** 2)) / (16 * Math.PI)) * Math.sin(beta) * alpha) / n) *
              2 *
              Math.PI) /
            m;
        }
      expect(rayleighCollection(theta, 8)).toBeCloseTo(integral, 8);
    }
  });
  it('makes dilution and equal-power wavelength predictions without overclaiming the regime', () => {
    const dilute = colloidObservation({ volumePpm: 30 }),
      concentrated = colloidObservation({ volumePpm: 120 });
    expect(dilute.eyePower).toBeLessThan(concentrated.eyePower);
    expect(dilute.forwardPower).toBeGreaterThan(concentrated.forwardPower);
    expect(
      colloidObservation({ volumePpm: 30, wavelengthNm: 450 }).eyePower / dilute.eyePower,
    ).toBeCloseTo(3.823, 2);
    expect(colloidOptics(18, 60, 450).opticalDepth).toBeLessThan(0.13);
    expect(colloidOptics(24, 500, 450).singleScatteringReliable).toBe(false);
    for (const n of [NaN, Infinity, -Infinity])
      for (const value of Object.values(colloidOptics(n, n, n, n)))
        if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  });
});

describe('causal film model', () => {
  it('has a retarded driven response, not spontaneous or persistent particle glow', () => {
    expect(incidentField(0.6, 0).envelope).toBe(1);
    expect(dipoleField(0.6).envelope).toBe(0);
    expect(dipoleField(2.1).envelope).toBe(1);
    expect(dipoleField(2.1, 2.3).envelope).toBe(0);
    for (const t of [2.7, 3.2, 6.4, 8])
      expect(dipoleField(t + 2.3, 2.3).field).toBeCloseTo(dipoleField(t).field, 12);
    expect(incidentField(7.4, 0).envelope).toBe(0);
    expect(dipoleField(7.4).envelope).toBe(1);
    expect(dipoleField(8.9).envelope).toBe(0);
    expect(dipoleField(11.2, 2.3).envelope).toBe(0);
    expect(dipoleRadiation([0, 0, 1])).toBe(0);
    expect(dipoleRadiation([0, 1, 0])).toBe(1);
    expect(dipoleRadiation([1, 0, 1])).toBeCloseTo(0.5);
  });
  it('intercepts only the branch to the eye, at both responsive geometries', () => {
    for (const width of [248, 280, 640, 1000]) {
      const open = observedRoute(width, false),
        closed = observedRoute(width, true);
      expect(closed.source).toEqual(open.source);
      expect(closed.screen).toEqual(open.screen);
      expect(closed.outgoingEnd).toEqual(closed.blocker);
      expect(open.outgoingEnd).toEqual(open.eye);
      expect(closed.blocker.y).toBeGreaterThan(closed.source.y);
      expect(closed.blocker.y).toBeLessThan(closed.eye.y);
    }
  });
  it('seeks reproducibly through evidence and never inherits exploration', () => {
    expect(colloidDirector(0, 0.5).shot).toBe('samples');
    expect(colloidDirector(1, 0.4).blocked).toBe(false);
    expect(colloidDirector(1, 0.7).blocked).toBe(true);
    expect(colloidDirector(1, 0.95).blocked).toBe(false);
    expect(colloidDirector(2, 0.3).shot).toBe('dipole');
    expect(colloidDirector(3, 0.4).volumePpm).toBe(30);
    expect(colloidDirector(3, 0.5).shot).toBe('wavelength');
    expect(colloidDirector(3, 0.9).shot).toBe('transfer');
    expect(colloidDirector(1, 0.4)).toEqual(colloidDirector(1, 0.4));
    expect(colloidDirector(NaN, Infinity).shot).toBe('samples');
  });
});
