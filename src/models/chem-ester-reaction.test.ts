import { describe, it, expect } from 'vitest';
import {
  esterPreparation,
  esterHydrolysis,
  ethanolBurn,
  aceticCarbonate,
  esterDirector,
} from './chem-ester-reaction';
describe('ester preparation and hydrolysis', () => {
  it('conserves both organic groups and water across reaction and receiver', () => {
    for (const heat of [true, false])
      for (const cat of [true, false])
        for (const collect of [true, false])
          for (const p of [0, 0.3, 1]) {
            const m = esterPreparation(p, heat, cat, collect),
              r = m.receiver;
            expect(m.acid + r.acid + m.ester + r.ester).toBeCloseTo(1, 9);
            expect(m.alcohol + r.alcohol + m.ester + r.ester).toBeCloseTo(1, 9);
            expect(m.water + r.water).toBeCloseTo(0.2 + m.extent, 9);
            expect(m.washed.oil + m.washed.dissolvedEster).toBeCloseTo(r.ester);
            expect(m.washed.acid + m.washed.acetate).toBeCloseTo(r.acid);
            expect(m.washed.carbonDioxide + m.washed.carbonate).toBeCloseTo(0.3);
          }
  });
  it('links catalyst and heat to rate while removal changes the reaction account', () => {
    expect(esterPreparation(1).extent).toBeGreaterThan(esterPreparation(1, false).extent);
    expect(esterPreparation(1).extent).toBeGreaterThan(esterPreparation(1, true, false).extent);
    expect(esterPreparation(1).extent).toBeGreaterThan(
      esterPreparation(1, true, true, false).extent,
    );
    expect(esterPreparation(0).receiver.ester).toBe(0);
  });
  it('conserves acid and ethyl groups during hydrolysis and consumes hydroxide only in base', () => {
    for (const med of ['neutral', 'acid', 'base'] as const)
      for (const p of [0, 0.4, 1])
        for (const base of [0, 0.3, 1.2]) {
          const m = esterHydrolysis(p, med, 75, base);
          expect(m.ester + m.alcohol).toBeCloseTo(1);
          expect(m.ester + m.acid + m.acetate).toBeCloseTo(1);
          if (med === 'base') {
            expect(m.hydroxide + m.acetate).toBeCloseTo(base);
            expect(m.extent).toBeLessThanOrEqual(base);
          } else expect(m.water + m.extent).toBeCloseTo(10);
        }
  });
  it('shows the declared temperature/medium comparison without forcing full conversion', () => {
    expect(esterHydrolysis(1, 'acid', 75).extent).toBeGreaterThan(
      esterHydrolysis(1, 'acid', 25).extent,
    );
    expect(esterHydrolysis(1, 'acid').extent).toBeGreaterThan(esterHydrolysis(1, 'neutral').extent);
    expect(esterHydrolysis(1, 'base').extent).toBeGreaterThan(esterHydrolysis(1, 'acid').extent);
    expect(esterHydrolysis(1, 'base', 75, 0).extent).toBe(0);
    expect(esterHydrolysis(1, 'acid').extent).toBeLessThan(1);
  });
  it('keeps the activity evidence and chapter routes explicit', () => {
    expect(ethanolBurn(1).water).toBeCloseTo(0.6);
    expect(ethanolBurn(1).carbonDioxide).toBeCloseTo(0.4);
    expect(aceticCarbonate(1).acetate).toBe(2);
    expect(aceticCarbonate(0.5).acid + 2 * aceticCarbonate(0.5).extent).toBe(2);
    expect(esterDirector(3, 1).preparation).toBe(0.55);
    expect(esterDirector(4, 1).preparation).toBe(1);
    expect(esterDirector(6, 0).hydrolysis).toBe(0);
  });
});

