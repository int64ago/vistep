export type MonoGenotype = 'DD' | 'Dd' | 'dd';
export type DiGenotype = 'YYRR' | 'YyRr' | 'yyrr';
export type Assortment = 'independent' | 'parental-only';
const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
const unit = (n: number) => Math.max(0, Math.min(1, finite(n)));
const smooth = (n: number) => {
  const p = unit(n);
  return p * p * (3 - 2 * p);
};
function validateGenotype(g: string) {
  if (!/^(?:[Dd]{2}|[Yy]{2}[Rr]{2})$/.test(g))
    throw new Error('Use D/d or Y/y and R/r diploid loci');
}
export type Gamete = { alleles: string; probability: number };
/** Independent loci, equal segregation and no viability selection. */
export function mendelGametes(genotype: string, assortment: Assortment = 'independent'): Gamete[] {
  validateGenotype(genotype);
  // An explicitly counterfactual coupling phase YR/yr, with zero recombination.
  // This is not a claim about the pea experiment or all linked loci.
  if (assortment === 'parental-only' && ['Y', 'y', 'R', 'r'].every((a) => genotype.includes(a)))
    return [
      { alleles: 'YR', probability: 0.5 },
      { alleles: 'yr', probability: 0.5 },
    ];
  if (genotype.length !== 2 && genotype.length !== 4)
    throw new Error('One or two diploid loci required');
  let states: Gamete[] = [{ alleles: '', probability: 1 }];
  for (let i = 0; i < genotype.length; i += 2) {
    const next = new Map<string, number>();
    for (const state of states)
      for (const allele of genotype.slice(i, i + 2)) {
        const key = state.alleles + allele;
        next.set(key, (next.get(key) ?? 0) + state.probability / 2);
      }
    states = [...next].map(([alleles, probability]) => ({ alleles, probability }));
  }
  return states;
}
export function fertilize(a: string, b: string) {
  const valid = (x: string) => /^(?:[Dd]|[Yy][Rr])$/.test(x);
  if (a.length !== b.length || !valid(a) || !valid(b))
    throw new Error('Matched valid loci required');
  return [...a].map((x, i) => [x, b[i]].sort().join('')).join('');
}
export function peaPhenotype(genotype: string) {
  validateGenotype(genotype);
  return genotype.length === 2
    ? genotype.includes('D')
      ? 'tall'
      : 'short'
    : `${genotype.includes('Y') ? 'yellow' : 'green'}-${genotype.includes('R') ? 'round' : 'wrinkled'}`;
}
export function mendelCross(
  mother: string,
  father: string,
  assortment: Assortment = 'independent',
) {
  if (mother.length !== father.length) throw new Error('Matched diploid loci required');
  const rows = mendelGametes(mother, assortment),
    columns = mendelGametes(father, assortment),
    cells = rows.flatMap((a, row) =>
      columns.map((b, column) => {
        const genotype = fertilize(a.alleles, b.alleles);
        return {
          row,
          column,
          maternal: a.alleles,
          paternal: b.alleles,
          genotype,
          phenotype: peaPhenotype(genotype),
          probability: a.probability * b.probability,
        };
      }),
    );
  const phenotype = new Map<string, number>();
  const genotypes = new Map<string, number>();
  for (const c of cells)
    phenotype.set(c.phenotype, (phenotype.get(c.phenotype) ?? 0) + c.probability);
  for (const c of cells)
    genotypes.set(c.genotype, (genotypes.get(c.genotype) ?? 0) + c.probability);
  return {
    rows,
    columns,
    cells,
    phenotype: Object.fromEntries(phenotype),
    genotypes: Object.fromEntries(genotypes),
  };
}
export const mendelObservations = {
  self: { labels: ['tall', 'short'], values: [787, 277] },
  test: { labels: ['tall', 'short'], values: [87, 79] },
  diSelf: {
    labels: ['yellow-round', 'green-round', 'yellow-wrinkled', 'green-wrinkled'],
    values: [315, 108, 101, 32],
  },
  diTestFemale: {
    labels: ['yellow-round', 'yellow-wrinkled', 'green-round', 'green-wrinkled'],
    values: [31, 27, 26, 26],
  },
  diTestMale: {
    labels: ['yellow-round', 'yellow-wrinkled', 'green-round', 'green-wrinkled'],
    values: [24, 22, 25, 26],
  },
} as const;
export function segregationDraws(seed: number, count: number) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from(
    { length: Math.max(0, Math.min(10000, Math.floor(finite(count)))) },
    (_, id) => {
      const maternalIndex = Math.floor(random() * 20),
        paternalIndex = Math.floor(random() * 20),
        maternal = maternalIndex < 10 ? 'D' : 'd',
        paternal = paternalIndex < 10 ? 'D' : 'd',
        genotype = fertilize(maternal, paternal);
      return {
        id,
        maternalIndex,
        paternalIndex,
        maternal,
        paternal,
        genotype,
        phenotype: peaPhenotype(genotype),
      };
    },
  );
}
export function segregationCounts(seed: number, count: number) {
  const counts = { DD: 0, Dd: 0, dd: 0 };
  for (const d of segregationDraws(seed, count)) counts[d.genotype as MonoGenotype]++;
  return counts;
}
export function bucketPoint(index: number, side: number) {
  return { x: 47 + side * 204 + (index % 5) * 17, y: 129 + Math.floor(index / 5) * 19 };
}
export function drawBallPoint(index: number, side: number, phase: number) {
  const start = bucketPoint(index, side),
    p = unit(phase),
    travel = p < 0.35 ? p / 0.35 : p < 0.65 ? 1 : (1 - p) / 0.35,
    e = travel * travel * (3 - 2 * travel);
  return {
    x: start.x + (161 + side * 38 - start.x) * e,
    y: start.y + (55 - start.y) * e - 28 * Math.sin(e * Math.PI),
  };
}
export function pollinationState(progress: number, emasculated = true, protectedFlower = true) {
  const p = unit(progress),
    removal = Math.min(1, p / 0.25),
    pollen = Math.min(1, Math.max(0, (p - 0.48) / 0.28));
  const firstBag =
      Math.min(1, Math.max(0, (p - 0.25) / 0.06)) *
      (1 - Math.min(1, Math.max(0, (p - 0.4) / 0.06))),
    lastBag = Math.min(1, Math.max(0, (p - 0.8) / 0.13));
  return {
    removal: emasculated ? removal : 0,
    pollen,
    bag: protectedFlower ? Math.max(firstBag, lastBag) : 0,
    controlledCross: emasculated && protectedFlower,
  };
}
export function peaOutline(phenotype: string, radius = 20) {
  return (
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2,
        r =
          radius *
          (phenotype.includes('wrinkled')
            ? 0.83 + 0.12 * Math.sin(a * 7) + 0.05 * Math.cos(a * 11)
            : 1);
      return `${i === 0 ? 'M' : 'L'}${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' ') + 'Z'
  );
}

/** Immutable textbook records: probabilities are computed independently above. */
for (const record of Object.values(mendelObservations)) {
  Object.freeze(record.labels);
  Object.freeze(record.values);
  Object.freeze(record);
}
Object.freeze(mendelObservations);
export const MENDEL_IDS = [
  'pollination',
  'parents',
  'self',
  'sampling',
  'test',
  'diParents',
  'diSelf',
  'diTest',
] as const;
export const MENDEL_SECONDS = [28, 31, 38, 29, 27, 26, 40, 30] as const;
export type MendelMode = (typeof MENDEL_IDS)[number];
export const MENDEL_PAIRS: Record<MendelMode, [string, string]> = {
  pollination: ['DD', 'dd'],
  parents: ['DD', 'dd'],
  self: ['Dd', 'Dd'],
  sampling: ['Dd', 'Dd'],
  test: ['Dd', 'dd'],
  diParents: ['YYRR', 'yyrr'],
  diSelf: ['YyRr', 'YyRr'],
  diTest: ['YyRr', 'yyrr'],
};
export function crossTransmission(
  mother: string,
  father: string,
  index: number,
  progress: number,
  width = 320,
  assortment: Assortment = 'independent',
) {
  const cross = mendelCross(mother, father, assortment),
    selected =
      cross.cells[Math.max(0, Math.min(cross.cells.length - 1, Math.floor(finite(index))))],
    w = Math.max(260, Math.min(720, finite(width, 320))),
    p = unit(progress),
    parents = [mother, father],
    gametes = [selected.maternal, selected.paternal];
  const sources = parents.flatMap((g, side) =>
    [...g].map((allele, i) => ({
      id: `${side ? 'p' : 'm'}-source-${i}`,
      allele,
      locus: Math.floor(i / 2),
      side,
      x: w * (side ? 0.75 : 0.25) + (i - (g.length - 1) / 2) * 24,
      y: 38,
    })),
  );
  const tokens = gametes.flatMap((g, side) =>
    [...g].map((allele, locus) => {
      const offset = locus * 2 + parents[side].slice(locus * 2, locus * 2 + 2).indexOf(allele),
        source = sources.find(
          (x) => x.side === side && x.id === `${side ? 'p' : 'm'}-source-${offset}`,
        )!,
        gx = w * (side ? 0.75 : 0.25) + (locus - (g.length - 1) / 2) * 26,
        tx = w / 2 + (locus - (g.length - 1) / 2) * 56 + (side ? 13 : -13),
        first = smooth(p / 0.45),
        second = smooth((p - 0.45) / 0.55),
        // YR / yr become Yy / Rr: the two inner copies must cross in the projection.
        // Finish lateral placement while their distinct vertical lanes are still separated.
        lateral = g.length === 2 ? smooth(second / 0.72) : second,
        lane =
          g.length === 2 && locus === (side ? 0 : 1)
            ? (side ? -24 : 24) * Math.sin(Math.PI * second)
            : 0;
      return {
        id: `${side ? 'p' : 'm'}-transmitted-${locus}`,
        sourceId: source.id,
        allele,
        locus,
        side,
        x: p < 0.45 ? source.x + (gx - source.x) * first : gx + (tx - gx) * lateral,
        y: p < 0.45 ? source.y + (106 - source.y) * first : 106 + (181 - 106) * second + lane,
      };
    }),
  );
  return {
    cross,
    selected,
    sources,
    tokens,
    width: w,
    progress: p,
    genotype: selected.genotype,
    // This diagram traces a hypothetical transmitted copy, not an unreplicated allele leaving a living parent.
    interpretation: 'factor-transmission-possibility-not-meiosis-film' as const,
  };
}
export function testCrossPrediction(twoLoci = false, assortment: Assortment = 'independent') {
  return mendelCross(twoLoci ? 'YyRr' : 'Dd', twoLoci ? 'yyrr' : 'dd', assortment);
}
export function pollenEvidence(removed: boolean, isolated: boolean) {
  return {
    chosen: true,
    selfPossible: !removed,
    foreignPossible: !isolated,
    identifiedFather: removed && isolated,
  };
}
/** Same published records remain fixed even when the exploratory model changes. */
export function observationFor(mode: MendelMode, reciprocal = false) {
  return mode === 'self'
    ? mendelObservations.self
    : mode === 'test'
      ? mendelObservations.test
      : mode === 'diSelf'
        ? mendelObservations.diSelf
        : mode === 'diTest'
          ? reciprocal
            ? mendelObservations.diTestMale
            : mendelObservations.diTestFemale
          : null;
}
export function sampleFrame(seed: number, count: number, progress: number) {
  const n = Math.max(1, Math.min(10000, Math.floor(finite(count, 30)))),
    p = unit(progress),
    completed = Math.min(n, Math.floor(p * n)),
    phase = p === 1 ? 1 : p * n - completed,
    draws = segregationDraws(seed, n),
    draw = draws[Math.min(n - 1, completed)];
  return { n, completed, phase, draw, counts: segregationCounts(seed, completed) };
}
/** Measured chapter-local seconds include the shared 0.45 s voice lead-in.
 * These cuts align the frozen bilingual narration; genetics and fixed records are unchanged. */
export const MENDEL_CUTS = {
  zh: {
    pollen: [9.33, 15.19],
    parents: [10.07, 11.59, 14.99],
    self: [7.17, 15.21, 25.77, 31.63],
    test: [11.31, 13.25, 14.67],
    diParents: [3.25, 13.57],
    diSelf: [6.15, 12.55, 26.65, 32.77],
    diTest: [6.97, 12.51, 14.55],
  },
  en: {
    pollen: [7.71, 13.21],
    parents: [9.31, 10.71, 14.05],
    self: [7.59, 14.73, 25.21, 28.75],
    test: [9.13, 11.29, 12.01],
    diParents: [2.59, 17.11],
    diSelf: [7.15, 11.17, 25.97, 32.59],
    diTest: [7.27, 12.23, 13.23],
  },
} as const;
function paced(time: number, keys: readonly (readonly [number, number])[]) {
  if (time <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) {
      const [a, va] = keys[i - 1],
        [b, vb] = keys[i];
      return va + (vb - va) * unit((time - a) / (b - a));
    }
  }
  return keys[keys.length - 1][1];
}
export function mendelDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.max(0, Math.min(7, Math.round(finite(chapter)))),
    t = Math.max(0, finite(chapterTime)),
    id = MENDEL_IDS[c],
    duration = MENDEL_SECONDS[c],
    en = locale === 'en',
    a = MENDEL_CUTS[en ? 'en' : 'zh'];
  let shot = 'transmission',
    progress = 0,
    cell = 0,
    predictionRevealed = false;
  if (c === 0) {
    shot = t < a.pollen[0] ? 'pollen-risk' : t < a.pollen[1] ? 'pollen-control' : 'pollen-chosen';
    progress = paced(
      t,
      en
        ? [
            [0, 0],
            [7.71, 0],
            [10.1, 0.25],
            [10.91, 0.25],
            [11.8, 0.31],
            [12.7, 0.4],
            [13.21, 0.48],
            [16.4, 0.76],
            [17, 0.8],
            [18.1, 1],
          ]
        : [
            [0, 0],
            [9.33, 0],
            [10.9, 0.25],
            [12.53, 0.25],
            [13.3, 0.31],
            [14.6, 0.4],
            [15.19, 0.48],
            [18.15, 0.76],
            [18.65, 0.8],
            [19.6, 1],
          ],
    );
  } else if (c === 1) {
    shot = t < a.parents[0] ? 'first-observation' : 'transmission';
    progress = smooth((t - a.parents[1]) / (a.parents[2] - a.parents[1]));
  } else if (c === 2) {
    shot =
      t < a.self[0]
        ? 'record'
        : t < a.self[1]
          ? 'gametes'
          : t < a.self[2]
            ? 'matrix'
            : 'prediction';
    progress = unit((t - a.self[1]) / ((en ? 20 : 21.45) - a.self[1]));
    cell = Math.min(3, Math.floor(progress * 4));
    predictionRevealed = t >= a.self[3];
  } else if (c === 3) {
    shot = 'sampling';
    progress = paced(
      t,
      en
        ? [
            [0, 0],
            [4.61, 0],
            [6.1, 0.35 / 30],
            [7.63, 0.65 / 30],
            [10.3, 1 / 30],
            [10.8, 1 / 30],
            [20.5, 1],
          ]
        : [
            [0, 0],
            [3.99, 0],
            [5.95, 0.35 / 30],
            [7.39, 0.65 / 30],
            [10.4, 1 / 30],
            [13.65, 1 / 30],
            [23, 1],
          ],
    );
  } else if (c === 4) {
    shot = t < a.test[0] ? 'transmission' : t < a.test[2] ? 'prediction' : 'record';
    progress = smooth((t - 1) / ((en ? 8.45 : 10.6) - 1));
    cell = 1;
    predictionRevealed = t >= a.test[1];
  } else if (c === 5) {
    shot = t < a.diParents[0] ? 'first-observation' : 'transmission';
    progress = smooth((t - a.diParents[0]) / (a.diParents[1] - a.diParents[0]));
  } else if (c === 6) {
    shot =
      t < a.diSelf[0]
        ? 'record'
        : t < a.diSelf[1]
          ? 'gametes'
          : t < a.diSelf[2]
            ? 'matrix'
            : 'prediction';
    progress = unit((t - a.diSelf[1]) / ((en ? 19.31 : 21.49) - a.diSelf[1]));
    cell = Math.min(15, Math.floor(progress * 16));
    predictionRevealed = t >= a.diSelf[3];
  } else {
    shot = t < a.diTest[0] ? 'transmission' : t < a.diTest[2] ? 'prediction' : 'record';
    progress = smooth((t - 0.8) / ((en ? 7.05 : 6.49) - 0.8));
    cell = 2;
    predictionRevealed = t >= a.diTest[1];
  }
  return { chapter: c, id, time: t, shot, progress, cell, duration, predictionRevealed };
}
