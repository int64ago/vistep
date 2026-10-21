import { describe, it, expect } from 'vitest';
import {
  methaneChain,
  methaneDistribution,
  methanePopulation,
  methaneDirector,
  METHANE_MEASURED_CUTS,
  METHANE_SECONDS,
  methaneSubstitution,
} from './chem-methane-substitution';
describe('methane causal accounts', () => {
  it('switches the pulse off after the initiation event without deleting radicals', () => {
    expect(methaneChain(1, 0.2, 320, 'pulse').lampOn).toBe(true);
    expect(methaneChain(1, 1, 320, 'pulse').lampOn).toBe(false);
    expect(methaneChain(1, 1, 320, 'pulse').radicalCount).toBe(2);
    const d = methaneDirector(1, 0, 29);
    expect(d.condition).toBe('pulse');
    expect(methaneChain(d.step, d.event, 320, d.condition).lampOn).toBe(false);
  });
  it('preserves eleven atom identities through two propagation cycles and termination', () => {
    const initial = methaneChain(0, 0);
    const ids = initial.atoms.map((a) => a.id);
    for (let s = 0; s <= 6; s++)
      for (let p = 0; p <= 20; p++) {
        const q = methaneChain(s, p / 20, 272, 'pulse');
        expect(q.atoms.map((a) => a.id)).toEqual(ids);
        expect(q.atoms.filter((a) => a.element === 'C')).toHaveLength(1);
        expect(q.atoms.filter((a) => a.element === 'H')).toHaveLength(4);
        expect(q.atoms.filter((a) => a.element === 'Cl')).toHaveLength(6);
        expect(
          q.atoms
            .filter((a) => a.radical)
            .map((a) => a.id)
            .sort(),
        ).toEqual([...q.radicalIds].sort());
        expect(q.bonds.every((b) => ids.includes(b.a) && ids.includes(b.b))).toBe(true);
      }
    const finish = methaneChain(6, 1);
    expect(finish.products).toEqual({ organicCl: 2, hcl: 2, chlorine: 1 });
    expect(finish.radicalCount).toBe(0);
  });
  it('regenerates the kind of carrier, not the same chlorine atom', () => {
    expect(methaneChain(1, 1).radicalIds).toEqual(['Cl0', 'Cl1']);
    expect(methaneChain(2, 1).radicalIds).toEqual(['C', 'Cl1']);
    expect(methaneChain(3, 1).radicalIds).toEqual(['Cl3', 'Cl1']);
    expect(methaneChain(5, 1).radicalIds).toEqual(['Cl5', 'Cl1']);
    expect(methaneChain(2, 1).bonds.find((b) => b.a === 'Cl0' && b.b === 'H0')?.opacity).toBe(1);
  });
  it('can propagate after a pulse but a fresh dark sample is unchanged', () => {
    for (let s = 2; s <= 6; s++) {
      const q = methaneChain(s, 1, 320, 'pulse');
      expect(q.lampOn).toBe(false);
      expect(q.products.hcl).toBeGreaterThan(0);
      const d = methaneChain(s, 1, 320, 'dark');
      expect(d.radicalCount).toBe(0);
      expect(d.products.hcl).toBe(0);
      expect(d.atoms).toEqual(methaneChain(0, 0, 320, 'dark').atoms);
    }
  });
  it('exact finite combinatorics agree with exhaustively selecting two of eight sites', () => {
    const histogram = Array(5).fill(0);
    let total = 0;
    for (let a = 0; a < 8; a++)
      for (let b = a + 1; b < 8; b++) {
        histogram[Number(a < 4) + Number(b < 4)]++;
        total++;
      }
    const q = methaneDistribution(2, 2);
    q.probabilities.forEach((p, k) => expect(p).toBeCloseTo(histogram[k] / total, 12));
  });
  it('expected distribution conserves all sites and chlorine with a valid dilution counterexample', () => {
    for (const n of [1, 2, 8, 16, 32])
      for (let m = 0; m <= 4 * n; m++) {
        const q = methaneDistribution(n, m);
        expect(q.expected.reduce((a, b) => a + b, 0)).toBeCloseTo(n, 9);
        expect(q.expected.reduce((a, b, k) => a + k * b, 0)).toBeCloseTo(m, 9);
        expect(q.organicH + q.hcl).toBe(4 * n);
        expect(q.organicCl + q.hcl).toBe(2 * m);
      }
    expect(methaneDistribution(32, 8).multiple).toBeLessThan(methaneDistribution(8, 8).multiple);
  });
  it('the fixed realization preserves each carbon and site across chlorine input', () => {
    for (const n of [8, 16, 32])
      for (const m of [0, 8, 16, 32])
        for (const p of [0, 0.1, 0.5, 1]) {
          const q = methanePopulation(n, m, p);
          expect(q.carbons.reduce((a, b) => a + b.count, 0)).toBe(q.completed);
          expect(q.counts.reduce((a, b) => a + b, 0)).toBe(n);
          expect(q.organicCl + q.hcl + 2 * q.remainingChlorine).toBe(2 * m);
          expect(new Set(q.carbons.flatMap((c) => c.sites.map((s) => s.id))).size).toBe(4 * n);
        }
    expect(methanePopulation(8, 8, 0.5).order).toEqual(methanePopulation(8, 16, 1).order);
  });
  it('keeps finite values and finite-input boundaries', () => {
    for (const v of [NaN, Infinity, -Infinity, -1, 0, 1, 1000]) {
      for (const q of [
        methaneChain(v, v, v),
        methaneDistribution(v, v),
        methanePopulation(v, v, v),
        methaneDirector(v, v, v),
        methaneSubstitution(v, true, v),
      ])
        expect(JSON.stringify(q)).not.toMatch(/null/);
    }
  });
  it('hides the dilution answer and preserves director boundary determinism', () => {
    expect(methaneDirector(4, 0, 22).ratioReveal).toBe(false);
    expect(methaneDirector(4, 0, 34).ratioReveal).toBe(true);
    expect(methaneDirector(0, 1).reactionProgress).toBe(0);
    expect(methaneDirector(2, 1).reactionProgress).toBe(1);
  });
});

