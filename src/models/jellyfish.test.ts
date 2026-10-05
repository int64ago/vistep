import { describe, expect, it } from 'vitest';
import {
  JELLY,
  JELLY_DEFAULT,
  jellyFrame,
  jellyRun,
  jellyShape,
  jellyShot,
  jellyVortices,
} from './jellyfish';
import {
  jellyBellMesh,
  jellyBellPoint,
  jellyGonadPoint,
  jellyOralPoint,
  jellyTentaclePoint,
} from './jellyfish-geometry';
describe('Aurelia teaching model and body', () => {
  it('derives flux from the same ellipsoidal cavity that is drawn', () => {
    for (const time of [0.05, 0.2, 0.45, 0.7, 1.2, 1.8]) {
      const s = jellyShape(time),
        delta = 1e-5;
      const derivative =
        (jellyShape(time + delta).volume - jellyShape(time - delta).volume) / (2 * delta);
      expect(s.volumeRate).toBeCloseTo(derivative, 10);
      expect(s.outflow - s.inflow).toBeCloseTo(-s.volumeRate, 12);
      const top = jellyBellPoint(s, 0, 0, true),
        rim = jellyBellPoint(s, Math.PI / 2, 0, true);
      expect(top[1] * JELLY.radius).toBeCloseTo(s.height, 12);
      expect(rim[0] * JELLY.radius).toBeCloseTo(s.radius, 12);
    }
  });
  it('expels and refills the same volume, with a truly still interpulse phase', () => {
    const dt = 1 / 4000,
      initial = jellyShape(0).volume,
      minimum = jellyShape(0.5).volume;
    let out = 0,
      inside = 0;
    for (let time = 0; time < 2; time += dt) {
      const s = jellyShape(time);
      out += s.outflow * dt;
      inside += s.inflow * dt;
    }
    expect(out).toBeCloseTo(initial - minimum, 10);
    expect(inside).toBeCloseTo(out, 10);
    expect(jellyShape(1.7).volumeRate).toBe(0);
    expect(jellyShape(1.9).compression).toBe(0);
  });
  it('allows bounded secondary acceleration after body motion has stopped', () => {
    const run = jellyRun(),
      without = jellyRun({ ...JELLY_DEFAULT, recovery: false });
    const boosted = run.filter((f) => f.stage === 'rest' && f.recoveryForce > f.drag);
    expect(boosted.length).toBeGreaterThan(0);
    for (const f of boosted) {
      expect(f.outflow).toBe(0);
      expect(f.inflow).toBe(0);
    }
    for (const f of run) {
      expect(f.vortexEnergy).toBeGreaterThanOrEqual(0);
      expect(f.releasedEnergy + f.vortexEnergy).toBeLessThanOrEqual(f.wakeEnergy * 0.35 + 1e-15);
      expect(f.recoveredWork).toBeLessThanOrEqual(f.releasedEnergy + 1e-15);
    }
    expect(run.at(-1)!.distance).toBeGreaterThan(without.at(-1)!.distance);
    expect(run.map((f) => f.activeForce)).toEqual(without.map((f) => f.activeForce));
  });
  it('has no free propulsion when the contraction amplitude is zero', () => {
    const run = jellyRun({ ...JELLY_DEFAULT, amplitude: 0 });
    expect(
      run.every(
        (f) => f.activeForce === 0 && f.recoveryForce === 0 && f.speed === 0 && f.distance === 0,
      ),
    ).toBe(true);
    expect(run.every((f) => jellyVortices(f).length === 0)).toBe(true);
  });
  it('accounts recovery work from actual displacement and respects the energy budget at nondefault pulses and steps', () => {
    for (const amplitude of [0.05, 0.22, 0.35])
      for (const period of [0.8, 2, 4])
        for (const dt of [0.02, 1 / 240, 1 / 480]) {
          const run = jellyRun({ amplitude, period, recovery: true }, 8, dt);
          let previousDistance = 0,
            actualWork = 0;
          for (const frame of run) {
            const stepWork = frame.recoveryForce * (frame.distance - previousDistance);
            actualWork += stepWork;
            expect(frame.recoveredWork).toBe(actualWork);
            expect(actualWork).toBeLessThanOrEqual(frame.releasedEnergy);
            expect(frame.releasedEnergy + frame.vortexEnergy).toBeLessThanOrEqual(
              frame.wakeEnergy * 0.35 + 1e-18,
            );
            previousDistance = frame.distance;
          }
        }
  });
  it('converges under a smaller time step and reconstructs backward seeks', () => {
    const run = jellyRun(),
      finer = jellyRun(JELLY_DEFAULT, 8, 1 / 480);
    expect(
      Math.abs(run.at(-1)!.distance - finer.at(-1)!.distance) / finer.at(-1)!.distance,
    ).toBeLessThan(0.015);
    const snapshot = JSON.stringify(jellyFrame(run, 1.8));
    jellyFrame(run, 7.8);
    jellyFrame(run, 0.1);
    expect(JSON.stringify(jellyFrame(run, 1.8))).toBe(snapshot);
    expect(jellyShot(4, 0.5)).toMatchObject({ view: 'pressure', time: 1.71 });
  });
  it('holds the final film frame fully relaxed with the stopping vortex and its opposite circulation', () => {
    const run = jellyRun(),
      shot = jellyShot(6, 1),
      frame = jellyFrame(run, shot.time),
      rings = jellyVortices(frame),
      starting = rings.find((ring) => ring.type === 'starting')!,
      stopping = rings.find((ring) => ring.type === 'stopping')!;
    expect(shot).toMatchObject({ view: 'vortices', time: 7.8 });
    expect(frame.stage).toBe('rest');
    expect(frame.volumeRate).toBe(0);
    expect(frame.recoveryForce).toBeGreaterThan(0);
    expect(stopping.strength).toBeGreaterThan(0.5);
    expect(stopping.y).toBeCloseTo(-0.07, 12);
    expect(stopping.rotation).toBe(-1);
    expect(starting.rotation).toBe(-stopping.rotation);
    jellyFrame(run, 0);
    jellyFrame(run, 8);
    expect(jellyVortices(jellyFrame(run, jellyShot(6, 1).time))).toEqual(rings);
  });
  it('bounds numerical inputs and remains finite at allowed extremes', () => {
    expect(() => jellyRun({ ...JELLY_DEFAULT, period: 0 })).toThrow(RangeError);
    expect(() => jellyShape(NaN)).toThrow(RangeError);
    for (const amplitude of [0, 0.35])
      for (const period of [0.8, 4])
        expect(
          jellyRun({ amplitude, period, recovery: true }).every((f) =>
            Object.values(f).every((v) => typeof v !== 'number' || Number.isFinite(v)),
          ),
        ).toBe(true);
  });
  it('builds nondegenerate bell caps with a periodic seam and connected anatomy', () => {
    for (const time of [0, 0.5, 1.44]) {
      const frame = jellyFrame(jellyRun(), time),
        mesh = jellyBellMesh(frame, 12, 32);
      for (let k = 0; k < mesh.indices.length; k += 3) {
        const [a, b, c] = mesh.indices.slice(k, k + 3).map((i) => mesh.vertices[i]),
          u = b.map((n, j) => n - a[j]),
          v = c.map((n, j) => n - a[j]);
        expect(
          Math.hypot(
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0],
          ),
        ).toBeGreaterThan(1e-7);
      }
      expect(jellyBellPoint(frame, 0.5, 0)).toEqual(
        jellyBellPoint(frame, 0.5, 2 * Math.PI).map((v) => (Math.abs(v) < 1e-12 ? 0 : v)),
      );
      for (let arm = 0; arm < 4; arm++) {
        expect(jellyGonadPoint(arm, 0.5)[1]).toBeGreaterThan(0);
        expect(jellyOralPoint(arm, 1, 0, frame)[1]).toBeLessThan(0);
      }
      expect(
        Math.hypot(jellyTentaclePoint(0, 0, frame)[0], jellyTentaclePoint(0, 0, frame)[2]),
      ).toBeCloseTo(frame.radius / JELLY.radius, 12);
    }
  });
});
