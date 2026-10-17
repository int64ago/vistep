import { describe, expect, it } from 'vitest';
import {
  idealGas,
  gasConstants,
  gasInitial,
  gasParticle,
  boxCoordinate,
  rightWallHits,
  gasWallMeasurement,
  lastRightHit,
} from './ideal-gas';
describe('Ideal gas from elastic wall impulses', () => {
  it('matches independent molar and molecular benchmarks', () => {
    const s = idealGas();
    expect(s.pressure).toBeCloseTo(99773.5514, 3);
    expect(s.rms).toBeCloseTo(1367.3, 0);
    expect(s.mass * gasConstants.NA).toBeCloseTo(0.004002602, 12);
  });
  it('has zero mean velocity, isotropic second moments and correct translational energy', () => {
    const s = idealGas(),
      sums = [0, 0, 0],
      squares = [0, 0, 0];
    let energy = 0;
    for (let i = 0; i < s.count; i++) {
      const { v } = gasInitial(i);
      for (let a = 0; a < 3; a++) {
        sums[a] += v[a];
        squares[a] += v[a] ** 2;
      }
      energy += 0.5 * s.mass * s.weight * v.reduce((a, b) => a + b * b, 0);
    }
    for (let a = 0; a < 3; a++) {
      expect(sums[a]).toBeCloseTo(0, 8);
      expect(squares[a] / s.count / s.componentSpeed ** 2).toBeCloseTo(1, 12);
    }
    expect(energy).toBeCloseTo(s.energy, 9);
  });
  it('reflects the normal component, preserves energy, and keeps actual positions in the box', () => {
    expect(boxCoordinate(0.2, 1, 1, 1).position).toBeCloseTo(0.8, 12);
    expect(boxCoordinate(0.2, 1, 1, 1).velocity).toBe(-1);
    for (const volume of [0.0005, 0.0015])
      for (const time of [0, 0.001, 0.035, 3]) {
        const s = idealGas({ volume });
        for (let i = 0; i < 48; i++) {
          const p = gasParticle(i, time, { volume });
          for (let a = 0; a < 3; a++) {
            expect(p.position[a]).toBeGreaterThanOrEqual(0);
            expect(p.position[a]).toBeLessThanOrEqual([s.lx, s.ly, s.lz][a]);
          }
          expect(p.velocity.reduce((a, b) => a + b * b, 0)).toBeCloseTo(
            p.v0.reduce((a, b) => a + b * b, 0),
            6,
          );
        }
      }
  });
  it('counts actual unfolded wall crossings for either initial direction', () => {
    expect(rightWallHits(0.25, 1, 1, 0, 5)).toBe(3);
    expect(rightWallHits(0.25, -1, 1, 0, 5)).toBe(2);
    const h = lastRightHit(0, 0.03),
      p = gasParticle(0, h.at);
    expect(p.position[0]).toBeCloseTo(0.1, 10);
    expect(h.at).toBeLessThanOrEqual(0.03);
  });
  it('independently recovers state-equation pressure from counted impulses over long windows', () => {
    for (const o of [{}, { volume: 0.0005 }, { temperature: 600, groups: 3 }, { neon: true }]) {
      const s = idealGas(o),
        m = gasWallMeasurement(0.4, 0.4, o);
      expect(Math.abs(m.pressure / s.pressure - 1)).toBeLessThan(0.001);
    }
    expect(gasWallMeasurement(0.1, 0.1, { groups: 0 }).pressure).toBe(0);
  });
  it('distinguishes heavier atoms, kelvin scaling and gauge reference', () => {
    const he = idealGas(),
      ne = idealGas({ neon: true });
    expect(ne.pressure).toBe(he.pressure);
    expect(ne.rms / he.rms).toBeCloseTo(Math.sqrt(0.004002602 / 0.0201797), 12);
    expect(idealGas({ temperature: 600 }).pressure / he.pressure).toBe(2);
    expect(idealGas({ temperature: 600 }).gauge / he.gauge).not.toBeCloseTo(2, 0);
    for (const o of [{ temperature: 0 }, { volume: 0 }, { groups: 1.2 }])
      expect(() => idealGas(o)).toThrow(RangeError);
  });
});

// The time window is open at its start and closed at its end in either direction.
it('counts negative-velocity wall impacts at exact time boundaries', () => {
  expect(rightWallHits(0.5, -1, 1, 0.5, 1.5)).toBe(1);
  expect(rightWallHits(0.5, -1, 1, 1.5, 2.5)).toBe(0);
});
