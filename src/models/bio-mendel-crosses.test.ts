import { expect, it } from 'vitest';
import {
  mendelCross,
  mendelGametes,
  segregationCounts,
  segregationDraws,
  drawBallPoint,
  bucketPoint,
  pollinationState,
  mendelObservations,
} from './bio-mendel-crosses';
it('derives classic ratios from gamete multiplication rather than drawing fixed ratios', () => {
  expect(mendelCross('DD', 'dd').phenotype).toEqual({ tall: 1 });
  expect(mendelCross('Dd', 'Dd').phenotype).toEqual({ tall: 0.75, short: 0.25 });
  expect(mendelCross('Dd', 'Dd').genotypes).toEqual({ DD: 0.25, Dd: 0.5, dd: 0.25 });
  expect(mendelCross('Dd', 'dd').phenotype).toEqual({ tall: 0.5, short: 0.5 });
  expect(mendelCross('YyRr', 'YyRr').phenotype).toEqual({
    'yellow-round': 9 / 16,
    'yellow-wrinkled': 3 / 16,
    'green-round': 3 / 16,
    'green-wrinkled': 1 / 16,
  });
  expect(Object.values(mendelCross('YyRr', 'yyrr').phenotype)).toEqual([0.25, 0.25, 0.25, 0.25]);
  expect(mendelGametes('YYRR')).toEqual([{ alleles: 'YR', probability: 1 }]);
});
it('preserves parent-origin alleles and exposes the recessive homozygote boundary', () => {
  for (const cross of [
    ['DD', 'dd'],
    ['Dd', 'Dd'],
    ['YyRr', 'YyRr'],
  ]) {
    const m = mendelCross(...(cross as [string, string]));
    expect(m.cells.reduce((s, c) => s + c.probability, 0)).toBeCloseTo(1);
    expect(m.cells.every((c) => c.genotype.length === cross[0].length)).toBe(true);
  }
  expect(mendelCross('dd', 'dd').phenotype).toEqual({ short: 1 });
  expect(mendelObservations.diSelf.values.reduce((a, b) => a + b, 0)).toBe(556);
});
it('samples with replacement reproducibly and returns the identical ball to its own bucket', () => {
  expect(segregationDraws(17, 35).slice(0, 30)).toEqual(segregationDraws(17, 30));
  const counts = segregationCounts(17, 30);
  expect(counts.DD + counts.Dd + counts.dd).toBe(30);
  expect(segregationDraws(18, 30)).not.toEqual(segregationDraws(17, 30));
  for (let i = 0; i < 20; i++)
    for (let side = 0; side < 2; side++) {
      expect(drawBallPoint(i, side, 0)).toEqual(bucketPoint(i, side));
      expect(drawBallPoint(i, side, 1)).toEqual(bucketPoint(i, side));
    }
  expect(pollinationState(1, false, true).controlledCross).toBe(false);
  expect(pollinationState(1, true, false).controlledCross).toBe(false);
});