import {
  esterAtomMap,
  closedEsterHydrolysis,
  esterFilmState,
  ESTER_C3_CUTS,
} from './chem-ester-reaction';
describe('labelled oxygen and closed reversible comparison', () => {
  it('preserves every atom identity and balances both product formulas', () => {
    const ids = esterAtomMap(0).atoms.map((a) => a.id);
    for (let n = 0; n <= 100; n++) {
      const m = esterAtomMap(n / 100);
      expect(m.atoms.map((a) => a.id)).toEqual(ids);
      expect(m.total).toEqual([4, 10, 3]);
      expect(m.atoms.find((a) => a.id === m.isotope)?.product).toBe('ester');
      expect(m.bonds.find((b) => b.id === 'alcohol-CO')?.opacity).toBe(1);
      for (const a of m.atoms) expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
    }
    const m = esterAtomMap(1),
      sum = (product: string) =>
        m.atoms
          .filter((a) => a.product === product)
          .reduce((s, a) => s.map((v, i) => v + a.atoms[i]), [0, 0, 0]);
    expect(sum('ester')).toEqual([4, 8, 2]);
    expect(sum('water')).toEqual([0, 2, 1]);
    expect(m.bonds.find((b) => b.id === 'acid-leaving')?.opacity).toBe(0);
    expect(m.bonds.find((b) => b.id === 'ester-link')?.opacity).toBe(1);
  });
  it('keeps the acid oxygen glyph clear of the highlighted isotope throughout mapping', () => {
    for (let i = 0; i <= 1000; i++) {
      const atoms = esterAtomMap(i / 1000).atoms,
        acid = atoms.find((a) => a.id === 'acid-oxygen')!,
        isotope = atoms.find((a) => a.id === 'alcohol-oxygen')!;
      // Includes the isotope highlight half-width/height plus the oxygen glyph and clearance.
      expect(
        Math.max(Math.abs(acid.x - isotope.x) - 32, Math.abs(acid.y - isotope.y) - 28),
      ).toBeGreaterThan(0);
    }
  });
  it('keeps unrelated atoms off the intact alcohol C–O bond throughout staged mapping', () => {
    for (let i = 0; i <= 1000; i++) {
      const m = esterAtomMap(i / 1000),
        oxygen = m.atoms.find((a) => a.id === 'alcohol-oxygen')!,
        ethyl = m.atoms.find((a) => a.id === 'ethyl-group')!;
      expect(oxygen.y).toBe(ethyl.y);
      for (const a of m.atoms.filter((a) => !['alcohol-oxygen', 'ethyl-group'].includes(a.id))) {
        const half = a.label === 'CH₃' ? 25 : 10;
        const aboveOrBelow = Math.abs(a.y - oxygen.y) > 11;
        const outside = a.x + half < oxygen.x || a.x - half > ethyl.x;
        expect(aboveOrBelow || outside).toBe(true);
      }
    }
  });
  it('matches an independent RK4 integration of the material balance', () => {
    for (const water of [0.2, 1, 10, 20])
      for (const speed of [0.18, 1, 3])
        for (const t of [0.4, 2, 8]) {
          const steps = 10000,
            dt = t / steps,
            rate = (x: number) => speed * (0.175 * (1 - x) * (water - x) - 0.7 * x * x);
          let x = 0;
          for (let n = 0; n < steps; n++) {
            const a = rate(x),
              b = rate(x + (a * dt) / 2),
              c = rate(x + (b * dt) / 2),
              d = rate(x + c * dt);
            x += (dt * (a + 2 * b + 2 * c + d)) / 6;
          }
          const m = closedEsterHydrolysis(t, speed, water);
          expect(m.extent).toBeCloseTo(x, 9);
          expect(m.ester + m.acid).toBeCloseTo(1, 12);
          expect(m.ester + m.alcohol).toBeCloseTo(1, 12);
          expect(m.water + m.extent).toBeCloseTo(water, 12);
        }
  });
  it('shares one equilibrium while changing the approach, and respects absent reactants', () => {
    for (const w of [0.2, 1, 10, 20]) {
      const slow = closedEsterHydrolysis(2, 0.18, w),
        fast = closedEsterHydrolysis(2, 1, w);
      expect(slow.equilibrium).toBe(fast.equilibrium);
      expect(fast.extent).toBeGreaterThan(slow.extent);
      const x = fast.equilibrium;
      expect(0.175 * (1 - x) * (w - x) - 0.7 * x * x).toBeCloseTo(0, 12);
      expect(closedEsterHydrolysis(80, 1, w).extent).toBeCloseTo(x, 8);
    }
    expect(closedEsterHydrolysis(60, 1, 0).extent).toBe(0);
    expect(closedEsterHydrolysis(60, 0, 10).extent).toBe(0);
    for (const value of [NaN, Infinity, -Infinity, -1, 1e9]) {
      for (const m of [
        closedEsterHydrolysis(value),
        closedEsterHydrolysis(3, value),
        closedEsterHydrolysis(3, 1, value),
      ])
        for (const n of Object.values(m)) expect(Number.isFinite(n)).toBe(true);
    }
  });
  it('holds both predictions before revealing and reverses the same atom map', () => {
    const a = esterFilmState(3, 0.2);
    expect(a.question).toBe(true);
    expect(a.revealed).toBe(false);
    expect(a.atomProgress).toBe(0);
    const b = esterFilmState(7, 0.42);
    expect(b.question).toBe(true);
    expect(b.revealed).toBe(false);
    expect(b.closedTime).toBe(4);
    expect(esterFilmState(3, 1).atomProgress).toBe(1);
    expect(esterFilmState(7, 0).atomProgress).toBe(1);
    expect(esterFilmState(7, 0.3).atomProgress).toBe(0);
    for (const c of [0, 1, 2, 4, 5, 6, 8, 9])
      for (const p of [0, 0.31, 1]) {
        const legacy = esterDirector(c, p),
          next = esterFilmState(c, p);
        for (const k of Object.keys(legacy) as (keyof typeof legacy)[])
          expect(next[k]).toBe(legacy[k]);
      }
  });
  it('uses measured language-specific voice turns without early answers or broken atom continuity', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = ESTER_C3_CUTS[locale],
        at = (seconds: number) => esterFilmState(3, seconds / 50, locale);
      expect(at(cuts.atoms - 0.01).shot).toBe('apparatus');
      expect(at(cuts.atoms + 0.01).shot).toBe('atoms');
      expect(at(cuts.question + 0.01).question).toBe(true);
      expect(at(cuts.result - 0.01).revealed).toBe(false);
      expect(at(cuts.result + 0.01).revealed).toBe(true);
      expect(at(cuts.follow).atomProgress).toBe(0);
      expect(at((cuts.follow + cuts.moved) / 2).atomProgress).toBeCloseTo(0.5, 10);
      expect(at(cuts.moved + 0.01).atomProgress).toBe(1);
      for (const beat of ['water', 'ester', 'limit', 'catalyst', 'collection'] as const)
        expect(at(cuts[beat] + 0.01).atomBeat).toBe(beat);
      for (let i = 0; i <= 100; i++) {
        const state = at(cuts.follow + ((cuts.moved - cuts.follow) * i) / 100);
        expect(
          esterAtomMap(state.atomProgress).bonds.find((b) => b.id === 'alcohol-CO')?.opacity,
        ).toBe(1);
      }
    }
  });
  it('uses the same reversible balance and catalyst ratio in bath and closed views', () => {
    for (const temperature of [25, 55, 75, 80])
      for (const progress of [0, 0.2, 0.7, 1]) {
        const fast = esterHydrolysis(progress, 'acid', temperature),
          slow = esterHydrolysis(progress, 'neutral', temperature);
        const scale = (0.08 / 1.75) * fast.temperatureFactor;
        expect(fast.extent).toBeCloseTo(closedEsterHydrolysis(5 * progress, scale, 10).extent, 12);
        expect(slow.extent).toBeCloseTo(
          closedEsterHydrolysis(5 * progress, 0.18 * scale, 10).extent,
          12,
        );
        const equilibrium = closedEsterHydrolysis(80, 1, 10);
        expect(
          (equilibrium.ester * equilibrium.water) / (equilibrium.acid * equilibrium.alcohol),
        ).toBeCloseTo(4, 10);
        expect(fast.extent).toBeLessThanOrEqual(equilibrium.equilibrium);
      }
  });
  it('conserves ester and hydroxide for zero, finite, excessive and invalid base stocks', () => {
    for (const initial of [0, 0.01, 0.4, 1, 1.2, 3, 100, NaN, Infinity, -Infinity, -1])
      for (const p of [0, 0.5, 1, NaN, Infinity]) {
        const m = esterHydrolysis(p, 'base', 80, initial);
        expect(m.ester + m.alcohol).toBeCloseTo(1, 12);
        expect(m.ester + m.acetate).toBeCloseTo(1, 12);
        expect(m.hydroxide + m.acetate).toBeCloseTo(m.initialBase, 12);
        expect(m.extent).toBeLessThanOrEqual(Math.min(1, m.initialBase));
        for (const n of Object.values(m))
          if (typeof n === 'number') expect(Number.isFinite(n) && n >= 0).toBe(true);
        if (m.initialBase === 0) expect(m.extent).toBe(0);
      }
  });
});
