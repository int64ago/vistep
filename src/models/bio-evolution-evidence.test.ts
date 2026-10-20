import { describe, it, expect } from 'vitest';
import {
  cytochromeDifferences,
  selectionYears,
  limbBones,
  diskCenters,
  concentration,
  inhibitionRadius,
  discSelection,
  isolatedPopulations,
  geneFlow,
} from './bio-evolution-evidence';
describe('evolution evidence and stated teaching models', () => {
  it('matches the textbook second-year selection benchmark without inserting Hardy-Weinberg mating', () => {
    const y = selectionYears()[1];
    expect(y.counts).toEqual([11, 22, 63]);
    expect(y.total).toBe(96);
    expect(y.frequencies[0]).toBeCloseTo(0.11458333, 7);
    expect(y.S).toBeCloseTo(0.22916667, 7);
    expect(y.s + y.S).toBeCloseTo(1);
    expect(selectionYears(0, 0).every((x) => x.S === 0.2)).toBe(true);
    expect(selectionYears(0.1, -0.1)[9].S).toBeGreaterThan(0.2);
    expect(selectionYears(-0.1, 0.1)[9].S).toBeLessThan(0.2);
  });
  it('preserves evidence counts and connected homologous bone groups', () => {
    expect(cytochromeDifferences.map((x) => x[1])).toEqual([0, 1, 11, 13, 14, 21, 27, 31, 43, 44]);
    for (const l of ['human', 'bat', 'whale', 'cat'] as const) {
      const b = limbBones(l);
      expect(new Set(b.map((x) => x.id)).size).toBe(b.length);
      expect(new Set(b.map((x) => x.group)).size).toBe(6);
      for (let d = 0; d < 5; d++) {
        const m = b.find((x) => x.id === `metacarpal-${d}`)!;
        expect(b.find((x) => x.id === `digit-${d}-0`)!.a).toEqual(m.b);
      }
    }
  });
  it('derives model inhibition boundaries from concentration and does not create resistance', () => {
    expect(diskCenters.filter((x) => x.drug)).toHaveLength(3);
    for (const mic of [0.12, 0.5, 0.7])
      expect(concentration(inhibitionRadius(mic))).toBeCloseTo(mic, 10);
    expect(discSelection(1).radius).toBeLessThan(discSelection(0).radius);
    expect(discSelection(2).radius).toBe(discSelection(1).radius);
    expect(discSelection(3, false).radius).toBe(discSelection(0, false).radius);
    expect(discSelection(0).selected).toBe(false);
    const d = discSelection(1);
    expect(d.meanDiameter).toBeCloseTo(d.diameters.reduce((a, b) => a + b, 0) / 3, 12);
  });
  it('keeps reproductive isolation independent of allele divergence', () => {
    const isolated = isolatedPopulations(15, 0).at(-1)!,
      mixed = isolatedPopulations(15, 0.25).at(-1)!;
    expect(isolated.a - isolated.b).toBeGreaterThan(mixed.a - mixed.b);
    expect(isolated.a + isolated.b).toBeCloseTo(1);
    expect(geneFlow(false, false)).toBe(true);
    expect(geneFlow(true, false)).toBe(false);
    expect(geneFlow(false, true)).toBe(false);
  });
});

