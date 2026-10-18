const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number) => Math.min(1, Math.max(0, finite(v)));
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const between = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export const textbookCultureLifespans = [
  { source: 'fetal', min: 50, max: 50 },
  { source: 'middle', min: 20, max: 20 },
  { source: 'older', min: 2, max: 4 },
] as const;
export function cultureRemaining(passages: number) {
  passages = Math.max(0, finite(passages));
  return textbookCultureLifespans.map((s) => ({
    ...s,
    remainingMin: Math.max(0, s.min - passages),
    remainingMax: Math.max(0, s.max - passages),
  }));
}
export function carrotCulture(progress: number) {
  const p = clamp(progress),
    effective = p;
  return {
    progress: effective,
    proliferation: Math.min(1, effective / 0.45),
    root: Math.max(0, Math.min(1, (effective - 0.4) / 0.25)),
    shoot: Math.max(0, Math.min(1, (effective - 0.6) / 0.4)),
    conditional: true,
  };
}
/** This is the textbook's stated comparison, deliberately not a universal biological predictor. */
export function textbookNuclearSwap(youngNucleus: boolean, youngCytoplasm: boolean) {
  return {
    youngNucleus,
    youngCytoplasm,
    textbookProliferation: youngNucleus ? 'vigorous' : 'absent',
    generalizes: false,
  };
}
export const nuclearEvidenceLimits = [
  { year: 1976, doi: '10.1016/0014-4827(76)90269-X', finding: 'limited-division' },
  { year: 1983, pmid: '6301866', finding: 'cytoplasmic-inhibition', minimumInhibition: 0.4 },
] as const;
export function wormCellFates(progress: number, ced3Functional = true, ced4Functional = true) {
  const formed = 1090,
    scheduled = 131,
    completed = Math.floor(clamp(progress) * scheduled),
    dead = ced3Functional && ced4Functional ? completed : 0;
  return {
    formed,
    scheduled,
    dead,
    retained: formed - dead,
    execution: ced3Functional && ced4Functional,
  };
}
export const illustrativeLineage = Array.from({ length: 15 }, (_, id) => ({
  id,
  parent: id === 0 ? null : Math.floor((id - 1) / 2),
  level: Math.floor(Math.log2(id + 1)),
  scheduledDeath: id === 10 || id === 13,
}));

/** Culture progression is a qualitative reconstruction of the reported outcome,
 * not a success-rate predictor or proof that each initial cell is totipotent. */
export function observedRegeneration(progress: number) {
  const p = clamp(progress);
  return {
    ...carrotCulture(p),
    sampleId: 'carrot-phloem-culture',
    evidence: 'textbook-reconstruction' as const,
  };
}
export const PROGRAM_IDS = ['growth', 'root', 'shoot'] as const;
/** Modern explanatory programs, not measured 1958 genes. All DNA program IDs
 * remain present; RNA is a separate copy of a selected program, not transformed DNA. */
export function differentiationProgram(role: 'root' | 'shoot', progress: number) {
  const p = clamp(progress),
    chosen = role === 'root' ? 1 : 2;
  return {
    role,
    programs: PROGRAM_IDS.map((id, i) => ({ id, present: true, selected: i === chosen })),
    transcript: {
      id: `RNA-${role}`,
      templateId: PROGRAM_IDS[chosen],
      x: 84 + 86 * clamp(p / 0.7),
      y: 40 + chosen * 40 + (88 - (40 + chosen * 40)) * smooth(p / 0.7),
      visible: p > 0,
    },
    protein: { id: `protein-${role}`, templateId: PROGRAM_IDS[chosen], visible: p >= 0.8 },
    predicted: 'different-expression-with-retained-information' as const,
  };
}
export function regenerationHypothesis(requiredInformationLost: boolean) {
  return {
    requiredInformationLost,
    observedRegeneration: true,
    compatibleWithObservedResult: !requiredInformationLost,
    provesEveryCellRegenerates: false,
    measuredGeneExpression: false,
  };
}
export function cultureComparison(sameConditions: boolean) {
  return {
    rows: textbookCultureLifespans,
    sameConditions,
    directlyComparable: sameConditions,
    individualLifespan: null,
    deathMeasured: false,
    causalAgingMechanismIdentified: false,
  };
}
/** Only a pedagogic local branch. Births precede the two scheduled death fates;
 * these identities are not names from the full measured worm lineage. */
