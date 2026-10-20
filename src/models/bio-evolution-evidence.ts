const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, finite(v)));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export const cytochromeDifferences = Object.freeze([
  Object.freeze(['黑猩猩', 0] as const),
  Object.freeze(['猕猴', 1] as const),
  Object.freeze(['狗', 11] as const),
  Object.freeze(['鸡', 13] as const),
  Object.freeze(['响尾蛇', 14] as const),
  Object.freeze(['金枪鱼', 21] as const),
  Object.freeze(['果蝇', 27] as const),
  Object.freeze(['天蚕蛾', 31] as const),
  Object.freeze(['链孢霉', 43] as const),
  Object.freeze(['酵母菌', 44] as const),
] as const);
export function selectionYears(darkChange = 0.1, lightChange = -0.1, years = 10) {
  darkChange = clamp(darkChange, -1, 1);
  lightChange = clamp(lightChange, -1, 1);
  years = Math.floor(clamp(years, 1, 100));
  let ss = 10,
    het = 20,
    light = 70;
  return Array.from({ length: years }, (_, i) => {
    if (i) {
      ss *= 1 + darkChange;
      het *= 1 + darkChange;
      light *= 1 + lightChange;
    }
    const total = ss + het + light;
    return {
      year: i + 1,
      counts: [ss, het, light],
      frequencies: total ? [ss / total, het / total, light / total] : [0, 0, 0],
      S: total ? (2 * ss + het) / (2 * total) : 0,
      s: total ? (2 * light + het) / (2 * total) : 0,
      total,
      extinct: total === 0,
    };
  });
}
export type Limb = 'human' | 'bat' | 'whale' | 'cat';
export type Bone = {
  id: string;
  group: number;
  a: [number, number];
  b: [number, number];
  width: number;
};
export function limbBones(limb: Limb) {
  const human = limb === 'human',
    bat = limb === 'bat',
    whale = limb === 'whale';
  const elbow: [number, number] = [100, human ? 83 : bat ? 65 : whale ? 53 : 91],
    wrist: [number, number] = [100, human ? 139 : bat ? 105 : whale ? 100 : 156];
  const bones: Bone[] = [
    { id: 'humerus', group: 0, a: [100, 17], b: elbow, width: 12 },
    { id: 'radius', group: 1, a: [elbow[0] - 7, elbow[1]], b: [wrist[0] - 8, wrist[1]], width: 7 },
    {
      id: 'ulna',
      group: 2,
      a: [elbow[0] + 7, elbow[1]],
      b: [wrist[0] + 8, wrist[1]],
      width: bat ? 3 : 7,
    },
  ];
  for (let i = 0; i < 6; i++)
    bones.push({
      id: `carpal-${i}`,
      group: 3,
      a: [85 + (i % 3) * 15, wrist[1] + 7 + Math.floor(i / 3) * 9],
      b: [89 + (i % 3) * 15, wrist[1] + 7 + Math.floor(i / 3) * 9],
      width: 8,
    });
  for (let d = 0; d < 5; d++) {
    const angle = (d - 2) * (bat ? 0.32 : whale ? 0.16 : 0.23) + (d === 0 ? -0.25 : 0);
    const x = 85 + d * 7.5,
      y = wrist[1] + 18;
    const met = bat ? (d === 0 ? 20 : 48) : whale ? 22 : human ? 28 : 18;
    const end: [number, number] = [x + Math.sin(angle) * met, y + Math.cos(angle) * met];
    bones.push({ id: `metacarpal-${d}`, group: 4, a: [x, y], b: end, width: 5 });
    let a = end;
    const count = whale ? [3, 5, 7, 6, 4][d] : d === 0 ? 2 : 3;
    const lengths = bat ? (d === 0 ? 10 : 25) : whale ? 10 : human ? (d === 0 ? 13 : 16) : 9;
    for (let j = 0; j < count; j++) {
      const len = lengths * (1 - j * 0.09);
      const b: [number, number] = [a[0] + Math.sin(angle) * len, a[1] + Math.cos(angle) * len];
      bones.push({ id: `digit-${d}-${j}`, group: 5, a, b, width: 4.5 });
      a = b;
    }
  }
  return bones;
}
export const diskCenters = [
  { id: 'blank', x: 98, y: 98, drug: false },
  { id: 'a', x: 202, y: 98, drug: true },
  { id: 'b', x: 98, y: 202, drug: true },
  { id: 'c', x: 202, y: 202, drug: true },
];
/** A normalized, independent-disk concentration snapshot; not diffusion kinetics. */
export function concentration(distance: number, source = 1) {
  const r = Number.isNaN(distance) ? 0 : Math.abs(distance);
  return clamp(source) * Math.exp((-r * r) / (2 * 18 * 18));
}
export function inhibitionRadius(threshold: number, source = 1) {
  const limit = clamp(threshold, 0.001, 1),
    amount = clamp(source);
  if (amount <= limit) return 8;
  return Math.max(8, 18 * Math.sqrt(-2 * Math.log(limit / amount)));
}
export function discSelection(passage: number, preexisting = true, source = 1) {
  const selected = finite(passage) >= 1 && preexisting;
  const threshold = selected ? 0.5 : 0.12;
  const diameters = [0.98, 1, 1.02].map((f) => 2 * inhibitionRadius(threshold * f, source));
  return {
    selected,
    threshold,
    radius: inhibitionRadius(threshold, source),
    blankRadius: 8,
    lineage: selected ? 'R-3' : 'ordinary',
    diameters,
    meanDiameter: diameters.reduce((sum, x) => sum + x, 0) / 3,
    source: clamp(source),
    noDrug: clamp(source) === 0,
  };
}
export function isolatedPopulations(generations: number, migration: number) {
  generations = Math.floor(clamp(generations, 0, 100));
  migration = clamp(migration, 0, 0.5);
  let a = 0.5,
    b = 0.5;
  const out = [{ generation: 0, a, b }];
  for (let i = 1; i <= generations; i++) {
    const sa = (a * 1.15) / (a * 1.15 + (1 - a) * 0.85);
    const sb = (b * 0.85) / (b * 0.85 + (1 - b) * 1.15);
    a = (1 - migration) * sa + migration * sb;
    b = (1 - migration) * sb + migration * sa;
    out.push({ generation: i, a, b });
  }
  return out;
}
export function geneFlow(geographicBarrier: boolean, reproductiveBarrier: boolean) {
  return !geographicBarrier && !reproductiveBarrier;
}

