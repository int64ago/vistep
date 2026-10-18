import { describe, it, expect } from 'vitest';
import {
  testSample,
  candidates,
  candidateGroups,
  aspirinEvidence,
  branchYield,
  esterAtoms,
  nmrPatterns,
  identificationDemo,
} from './chem-organic-detection';
describe('organic evidence and retrosynthesis', () => {
  it('does not confuse bromine extraction, addition, substitution or aldehyde oxidation', () => {
    expect(testSample('hexene', 'bromine').result).toBe('addition');
    expect(testSample('benzene', 'bromine').result).toBe('partition');
    expect(testSample('ccl4', 'water').result).toBe('lower');
    expect(testSample('phenol', 'bromine').precipitate).toBe('white');
    expect(testSample('ethanal', 'bromine').result).toBe('oxidation');
    expect(testSample('bromobutane', 'halide', false).result).toBe('invalid-preparation');
  });
  it('separates both finite candidate sets with orthogonal observations', () => {
    for (const s of candidateGroups[0]) {
      const obs = ['water', 'bromine'].map((test) => ({
        test: test as 'water' | 'bromine',
        result: testSample(s, test as 'water' | 'bromine').result,
      }));
      expect(candidates(0, obs)).toEqual([s]);
    }
    for (const s of candidateGroups[1]) {
      const obs = ['iron', 'copper', 'halide'].map((test) => ({
        test: test as 'iron' | 'copper' | 'halide',
        result: testSample(s, test as 'iron' | 'copper' | 'halide').result,
      }));
      expect(candidates(1, obs)).toEqual([s]);
    }
  });
  it('requires hydrolysis and valid medium for the aspirin phenolic test', () => {
    expect(aspirinEvidence(false, true).ironPositive).toBe(false);
    expect(aspirinEvidence(true, false).ironPositive).toBe(false);
    expect(aspirinEvidence(true, true).ironPositive).toBe(true);
  });
  it('preserves six carbon identities across the planning disconnection and uses branch-limited yield', () => {
    for (const mobile of [false, true]) {
      expect(esterAtoms(mobile, 0).map((a) => a.id)).toEqual(
        esterAtoms(mobile, 1).map((a) => a.id),
      );
      expect(esterAtoms(mobile, 1).filter((a) => !a.id.startsWith('O')).length).toBe(6);
    }
    expect(branchYield(0.7).target).toBeCloseTo(0.2401);
    expect(nmrPatterns.ester.areas.reduce((a, b) => a + b)).toBe(8);
  });
});

it('demonstration exclusions follow completed observations and uniquely resolve both unknowns', () => {
  for (const group of [0, 1]) {
    const first = identificationDemo(group, 0);
    expect(candidates(group, first.observations)).toEqual(candidateGroups[group]);
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const d = identificationDemo(group, p);
      expect(candidates(group, d.observations)).toContain(d.sample);
    }
    const last = identificationDemo(group, 1);
    expect(candidates(group, last.observations)).toEqual([last.sample]);
  }
});
