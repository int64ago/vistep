import { describe, it, expect } from 'vitest';
import { ironSteam, ironSteamDirector, steamPoint } from './chem-iron-steam';
describe('steam over hot iron', () => {
  it('conserves total mass and 3:4:1:4 stoichiometry', () => {
    for (const p of [0, 0.3, 1]) {
      const m = ironSteam(1, 0.5, p);
      expect(m.massAfter).toBeCloseTo(m.massBefore, 12);
      expect(m.hydrogen).toBeCloseTo(4 * m.oxide);
      expect(m.ironLeft + 3 * m.oxide).toBeCloseTo(1 / 55.845);
    }
  });
  it('gives the independent one-gram iron yield and respects water limitation', () => {
    const m = ironSteam();
    expect(m.oxideGrams).toBeCloseTo((3 * 55.845 + 4 * 15.999) / (3 * 55.845));
    expect(m.hydrogen).toBeCloseTo(4 / (3 * 55.845));
    expect(ironSteam(1, 0.05).hydrogen).toBeCloseTo(0.05 / (2 * 1.008 + 15.999));
  });
  it('requires both reactants and the demonstrated hot condition', () => {
    expect(ironSteam(1, 0.5, 1, false).hydrogen).toBe(0);
    expect(ironSteam(0, 0.5).hydrogen).toBe(0);
    expect(ironSteam(1, 0).hydrogen).toBe(0);
  });
  it('rebuilds gas evidence and keeps tube paths connected', () => {
    expect(ironSteamDirector(2, 0)).toMatchObject({ test: true, extent: 1, hot: true });
    expect(
      steamPoint(
        [
          [0, 0],
          [20, 0],
          [20, 30],
        ],
        0.5,
      ),
    ).toEqual({ x: 20, y: 5 });
  });
});