/** Independent transcription of P102 Fig6-3 relationships, not inferred from SVG lengths. */
export const limbObservations = Object.freeze({
  human: Object.freeze(['humerus', 'radius', 'ulna', 'carpals', 'metacarpals', 'phalanges']),
  bat: Object.freeze(['humerus', 'radius', 'ulna', 'carpals', 'metacarpals', 'phalanges']),
  whale: Object.freeze(['humerus', 'radius', 'ulna', 'carpals', 'metacarpals', 'phalanges']),
  cat: Object.freeze(['humerus', 'radius', 'ulna', 'carpals', 'metacarpals', 'phalanges']),
});
export const limbRelations = Object.freeze([
  Object.freeze(['humerus', 'radius']),
  Object.freeze(['humerus', 'ulna']),
  Object.freeze(['radius', 'carpals']),
  Object.freeze(['ulna', 'carpals']),
  Object.freeze(['carpals', 'metacarpals']),
  Object.freeze(['metacarpals', 'phalanges']),
]);
export function limbComparison(limb: Limb, revealed: boolean) {
  return {
    specimen: limb,
    observed: revealed ? limbObservations[limb] : null,
    hypothesis: ['humerus', 'radius', 'ulna', 'carpals', 'metacarpals', 'phalanges'],
    observedRelations: revealed ? limbRelations : null,
    kind: 'classroom conceal/reveal of independent textbook observations' as const,
  };
}
/** Representative moth IDs remain fixed when background or class-weight calculations change. */
export const mothRepresentatives = Object.freeze([
  Object.freeze({ id: 'M-SS', genotype: 'SS', alleles: ['S', 'S'] as const, dark: true }),
  Object.freeze({ id: 'M-Ss', genotype: 'Ss', alleles: ['S', 's'] as const, dark: true }),
  Object.freeze({ id: 'M-ss', genotype: 'ss', alleles: ['s', 's'] as const, dark: false }),
]);
export function alleleAccounting(counts: readonly number[]) {
  const n = [0, 1, 2].map((i) => Math.max(0, finite(counts[i] ?? 0)));
  const S = 2 * n[0] + n[1],
    recessive = n[1] + 2 * n[2],
    total = n.reduce((a, b) => a + b, 0);
  return {
    counts: n,
    classS: [2 * n[0], n[1], 0],
    classRecessive: [0, n[1], 2 * n[2]],
    S,
    recessive,
    copies: 2 * total,
    individuals: total,
    frequency: total ? S / (2 * total) : null,
    darkFraction: total ? (n[0] + n[1]) / total : null,
  };
}
/** Stable clone identity with schematic binary genealogy, not measured growth time. */
export function cloneTransfer(progress: number, preexisting = true) {
  const p = clamp(progress),
    moving = smooth((p - 0.13) / 0.36),
    root = preexisting ? 'R-3' : 'S-0';
  const threshold = preexisting ? 0.5 : 0.12;
  const sourceRadius = preexisting ? 32 : 45;
  const rootPosition = {
    x: 85 + sourceRadius + 190 * moving,
    y: 100 - 74 * Math.sin(Math.PI * moving),
  };
  const generation = p < 0.56 ? 0 : p < 0.69 ? 1 : p < 0.82 ? 2 : 3;
  const ancestors = Array.from({ length: generation + 1 }, (_, g) =>
    Array.from({ length: 2 ** g }, (_, i) => ({
      id: g ? `${root}.${g}.${i}` : root,
      parentId: g ? (g === 1 ? root : `${root}.${g - 1}.${Math.floor(i / 2)}`) : null,
      generation: g,
      threshold,
      active: g === generation,
    })),
  ).flat();
  function terminal(g: number, i: number): { x: number; y: number } {
    if (!g) return { x: 275 + sourceRadius, y: 100 };
    const angle = ((i + 0.5) * Math.PI * 2) / 2 ** g;
    return { x: 275 + 49 * Math.cos(angle), y: 100 + 49 * Math.sin(angle) };
  }
  const split = generation ? smooth((p - [0.56, 0.69, 0.82][generation - 1]) / 0.1) : 0;
  const active = ancestors
    .filter((x) => x.active)
    .map((x, i) => {
      if (!generation) return { ...x, x: rootPosition.x, y: rootPosition.y };
      const from = terminal(generation - 1, Math.floor(i / 2)),
        to = terminal(generation, i);
      // Place daughter markers around the viable annulus; a straight chord could
      // cross the drug-inhibited center and falsely depict growth there.
      const fromR = Math.hypot(from.x - 275, from.y - 100),
        toR = Math.hypot(to.x - 275, to.y - 100);
      const a = Math.atan2(from.y - 100, from.x - 275),
        b = Math.atan2(to.y - 100, to.x - 275);
      const angle = a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * split,
        radius = fromR + (toR - fromR) * split;
      return { ...x, x: 275 + radius * Math.cos(angle), y: 100 + radius * Math.sin(angle) };
    });
  return {
    root,
    threshold,
    rootPosition,
    arrived: moving === 1,
    generation,
    ancestors,
    active,
    selected: preexisting && moving === 1,
    sourcePosition: { x: 85 + sourceRadius, y: 100 },
    sourceRadius,
  };
}
/** Fertility is an independent scenario input, never inferred from allele distance. */
export function reunionFamily(fertile: boolean, progress: number) {
  const p = clamp(progress),
    branch = fertile ? 'fertile' : 'sterile';
  const parents = [
    { id: `${branch}:A-1`, generation: 0 },
    { id: `${branch}:B-1`, generation: 0 },
  ];
  const first =
    p >= 0.3
      ? [0, 1].map((i) => ({
          id: `${branch}:F1-${i + 1}`,
          parentIds: parents.map((x) => x.id),
          generation: 1,
          fertile,
        }))
      : [];
  const second =
    p >= 0.7 && fertile
      ? [0, 1].map((i) => ({
          id: `${branch}:F2-${i + 1}`,
          parentIds: first.map((x) => x.id),
          generation: 2,
        }))
      : [];
  return {
    branch,
    parents,
    first,
    second,
    geneFlow: geneFlow(false, !fertile),
    tested: p >= 0.7,
    qualifier: 'illustrative two-generation fertility check, not observed mouse data' as const,
  };
}
export const evolutionChapterIds = [
  'fossil',
  'anatomy',
  'embryo',
  'molecular',
  'moths',
  'frequency',
  'discs',
  'selection',
  'barrier',
  'reunion',
] as const;
export type EvolutionMode = (typeof evolutionChapterIds)[number];
/** Measured preserved recordings. Times include the 0.45 s chapter lead-in.
 * Presentation cuts do not alter fixed observations or biological model parameters. */
