import { expect, it } from 'vitest';
import {
  xLinkedCross,
  inferTextbookPedigree,
  textbookPedigree,
  pedigreeFamilies,
  summarizeSurvey,
  surveySample,
  teachingPopulation,
  groupSurveySamples,
} from './bio-linked-inheritance';
it('computes parental, F2, test and reciprocal X-linked crosses while preserving parental origin', () => {
  expect(xLinkedCross('BB', 'bY').every((c) => !c.affected)).toBe(true);
  const f2 = xLinkedCross('Bb', 'BY');
  expect(f2.filter((c) => c.affected).reduce((s, c) => s + c.probability, 0)).toBe(0.25);
  expect(f2.filter((c) => c.affected).every((c) => c.sex === 'male')).toBe(true);
  expect(xLinkedCross('Bb', 'bY').filter((c) => c.affected)).toHaveLength(2);
  expect(xLinkedCross('bb', 'BY').find((c) => c.sex === 'female')?.affected).toBe(false);
  expect(xLinkedCross('bb', 'BY').find((c) => c.sex === 'male')?.affected).toBe(true);
  for (const c of xLinkedCross('Bb', 'bY')) if (c.sex === 'male') expect(c.paternal).toBe('Y');
});
it('retains all 20 textbook people and inferred uncertainty rather than inventing known carriers', () => {
  expect(textbookPedigree).toHaveLength(20);
  expect(pedigreeFamilies.flatMap((f) => f.children)).toHaveLength(15);
  const x = inferTextbookPedigree();
  expect(x['I-1']).toEqual(['bY']);
  expect(x['I-2']).toEqual(['BB', 'Bb']);
  expect(x['II-3']).toEqual(['Bb']);
  expect(x['II-5']).toEqual(['Bb']);
  expect(x['III-9']).toEqual(['BB', 'Bb']);
  expect(x['III-6']).toEqual(['bY']);
});
it('weights group totals, deduplicates people and changes the denominator with the population definition', () => {
  expect(summarizeSurvey(groupSurveySamples[0]).proportion).toBe(0.1);
  expect(summarizeSurvey(groupSurveySamples[1]).proportion).toBe(0.0125);
  expect(summarizeSurvey(groupSurveySamples.flat()).proportion).toBe(0.03);
  expect(summarizeSurvey([...groupSurveySamples[0], ...groupSurveySamples[0]]).total).toBe(20);
  expect(summarizeSurvey(teachingPopulation, 'male').total).toBe(100);
  expect(summarizeSurvey(teachingPopulation, 'female').proportion).toBe(0);
  expect(summarizeSurvey([]).proportion).toBeNull();
  expect(surveySample(200, true).length).toBeLessThan(200);
  expect(summarizeSurvey(surveySample(200, true)).proportion).toBeGreaterThan(
    summarizeSurvey(teachingPopulation).proportion!,
  );
  expect(new Set(surveySample(200).map((p) => p.id)).size).toBe(200);
});

import { linkedTransmission, linkedFilmState } from './bio-linked-inheritance';
it('tracks each theoretical parental source to the same child without replacing observation counts', () => {
  for (const mother of ['BB', 'Bb', 'bb'] as const)
    for (const father of ['BY', 'bY'] as const) {
      const end = linkedTransmission(mother, father, 1);
      expect(end.outcomes.reduce((s, c) => s + c.probability, 0)).toBe(1);
      for (let k = 0; k < 100; k++) {
        const s = linkedTransmission(mother, father, k / 100);
        expect(s.tokens.map((x) => x.allele)).toEqual([s.child.maternal, s.child.paternal]);
        expect(s.tokens.map((x) => x.source)).toEqual(['maternal', 'paternal']);
        expect(s.tokens.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y))).toBe(true);
      }
      expect(linkedTransmission(mother, father, NaN).q).toBe(0);
      expect(end.tokens.map((x) => x.y)).toEqual([74, 74]);
    }
});
it('cuts follow unchanged recorded references and do not reveal pooling before its spoken sum', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(linkedFilmState(7, 1, locale).poolReveal).toBe(false);
    expect(linkedFilmState(7, 12, locale).poolReveal).toBe(true);
    expect(linkedFilmState(5, 3, locale).focus).toBe('I-1');
    expect(linkedFilmState(5, 9, locale).focus).toBe('II-3');
    expect(linkedFilmState(5, 21, locale).focus).toBe('I-2');
    expect(linkedFilmState(6, 0, locale).sampleCount).toBe(0);
    expect(linkedFilmState(6, 20, locale).sampleCount).toBe(200);
  }
});
