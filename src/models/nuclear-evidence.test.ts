import { describe, it, expect } from 'vitest';
import {
  nitrogenReaction,
  recoilCollision,
  neutronRecoil,
  recoilMass,
  recoilCandidate,
  fissionBalance,
  missingFragment,
  fragmentEvent,
  emulsionTracks,
  trackFocus,
  chainExpectation,
  chainAccount,
  chainEvent,
  nuclearDirector,
  nuclearVariant,
  NUCLEAR_CUTS,
} from './nuclear-evidence';
import { RECOIL_RECORDS, BARIUM_RECORDS, BLACKETT_RECORD } from './nuclear-evidence-records';
describe('nuclear evidence independent contracts', () => {
  it('conserves two-body momentum and energy including the negative Q', () => {
    for (const E of [2, 7.7, 10])
      for (const angle of [0, 20, 70, 120, 160]) {
        const s = nitrogenReaction(angle, E);
        expect(s.proton.x + s.oxygen.x).toBeCloseTo(Math.sqrt(8 * E), 11);
        expect(s.proton.y + s.oxygen.y).toBe(0);
        expect(s.protonEnergy + s.oxygenEnergy).toBeCloseTo(E - 1.191, 10);
      }
  });
  it('predicts independent equal-mass transfer and heavy-target return', () => {
    const H = recoilCollision(1, 1, 10),
      N = recoilCollision(1, 14, 10);
    expect(H.projectileSpeed).toBe(0);
    expect(H.targetSpeed).toBe(10);
    expect(N.projectileSpeed).toBeCloseTo(-26 / 3);
    expect(N.targetSpeed).toBeCloseTo(4 / 3);
    expect(N.fraction).toBeCloseTo(56 / 225);
    for (const m of [0.2, 1, 4])
      for (const M of [1, 4, 14]) {
        const s = recoilCollision(m, M, 1e7);
        expect(s.finalMomentum).toBeCloseTo(s.initialMomentum, 5);
        expect(s.finalEnergy / s.initialEnergy).toBeCloseTo(1, 12);
      }
  });
  it('inverts the textbook pair without replacing the original historical estimate', () => {
    const a = recoilMass(3.3e7, 4.4e6)!,
      b = recoilMass(3.7e7, 4.7e6)!;
    expect(a.mass).toBe(1);
    expect(b.mass).toBeCloseTo(28.8 / 32.3, 12);
    expect(recoilCandidate(1, 3.3e7).nitrogen).toBe(4.4e6);
    expect(recoilCandidate(1, 3.3e7).helium).toBe(13.2e6);
    expect(recoilMass(1, 1)).toBeNull();
    expect(recoilMass(14, 1)).toBeNull();
    expect(recoilMass(1, 0)).toBeNull();
  });
  it('rejects impossible mass-inference pairs and keeps all other accepted domains finite', () => {
    const inputs = [NaN, Infinity, -Infinity, -1, 0, Number.MAX_VALUE];
    for (const x of inputs) {
      expect(recoilMass(x, 0)).toBeNull();
      for (const o of [
        nitrogenReaction(x, x),
        recoilCollision(x, x, x),
        neutronRecoil(x, x),
        recoilCandidate(x, x),
        missingFragment(x, x),
        chainAccount(x, x),
        nuclearDirector(x, x, x),
      ]) {
        const numbers = (a: unknown): number[] =>
          typeof a === 'number'
            ? [a]
            : a && typeof a === 'object'
              ? Object.values(a).flatMap(numbers)
              : [];
        expect(numbers(o).every(Number.isFinite)).toBe(true);
      }
      expect(Number.isFinite(chainExpectation(x, x, x))).toBe(true);
    }
  });
  it('matches the printed 144Ba/89Kr ledger and predicts the missing fragment', () => {
    const s = fissionBalance();
    expect(s.output[0]!.a).toBe(144);
    expect(s.output[1]!.a).toBe(89);
    for (const k of ['a', 'z'] as const)
      expect(s.input.reduce((v, p) => v + p[k], 0)).toBe(s.output.reduce((v, p) => v + p[k], 0));
    expect(missingFragment()).toEqual({ a: 89, z: 36, bariumA: 144, neutrons: 3 });
    expect(missingFragment(144, 2).a).toBe(90);
  });
  it('fixed records are immutable and independent of candidate controls', () => {
    const before = JSON.stringify([RECOIL_RECORDS, BARIUM_RECORDS, BLACKETT_RECORD]);
    for (const m of [0.2, 1, 4]) recoilCandidate(m, 3.3e7);
    expect(JSON.stringify([RECOIL_RECORDS, BARIUM_RECORDS, BLACKETT_RECORD])).toBe(before);
    expect(Object.isFrozen(RECOIL_RECORDS.textbook)).toBe(true);
    expect(BLACKETT_RECORD.outgoingTracks).toBe(2);
  });
  it('tracks preserve their identity and distinguish projected crossing from common depth', () => {
    for (const count of [3, 4] as const) {
      const a = emulsionTracks(count),
        b = emulsionTracks(count, true);
      expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
      expect(a.map((x) => x.direction)).toEqual(b.map((x) => x.direction));
      expect(a.every((x) => x.origin.z === 0)).toBe(true);
      expect(b.at(-1)!.origin.z).toBe(1);
      expect(trackFocus(1, 0)).toBeLessThan(0.1);
      expect(trackFocus(1, 1)).toBe(1);
      const p = fragmentEvent(count);
      expect(p.reduce((v, p) => v + p.x, 0)).toBeCloseTo(0);
      expect(p.reduce((v, p) => v + p.y, 0)).toBeCloseTo(0);
    }
  });
  it('counts every selected neutron in one fate and only creates children after a fission', () => {
    for (const e of [0, 0.2, 1])
      for (const a of [0, 0.4, 1]) {
        const account = chainAccount(e, a);
        expect(account.escape + account.absorb + account.fission).toBeCloseTo(1);
        expect(account.k).toBeCloseTo(3 * account.fission);
        const start = chainEvent(e, a, 0),
          end = chainEvent(e, a, 1);
        expect(start.map((n) => n.id)).toEqual(end.map((n) => n.id));
        expect(start.every((n) => n.children.length === 0)).toBe(true);
        for (const n of end) expect(n.children.length).toBe(n.fate === 'fission' ? 3 : 0);
      }
  });
  it('stable expectation does not assert identical sampled fates', () => {
    const s = chainAccount(0.2, 7 / 15);
    expect(s.k).toBeCloseTo(1);
    expect(chainExpectation(s.k, 8)).toBeCloseTo(32);
    expect(new Set(chainEvent(0.2, 7 / 15, 1).map((x) => x.fate)).size).toBe(3);
  });
  it('six entry aliases initialize their intended apparatus', () => {
    for (const id of ['e1-chadwick-reference', 'e3-chadwick-neutron'])
      expect(nuclearVariant(id)).toBe('neutron');
    expect(nuclearVariant('e3-uranium-fission-discovery')).toBe('fission');
    expect(nuclearVariant('e3-uranium-multifragment-fission')).toBe('tracks');
    expect(nuclearVariant('e3-fermi-controlled-chain-reaction')).toBe('chain');
  });
  it('measured prediction reveal is seek-reversible and preceded by an unanswered hold', () => {
    for (const locale of ['zh', 'en'] as const) {
      const k = NUCLEAR_CUTS[locale];
      for (const t of [k.unknown, k.answer - 0.01, k.unknown]) {
        const s = nuclearDirector(5, 0, t, locale);
        expect(s.reveal).toBe(false);
        expect(s.progress).toBe(1);
      }
      expect(nuclearDirector(5, 0, k.answer, locale).reveal).toBe(true);
      expect(nuclearDirector(9, 0, k.equal - 0.01, locale).reveal).toBe(false);
      expect(nuclearDirector(9, 0, k.equal, locale).reveal).toBe(true);
    }
  });
  it('keeps spoken upper-bound bars visible and separates fixed mass evidence from the new prediction', () => {
    for (const locale of ['zh', 'en'] as const) {
      const k = NUCLEAR_CUTS[locale];
      expect(nuclearDirector(3, 0, k.inference, locale).view).toBe('inference');
      expect(nuclearDirector(3, 0, k.fit, locale).candidateMass).toBe(1);
      expect(nuclearDirector(3, 0, k.upper + 1, locale).view).toBe('collision');
      expect(nuclearDirector(3, 0, 24, locale)).toMatchObject({
        view: 'inference',
        stage: 2,
        reveal: false,
      });
      expect(nuclearDirector(3, 0, 26, locale).reveal).toBe(true);
    }
  });
  it('separates chemical comparison from later model while keeping the next fragment unknown', () => {
    for (const locale of ['zh', 'en'] as const) {
      const k = NUCLEAR_CUTS[locale];
      expect(nuclearDirector(4, 0, k.separation - 0.01, locale).stage).toBe(0);
      expect(nuclearDirector(4, 0, k.barium, locale)).toMatchObject({
        view: 'chemistry',
        reveal: true,
      });
      expect(nuclearDirector(4, 0, k.model, locale)).toMatchObject({
        view: 'channel',
        reveal: false,
      });
    }
  });
  it('retains the same track IDs through continuous focus and matches spoken polygon timing', () => {
    for (const locale of ['zh', 'en'] as const) {
      const k = NUCLEAR_CUTS[locale];
      const a = nuclearDirector(6, 0, k.depth, locale),
        b = nuclearDirector(6, 0, k.refocus, locale);
      expect(a.focus).toBe(0);
      expect(b.focus).toBe(1);
      expect(emulsionTracks(a.count, a.unrelated).map((x) => x.id)).toEqual(
        emulsionTracks(b.count, b.unrelated).map((x) => x.id),
      );
      expect(nuclearDirector(7, 0, k.polygon, locale).view).toBe('momentum');
      expect(nuclearDirector(7, 0, k.polygon - 0.01, locale).view).toBe('emulsion');
    }
  });
  it('times mean growth/decay and returns the same neutron histories when named', () => {
    for (const locale of ['zh', 'en'] as const) {
      const k = NUCLEAR_CUTS[locale],
        s = nuclearDirector(8, 0, k.below - 0.01, locale),
        d = nuclearDirector(8, 0, k.below, locale);
      expect(chainAccount(s.escape, s.absorb).k).toBeGreaterThan(1);
      expect(chainAccount(d.escape, d.absorb).k).toBeLessThan(1);
      const r = nuclearDirector(9, 0, k.histories, locale);
      expect(r.view).toBe('routes');
      expect(r.progress).toBe(1);
      expect(chainAccount(r.escape, r.absorb).k).toBeCloseTo(1);
    }
  });
});
