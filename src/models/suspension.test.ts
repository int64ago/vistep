import { describe, expect, it } from 'vitest';
import {
  SUSPENSION as p,
  SUSPENSION_GEOMETRY as g,
  suspensionInitial,
  suspensionRoad,
  suspensionForces,
  suspensionEnergy,
  simulateSuspension,
  sampleSuspension,
  sampleSuspensionPair,
  suspensionPose,
  suspensionShot,
} from './suspension';
const flat = { kind: 'flat' as const, amplitude: 0, frequency: 10 };
const bump = { kind: 'bump' as const, amplitude: 0.035, frequency: 10 };
describe('quarter-car suspension: dynamics, work and reproducible comparisons', () => {
  it('remains at static equilibrium on a flat road, with positive static tire load', () => {
    const trace = simulateSuspension(p, flat, 3),
      s = sampleSuspension(trace, 3),
      f = suspensionForces(s, p, flat);
    expect(s.body).toBe(0);
    expect(s.wheel).toBe(0);
    expect(s.dissipated).toBe(0);
    expect(f.normalLoad).toBeCloseTo((p.sprungMass + p.unsprungMass) * 9.81, 10);
  });
  it('recovers the exact uncoupled tire oscillator and free body limit', () => {
    const params = { ...p, stiffness: 0, damping: 0 },
      init = { ...suspensionInitial(0.02), wheel: 0.002, bodyVelocity: 0.01 };
    const trace = simulateSuspension(params, flat, 2, init),
      omega = Math.sqrt(p.tireStiffness / p.unsprungMass);
    for (const t of [0.125, 0.47, 1.33, 2]) {
      const s = sampleSuspension(trace, t);
      expect(s.body).toBeCloseTo(0.02 + 0.01 * t, 11);
      expect(s.wheel).toBeCloseTo(0.002 * Math.cos(omega * t), 6);
    }
  });
  it('conserves undamped perturbation energy after release', () => {
    const params = { ...p, damping: 0 },
      trace = simulateSuspension(params, flat, 8, suspensionInitial(0.04));
    for (const s of trace.states.filter((_, i) => i % 97 === 0)) {
      expect(
        Math.abs(suspensionEnergy(s, params, flat).mechanical - trace.initialEnergy),
      ).toBeLessThan(0.0003);
      expect(s.dissipated).toBe(0);
    }
  });
  it('accounts for damper dissipation and road work with the correct energy signs', () => {
    for (const road of [flat, bump]) {
      const trace = simulateSuspension(
        p,
        road,
        8,
        suspensionInitial(road.kind === 'flat' ? 0.04 : 0),
      );
      let previous = 0;
      for (const s of trace.states.filter((_, i) => i % 71 === 0)) {
        const e = suspensionEnergy(s, p, road),
          f = suspensionForces(s, p, road);
        expect(f.damperPower).toBeGreaterThanOrEqual(0);
        expect(s.dissipated).toBeGreaterThanOrEqual(previous);
        previous = s.dissipated;
        expect(
          Math.abs(e.mechanical + e.dissipated - trace.initialEnergy - e.roadWork),
        ).toBeLessThan(0.003);
      }
    }
  });
  it('places equal and opposite spring/damper forces between the two masses', () => {
    const s = {
      ...suspensionInitial(0.025),
      wheel: -0.005,
      bodyVelocity: -0.15,
      wheelVelocity: 0.08,
      time: 1.01,
    };
    const f = suspensionForces(s, p, bump);
    expect(p.sprungMass * f.bodyAcceleration + p.unsprungMass * f.wheelAcceleration).toBeCloseTo(
      f.tire,
      9,
    );
    expect(f.damper * f.relativeVelocity).toBeCloseTo(-f.damperPower, 10);
  });
  it('uses an analytic, smooth, deterministic road derivative', () => {
    const ripple = { kind: 'ripple' as const, amplitude: 0.008, frequency: 6 };
    for (const road of [bump, ripple])
      for (const t of [0, 0.8, 0.89, 1.05, 1.28, 2.45, 5.8, 7]) {
        const h = 1e-6,
          derivative =
            (suspensionRoad(t + h, road).displacement - suspensionRoad(t - h, road).displacement) /
            (2 * h);
        expect(suspensionRoad(t, road).velocity).toBeCloseTo(derivative, 5);
        expect(suspensionRoad(t, road)).toEqual(suspensionRoad(t, { ...road }));
      }
  });
  it('reconstructs seeks without history and converges on step refinement', () => {
    const trace = simulateSuspension(p, bump),
      fine = simulateSuspension(p, bump, 8, suspensionInitial(), 1 / 1200);
    const saved = sampleSuspension(trace, 3.14159);
    sampleSuspension(trace, 7.9);
    sampleSuspension(trace, 0.2);
    expect(sampleSuspension(trace, 3.14159)).toEqual(saved);
    expect(saved.body).toBeCloseTo(sampleSuspension(fine, 3.14159).body, 7);
    expect(saved.wheel).toBeCloseTo(sampleSuspension(fine, 3.14159).wheel, 7);
  });
  it('keeps both compared runs at exactly the same road and time', () => {
    for (const chapter of [2, 3, 5]) {
      const shot = suspensionShot(chapter, 0.43),
        a = simulateSuspension(shot.parameters, shot.road),
        b = simulateSuspension(shot.comparison!, shot.road);
      const sample = sampleSuspensionPair(a, b, shot.modelTime);
      expect(sample.a.time).toBeCloseTo(sample.b!.time, 12);
      expect(suspensionForces(sample.a, a.parameters, a.road).road).toBe(
        suspensionForces(sample.b!, b.parameters, b.road).road,
      );
    }
  });
  it('stops at zero tire load instead of drawing a tensile tire or inventing flight', () => {
    const road = { kind: 'ripple' as const, amplitude: 0.03, frequency: 10.4 },
      a = simulateSuspension(p, road),
      b = simulateSuspension({ ...p, damping: 6500 }, road);
    expect(a.contactLimit).not.toBeNull();
    const sample = sampleSuspensionPair(a, b, 8);
    expect(sample.limited).toBe(true);
    expect(sample.a.time).toBeCloseTo(sample.b!.time, 12);
    expect(suspensionForces(sample.a, p, road).normalLoad).toBeGreaterThanOrEqual(0);
    expect(suspensionForces(sample.a, p, road).normalLoad).toBeLessThan(0.0001);
    expect(sampleSuspension(a, 20)).toEqual(sampleSuspension(a, a.contactLimit!));
  });
  it('derives actual tire compression, spring sag and connected damper overlap', () => {
    for (const stiffness of [12000, 18000, 30000])
      for (const damping of [0, 1400, 6500]) {
        const params = { ...p, stiffness, damping },
          trace = simulateSuspension(params, bump);
        for (const s of trace.states.filter((_, i) => i % 31 === 0)) {
          const pose = suspensionPose(s, params, bump),
            f = suspensionForces(s, params, bump);
          expect(g.tireRadius - (pose.wheelY - pose.roadY)).toBeCloseTo(f.tireCompression, 12);
          expect(pose.springLength).toBeCloseTo(
            g.springFreeLength - (p.sprungMass * 9.81) / stiffness + f.travel,
            12,
          );
          const piston = pose.damperLength - g.damperRodLength;
          expect(piston).toBeGreaterThan(0.025);
          expect(piston).toBeLessThan(g.damperTubeLength - 0.025);
          expect(pose.springLength).toBeGreaterThan(0.12);
        }
      }
  });
  it('keeps piston, cylinder and guide overlap through the offered resonant ripple range', () => {
    for (const stiffness of [12000, 18000, 30000])
      for (const damping of [0, 1400, 6500])
        for (const frequency of [1, 1.1, 1.2, 1.3, 1.5, 1.6, 6, 10.4, 14]) {
          const params = { ...p, stiffness, damping },
            road = { kind: 'ripple' as const, amplitude: g.rippleAmplitudeLimit, frequency };
          for (const s of simulateSuspension(params, road).states.filter((_, i) => i % 17 === 0)) {
            const pose = suspensionPose(s, params, road),
              piston = pose.damperLength - g.damperRodLength;
            expect(piston).toBeGreaterThan(0.025);
            expect(piston).toBeLessThan(g.damperTubeLength - 0.025);
            expect(pose.damperLength - g.damperTubeLength).toBeGreaterThan(0.035);
            expect(pose.upperMountY + 0.02 - g.guideLength).toBeLessThan(pose.wheelY - 0.015);
            expect(pose.upperMountY + 0.02 - g.guideLength).toBeGreaterThan(-0.225);
          }
        }
  });
  it('rejects zero-stiffness geometry without excluding the free-body dynamical limit', () => {
    const free = { ...p, stiffness: 0, damping: 0 };
    expect(() => simulateSuspension(free, flat, 1)).not.toThrow();
    expect(() => suspensionPose(suspensionInitial(), free, flat)).toThrow(
      /positive spring stiffness/,
    );
    expect(() => suspensionPose({ ...suspensionInitial(), body: Infinity }, p, flat)).toThrow();
  });
  it('reduces release oscillation energy with positive damping and rejects invalid parameters', () => {
    const damped = simulateSuspension(p, flat, 8, suspensionInitial(0.04));
    expect(suspensionEnergy(sampleSuspension(damped, 8), p, flat).mechanical).toBeLessThan(
      damped.initialEnergy * 0.001,
    );
    expect(() => simulateSuspension({ ...p, sprungMass: 0 }, flat)).toThrow();
    expect(() => simulateSuspension({ ...p, damping: -1 }, flat)).toThrow();
    expect(() => sampleSuspension(damped, NaN)).toThrow();
  });
});