import {
  alleleAccounting,
  mothRepresentatives,
  limbComparison,
  limbObservations,
  cloneTransfer,
  reunionFamily,
  evolutionDirector,
} from './bio-evolution-evidence';
describe('independent evidence and tracked classroom counterexamples', () => {
  it('distinguishes allele frequency from dark phenotype, with two copies per individual', () => {
    const a = alleleAccounting([11, 22, 63]);
    expect(a.S).toBe(44);
    expect(a.copies).toBe(192);
    expect(a.frequency).toBe(44 / 192);
    expect(a.darkFraction).toBe(33 / 96);
    expect(a.frequency).not.toBe(a.darkFraction);
    expect(alleleAccounting([0, 1, 0])).toMatchObject({
      S: 1,
      copies: 2,
      frequency: 0.5,
      darkFraction: 1,
    });
    expect(alleleAccounting([0, 0, 0]).frequency).toBeNull();
    expect(alleleAccounting([NaN, -10, Infinity]).copies).toBe(0);
    expect(mothRepresentatives.map((x) => [x.id, ...x.alleles])).toEqual([
      ['M-SS', 'S', 'S'],
      ['M-Ss', 'S', 's'],
      ['M-ss', 's', 's'],
    ]);
  });
  it('does not use a hypothesis to generate concealed observation records', () => {
    expect(limbComparison('whale', false).observed).toBeNull();
    expect(limbComparison('whale', false).observedRelations).toBeNull();
    expect(limbComparison('whale', true).observed).toBe(limbObservations.whale);
    expect(Object.isFrozen(limbObservations.whale)).toBe(true);
  });
  it('transfers the same clone and gives every descendant an earlier parent with an unchanged threshold', () => {
    for (const existing of [true, false])
      for (let i = 0; i <= 100; i++) {
        const s = cloneTransfer(i / 100, existing),
          ids = new Set(s.ancestors.map((x) => x.id));
        expect(ids.size).toBe(s.ancestors.length);
        for (const x of s.ancestors) {
          expect(x.threshold).toBe(existing ? 0.5 : 0.12);
          if (x.parentId) {
            expect(ids.has(x.parentId)).toBe(true);
            expect(s.ancestors.find((y) => y.id === x.parentId)!.generation).toBe(x.generation - 1);
          }
        }
      }
    expect(cloneTransfer(0).active[0].id).toBe('R-3');
    expect(cloneTransfer(0.49).rootPosition).toEqual({ x: 307, y: 100 - 74 * Math.sin(Math.PI) });
    expect(cloneTransfer(1).active).toHaveLength(8);
    expect(cloneTransfer(1, false).selected).toBe(false);
  });
  it('keeps a moving identity continuous and introduces daughters at the parent location', () => {
    for (let i = 0; i < 1000; i++) {
      const a = cloneTransfer(i / 1000),
        b = cloneTransfer((i + 1) / 1000);
      for (const x of a.active) {
        const y = b.active.find((y) => y.id === x.id);
        if (y) expect(Math.hypot(x.x - y.x, x.y - y.y)).toBeLessThan(3.5);
      }
    }
    const before = cloneTransfer(0.559999).active[0],
      birth = cloneTransfer(0.56).active;
    for (const x of birth)
      expect(Math.hypot(x.x - before.x, x.y - before.y)).toBeLessThan(0.000001);
  });
  it('removes the drug source without creating an inhibition halo or a more tolerant clone', () => {
    for (const q of [0, 0.2, 0.5, 1])
      for (const threshold of [0.12, 0.5]) {
        const r = inhibitionRadius(threshold, q);
        if (r > 8) expect(concentration(r, q)).toBeCloseTo(threshold, 12);
        else expect(concentration(8, q)).toBeLessThanOrEqual(threshold);
      }
    expect(discSelection(2, true, 0)).toMatchObject({ radius: 8, noDrug: true });
    expect(discSelection(100, false).threshold).toBe(0.12);
    expect(discSelection(100, true).threshold).toBe(0.5);
  });
  it('uses a second generation as independent fertility evidence, not allele-distance inference', () => {
    for (const fertile of [true, false]) {
      expect(reunionFamily(fertile, 0.1).first).toHaveLength(0);
      expect(reunionFamily(fertile, 0.5).first).toHaveLength(2);
      expect(reunionFamily(fertile, 1).second).toHaveLength(fertile ? 2 : 0);
    }
    expect(reunionFamily(true, 1).second[0].parentIds).toEqual(['fertile:F1-1', 'fertile:F1-2']);
    expect(reunionFamily(false, 1).geneFlow).toBe(false);
    expect(isolatedPopulations(100, 0.5).at(-1)).toMatchObject({ a: 0.5, b: 0.5 });
  });
  it('bounds invalid numerical inputs and exposes population extinction rather than NaN frequencies', () => {
    expect(selectionYears(-1, -1)[1]).toMatchObject({ total: 0, extinct: true, S: 0, s: 0 });
    expect(selectionYears(NaN, Infinity, NaN)).toHaveLength(1);
    for (const f of [
      concentration(NaN),
      inhibitionRadius(NaN),
      cloneTransfer(NaN).rootPosition.x,
      isolatedPopulations(NaN, NaN)[0].a,
    ])
      expect(Number.isFinite(f)).toBe(true);
    expect(evolutionDirector(999, Infinity).mode).toBe('reunion');
    expect(evolutionDirector(NaN, NaN).progress).toBe(0.1);
  });
});

describe('live clone sampling is compatible with the shared concentration field', () => {
  it('keeps the ordinary control outside its inhibition boundary, while R-3 may grow closer', () => {
    // Old counterexample: a sensitive clone at r=32 lay in its inhibition region.
    expect(concentration(32)).toBeGreaterThan(0.12);
    expect(concentration(32)).toBeLessThan(0.5);
    for (const existing of [true, false])
      for (const source of [0, 0.05, 0.2, 0.5, 1]) {
        const clone = cloneTransfer(0, existing),
          distance = Math.hypot(clone.sourcePosition.x - 85, clone.sourcePosition.y - 100);
        expect(concentration(distance, source)).toBeLessThan(clone.threshold);
        const arrived = cloneTransfer(0.5, existing).active[0];
        expect(concentration(Math.hypot(arrived.x - 275, arrived.y - 100), source)).toBeLessThan(
          clone.threshold,
        );
        for (let i = 50; i <= 100; i++)
          for (const d of cloneTransfer(i / 100, existing).active)
            expect(concentration(Math.hypot(d.x - 275, d.y - 100), source)).toBeLessThan(
              clone.threshold,
            );
      }
  });
});

