import { describe, it, expect } from 'vitest';
import {
  chlorinePhotolysis,
  photolysisTrace,
  photolysisHeadspaces,
  photolysisEvent,
  photolysisNet,
  photolysisFilm,
  PHOTO_ATOM_IDS,
  PHOTOLYSIS_SPEECH_CUTS,
  TEXTBOOK_PHOTOLYSIS_DIRECTIONS,
} from './chem-chlorine-photolysis';

describe('light, net chemistry and distinct sensor quantities', () => {
  it('matches an independently calculated 100 mL, 1.8 mmol endpoint', () => {
    const m = chlorinePhotolysis(1);
    expect(m.decomposed).toBeCloseTo(0.0018, 12);
    expect(m.oxygen).toBeCloseTo(0.0009, 12);
    expect(m.pH).toBeCloseTo(-Math.log10(0.026), 12);
    expect(m.chlorideMgL).toBeCloseTo(921.7, 9);
    // n0 calculated separately with R in Pa m³ mol⁻¹ K⁻¹.
    const n0 = (101325 * 0.0005) / (8.31446261815324 * 298.15);
    expect(m.oxygenPercent).toBeCloseTo((100 * (0.18 * n0 + 0.0009)) / (n0 + 0.0009), 7);
  });
  it('conserves chlorine and net acid/chloride/oxygen increments', () => {
    const initial = chlorinePhotolysis(0);
    for (const p of [0, 0.001, 0.25, 0.5, 1]) {
      const m = chlorinePhotolysis(p);
      expect(m.remainingHOCl + m.decomposed).toBeCloseTo(0.0018, 12);
      expect(m.chloride * m.liquidLitres + m.remainingHOCl).toBeCloseTo(initial.chlorineTotal, 12);
      expect((m.chloride - initial.chloride) * m.liquidLitres).toBeCloseTo(2 * m.oxygen, 12);
      expect(m.hydrogen - initial.hydrogen).toBeCloseTo(m.chloride - initial.chloride, 12);
    }
  });
  it('changes fraction, not yield or liquid readings, when only gas volume doubles', () => {
    const { A, B } = photolysisHeadspaces();
    expect(A.oxygen).toBe(B.oxygen);
    expect(A.pH).toBe(B.pH);
    expect(A.chlorideMgL).toBe(B.chlorideMgL);
    expect(B.initialGasMoles).toBeCloseTo(2 * A.initialGasMoles, 12);
    expect(A.oxygenPercent).toBeCloseTo(21.45877691, 5);
    expect(B.oxygenPercent).toBeCloseTo(19.766647229, 5);
    expect(B.oxygenPercent).toBeLessThan(A.oxygenPercent);
  });
  it('does not invent kinetic curves or alter the fixed observation directions', () => {
    const saved = JSON.stringify(TEXTBOOK_PHOTOLYSIS_DIRECTIONS);
    for (const v of [50, 500, 1000]) {
      expect(new Set(photolysisTrace(1, v, false).map((m) => m.pH)).size).toBe(1);
      photolysisTrace(0.7, v, true);
    }
    expect(JSON.stringify(TEXTBOOK_PHOTOLYSIS_DIRECTIONS)).toBe(saved);
    expect(Object.isFrozen(TEXTBOOK_PHOTOLYSIS_DIRECTIONS)).toBe(true);
    expect(TEXTBOOK_PHOTOLYSIS_DIRECTIONS.map((d) => d.phase)).toEqual([
      'liquid',
      'liquid',
      'headspace',
    ]);
  });
  it('has finite endpoints for invalid UI and programmatic values', () => {
    for (const p of [NaN, Infinity, -Infinity, -1, 0, 1, 3])
      for (const h of [NaN, Infinity, -Infinity, -50, 0, 500, 2000]) {
        const m = chlorinePhotolysis(p, h);
        expect(Object.values(m).every(Number.isFinite)).toBe(true);
        expect(m.headspaceMl).toBeGreaterThanOrEqual(50);
        expect(m.headspaceMl).toBeLessThanOrEqual(1000);
      }
    expect(photolysisTrace(NaN, NaN).every((m) => Number.isFinite(m.pH))).toBe(true);
  });
});

