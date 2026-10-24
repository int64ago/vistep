import { describe, it, expect } from 'vitest';
import {
  copperAlcoholCycle,
  dichromateAlcohol,
  alcoholOxidationDirector,
  ethanolAtomAccount,
} from './chem-alcohol-oxidation';
describe('ethanol oxidation accounts', () => {
  it('preserves copper while oxygen transfers into oxide and water', () => {
    for (const air of [true, false])
      for (const ethanol of [true, false])
        for (let t = 0; t <= 4; t += 0.03125) {
          const m = copperAlcoholCycle(t, air, ethanol);
          expect(m.copper + m.oxide).toBeCloseTo(1);
          expect(m.oxide + m.water).toBeCloseTo(2 * m.oxygen);
          expect(m.aldehyde).toBeCloseTo(m.water);
          expect(m.oxide).toBeGreaterThanOrEqual(0);
        }
  });
  it('repeats the copper cycle and distinguishes missing reactants', () => {
    expect(copperAlcoholCycle(3).aldehyde).toBe(3);
    expect(copperAlcoholCycle(3).copper).toBe(1);
    expect(copperAlcoholCycle(3, false).aldehyde).toBe(0);
    expect(copperAlcoholCycle(3, true, false).oxide).toBe(1);
    expect(copperAlcoholCycle(3, true, false).aldehyde).toBe(0);
  });
  it('balances carbon, hydrogen, oxygen, chromium and charge for acid oxidation', () => {
    for (const e of [0, 1, 3, 6])
      for (const d of [0, 1, 2, 4])
        for (const h of [0, 8, 16, 32])
          for (const p of [0, 0.3, 1]) {
            const m = dichromateAlcohol(p, e, d, h);
            expect(2 * m.ethanol + 2 * m.aceticAcid).toBeCloseTo(2 * e);
            expect(6 * m.ethanol + 4 * m.aceticAcid + m.acid + 2 * m.water).toBeCloseTo(6 * e + h);
            expect(m.ethanol + 7 * m.dichromate + 2 * m.aceticAcid + m.water).toBeCloseTo(
              e + 7 * d,
            );
            expect(2 * m.dichromate + m.chromiumIII).toBeCloseTo(2 * d);
            expect(-2 * m.dichromate + m.acid + 3 * m.chromiumIII).toBeCloseTo(-2 * d + h);
            expect(m.electrons).toBeCloseTo(m.aceticAcid * 4);
          }
  });
  it('limits the final state by oxidant, alcohol or acid and retains excess colour', () => {
    expect(dichromateAlcohol(1, 3, 2).aceticAcid).toBe(3);
    expect(dichromateAlcohol(1, 1, 2).dichromate).toBeCloseTo(4 / 3);
    expect(dichromateAlcohol(1, 3, 2, 8).aceticAcid).toBe(1.5);
    expect(dichromateAlcohol(NaN).extent).toBe(0);
  });
  it('seeks each observation independently', () => {
    expect(alcoholOxidationDirector(0, 1).cycleTime).toBeCloseTo(0.45);
    expect(alcoholOxidationDirector(1, 1).cycleTime).toBe(1);
    expect(alcoholOxidationDirector(2, 0.4).cycleTime).toBe(3);
    expect(alcoholOxidationDirector(4, 0).oxidationProgress).toBe(0);
  });
});