import {
  crossTransmission,
  testCrossPrediction,
  observationFor,
  sampleFrame,
  mendelDirector,
  MENDEL_IDS,
} from './bio-mendel-crosses';
it('keeps textbook observations immutable and independent from counterfactual predictions', () => {
  const before = JSON.stringify(mendelObservations);
  expect(testCrossPrediction(true).phenotype['yellow-wrinkled']).toBe(0.25);
  expect(testCrossPrediction(true, 'parental-only').phenotype).toEqual({
    'yellow-round': 0.5,
    'green-wrinkled': 0.5,
  });
  expect(mendelCross('YyRr', 'YyRr', 'parental-only').phenotype).toEqual({
    'yellow-round': 0.75,
    'green-wrinkled': 0.25,
  });
  expect(mendelCross('yYrR', 'YyRr', 'parental-only').phenotype).toEqual({
    'yellow-round': 0.75,
    'green-wrinkled': 0.25,
  });
  expect(JSON.stringify(mendelObservations)).toBe(before);
  expect(Object.isFrozen(mendelObservations.diTestMale.values)).toBe(true);
  expect(observationFor('diTest', true)?.values).toEqual([24, 22, 25, 26]);
});
it('traces transmitted copies to distinct parental source identities at every frame', () => {
  for (const pair of [
    ['DD', 'dd'],
    ['Dd', 'Dd'],
    ['YyRr', 'YyRr'],
    ['YyRr', 'yyrr'],
  ] as const) {
    const cross = mendelCross(pair[0], pair[1]);
    for (let i = 0; i < cross.cells.length; i++)
      for (const progress of [0, 0.1, 0.44, 0.45, 0.6, 0.9, 1]) {
        const frame = crossTransmission(pair[0], pair[1], i, progress, 272);
        expect(new Set(frame.tokens.map((t) => t.id)).size).toBe(pair[0].length);
        expect(
          frame.tokens.every((t) =>
            frame.sources.some(
              (s) => s.id === t.sourceId && s.side === t.side && s.allele === t.allele,
            ),
          ),
        ).toBe(true);
        expect(
          frame.tokens
            .filter((t) => t.side === 0)
            .map((t) => t.allele)
            .join(''),
        ).toBe(cross.cells[i].maternal);
        expect(
          frame.tokens
            .filter((t) => t.side === 1)
            .map((t) => t.allele)
            .join(''),
        ).toBe(cross.cells[i].paternal);
        expect(frame.genotype).toBe(cross.cells[i].genotype);
      }
  }
  const a = crossTransmission('YyRr', 'yyrr', 3, 0.45 - 1e-7, 272),
    b = crossTransmission('YyRr', 'yyrr', 3, 0.45 + 1e-7, 272);
  expect(
    a.tokens.every((t, i) => Math.hypot(t.x - b.tokens[i].x, t.y - b.tokens[i].y) < 1e-4),
  ).toBe(true);
});
it('keeps sample ledger completed only after return and reconstructs prefixes', () => {
  const a = sampleFrame(17, 30, 0),
    b = sampleFrame(17, 30, 1 / 30 - 1e-6),
    c = sampleFrame(17, 30, 1 / 30),
    d = sampleFrame(17, 30, 1);
  expect(a.completed).toBe(0);
  expect(b.completed).toBe(0);
  expect(c.completed).toBe(1);
  expect(d.completed).toBe(30);
  expect(d.counts).toEqual(segregationCounts(17, 30));
  expect(sampleFrame(17, NaN, NaN).n).toBe(30);
  expect(sampleFrame(17, 0, 1).n).toBe(1);
  expect(segregationDraws(17, NaN)).toEqual([]);
});
it('rejects mismatched loci and keeps finite geometry at external boundaries', () => {
  for (const [a, b] of [
    ['Dd', 'YyRr'],
    ['DX', 'dd'],
    ['', 'dd'],
  ])
    expect(() => mendelCross(a, b)).toThrow();
  for (const p of [NaN, -Infinity, Infinity, -5, 5]) {
    const s = crossTransmission('Dd', 'dd', NaN, p, NaN);
    expect(s.tokens.every((t) => Number.isFinite(t.x) && Number.isFinite(t.y))).toBe(true);
    expect(Number.isFinite(pollinationState(p).removal)).toBe(true);
  }
});
it('preserves eight IDs and puts new predictions after observations within both original windows', () => {
  expect(MENDEL_IDS).toEqual([
    'pollination',
    'parents',
    'self',
    'sampling',
    'test',
    'diParents',
    'diSelf',
    'diTest',
  ]);
  expect(mendelDirector(2, 0).shot).toBe('record');
  expect(mendelDirector(2, 30).shot).toBe('prediction');
  expect(mendelDirector(6, 0).shot).toBe('record');
  expect(mendelDirector(6, 27).shot).toBe('prediction');
  expect(mendelDirector(4, 0).shot).toBe('transmission');
  expect(mendelDirector(4, 23).shot).toBe('record');
  expect(mendelDirector(7, 25).shot).toBe('record');
});