describe('selected homolysis and conserved net allocation', () => {
  it('absorbs the selected photon before cleavage, never makes a visible UV colour', () => {
    expect(photolysisEvent(7.999).photon.visible).toBe(true);
    const at = photolysisEvent(8);
    expect(at.photon.visible).toBe(false);
    expect(at.photon.absorbed).toBe(true);
    expect(at.cleavage).toBe(0);
    expect(photolysisEvent(11.499).cleavage).toBe(0);
    expect(photolysisEvent(17).radicals).toBe(true);
    expect(photolysisEvent(32, 258, false).cleavage).toBe(0);
    expect(photolysisEvent(32, 258, false).radicals).toBe(false);
  });
  it('retains H–O, six atom IDs and exactly two selected electrons through the initial event', () => {
    for (const w of [258, 700]) {
      const start = photolysisEvent(0, w),
        ho = Math.hypot(start.atoms[0].x - start.atoms[1].x, start.atoms[0].y - start.atoms[1].y);
      for (let t = 0; t <= 32; t += 0.25) {
        const s = photolysisEvent(t, w);
        expect(s.atoms.map((a) => a.id)).toEqual(PHOTO_ATOM_IDS);
        expect(s.electrons.map((e) => e.id)).toEqual(['selected-bond-e0', 'selected-bond-e1']);
        expect(s.atoms.every((a) => a.charge === 0)).toBe(true);
        expect(Math.hypot(s.atoms[0].x - s.atoms[1].x, s.atoms[0].y - s.atoms[1].y)).toBeCloseTo(
          ho,
          12,
        );
      }
      expect(photolysisEvent(17, w).electrons.map((e) => e.owner)).toEqual([
        'sample-A-O0',
        'sample-A-Cl0',
      ]);
    }
  });
  it('starts the next lens at the exact prior atom positions, with no reconstructed HOCl0', () => {
    for (const w of [258, 700]) {
      const a = photolysisEvent(32, w),
        b = photolysisNet(0, w);
      expect(b.atoms).toEqual(a.atoms);
      expect(b.bonds).toEqual(a.bonds);
      expect(b.showSelectedElectrons).toBe(true);
      expect(photolysisNet(4, w).showSelectedElectrons).toBe(false);
    }
  });
  it('keeps 2H/2O/2Cl, zero total charge and trackable nonoverlapping atoms during allocation', () => {
    for (const w of [258, 700])
      for (let t = 0; t <= 34; t += 0.1) {
        const s = photolysisNet(t, w);
        expect(s.atoms.map((a) => a.id)).toEqual(PHOTO_ATOM_IDS);
        expect(s.charge).toBe(0);
        expect(s.atoms.every((a) => Number.isFinite(a.x) && Number.isFinite(a.y))).toBe(true);
        for (let i = 0; i < 6; i++)
          for (let j = i + 1; j < 6; j++) {
            const a = s.atoms[i],
              b = s.atoms[j];
            expect(Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius).toBeGreaterThanOrEqual(
              -0.01,
            );
          }
        expect(2 * (s.oxygen.notHeadspace + s.oxygen.headspace) + s.oxygen.unallocatedAtoms).toBe(
          2,
        );
      }
  });
  it('counts O2 in the headspace only after its complete drawing crosses the same liquid boundary', () => {
    for (const w of [258, 700]) {
      for (const t of [16, 20, 23, 25.999, 26, 26.001, 28, 34]) {
        const s = photolysisNet(t, w),
          oxygens = s.atoms.filter((a) => a.element === 'O');
        expect(s.oxygen.produced).toBe(1);
        expect(s.oxygen.headspace).toBe(t < 26 ? 0 : 1);
        expect(s.oxygen.headspace === 1).toBe(
          oxygens.every((a) => a.y + a.radius <= s.liquidY + 1e-10),
        );
        expect(s.oxygen.headspace + s.oxygen.notHeadspace).toBe(1);
      }
    }
  });
  it('holds the independent-sample answers and reconstructs them on reverse seeking', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = PHOTOLYSIS_SPEECH_CUTS[locale];
      expect(photolysisFilm(4, cuts.gas - 0.001, locale).revealGas).toBe(false);
      expect(photolysisFilm(4, cuts.gas, locale).revealGas).toBe(true);
      expect(photolysisFilm(4, cuts.liquid - 0.001, locale).revealLiquid).toBe(false);
      expect(photolysisFilm(4, cuts.liquid, locale).revealLiquid).toBe(true);
      const before = photolysisNet(10);
      photolysisNet(34);
      expect(photolysisNet(10)).toEqual(before);
    }
  });
});

