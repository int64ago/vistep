import { describe, expect, it } from 'vitest';
import {
  CHEMICAL_EV_PER_ATOM,
  FISSION,
  NUCLIDES,
  bindingCurve,
  bindingPerNucleon,
  chainAt,
  chainMultiplication,
  criticalRadius,
  diffusionArea,
  dropOutline,
  effectiveGenerationS,
  estimateMultiplication,
  expandedMultiplication,
  expandedRadius,
  fissionChain,
  fissionMassFraction,
  fissionQMeV,
  generationsToReach,
  infiniteMultiplication,
  multiplication,
  nonLeakage,
  populationAt,
  semfBindingMeV,
  stoppingScale,
  unitRandom,
} from './atomic-bomb';

describe('binding energy and one fission channel', () => {
  it('reproduces measured binding energies per nucleon from atomic masses', () => {
    expect(bindingPerNucleon(NUCLIDES.u235)).toBeCloseTo(7.591, 2);
    expect(bindingPerNucleon(NUCLIDES.ba141)).toBeCloseTo(8.326, 2);
    expect(bindingPerNucleon(NUCLIDES.kr92)).toBeCloseTo(8.513, 2);
    expect(bindingPerNucleon(NUCLIDES.fe56)).toBeCloseTo(8.79, 2);
  });
  it('places the semi-empirical curve within 0.15 MeV per nucleon of the measured markers', () => {
    for (const nuclide of Object.values(NUCLIDES))
      expect(
        Math.abs(semfBindingMeV(nuclide.A, nuclide.Z) / nuclide.A - bindingPerNucleon(nuclide)),
      ).toBeLessThan(0.15);
    const curve = bindingCurve(250);
    expect(curve[0].A).toBe(4);
    expect(curve.at(-1)!.A).toBe(250);
    const peak = curve.reduce((best, p) => (p.perNucleon > best.perNucleon ? p : best));
    expect(peak.A).toBeGreaterThan(50);
    expect(peak.A).toBeLessThan(70);
    expect(curve.at(-1)!.perNucleon).toBeLessThan(peak.perNucleon);
  });
  it('gives about 173 MeV and a 0.08% mass fraction for n + U-235 → Ba-141 + Kr-92 + 3n', () => {
    expect(fissionQMeV()).toBeCloseTo(173.3, 0);
    expect(fissionMassFraction()).toBeCloseTo(7.9e-4, 5);
    // Independent statement of the same energy: the fragments sit higher on the curve.
    const gain =
      bindingPerNucleon(NUCLIDES.ba141) * 141 +
      bindingPerNucleon(NUCLIDES.kr92) * 92 -
      bindingPerNucleon(NUCLIDES.u235) * 235;
    expect(gain).toBeCloseTo(fissionQMeV(), 6);
    expect((fissionQMeV() * 1e6) / CHEMICAL_EV_PER_ATOM).toBeGreaterThan(4e7);
  });
  it('rejects impossible nuclei and curve ranges', () => {
    expect(() => semfBindingMeV(10, 11)).toThrow(RangeError);
    expect(() => semfBindingMeV(2.5, 1)).toThrow(RangeError);
    expect(() => bindingCurve(3)).toThrow(RangeError);
  });
});

