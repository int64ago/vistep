import { describe, it, expect } from 'vitest';
import {
  practicalNet,
  practicalTotals,
  PRACTICAL_REACTIONS,
  practicalFrame,
  practicalRecipe,
  practicalAcidAtoms,
  practicalIndicator,
  practicalFilm,
  practicalRoutes,
  ironPractical,
  ironPracticalDirector,
  IRON_PRACTICAL_CASES,
} from './chem-iron-practical';
describe('iron practical net evidence', () => {
  it('balances each independently specified net equation, including acid O/H and complex charge', () => {
    for (const r of PRACTICAL_REACTIONS)
      expect(practicalTotals(r.after)).toEqual(practicalTotals(r.before));
    expect(practicalTotals({ FeII: 5, MnO4: 1, Hplus: 8 })).toMatchObject({
      atoms: { Fe: 5, Mn: 1, O: 4, H: 8 },
      charge: 17,
    });
  });
  it('retains each element and charge throughout limited continuous net extents', () => {
    for (let c = 0; c < 7; c++)
      for (let preset = 0; preset < 3; preset++)
        for (let k = 0; k <= 50; k++) {
          const m = practicalNet(c, k / 50, preset);
          for (const el of Object.keys(m.before.atoms))
            expect(m.after.atoms[el]).toBeCloseTo(m.before.atoms[el]!, 11);
          expect(m.after.charge).toBeCloseTo(m.before.charge, 11);
          expect(Object.values(m.state).every((n) => n! >= -1e-12)).toBe(true);
        }
  });
  it('reproduces independent stoichiometric endpoints, not just implementation round trips', () => {
    expect(practicalNet(0).state).toMatchObject({ FeII: 1, Cu0: 1, Fe0: 0, CuII: 0 });
    expect(practicalNet(1).state).toMatchObject({ FeII: 2, CuII: 1, FeIII: 0 });
    expect(practicalNet(2).state).toMatchObject({ FeII: 2, I2: 1, Iminus: 1 });
    expect(practicalNet(3).state).toMatchObject({ Fe0: 1, ZnII: 1 });
    expect(practicalNet(4).state).toMatchObject({ FeIII: 5, MnII: 1, water: 4, Hplus: 0 });
    expect(practicalNet(6).state).toMatchObject({ FeII: 3, FeIII: 3, Fe0: 0 });
  });
  it('makes the last positive-test counterexample distinguish quantity from species', () => {
    expect(practicalNet(6, 1, 0).after.atoms.Fe).toBe(6);
    expect(practicalIndicator(6, 0, 1, true).red).toBe(true);
    expect(practicalNet(6, 1, 1).state.FeIII).toBe(0);
    expect(practicalIndicator(6, 1, 1, true).red).toBe(false);
    expect(practicalNet(6, 1, 2).state).toMatchObject({ FeII: 6, FeIII: 1 });
  });
  it('keeps starch/SCN tied to the appropriate product and permitted order', () => {
    expect(practicalIndicator(2, 0, 1, true).blue).toBe(true);
    expect(practicalIndicator(2, 2, 1, true).blue).toBe(false);
    expect(practicalIndicator(4, 1, 1, true)).toMatchObject({
      pending: true,
      test: false,
      red: false,
    });
    expect(practicalIndicator(4, 0, 0.9, true).test).toBe(false);
    expect(practicalIndicator(4, 0, 1, true).red).toBe(true);
    expect(practicalIndicator(5, 2, 1, true).red).toBe(false);
  });
  it('never loses an atom or duplicates IDs while credit/phase paths move', () => {
    for (let c = 0; c < 7; c++)
      for (let preset = 0; preset < 3; preset++)
        for (const width of [248, 268, 660])
          for (let k = 0; k <= 100; k++) {
            const a = practicalFrame(c, k / 100, preset, width),
              start = practicalFrame(c, 0, preset, width);
            expect(a.actors.map((x) => x.id)).toEqual(start.actors.map((x) => x.id));
            expect(new Set(a.actors.map((x) => x.id)).size).toBe(a.actors.length);
            expect(a.charge).toBe(a.initialCharge);
            expect(a.ironPhases.solid + a.ironPhases.water + a.ironPhases.transfer).toBe(
              a.net.before.atoms.Fe,
            );
            expect(
              a.actors.every(
                (x) =>
                  Number.isFinite(x.x) &&
                  Number.isFinite(x.y) &&
                  x.x >= 8 &&
                  x.x <= width - 8 &&
                  x.y >= 0 &&
                  x.y <= 225,
              ),
            ).toBe(true);
            expect(a.credits.map((e) => e.id)).toEqual(start.credits.map((e) => e.id));
          }
  });
  it('derives departed/received credit inventory and actor state from the same boundaries', () => {
    const before = practicalFrame(6, 0.15999),
      flight = practicalFrame(6, 0.3),
      arrived = practicalFrame(6, 0.68);
    expect(before.credits.every((e) => e.phase === 'donor')).toBe(true);
    expect(flight.credits.every((e) => e.phase === 'transit')).toBe(true);
    expect(flight.creditCharge).toBe(-2);
    expect(flight.actors.filter((a) => a.receives).every((a) => a.formalCharge === 3)).toBe(true);
    expect(arrived.credits.every((e) => e.phase === 'received')).toBe(true);
    expect(arrived.actors.filter((a) => a.element === 'Fe' && a.formalCharge === 2)).toHaveLength(
      3,
    );
    expect(arrived.actors.filter((a) => a.element === 'Fe' && a.formalCharge === 3)).toHaveLength(
      3,
    );
  });
  it('represents the MnO4 acceptor packet rather than making a naked Mn7+ ion', () => {
    const before = practicalFrame(4, 0.15),
      flight = practicalFrame(4, 0.3),
      after = practicalFrame(4, 0.8);
    expect(before.acceptorCharge).toBe(7);
    expect(flight.acceptorCharge).toBe(7);
    expect(flight.creditCharge).toBe(-5);
    expect(after.acceptorCharge).toBe(2);
    expect(after.actors.filter((a) => a.formalCharge === 3)).toHaveLength(5);
    expect(after.charge).toBe(17);
  });
  it('keeps 13 Mn/O/H identities and exact endpoints across net atom views', () => {
    for (const width of [248, 268, 660])
      for (let i = 0; i <= 100; i++) {
        const a = practicalAcidAtoms(i / 100, width);
        expect(a.atoms).toHaveLength(13);
        expect(new Set(a.atoms.map((x) => x.id)).size).toBe(13);
        expect(a.atoms.filter((x) => x.element === 'O')).toHaveLength(4);
        expect(a.atoms.filter((x) => x.element === 'H')).toHaveLength(8);
        expect(a.atoms.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y))).toBe(true);
      }
    const end = practicalAcidAtoms(1);
    for (let i = 0; i < 4; i++)
      expect(
        end.atoms
          .filter((a) => a.group === `water${i}`)
          .map((a) => a.element)
          .sort(),
      ).toEqual(['H', 'H', 'O']);
  });
  it('keeps the thirteen net-allocation identities separated throughout the moving close view', () => {
    const radius = { Mn: 19, O: 13, H: 10 };
    for (const width of [248, 278, 390, 720])
      for (let frame = 0; frame <= 100; frame++) {
        const atoms = practicalAcidAtoms(frame / 100, width).atoms;
        for (let i = 0; i < atoms.length; i++)
          for (let j = i + 1; j < atoms.length; j++) {
            const a = atoms[i]!,
              b = atoms[j]!;
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
              radius[a.element] + radius[b.element],
            );
          }
      }
  });
  it('has no unsupported normal-pH inference from an absent acid supply', () => {
    const m = practicalNet(4, 1, 0, { FeII: 5, MnO4: 1, Hplus: 0 });
    expect(m.omittedAcidPath).toBe(true);
    expect(m.extent).toBe(0);
  });
  it('reconstructs prediction gates and never prepopulates a future route', () => {
    for (const c of [1, 3, 6]) {
      expect(practicalFilm(c, 0).prediction).toBe(true);
      expect(practicalFilm(c, 0).progress).toBe(0);
      expect(practicalRoutes(c, false)).toHaveLength(c);
    }
    expect(practicalRoutes(5, true).at(-1)).toMatchObject({ from: 3, to: 3, kind: 'coordination' });
    expect(practicalFilm(4, 18).test).toBe(false);
    expect(practicalFilm(4, 20).test).toBe(true);
    expect(practicalRoutes(0, true)[0]?.partner).toBe('Cu²⁺');
  });
  it('matches recorded words: Fe reaches water while the Cu acceptor still awaits its credits', () => {
    for (const [locale, time] of [
      ['zh', 9.3],
      ['en', 10.05],
    ] as const) {
      const d = practicalFilm(0, time, locale);
      const frame = practicalFrame(0, d.progress, 0, 268, d.motion);
      expect(frame.actors.find((a) => a.element === 'Fe')).toMatchObject({
        formalCharge: 2,
        phase: 'water',
      });
      expect(frame.actors.find((a) => a.element === 'Cu')).toMatchObject({
        formalCharge: 2,
        phase: 'water',
      });
      expect(frame.creditCharge).toBe(-2);
      expect(frame.charge).toBe(frame.initialCharge);
    }
  });
  it('keeps the predicted result hidden until the measured question is finished in each language', () => {
    for (const [locale, zinc, limited] of [
      ['zh', 7.0, 7.0],
      ['en', 6.3, 9.25],
    ] as const) {
      expect(practicalFilm(3, zinc, locale).prediction).toBe(true);
      expect(practicalFilm(6, limited, locale).prediction).toBe(true);
      expect(practicalFilm(6, limited, locale).test).toBe(false);
      expect(practicalFilm(5, 11.8, locale).reveal).toBe(false);
      expect(practicalFilm(5, 12.1, locale).reveal).toBe(true);
    }
  });
  it('shows the complete acid O/H net before the named follow-up reagent, then reveals the route', () => {
    for (const [locale, netEnd, beforeTest, test, map] of [
      ['zh', 16.5, 19.1, 19.3, 21.5],
      ['en', 17.55, 20.4, 20.6, 22.7],
    ] as const) {
      const d = practicalFilm(4, netEnd, locale);
      expect(d.shot).toBe('acid');
      expect(
        practicalAcidAtoms(d.progress).atoms.filter((a) => a.group.startsWith('water')),
      ).toHaveLength(12);
      expect(practicalFilm(4, beforeTest, locale).test).toBe(false);
      expect(practicalFilm(4, test, locale).test).toBe(true);
      expect(practicalFilm(4, map, locale).shot).toBe('map');
    }
  });
  it('keeps identities and total charge under independently scheduled measured spatial paths', () => {
    for (const locale of ['zh', 'en'])
      for (let chapter = 0; chapter < 7; chapter++)
        for (let t = 0; t <= 38; t += 0.1) {
          const d = practicalFilm(chapter, t, locale);
          const m = practicalFrame(chapter, d.progress, 0, 268, d.motion);
          expect(m.charge).toBe(m.initialCharge);
          expect(new Set(m.actors.map((a) => a.id)).size).toBe(m.actors.length);
          for (const a of m.actors) {
            expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
            if (!a.changed) {
              expect(a.x).toBe(a.from.x);
              expect(a.y).toBe(a.from.y);
            }
          }
        }
  });
  it('guards nonfinite and out-of-domain requests without leaking invalid chapter states', () => {
    for (const n of [NaN, Infinity, -Infinity, -20, 99])
      for (const fn of [
        () => practicalFrame(n, n, n, n),
        () => practicalNet(n, n, n),
        () => practicalFilm(n, n),
        () => practicalAcidAtoms(n, n),
      ]) {
        const value = fn();
        expect(JSON.stringify(value)).not.toMatch(/NaN|Infinity/);
        expect(JSON.stringify(value)).not.toContain('null');
      }
    expect(ironPracticalDirector(0.5, NaN).kind).toBe('iron-copper');
  });
  it('retains finite legacy consumers and their stoichiometric limits', () => {
    for (const kind of IRON_PRACTICAL_CASES)
      for (const p of [NaN, 0, 0.4, 1])
        for (const a of [NaN, 0, 0.3, 1, 2]) {
          const m = ironPractical(kind, p, a);
          expect(m.fe0 + m.fe2 + m.fe3).toBeCloseTo(m.initialIron);
          expect(m.iodide + 2 * m.iodine).toBeCloseTo(m.initialIodine);
          expect(
            Object.values(m)
              .filter((x) => typeof x === 'number')
              .every(Number.isFinite),
          ).toBe(true);
        }
    expect(ironPractical('ferric-copper').cu2).toBe(0.5);
    expect(ironPractical('iron-test').fe2).toBe(1.5);
  });
  it('returns fresh recipe objects so exploration cannot mutate recorded inputs', () => {
    const a = practicalRecipe(6);
    a.FeIII = 0;
    expect(practicalRecipe(6).FeIII).toBe(5);
  });
});