it('keeps the reported protein records immutable and concentration vanishing at infinite distance', () => {
  expect(Object.isFrozen(cytochromeDifferences)).toBe(true);
  expect(cytochromeDifferences.every(Object.isFrozen)).toBe(true);
  expect(concentration(Infinity)).toBe(0);
  expect(concentration(-Infinity)).toBe(0);
});

it('introduces each daughter at its parent on all exact division boundaries', () => {
  for (const [g, p] of [
    [1, 0.56],
    [2, 0.69],
    [3, 0.82],
  ]) {
    const before = cloneTransfer(p - 1e-8),
      at = cloneTransfer(p);
    expect(at.generation).toBe(g);
    expect(at.active).toHaveLength(2 ** g);
    for (const child of at.active) {
      const parent = before.active.find((x) => x.id === child.parentId)!;
      expect(parent).toBeDefined();
      expect(Math.hypot(child.x - parent.x, child.y - parent.y)).toBeLessThan(1e-5);
    }
  }
});

it('shows a separate ordinary counterexample after the preset-clone case without creating resistance', () => {
  expect(evolutionDirector(7, 12).cloneControl).toBe(false);
  expect(evolutionDirector(7, 15).cloneControl).toBe(true);
  expect(evolutionDirector(7, 14.75).cloneProgress).toBe(0);
  expect(evolutionDirector(7, 26).cloneProgress).toBe(1);
});

describe('measured director reveal boundaries', () => {
  it('conceals the independent whale record throughout the spoken prediction', () => {
    for (const locale of ['zh', 'en'] as const) {
      const hide = locale === 'en' ? 10.75 : 9.93,
        reveal = locale === 'en' ? 17.67 : 17.55;
      expect(evolutionDirector(1, hide - 0.001, locale).limb).toBe('bat');
      for (const t of [hide, 14, reveal - 0.001])
        expect(evolutionDirector(1, t, locale)).toMatchObject({
          limb: 'whale',
          limbRevealed: false,
        });
      expect(evolutionDirector(1, reveal, locale)).toMatchObject({
        limb: 'whale',
        limbRevealed: true,
      });
    }
  });
  it('holds the same R-3 descendants before beginning a separate ordinary-clone control', () => {
    for (const locale of ['zh', 'en'] as const) {
      const control = locale === 'en' ? 15.27 : 14.75;
      const a = evolutionDirector(7, control - 0.001, locale),
        b = evolutionDirector(7, control, locale);
      expect(a.cloneControl).toBe(false);
      expect(a.cloneProgress).toBe(1);
      expect(b.cloneControl).toBe(true);
      expect(b.cloneProgress).toBe(0);
      expect(cloneTransfer(a.cloneProgress, true).active.every((x) => x.threshold === 0.5)).toBe(
        true,
      );
      expect(
        cloneTransfer(evolutionDirector(7, control + 7, locale).cloneProgress, false).active.every(
          (x) => x.threshold === 0.12,
        ),
      ).toBe(true);
    }
  });
  it('brings local concentration and measured-model diameter views in at their actual spoken times', () => {
    expect(evolutionDirector(6, 7, 'zh').localDisc).toBe(true);
    expect(evolutionDirector(6, 13, 'zh').discDetail).toBe(true);
    expect(evolutionDirector(6, 7, 'en').localDisc).toBe(false);
    expect(evolutionDirector(6, 12.5, 'en').discDetail).toBe(true);
  });
});

it('reveals contributions before the total and denominator at measured words', () => {
  for (const locale of ['zh', 'en'] as const) {
    const start = locale === 'en' ? 16.11 : 15.87,
      two = locale === 'en' ? 18.83 : 17.87,
      total = locale === 'en' ? 21.97 : 19.89,
      den = locale === 'en' ? 22.83 : 22.75,
      pct = locale === 'en' ? 24.73 : 24.85;
    expect(evolutionDirector(5, start - 0.001, locale).countStage).toBe(0);
    expect(evolutionDirector(5, start, locale).countStage).toBe(1);
    expect(evolutionDirector(5, two, locale).countStage).toBe(2);
    expect(evolutionDirector(5, total, locale).countStage).toBe(3);
    expect(evolutionDirector(5, den, locale).countStage).toBe(4);
    expect(evolutionDirector(5, pct, locale).countStage).toBe(5);
    expect(evolutionDirector(5, 25.7, locale).year).toBe(1);
    expect(evolutionDirector(5, 25.7, locale).showCurve).toBe(false);
  }
});
