export type XFemale = 'BB' | 'Bb' | 'bb';
export type XMale = 'BY' | 'bY';
export type XGenotype = XFemale | XMale;
export function xLinkedCross(mother: XFemale, father: XMale) {
  const outcomes = new Map<
    string,
    {
      genotype: XGenotype;
      sex: 'female' | 'male';
      affected: boolean;
      carrier: boolean;
      probability: number;
      maternal: string;
      paternal: string;
    }
  >();
  for (const maternal of mother)
    for (const paternal of father) {
      const genotype = (
          paternal === 'Y' ? maternal + 'Y' : [maternal, paternal].sort().join('')
        ) as XGenotype,
        key = `${maternal}-${paternal}`,
        sex = paternal === 'Y' ? 'male' : 'female';
      const previous = outcomes.get(key);
      outcomes.set(key, {
        genotype,
        sex,
        affected: genotype === 'bb' || genotype === 'bY',
        carrier: genotype === 'Bb',
        probability: (previous?.probability ?? 0) + 0.25,
        maternal,
        paternal,
      });
    }
  return [...outcomes.values()];
}
export type PedigreePerson = {
  id: string;
  sex: 'female' | 'male';
  affected: boolean;
  generation: number;
  number: number;
};
export const textbookPedigree: PedigreePerson[] = [
  { id: 'I-1', sex: 'male', affected: true, generation: 1, number: 1 },
  { id: 'I-2', sex: 'female', affected: false, generation: 1, number: 2 },
  ...(['female', 'male', 'female', 'male', 'female', 'male'] as const).map((sex, i) => ({
    id: `II-${i + 1}`,
    sex,
    affected: false,
    generation: 2,
    number: i + 1,
  })),
  ...(
    [
      'female',
      'male',
      'female',
      'female',
      'male',
      'male',
      'male',
      'male',
      'female',
      'female',
      'female',
      'male',
    ] as const
  ).map((sex, i) => ({
    id: `III-${i + 1}`,
    sex,
    affected: [6, 7, 12].includes(i + 1),
    generation: 3,
    number: i + 1,
  })),
];
export const pedigreeFamilies = [
  { mother: 'I-2', father: 'I-1', children: ['II-2', 'II-3', 'II-5'] },
  { mother: 'II-1', father: 'II-2', children: ['III-1', 'III-2', 'III-3', 'III-4'] },
  { mother: 'II-3', father: 'II-4', children: ['III-5', 'III-6'] },
  {
    mother: 'II-5',
    father: 'II-6',
    children: ['III-7', 'III-8', 'III-9', 'III-10', 'III-11', 'III-12'],
  },
];
/** Constraint propagation under the textbook's one-locus, fully penetrant X-recessive assumptions. */
export function inferTextbookPedigree() {
  const possibilities: Record<string, XGenotype[]> = {};
  for (const p of textbookPedigree)
    possibilities[p.id] =
      p.sex === 'male' ? [p.affected ? 'bY' : 'BY'] : p.affected ? ['bb'] : ['BB', 'Bb'];
  for (let iteration = 0; iteration < 20; iteration++) {
    let changed = false;
    for (const family of pedigreeFamilies) {
      const valid: { mother: XGenotype; father: XGenotype; children: XGenotype[] }[] = [];
      for (const mother of possibilities[family.mother])
        for (const father of possibilities[family.father]) {
          const children = xLinkedCross(mother as XFemale, father as XMale).map((c) => c.genotype);
          if (family.children.every((id) => possibilities[id].some((g) => children.includes(g))))
            valid.push({ mother, father, children });
        }
      const filter = (id: string, allowed: XGenotype[]) => {
        const next = possibilities[id].filter((x) => allowed.includes(x));
        if (next.length !== possibilities[id].length) {
          changed = true;
          possibilities[id] = next;
        }
      };
      filter(
        family.mother,
        valid.map((v) => v.mother),
      );
      filter(
        family.father,
        valid.map((v) => v.father),
      );
      for (const id of family.children)
        filter(
          id,
          valid.flatMap((v) => v.children),
        );
    }
    if (!changed) break;
  }
  return possibilities;
}
export type SurveyPerson = {
  id: number;
  household: number;
  sex: 'female' | 'male';
  affected: boolean;
};
const syntheticAffected = new Set([0, 10, 52, 100, 102, 104, 150, 152]);
/** Explicit synthetic classroom population; not prevalence or private medical records. */
export const teachingPopulation: SurveyPerson[] = Array.from({ length: 200 }, (_, id) => ({
  id,
  household: Math.floor(id / 10),
  sex: id % 2 ? 'female' : 'male',
  affected: syntheticAffected.has(id),
}));
export function summarizeSurvey(records: SurveyPerson[], sex: 'all' | 'female' | 'male' = 'all') {
  const unique = [
      ...new Map(
        records.filter((r) => sex === 'all' || r.sex === sex).map((r) => [r.id, r]),
      ).values(),
    ],
    affected = unique.filter((r) => r.affected).length;
  return {
    total: unique.length,
    affected,
    proportion: unique.length ? affected / unique.length : null,
    duplicatesRemoved: records.filter((r) => sex === 'all' || r.sex === sex).length - unique.length,
  };
}
export function surveySample(count: number, selectedFamilies = false, seed = 23) {
  const households = new Set(teachingPopulation.filter((p) => p.affected).map((p) => p.household)),
    pool = teachingPopulation.filter((p) => !selectedFamilies || households.has(p.household));
  let s = seed >>> 0;
  const random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(pool.length, Math.max(0, Math.floor(count))));
}
export const groupSurveySamples = [
  teachingPopulation.slice(0, 20),
  teachingPopulation.slice(20, 100),
];