import {
  ironSteamAtoms,
  ironSteamMassFrame,
  ironSteamPrediction,
  ironSteamFilm,
} from './chem-iron-steam';
describe('net atom flow and complete material boundaries', () => {
  it('keeps all fifteen identities and counts while oxygen enters the solid and hydrogen pairs', () => {
    for (const width of [250, 258, 390, 760])
      for (let i = 0; i <= 100; i++) {
        const s = ironSteamAtoms(i / 100, width);
        expect(new Set(s.atoms.map((a) => a.id)).size).toBe(15);
        for (let j = 0; j < s.atoms.length; j++)
          for (let k = j + 1; k < s.atoms.length; k++) {
            const a = s.atoms[j],
              b = s.atoms[k];
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r + 1.9);
          }
        for (const [element, n] of Object.entries({ Fe: 3, O: 4, H: 8 }))
          expect(s.atoms.filter((a) => a.element === element)).toHaveLength(n);
        expect(
          s.atoms.every(
            (a) => a.x - a.r >= 0 && a.x + a.r <= s.width && a.y - a.r >= 0 && a.y + a.r < 208,
          ),
        ).toBe(true);
      }
    const end = ironSteamAtoms(1);
    expect(end.atoms.filter((a) => a.element === 'O').every((a) => a.x < end.solidRight)).toBe(
      true,
    );
    expect(end.bonds.filter((b) => b.opacity === 1 && b.from.startsWith('H'))).toHaveLength(4);
    expect(end.bonds.filter((b) => b.from.startsWith('O')).every((b) => b.opacity === 0)).toBe(
      true,
    );
  });
  it('includes material in transfer instead of counting it in both water and the solid', () => {
    for (let i = 0; i <= 200; i++) {
      const m = ironSteamMassFrame(i / 200);
      expect(m.total).toBeCloseTo(1.5, 12);
      expect(m.solid).toBeGreaterThanOrEqual(1);
      expect(m.transfer).toBeGreaterThanOrEqual(0);
    }
    expect(ironSteamMassFrame(0.249).transfer).toBe(0);
    expect(ironSteamMassFrame(0.25).transfer).toBeCloseTo((4 * 18.015) / (3 * 55.845));
    expect(ironSteamMassFrame(0.749).solid).toBe(1);
    expect(ironSteamMassFrame(0.75).solid).toBeCloseTo(1 + (4 * 15.999) / (3 * 55.845));
  });
  it('independently disproves doubling yield with .3→.6g water and 1g iron', () => {
    const { A, B } = ironSteamPrediction();
    expect(A.hydrogen * 1000).toBeCloseTo((0.3 / 18.015) * 1000, 8);
    expect(B.hydrogen * 1000).toBeCloseTo((4 / (3 * 55.845)) * 1000, 8);
    expect(A.limitingReactant).toBe('water');
    expect(B.limitingReactant).toBe('iron');
    expect(B.hydrogen / A.hydrogen).toBeCloseTo(1.4337302653, 8);
    expect(A.ironLeftGrams).toBeCloseTo(0.302518734388, 10);
    expect(B.waterLeftGrams).toBeCloseTo(0.1698809204047, 10);
  });
  it('distinguishes total solid from oxide when iron remains', () => {
    const m = ironSteam(1, 0.1);
    expect(m.solidTotalGrams).toBeCloseTo(1 + m.oxygenInSolidGrams, 12);
    expect(m.solidTotalGrams).toBeGreaterThan(m.oxideGrams);
  });
  it('keeps all numeric public outputs finite for nonfinite and out-of-range inputs', () => {
    for (const x of [NaN, Infinity, -Infinity, -20, 20]) {
      for (const m of [ironSteam(x, x, x), ironSteamMassFrame(x, x), ironSteamAtoms(x, x)]) {
        const numbers = JSON.stringify(m);
        expect(numbers).not.toContain('null');
      }
      expect(steamPoint([], x)).toEqual({ x: 0, y: 0 });
      expect(
        steamPoint(
          [
            [1, 2],
            [1, 2],
          ],
          x,
        ),
      ).toEqual({ x: 1, y: 2 });
    }
  });
  it('withholds prediction before reveal and reconstructs a reverse seek', () => {
    expect(ironSteamFilm(4, 17.729).reveal).toBe(false);
    expect(ironSteamFilm(4, 17.73).reveal).toBe(true);
    expect(ironSteamFilm(4, 5).prediction).toBe(0);
    expect(ironSteamFilm(4, 5).reveal).toBe(false);
  });
  it('follows measured bilingual references rather than the provisional whole-chapter proportion', () => {
    for (const locale of ['zh', 'en'] as const) {
      const first = ironSteamFilm(1, locale === 'en' ? 13.8 : 12.7, locale);
      expect(first.atoms).toBeCloseTo(0.25);
      expect(first.pairing).toBe(0);
      const oxygenEnd = ironSteamFilm(1, locale === 'en' ? 17 : 15.1, locale);
      expect(oxygenEnd.atoms).toBe(1);
      expect(oxygenEnd.pairing).toBe(0);
      const end = ironSteamFilm(1, locale === 'en' ? 20.1 : 17.7, locale);
      expect(ironSteamAtoms(end.atoms, 258, end.pairing).complete).toBe(true);
      expect(ironSteamMassFrame(ironSteamFilm(2, 7.8, locale).mass).solid).toBeCloseTo(
        1.3819858537,
      );
      const aOnly = ironSteamFilm(4, locale === 'en' ? 15 : 13, locale);
      expect(aOnly.prediction).toBe(1);
      expect(aOnly.predictionB).toBe(0);
      expect(aOnly.reveal).toBe(false);
      expect(ironSteamFilm(4, locale === 'en' ? 20.36 : 17.72, locale).reveal).toBe(false);
      expect(ironSteamFilm(4, locale === 'en' ? 20.37 : 17.73, locale).reveal).toBe(true);
      expect(ironSteamFilm(3, locale === 'en' ? 14.37 : 13.63, locale).evidence).toBe('combined');
    }
  });
  it('keeps measured oxygen and later hydrogen reading passes finite, separate and collision-free', () => {
    for (const locale of ['zh', 'en'] as const)
      for (const width of [258, 760])
        for (let time = 0; time <= 22; time += 0.1) {
          const d = ironSteamFilm(1, time, locale),
            s = ironSteamAtoms(d.atoms, width, d.pairing);
          expect(new Set(s.atoms.map((a) => a.id)).size).toBe(15);
          for (let j = 0; j < s.atoms.length; j++)
            for (let k = j + 1; k < s.atoms.length; k++) {
              const a = s.atoms[j],
                b = s.atoms[k];
              expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r + 1.9);
            }
          if (d.pairing === 0)
            expect(
              s.bonds.filter((b) => b.from.startsWith('H')).every((b) => b.opacity === 0),
            ).toBe(true);
        }
    expect(ironSteamPrediction(1, 0.3, 0.6, false, 0).B.hydrogen).toBe(0);
  });
});