export function evolutionDirector(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const i = Math.floor(clamp(chapter, 0, 9)),
    t = Math.max(0, finite(seconds)),
    en = locale === 'en';
  const windows = [23, 32, 28, 27, 28, 33, 30, 29, 28, 27],
    r = (a: number, b: number) => clamp((t - a) / (b - a));
  const hide = en ? 10.75 : 9.93,
    reveal = en ? 17.67 : 17.55,
    cat = en ? 23.13 : 22.87;
  let progress = clamp(t / windows[i]);
  if (i === 0)
    progress =
      t < (en ? 6.15 : 5.15)
        ? 0.1
        : t < (en ? 8.55 : 6.87)
          ? 0.3
          : t < (en ? 10.67 : 9.81)
            ? 0.6
            : 0.9;
  if (i === 2) progress = t < (en ? 2.91 : 2.11) ? 0.2 : t < (en ? 15.65 : 14.65) ? 0.4 : 0.75;
  if (i === 8) progress = r(en ? 4 : 4.55, en ? 10 : 10.7);
  const cloneControl = t >= (en ? 15.27 : 14.75),
    controlAt = en ? 15.27 : 14.75;
  const cloneProgress = cloneControl
    ? r(controlAt, controlAt + 3)
    : t < 2.8
      ? 0.5 * r(0.45, 2.8)
      : 0.5 + 0.5 * r(en ? 3.9 : 2.9, 9.1);
  const curveAt = en ? 26.55 : 26.31;
  return {
    mode: evolutionChapterIds[i],
    progress,
    fossilFocus:
      progress < 0.18
        ? 'whole'
        : progress < 0.46
          ? 'skeleton'
          : progress < 0.72
            ? 'feathers'
            : 'combined',
    limb: t < hide ? 'bat' : t < cat ? 'whale' : 'cat',
    limbRevealed: t < hide || t >= reveal,
    boneFocus:
      t < 5.15 || t >= hide
        ? -1
        : t < (en ? 6.55 : 6.2)
          ? 0
          : t < (en ? 7.29 : 6.97)
            ? 1
            : t < (en ? 8.61 : 7.73)
              ? 2
              : t < (en ? 9.39 : 8.3)
                ? 3
                : t < (en ? 10.05 : 8.8)
                  ? 4
                  : 5,
    embryoFocus: progress < 0.35 ? 'pharynx' : progress < 0.55 ? 'both' : 'both',
    molecularPage: t < (en ? 8.83 : 8.73) ? 0 : t < 16 ? 1 : 2,
    dark: t >= (en ? 13.37 : 13.51),
    year: t < 9.6 ? 0 : t < curveAt ? 1 : Math.min(9, 1 + 8 * r(curveAt, curveAt + 5.5)),
    showCurve: t >= curveAt,
    countReveal: r(9.6, 13.5),
    countStage:
      t < (en ? 16.11 : 15.87)
        ? 0
        : t < (en ? 18.83 : 17.87)
          ? 1
          : t < (en ? 21.97 : 19.89)
            ? 2
            : t < (en ? 22.83 : 22.75)
              ? 3
              : t < (en ? 24.73 : 24.85)
                ? 4
                : 5,
    localDisc: t >= (en ? 7.47 : 6.81) && t < (en ? 12.41 : 12.93),
    discDetail: t >= (en ? 12.41 : 12.93),
    cloneControl,
    cloneProgress,
    reunionProgress:
      t < 4
        ? 0.3 * r(0.45, 4)
        : t < (en ? 6.65 : 5.71)
          ? 0.3 + 0.39 * r(4, en ? 6.65 : 5.71)
          : 0.7 + 0.3 * r(en ? 6.65 : 5.71, en ? 8.67 : 7.71),
    provisional: false,
  };
}
