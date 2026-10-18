import { describe, it, expect } from 'vitest';
import {
  radialProbability,
  radialCdf,
  orbitalRadius,
  orbitalSamples,
  bohrHydrogen,
  projectOrbital,
  atomicDirector,
} from './chem-atomic-models';
describe('atomic model boundaries', () => {
  it('normalizes independently integrated hydrogen radial probabilities', () => {
    for (const o of ['1s', '2s', '2p'] as const) {
      let sum = 0;
      const dx = 0.002;
      for (let x = dx / 2; x < 50; x += dx) sum += radialProbability(o, x) * dx;
      expect(sum).toBeCloseTo(1, 6);
      expect(radialCdf(o, 0)).toBe(0);
      expect(radialCdf(o, 40)).toBeCloseTo(1, 6);
    }
  });
  it('has the known 1s mean-radius and 90% boundary benchmarks', () => {
    expect(orbitalRadius('1s', 0.9)).toBeCloseTo(2.66116, 4);
    expect(radialCdf('1s', 1)).toBeCloseTo(1 - 5 * Math.exp(-2), 10);
    expect(radialProbability('2s', 2)).toBe(0);
    expect(orbitalRadius('2s')).toBeGreaterThan(orbitalRadius('1s'));
  });
  it('samples reproducibly with p angular lobes and physical projection', () => {
    const a = orbitalSamples('2p', 1000),
      b = orbitalSamples('2p', 1000);
    expect(a).toEqual(b);
    const y = a.reduce((s, p) => s + (p.y * p.y) / p.r ** 2, 0) / 1000;
    expect(y).toBeCloseTo(0.6, 2);
    expect(projectOrbital({ x: 0, y: 1, z: 0 }, 'x')).not.toEqual(
      projectOrbital({ x: 0, y: 1, z: 0 }, 'y'),
    );
  });
  it('uses quantized Bohr energy/radius and deterministic chapter state', () => {
    expect(bohrHydrogen(2).radius / bohrHydrogen(1).radius).toBe(4);
    expect(bohrHydrogen(2).energy - bohrHydrogen(1).energy).toBeCloseTo(10.20427, 4);
    expect(atomicDirector(4, 0).count).toBe(1);
    expect(atomicDirector(5, 1).probability).toBe(0.9);
  });
});