export function lineageFrame(progress: number, ced3Functional = true, ced4Functional = true) {
  const p = clamp(progress),
    execution = ced3Functional && ced4Functional;
  return illustrativeLineage.map((node) => {
    const birth = clamp((p - node.level * 0.18) / 0.15);
    const death = node.scheduledDeath && execution ? between(p, 0.72, 0.98) : 0;
    return { ...node, birth, death, retained: death < 1, cellId: `local-${node.id}` };
  });
}
export const FATES_CHAPTERS = ['culture', 'age', 'nuclear', 'limits', 'lineage', 'genes'] as const;
export const FATES_SECONDS = [43.5, 27, 28, 30, 29, 38] as const;
/** Actual bilingual cue word times include the 0.45s lead-in. These are
 * presentation cuts, not measured biological rates. */
export const FATES_CUTS = {
  zh: {
    hypothesis: 9.97,
    retained: 15.41,
    expression: 18.55,
    switchProgram: 25.11,
    rna: 27.63,
    rnaEnd: 32.71,
    question: 36.55,
    answer: 41.79,
    oldStart: 2.33,
    oldEnd: 5.01,
    youngStart: 6.57,
    youngIn: 9.11,
    division: 9.39,
    divisionEnd: 10.61,
    study: 8.97,
    geneStart: 2.69,
    geneEnd: 7.0,
  },
  en: {
    hypothesis: 9.51,
    retained: 13.85,
    expression: 16.61,
    switchProgram: 22.51,
    rna: 24.43,
    rnaEnd: 28.37,
    question: 33.53,
    answer: 37.73,
    oldStart: 2.13,
    oldEnd: 4.89,
    youngStart: 5.83,
    youngIn: 8.57,
    division: 8.57,
    divisionEnd: 9.63,
    study: 8.55,
    geneStart: 4.53,
    geneEnd: 7.53,
  },
} as const;
export function fatesDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.min(5, Math.max(0, Math.round(finite(chapter)))),
    t = Math.max(0, finite(time)),
    cuts = FATES_CUTS[locale],
    young =
      t <= cuts.youngIn
        ? 0.6 * between(t, cuts.youngStart, cuts.youngIn)
        : t < cuts.division
          ? 0.6 + 0.05 * between(t, cuts.youngIn, cuts.division)
          : 0.65 + 0.35 * between(t, cuts.division, cuts.divisionEnd);
  return {
    chapter: FATES_CHAPTERS[c],
    time: t,
    progress:
      c === 0
        ? between(t, 0.8, locale === 'en' ? 6.37 : 7.31)
        : c === 2
          ? between(t, 2, 19)
          : c === 4
            ? between(t, 1, locale === 'en' ? 15.63 : 17.77)
            : between(t, 3, 20),
    cultureShot:
      t < cuts.hypothesis ? 'observed' : t < cuts.expression ? 'hypothesis' : 'expression',
    programRole: t < cuts.switchProgram ? ('root' as const) : ('shoot' as const),
    programProgress:
      t < cuts.switchProgram
        ? between(t, cuts.expression + 0.25, cuts.expression + 4.5)
        : between(t, cuts.rna, cuts.rnaEnd),
    culturePrediction: t >= cuts.question,
    cultureAnswer: t >= cuts.answer,
    hypothesisLost: t < cuts.retained,
    study: t < cuts.study ? 1976 : 1983,
    swapFocus: t < cuts.youngStart ? 0 : 1,
    swapProgress: [between(t, cuts.oldStart, cuts.oldEnd), young],
    ageReveal: between(t, 2, 12),
    geneReveal: between(t, cuts.geneStart, cuts.geneEnd),
  };
}

export type FatesMode = (typeof FATES_CHAPTERS)[number];

/** The 1983 abstract reports inhibition >=40%, not an exact mean. */
export function cytoplastEvidence() {
  return {
    year: 1983,
    control: 1,
    inhibitionLowerBound: nuclearEvidenceLimits[1].minimumInhibition,
    fusionUpperBound: 1 - nuclearEvidenceLimits[1].minimumInhibition,
    rawData: false,
  } as const;
}

/** The comparison starts after this illustrative cell was born. Progress here
 * varies execution only, not its previous lineage birth. */
export function executionComparison(
  progress: number,
  ced3Functional = true,
  ced4Functional = true,
) {
  const lineageProgress = 0.72 + 0.26 * clamp(progress);
  return {
    normal: lineageFrame(lineageProgress).find((n) => n.id === 10)!,
    intervention: lineageFrame(lineageProgress, ced3Functional, ced4Functional).find(
      (n) => n.id === 10,
    )!,
  };
}