it('does not change the traced test-cross identities while measured transfer completes', () => {
  for (const locale of ['zh', 'en'] as const)
    for (const ch of [4, 7]) {
      const frames = Array.from({ length: 101 }, (_, i) =>
        mendelDirector(ch, (11 * i) / 100, locale),
      );
      expect(new Set(frames.map((f) => f.cell)).size).toBe(1);
      expect(frames[0].progress).toBe(0);
      expect(frames.at(-1)?.progress).toBe(1);
    }
});
import { MENDEL_CUTS } from './bio-mendel-crosses';
it('keeps independent prediction concealed until the measured spoken conclusion', () => {
  for (const locale of ['zh', 'en'] as const)
    for (const [ch, key, index] of [
      [2, 'self', 3],
      [4, 'test', 1],
      [6, 'diSelf', 3],
      [7, 'diTest', 1],
    ] as const) {
      const at = MENDEL_CUTS[locale][key][index]!;
      expect(mendelDirector(ch, at - 0.01, locale).shot).toBe('prediction');
      expect(mendelDirector(ch, at - 0.01, locale).predictionRevealed).toBe(false);
      expect(mendelDirector(ch, at, locale).predictionRevealed).toBe(true);
    }
});
it('shows fixed test-cross observations at their spoken entrance instead of the old20/21s cut', () => {
  for (const locale of ['zh', 'en'] as const)
    for (const [ch, key] of [
      [4, 'test'],
      [7, 'diTest'],
    ] as const) {
      const at = MENDEL_CUTS[locale][key][2];
      expect(mendelDirector(ch, at - 0.01, locale).shot).toBe('prediction');
      expect(mendelDirector(ch, at, locale).shot).toBe('record');
    }
});
it('holds observed tall offspring before hypothesizing factor transmission and completes before dominance explanation', () => {
  for (const locale of ['zh', 'en'] as const) {
    const a = MENDEL_CUTS[locale].parents;
    expect(mendelDirector(1, a[0] - 0.01, locale).shot).toBe('first-observation');
    expect(mendelDirector(1, a[0], locale).shot).toBe('transmission');
    expect(mendelDirector(1, a[1], locale).progress).toBe(0);
    expect(mendelDirector(1, a[2], locale).progress).toBe(1);
  }
});
it('keeps the first returned sample in its own bucket during the spoken return before the next draw', () => {
  for (const [locale, t] of [
    ['zh', 12],
    ['en', 10.5],
  ] as const) {
    const f = mendelDirector(3, t, locale),
      s = sampleFrame(17, 30, f.progress);
    expect(s.completed).toBe(1);
    expect(s.phase).toBe(0);
  }
});
it('handles nonfinite time and keeps all bilingual measured progress finite and bounded', () => {
  for (const locale of ['zh', 'en'] as const)
    for (let c = 0; c < 8; c++)
      for (const t of [NaN, -Infinity, Infinity, -3, 0, 0.2, 5, 10, 25, 40, 300]) {
        const d = mendelDirector(c, t, locale);
        expect(Number.isFinite(d.progress)).toBe(true);
        expect(d.progress).toBeGreaterThanOrEqual(0);
        expect(d.progress).toBeLessThanOrEqual(1);
      }
});

it('aligns the clarified two-locus voice with observed phenotypes, joined factors and later tests', () => {
  // Independent measured lexical landmarks from the final unhinted ASR, including the 0.45 s lead-in.
  expect(mendelDirector(5, 12, 'en').progress).toBeLessThan(1);
  expect(mendelDirector(5, 17.2, 'en').progress).toBe(1);
  expect(mendelDirector(5, 13.6, 'zh').progress).toBe(1);
  for (const locale of ['zh', 'en'] as const) {
    expect(mendelDirector(6, 4, locale).shot).toBe('record');
    expect(mendelDirector(6, 10, locale).shot).toBe('gametes');
    expect(mendelDirector(6, 22, locale).progress).toBe(1);
    expect(mendelDirector(6, 28, locale).predictionRevealed).toBe(false);
    expect(mendelDirector(6, 33, locale).predictionRevealed).toBe(true);
    expect(mendelDirector(7, 8, locale).shot).toBe('prediction');
    expect(mendelDirector(7, 8, locale).predictionRevealed).toBe(false);
    expect(mendelDirector(7, 12.6, locale).predictionRevealed).toBe(true);
    expect(mendelDirector(7, 15, locale).shot).toBe('record');
  }
});

it('keeps all four inherited copies distinct while YR and yr reorder into YyRr', () => {
  for (const width of [260, 272, 320, 390, 480, 680, 720])
    for (let i = 0; i <= 1000; i++) {
      const s = crossTransmission('YYRR', 'yyrr', 0, i / 1000, width);
      for (let a = 0; a < s.tokens.length; a++)
        for (let b = a + 1; b < s.tokens.length; b++) {
          const u = s.tokens[a],
            v = s.tokens[b];
          // Glyph backing rectangles are 22 × 32; at least one axis retains clearance.
          expect(Math.abs(u.x - v.x) >= 23 || Math.abs(u.y - v.y) >= 33).toBe(true);
        }
    }
  const s = crossTransmission('YYRR', 'yyrr', 0, 1, 260);
  expect(s.tokens.map((t) => t.y)).toEqual([181, 181, 181, 181]);
  expect(s.tokens.map((t) => [t.id, t.sourceId, t.allele])).toEqual(
    crossTransmission('YYRR', 'yyrr', 0, 0, 260).tokens.map((t) => [t.id, t.sourceId, t.allele]),
  );
});