describe('one-group multiplication in a bare sphere', () => {
  it('sets k∞ from the collision fractions and crosses k = 1 at the critical radius', () => {
    expect(infiniteMultiplication()).toBeCloseTo((2.4 * 0.25) / 0.28, 12);
    expect(diffusionArea()).toBeCloseTo(1 / 3 / 0.28, 12);
    const rc = criticalRadius();
    expect(rc).toBeGreaterThan(2);
    expect(rc).toBeLessThan(3);
    expect(multiplication(rc)).toBeCloseTo(1, 9);
    expect(multiplication(rc * 0.999)).toBeLessThan(1);
    expect(multiplication(rc * 1.001)).toBeGreaterThan(1);
  });
  it('increases monotonically with radius toward k∞ while leakage falls', () => {
    let previous = 0;
    for (let r = 0.5; r <= 40; r += 0.5) {
      const k = multiplication(r);
      expect(k).toBeGreaterThan(previous);
      expect(k).toBeLessThan(infiniteMultiplication());
      expect(nonLeakage(r)).toBeCloseTo(k / infiniteMultiplication(), 12);
      previous = k;
    }
    expect(multiplication(400)).toBeCloseTo(infiniteMultiplication(), 2);
  });
  it('agrees with a power-iteration transport estimate from the same collision fractions', () => {
    // Diffusion theory is approximate for spheres a few mean free paths wide; a loose band
    // still separates "well under" from "well over" critical and checks the shared constants.
    for (const [radius, tolerance] of [
      [1.6, 0.2],
      [3, 0.15],
      [4.5, 0.12],
    ] as const) {
      const estimate = estimateMultiplication(radius, 23, 500, 8);
      expect(Math.abs(estimate.k - multiplication(radius))).toBeLessThan(tolerance);
    }
  });
  it('lowers the mean-free-path radius as 1/s² under expansion and stops at k = 1', () => {
    expect(expandedRadius(4.5, 2)).toBeCloseTo(4.5 / 4, 12);
    const s = stoppingScale(4.5);
    expect(expandedMultiplication(4.5, s)).toBeCloseTo(1, 9);
    expect(expandedMultiplication(4.5, s * 1.1)).toBeLessThan(1);
    expect(stoppingScale(1)).toBe(1);
    expect(() => expandedRadius(4.5, 0.9)).toThrow(RangeError);
    expect(() => multiplication(0)).toThrow(RangeError);
  });
});

describe('generation growth and delayed neutrons', () => {
  it('needs about 80 generations at k = 2 to reach 10²⁴ and lengthens the average generation', () => {
    expect(generationsToReach(2, 1e24)).toBeCloseTo(79.7, 0);
    expect(populationAt(2, 1e-8, 8e-7)).toBeCloseTo(2 ** 80, -20);
    const effective = effectiveGenerationS(FISSION.thermalPromptLifetimeS);
    expect(effective).toBeGreaterThan(0.08);
    expect(effective).toBeLessThan(0.085);
    // Same k = 1.001: prompt-only doubles within a second, delayed takes about a minute.
    expect(populationAt(1.001, FISSION.thermalPromptLifetimeS, 1)).toBeGreaterThan(20000);
    expect(populationAt(1.001, effective, 60)).toBeLessThan(2.1);
    expect(populationAt(1.001, effective, 60)).toBeGreaterThan(2);
    expect(() => generationsToReach(1, 10)).toThrow(RangeError);
    expect(() => populationAt(2, 0, 1)).toThrow(RangeError);
  });
});