describe('actual bilingual spoken event director', () => {
  it('absorbs before splitting and gives the selected electron separation at least three visible seconds', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = PHOTOLYSIS_SPEECH_CUTS[locale];
      const absorb = cuts.event[2][0],
        split = cuts.event[3][0],
        separate = cuts.event[4][0];
      expect(separate - split).toBeGreaterThanOrEqual(3);
      expect(photolysisEvent(photolysisFilm(1, absorb, locale).eventTime).photon.absorbed).toBe(
        true,
      );
      expect(photolysisEvent(photolysisFilm(1, split, locale).eventTime).cleavage).toBe(0);
      expect(photolysisEvent(photolysisFilm(1, separate, locale).eventTime).radicals).toBe(true);
      expect(
        photolysisEvent(photolysisFilm(1, separate, locale).eventTime).electrons.map(
          (e) => e.owner,
        ),
      ).toEqual(['sample-A-O0', 'sample-A-Cl0']);
    }
  });
  it('keeps products below the surface until the actual follow/crossing phrase, then counts the same pair', () => {
    for (const locale of ['zh', 'en'] as const) {
      const cuts = PHOTOLYSIS_SPEECH_CUTS[locale],
        start = cuts.net[4][0],
        arrival = cuts.net[5][0];
      const before = photolysisNet(photolysisFilm(2, start, locale).netTime),
        during = photolysisNet(photolysisFilm(2, arrival - 0.001, locale).netTime),
        after = photolysisNet(photolysisFilm(2, arrival, locale).netTime);
      expect(before.oxygen.notHeadspace).toBe(1);
      expect(during.oxygen.headspace).toBe(0);
      expect(after.oxygen.headspace).toBe(1);
      expect(after.atoms.map((a) => a.id)).toEqual(before.atoms.map((a) => a.id));
      expect(photolysisNet(photolysisFilm(2, 0, locale).netTime).atoms).toEqual(
        photolysisEvent(32).atoms,
      );
    }
  });
  it('matches named scales while speech names them and holds comparison answers through the actual question', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(photolysisFilm(3, 12, locale).shot).toBe('pH-scale');
      expect(photolysisFilm(3, 15, locale).shot).toBe('chloride-scale');
      expect(photolysisFilm(3, 18, locale).shot).toBe('gas-denominator');
      expect(photolysisFilm(4, 11.2, locale).comparisonMix).toBe(0);
      expect(photolysisFilm(4, 17, locale).comparisonMix).toBe(1);
      expect(photolysisFilm(4, 17, locale).revealGas).toBe(false);
      expect(photolysisFilm(4, 19, locale).revealGas).toBe(true);
      expect(photolysisFilm(4, 21, locale).revealLiquid).toBe(false);
      expect(photolysisFilm(4, 23, locale).revealLiquid).toBe(true);
      for (const time of [NaN, -Infinity, Infinity, -1, 0, 34, 100]) {
        const d = photolysisFilm(4, time, locale);
        expect([d.time, d.eventTime, d.netTime, d.comparisonMix].every(Number.isFinite)).toBe(true);
      }
    }
  });
});
