import { describe, it, expect } from 'vitest';
import {
  chlorineGasTrain,
  pipePosition,
  chlorineDiscoveryDirector,
  chlorineFilm,
  chlorineHistoryClaim,
  CHLORINE_HISTORY,
  oxygenSourceAccount,
  oxygenSourceAtoms,
  hydrogenChlorineAtoms,
  chlorineTrainGeometry,
} from './chem-chlorine-discovery';
describe('historical evidence and modern counterexample', () => {
  it('preserves source records when changing a hypothesis or seeking', () => {
    const records = JSON.stringify(CHLORINE_HISTORY);
    for (const claim of ['transferable-oxygen', 'alternative'] as const) {
      expect(chlorineHistoryClaim(claim).records).toBe(CHLORINE_HISTORY);
      expect(chlorineHistoryClaim(claim).provesElementAlone).toBe(false);
    }
    for (const chapter of [0, 2, 1, 0]) chlorineFilm(chapter, 25);
    expect(JSON.stringify(CHLORINE_HISTORY)).toBe(records);
    expect(Object.isFrozen(CHLORINE_HISTORY)).toBe(true);
    expect(CHLORINE_HISTORY.every(Object.isFrozen)).toBe(true);
    expect(CHLORINE_HISTORY[3].observation).toContain('little condensation');
  });
  it('independently balances PbO + 2 HCl with stoichiometric and limiting cases', () => {
    for (const [oxide, acid, water, expected] of [
      [1, 2, 0, 1],
      [2, 2, 0, 1],
      [1, 6, 0, 1],
      [0, 2, 0, 0],
      [1, 0, 0, 0],
      [0, 2, 1, 0],
    ]) {
      for (const p of [0, 0.17, 0.6, 1]) {
        const m = oxygenSourceAccount(oxide, acid, water, p);
        expect(m.netNewWater).toBeCloseTo(expected * p);
        expect(m.atoms).toEqual(m.initialAtoms);
        expect(m.atoms).toEqual({ Pb: oxide, O: oxide + water, H: acid + 2 * water, Cl: acid });
        expect(m.species.preexistingWater).toBe(water);
      }
    }
  });
  it('does not turn initial water into evidence for newly generated water', () => {
    const m = oxygenSourceAccount(0, 2, 1);
    expect(m.netNewWater).toBe(0);
    expect(m.species.preexistingWater).toBe(1);
    expect(m.oxygenFromOxide).toBe(0);
    expect(m.oxygenFromExternalWater).toBe(1);
  });
  it('keeps six atomic identities throughout allocation and only removes actual omitted inputs', () => {
    const start = oxygenSourceAtoms(0).map((a) => a.id);
    for (const p of [0, 0.1, 0.4, 0.75, 1, 0.2]) {
      const a = oxygenSourceAtoms(p, 258);
      expect(a.map((x) => x.id)).toEqual(start);
      expect(a.filter((x) => x.element === 'O')).toHaveLength(1);
      expect(a.filter((x) => x.element === 'H')).toHaveLength(2);
      expect(a.filter((x) => x.element === 'Cl')).toHaveLength(2);
      expect(a.filter((x) => x.element === 'Pb')).toHaveLength(1);
      expect(a.every((x) => Number.isFinite(x.x + x.y) && x.x >= 16 && x.x <= 242)).toBe(true);
    }
    const dry = oxygenSourceAtoms(1, 258, false);
    expect(dry).toHaveLength(4);
    expect(dry.some((a) => a.element === 'O')).toBe(false);
    const wet = oxygenSourceAtoms(1, 258, false, true);
    expect(wet.filter((a) => a.origin === 'external')).toHaveLength(3);
    expect(wet.find((a) => a.element === 'O')?.origin).toBe('external');
  });
  it('keeps individually counted atoms visually separated throughout phone and desktop allocations', () => {
    for (const w of [240, 258, 390, 720])
      for (let i = 0; i <= 200; i++) {
        const atoms = oxygenSourceAtoms(i / 200, w);
        for (let j = 0; j < atoms.length; j++)
          for (let k = j + 1; k < atoms.length; k++)
            expect(Math.hypot(atoms[j].x - atoms[k].x, atoms[j].y - atoms[k].y)).toBeGreaterThan(
              32,
            );
        expect(atoms.every((a) => a.y >= 16 && a.y <= 150)).toBe(true);
      }
  });
  it('shows only two H and two Cl in the later modern combination overlay', () => {
    const ids = hydrogenChlorineAtoms(0).map((a) => a.id);
    for (const p of [0, 0.25, 0.8, 1]) {
      const a = hydrogenChlorineAtoms(p, 258);
      expect(a.map((x) => x.id)).toEqual(ids);
      expect(a.filter((x) => x.element === 'H')).toHaveLength(2);
      expect(a.filter((x) => x.element === 'Cl')).toHaveLength(2);
    }
  });
  it('holds a distinct prediction before the conservation answer', () => {
    expect(chlorineFilm(1, 32).oxygenBeat).toBe('predict');
    expect(chlorineFilm(1, 39).oxygenBeat).toBe('reveal');
    expect(chlorineFilm(2, 20).interpretationBeat).toBe('judgment');
    expect(chlorineFilm(2, 30).interpretationBeat).toBe('modern');
  });
});
describe('finite collection and path geometry', () => {
  it('conserves chlorine independently in collected, captured and uncaptured fractions', () => {
    for (const q of [0, 0.1, 1, 4])
      for (const cap of [0, 1, 8]) {
        const m = chlorineGasTrain(q, cap);
        expect(m.collected + m.absorbed + m.unabsorbed).toBeCloseTo(q);
        expect(m.chlorineAtoms).toBeCloseTo(2 * q);
        expect(m.remainingOH + 2 * m.absorbed).toBeCloseTo(cap);
      }
  });
  it('saturates the collector but not the total material balance', () => {
    const m = chlorineGasTrain(4);
    expect(m.collected).toBeCloseTo(1 - Math.exp(-4));
    expect(m.tail).toBeGreaterThan(3);
    expect(m.unabsorbed).toBe(0);
    const scarce = chlorineGasTrain(4, 1);
    expect(scarce.absorbed).toBe(0.5);
    expect(scarce.remainingOH).toBe(0);
    expect(scarce.chloride).toBe(scarce.hypochlorite);
    expect(scarce.unabsorbed).toBeGreaterThan(2.5);
  });
  it('uses the same physical tube vertices for paths and marker arrival', () => {
    expect(
      pipePosition(
        [
          [0, 0],
          [30, 0],
          [30, 40],
        ],
        0.5,
      ),
    ).toEqual({ x: 30, y: 5 });
    for (const width of [258, 390, 720]) {
      const g = chlorineTrainGeometry(width),
        b = g.centres[1],
        c = g.centres[2];
      expect(pipePosition(g.generator, 1)).toEqual({ x: b - 12, y: 144 });
      expect(pipePosition(g.tail, 0)).toEqual({ x: b + 12, y: 76 });
      expect(pipePosition(g.tail, 1)).toEqual({ x: c, y: 142 });
      expect(g.generatorPath).toContain(`${b - 12} 144`);
      expect(g.tailPath).toContain(`${c} 142`);
    }
    expect(chlorineDiscoveryDirector(4, 0).throughput).toBe(2);
  });
  it('follows measured language-specific word events without advancing a held prediction', () => {
    for (const [locale, start, end, question, answer, judgment, modern, hydrogenEnd] of [
      ['zh', 16.2, 20.25, 24.95, 33.09, 18.5, 23.55, 29.15],
      ['en', 18.05, 23.3, 28.1, 34.37, 20.6, 25.05, 31.8],
    ] as const) {
      expect(chlorineFilm(1, start, locale).oxygenProgress).toBe(0);
      expect(chlorineFilm(1, end, locale).oxygenProgress).toBe(1);
      expect(chlorineFilm(1, question + 0.1, locale).oxygenBeat).toBe('predict');
      expect(chlorineFilm(1, answer - 0.01, locale).oxygenBeat).toBe('predict');
      expect(chlorineFilm(1, answer, locale).oxygenBeat).toBe('reveal');
      expect(chlorineFilm(2, judgment - 0.01, locale).interpretationBeat).toBe('evidence');
      expect(chlorineFilm(2, judgment, locale).interpretationBeat).toBe('judgment');
      expect(chlorineFilm(2, modern, locale).interpretationBeat).toBe('modern');
      expect(chlorineFilm(2, hydrogenEnd, locale).hydrogenProgress).toBe(1);
      expect(chlorineFilm(3, 31, locale).throughput).toBe(chlorineFilm(4, 0, locale).throughput);
    }
  });
  it('guards nonfinite, negative and degenerate inputs without creating matter or NaN paths', () => {
    for (const bad of [NaN, Infinity, -Infinity, -10]) {
      for (const m of [chlorineGasTrain(bad, bad), oxygenSourceAccount(bad, bad, bad, bad)])
        expect(JSON.stringify(m)).not.toMatch(/null|NaN|Infinity/);
      const d = chlorineFilm(bad, bad);
      expect(d.progress).toBe(0);
      expect(oxygenSourceAtoms(bad, bad).every((a) => Number.isFinite(a.x + a.y))).toBe(true);
      expect(
        pipePosition(
          [
            [0, 0],
            [10, 10],
          ],
          bad,
        ),
      ).toEqual({ x: 0, y: 0 });
    }
    expect(pipePosition([], 0.4)).toEqual({ x: 0, y: 0 });
    expect(pipePosition([[3, 7]], 1)).toEqual({ x: 3, y: 7 });
    expect(
      pipePosition(
        [
          [3, 7],
          [3, 7],
        ],
        0.7,
      ),
    ).toEqual({ x: 3, y: 7 });
    expect(
      pipePosition(
        [
          [NaN, 1],
          [3, 7],
        ],
        0.7,
      ),
    ).toEqual({ x: 3, y: 7 });
  });
});