describe('counter-addressed neutron walk', () => {
  it('is deterministic, keeps every collision inside the sphere and exits exactly on it', () => {
    const a = fissionChain(3, 11),
      b = fissionChain(3, 11);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(fissionChain(3, 12).neutrons[0].points[1]).not.toEqual(a.neutrons[0].points[1]);
    for (const n of a.neutrons) {
      for (const [i, p] of n.points.entries()) {
        const r = Math.hypot(...p);
        if (n.fate === 'leak' && i === n.points.length - 1) expect(r).toBeCloseTo(3, 9);
        else expect(r).toBeLessThanOrEqual(3 + 1e-9);
      }
      for (let i = 1; i < n.times.length; i++) {
        const flight = Math.hypot(
          n.points[i][0] - n.points[i - 1][0],
          n.points[i][1] - n.points[i - 1][1],
          n.points[i][2] - n.points[i - 1][2],
        );
        expect(n.times[i] - n.times[i - 1]).toBeCloseTo(flight, 9);
      }
      expect(n.end).toBe(n.times.at(-1));
      if (n.parent !== null) {
        const parent = a.neutrons[n.parent];
        expect(parent.fate).toBe('fission');
        expect(n.born).toBe(parent.end);
        expect(n.points[0]).toEqual(parent.points.at(-1));
        expect(n.generation).toBe(parent.generation + 1);
      }
      if (n.fate === 'fission') {
        expect(n.children.length).toBeGreaterThanOrEqual(2);
        expect(n.children.length).toBeLessThanOrEqual(3);
      } else expect(n.children).toHaveLength(0);
    }
    expect(a.fissions + a.leaked + a.captured + (a.truncated ? 1 : 0)).toBeGreaterThanOrEqual(
      a.neutrons.filter((n) => n.fate !== 'open').length,
    );
    expect(a.generations.reduce((s, g) => s + g, 0)).toBe(a.neutrons.length);
  });
  it('emits 2 or 3 neutrons per fission at the configured mean over many histories', () => {
    let fissions = 0,
      children = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const chain = fissionChain(Infinity, seed, { maxGenerations: 6, maxNeutrons: 300 });
      for (const n of chain.neutrons)
        if (n.fate === 'fission' && n.children.length) {
          fissions++;
          children += n.children.length;
        }
    }
    expect(children / fissions).toBeGreaterThan(2.3);
    expect(children / fissions).toBeLessThan(2.5);
    const inf = fissionChain(Infinity, 7, { maxGenerations: 7 });
    expect(inf.leaked).toBe(0);
    const growth = chainMultiplication(inf);
    expect(growth.length).toBeGreaterThan(3);
  });
  it('reconstructs the visible walk at any time as a prefix of later times', () => {
    const chain = fissionChain(4.5, 2);
    const early = chainAt(chain, 3),
      late = chainAt(chain, 9);
    expect(early.fissions).toBeLessThanOrEqual(late.fissions);
    expect(early.generation).toBeLessThanOrEqual(late.generation);
    for (const [i, path] of early.paths.entries()) {
      if (!path) continue;
      const laterPath = late.paths[i]!;
      for (let j = 0; j < path.points.length - 1; j++)
        expect(laterPath.points[j]).toEqual(path.points[j]);
      const r = Math.hypot(...path.points.at(-1)!);
      expect(r).toBeLessThanOrEqual(4.5 + 1e-9);
    }
    expect(chainAt(chain, -1).paths.every((p) => p === null)).toBe(true);
    expect(chainAt(chain, 1e6).alive).toHaveLength(0);
    expect(() => chainAt(chain, NaN)).toThrow(RangeError);
  });
  it('validates counters, limits and radii', () => {
    expect(() => unitRandom(-1, 0, 0)).toThrow(RangeError);
    expect(() => unitRandom(1, 0.5, 0)).toThrow(RangeError);
    expect(() => fissionChain(0, 1)).toThrow(RangeError);
    expect(() => fissionChain(3, 1, { maxNeutrons: 0 })).toThrow(RangeError);
    const values = Array.from({ length: 2000 }, (_, i) => unitRandom(5, i, 3));
    expect(Math.min(...values)).toBeGreaterThan(0);
    expect(Math.max(...values)).toBeLessThan(1);
    expect(values.reduce((s, v) => s + v, 0) / values.length).toBeCloseTo(0.5, 1);
  });
});

describe('liquid-drop scission outline', () => {
  it('starts as one sphere and ends as two separated fragments with A-scaled radii', () => {
    const sphere = dropOutline(0);
    for (const p of sphere.outline) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 6);
    const split = dropOutline(1);
    expect(split.separated).toBe(true);
    expect(split.heavy.r / split.light.r).toBeCloseTo(Math.cbrt(141 / 92), 9);
    expect(split.heavy.r ** 3 + split.light.r ** 3).toBeCloseTo((141 + 92) / 236, 9);
    expect(split.heavy.x + split.heavy.r).toBeLessThan(split.light.x - split.light.r);
    const middle = dropOutline(0.9);
    const neck = Math.min(
      ...middle.outline
        .filter((p) => p.x > middle.heavy.x && p.x < middle.light.x)
        .map((p) => Math.abs(p.y)),
    );
    expect(neck).toBeGreaterThan(0);
    expect(neck).toBeLessThan(0.3);
    expect(() => dropOutline(NaN)).toThrow(RangeError);
  });
});