describe('finite oxide inventory and formal atom account', () => {
  it('a preoxidized coil supplies one finite turn without fresh air', () => {
    expect(copperAlcoholCycle(0, false, true, 1).oxide).toBe(1);
    expect(copperAlcoholCycle(1, false, true, 1).aldehyde).toBe(1);
    expect(copperAlcoholCycle(4, false, true, 1).aldehyde).toBe(1);
    expect(copperAlcoholCycle(4, false, true, 0).aldehyde).toBe(0);
    expect(copperAlcoholCycle(4, true, true, 1).aldehyde).toBe(4);
    expect(copperAlcoholCycle(4, false, true, 0.4).aldehyde).toBeCloseTo(0.4);
  });
  it('balances initial plus incoming oxygen and both electron ledgers over finite inventories', () => {
    for (const initial of [0, 0.4, 1])
      for (const air of [true, false])
        for (const stock of [0, 0.3, 1, 4])
          for (let t = 0; t <= 4; t += 0.0625) {
            const m = copperAlcoholCycle(t, air, true, initial, stock);
            expect(m.oxide + m.water).toBeCloseTo(initial + 2 * m.oxygen);
            expect(m.ethanolRemaining + m.aldehyde).toBeCloseTo(stock);
            expect(m.copper + m.oxide).toBeCloseTo(1);
            expect(2 * (m.oxide - initial)).toBeCloseTo(m.electronsToOxygen - m.electronsToCopper);
            expect(m.aldehyde).toBeLessThanOrEqual(stock + 1e-12);
          }
  });
  it('sanitizes nonfinite and out-of-range controls', () => {
    for (const x of [NaN, Infinity, -Infinity, -10, 100]) {
      const m = copperAlcoholCycle(x, true, true, x, x);
      expect(
        Object.values(m)
          .filter((v) => typeof v === 'number')
          .every(Number.isFinite),
      ).toBe(true);
      expect(m.oxide).toBeGreaterThanOrEqual(0);
      expect(m.oxide).toBeLessThanOrEqual(1);
      const a = ethanolAtomAccount(x);
      expect(a.atoms.every((v) => Number.isFinite(v.x + v.y))).toBe(true);
    }
  });
  it('keeps ethanol oxygen and retained hydrogen fixed while two selected H reach the same water O', () => {
    const first = ethanolAtomAccount(0),
      last = ethanolAtomAccount(1);
    expect(first.atoms.map((x) => x.id)).toEqual(last.atoms.map((x) => x.id));
    for (const id of ['O-ethanol', 'C-methyl', 'C-alpha', 'H-alpha-retained'])
      expect(first.atoms.find((x) => x.id === id)).toEqual(last.atoms.find((x) => x.id === id));
    expect(last.finalCarbonOxidation - first.initialCarbonOxidation).toBe(last.electronEquivalents);
    expect(first.initialCopperOxidation - last.finalCopperOxidation).toBe(last.electronEquivalents);
    const o = last.atoms.find((x) => x.id === 'O-oxide')!;
    for (const id of ['H-alpha-removed', 'H-hydroxyl']) {
      const h = last.atoms.find((x) => x.id === id)!;
      expect(Math.hypot(h.x - o.x, h.y - o.y)).toBeCloseTo(Math.hypot(40, 25));
    }
  });
  it('hides both predictions before any amount is revealed, with deterministic seeks', () => {
    for (const chapter of [2, 5]) {
      const middle = alcoholOxidationDirector(chapter, chapter === 2 ? 27 / 48 : 26 / 45);
      expect(middle.shot).toBe('prediction');
      expect(middle.answer).toBe(false);
      const end = alcoholOxidationDirector(chapter, 1);
      expect(end.answer).toBe(true);
      expect(alcoholOxidationDirector(chapter, middle.progress)).toEqual(middle);
    }
  });
});

describe('measured bilingual director contract', () => {
  it('finishes one stored-oxygen turn at the spoken unit and never grows after oxygen runs out', () => {
    for (const [locale, answer, one] of [
      ['zh', 29.55, 31.21],
      ['en', 29.17, 31.11],
    ] as const) {
      const at = (t: number) => alcoholOxidationDirector(2, t / 48.5, locale);
      expect(at(answer - 0.1).answer).toBe(false);
      expect(at(one + 0.01).answer).toBe(true);
      for (const t of [one, one + 3, 48.5]) {
        const d = at(t),
          m = copperAlcoholCycle(d.cycleTime, d.air, true, d.initialOxide, d.ethanolUnits);
        expect(m.aldehyde).toBe(1);
        expect(m.oxide).toBe(0);
        expect(m.copper).toBe(1);
      }
    }
  });
  it('keeps the electron account through its spoken limitation, then moves the same atoms', () => {
    for (const [locale, cut, move, end] of [
      ['zh', 16.39, 19.93, 26.85],
      ['en', 18.69, 23.85, 31.75],
    ] as const) {
      const at = (t: number) => alcoholOxidationDirector(3, t / 42, locale);
      expect(at(cut - 0.05).shot).toBe('electrons');
      expect(at(cut + 0.05).shot).toBe('atoms');
      expect(at(move - 0.05).atomProgress).toBe(0);
      expect(at(end + 0.05).atomProgress).toBe(1);
    }
  });
  it('does not reveal acid amount through the spoken prediction in either language', () => {
    for (const [locale, predict, no, final] of [
      ['zh', 33.5, 34.35, 38.09],
      ['en', 38.8, 39.33, 43.31],
    ] as const) {
      const at = (t: number) => alcoholOxidationDirector(5, t / 54.5, locale);
      expect(at(predict).answer).toBe(false);
      expect(at(no - 0.02).oxidationProgress).toBe(0);
      const d = at(final + 0.02),
        m = dichromateAlcohol(d.oxidationProgress, d.ethanol, d.oxidant, d.acid);
      expect(m.aceticAcid).toBe(3);
      expect(m.ethanol).toBe(3);
      expect(m.dichromate).toBe(0);
    }
  });
});