describe('measured bilingual methane director', () => {
  it('retains both original observation spans and uses the complete final 195 seconds', () => {
    expect(METHANE_SECONDS).toEqual([27, 35, 31, 52, 50]);
    expect(METHANE_SECONDS.reduce((a, b) => a + b, 0)).toBe(195);
    for (const locale of ['zh', 'en'] as const) {
      expect(methaneDirector(0, 1, 27, locale).reactionProgress).toBe(0);
      expect(methaneDirector(2, 0, 15.5, locale).reactionProgress).toBeCloseTo(0.825);
      expect(methaneDirector(2, 1, 31, locale).reactionProgress).toBe(1);
    }
  });
  it('finishes the absorbed-light split before discussing radicals and preserves them when light stops', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = METHANE_MEASURED_CUTS[locale];
      const before = methaneDirector(1, 0, cuts.initiation[0] - 0.001, locale);
      expect(before.event).toBe(0);
      expect(methaneChain(before.step, before.event).radicalIds).toEqual([]);
      const after = methaneDirector(1, 0, cuts.initiation[1], locale);
      expect(methaneChain(after.step, after.event).radicalIds).toEqual(['Cl0', 'Cl1']);
      expect(methaneDirector(1, 0, cuts.darkControl[0], locale).shot).toBe('dark-control');
      const dark = methaneDirector(1, 0, cuts.darkControl[1], locale);
      const sample = methaneChain(dark.step, dark.event, 272, dark.condition);
      expect(dark.shot).toBe('dark-question');
      expect(sample.lampOn).toBe(false);
      expect(sample.radicalIds).toEqual(['Cl0', 'Cl1']);
    }
  });
  it('lets every spoken propagation event complete before the next begins, without replacing identities', () => {
    for (const locale of ['zh', 'en'] as const) {
      const events = METHANE_MEASURED_CUTS[locale].chain;
      expect(methaneDirector(3, 0, 3.5, locale).event).toBe(0);
      events.forEach(([start, end], i) => {
        const beginning = methaneDirector(3, 0, start, locale),
          finish = methaneDirector(3, 0, end, locale);
        expect(beginning.step).toBe(i + 2);
        expect(beginning.event).toBe(0);
        const a = methaneChain(beginning.step, beginning.event, 272, 'pulse');
        const prior = methaneChain(i + 1, 1, 272, 'pulse');
        expect(a.atoms).toEqual(prior.atoms);
        const z = methaneChain(finish.step, finish.event, 272, 'pulse');
        expect(z.atoms).toEqual(methaneChain(i + 2, 1, 272, 'pulse').atoms);
        expect(z.atomCount).toEqual({ C: 1, H: 4, Cl: 6 });
        expect(z.lampOn).toBe(false);
        if (i < 4) expect(end).toBeLessThanOrEqual(events[i + 1][0]);
      });
      const end = methaneDirector(3, 0, 35, locale);
      expect(end.step).toBe(6);
      expect(end.event).toBe(1);
      expect(methaneChain(end.step, end.event).radicalCount).toBe(0);
    }
  });
  it('leaves the ratios unanswered throughout both spoken questions, then reveals at the stated repeat-selection conclusion', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = METHANE_MEASURED_CUTS[locale];
      for (const t of [cuts.question, 23.5, 24.5, cuts.answer - 0.001]) {
        const d = methaneDirector(4, 0, t, locale);
        expect(d.ratioQuestion).toBe(true);
        expect(d.ratioReveal).toBe(false);
      }
      expect(methaneDirector(4, 0, cuts.answer, locale).ratioReveal).toBe(true);
      expect(methaneDirector(4, 0, 50, locale).time).toBe(50);
    }
  });
});