const finiteUnit = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
/** Presentation of computed gamete classes. Tokens preserve parental origin within each
 * selected theoretical combination; none is claimed to be an observed fly or measured count. */
export function linkedTransmission(mother: XFemale, father: XMale, progress: number, width = 280) {
  const p = finiteUnit(progress),
    w = Number.isFinite(width) ? Math.max(240, Math.min(720, width)) : 280;
  const outcomes = xLinkedCross(mother, father).sort(
    (a, b) =>
      Number(a.sex === 'male') - Number(b.sex === 'male') ||
      Number(a.affected) - Number(b.affected),
  );
  const index = Math.min(outcomes.length - 1, Math.floor(p * outcomes.length)),
    q = p === 1 ? 1 : p * outcomes.length - index;
  const smooth = q * q * (3 - 2 * q),
    child = outcomes[index];
  const tokens = (
    [
      ['maternal', child.maternal, 0.27 * w, 0.5 * w - 12],
      ['paternal', child.paternal, 0.73 * w, 0.5 * w + 12],
    ] as const
  ).map(([source, allele, x0, x1]) => ({
    id: `class-${index}-${source}`,
    source,
    allele,
    x: x0 + (x1 - x0) * smooth,
    y: 18 + 56 * smooth,
  }));
  return {
    outcomes,
    index,
    q,
    tokens,
    child,
    revealed: outcomes.map((_, i) => i < index || (i === index && q >= 0.92)),
  };
}
/** Existing speech, independently decoded. Times are chapter-local seconds including the .45s lead-in. */
export function linkedFilmState(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const t = Math.max(0, Number.isFinite(time) ? time : 0),
    en = locale === 'en',
    step = (a: number, b: number) => finiteUnit((t - a) / (b - a));
  let progress = 0;
  if (chapter === 0)
    progress =
      t < (en ? 12.4 : 10.8)
        ? 0.5 * step(5.3, en ? 12.3 : 10.7)
        : 0.5 + 0.5 * step(en ? 12.4 : 10.8, en ? 17.4 : 15.6);
  if (chapter === 1) progress = step(en ? 7.7 : 6.6, en ? 10.7 : 10.2);
  if (chapter === 2) progress = step(en ? 8.7 : 8.5, en ? 15.7 : 16.3);
  if (chapter === 3)
    progress = t < 8.6 ? 0.5 * step(4.4, 8.3) : 0.5 + 0.5 * step(8.6, en ? 14.1 : 14.6);
  if (chapter === 4) progress = step(en ? 5.1 : 5.7, en ? 9 : 10.2);
  if (chapter === 5) progress = step(2, en ? 24 : 25.5);
  if (chapter === 6) progress = step(en ? 4.7 : 3.6, en ? 8.7 : 9.4);
  if (chapter === 7) progress = step(0.8, en ? 5 : 5.6);
  const focus =
    t < (en ? 5.4 : 5.1)
      ? 'I-1'
      : t < (en ? 11.3 : 13.1)
        ? 'II-3'
        : t < (en ? 18.8 : 20.3)
          ? 'III-6'
          : 'I-2';
  return {
    progress,
    focus,
    reveal: t >= (en ? 8 : 10),
    sampleCount: Math.round(progress * 200),
    candle: progress > 0.5,
    poolReveal: t >= (en ? 4.8 : 5.4),
    duplicateReveal: t >= (en ? 10.6 : 12.2),
    secondGroup: t >= (en ? 2.7 : 3),
  };
}
