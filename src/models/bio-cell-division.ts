export type MitoticPhase =
  'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase' | 'daughter';
const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number) => Math.min(1, Math.max(0, finite(v)));
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const phase = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export function mitoticState(progress: number) {
  const p = Math.max(0, Math.min(5.999, finite(progress))),
    phase = (['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase', 'daughter'] as const)[
      Math.floor(p)
    ],
    alignment = clamp((p - 1) / 1.5),
    separation = clamp(p - 3),
    division = p >= 5 ? 1 : clamp((p - 4.4) / 0.6),
    replication = clamp(p);
  const chromatids = Array.from({ length: 8 }, (_, id) => {
    const chromosome = Math.floor(id / 2),
      sister = id % 2,
      side = sister === 0 ? -1 : 1,
      x0 = 145 + (chromosome % 2) * 80,
      y0 = 85 + Math.floor(chromosome / 2) * 70,
      cx = x0 + (185 - x0) * alignment + side * (2 + 68 * separation),
      cy = y0 + (65 + chromosome * 36 - y0) * alignment;
    return {
      id,
      chromosome,
      sister,
      x: cx,
      y: cy,
      color: ['#9d7898', '#7c87a9', '#b28b73', '#8c9f73'][chromosome],
      armOffset: side * 8 * (1 - 2 * separation),
      visible: sister === 0 ? 1 : replication,
    };
  });
  return {
    phase,
    alignment,
    separation,
    division,
    replication,
    chromatids,
    chromosomesPerCell: p < 3 ? 4 : p < 5 ? 8 : 4,
    dnaPerDaughter: 4,
    cellCount: p < 5 ? 1 : 2,
    chromosomesInWholeSystem: p < 3 ? 4 : 8,
    dnaInWholeSystem: 4 + 4 * replication,
  };
}
export function cubeExchange(edge: number, depth = 0.5) {
  const l = Math.max(0.001, finite(edge, 2)),
    d = Math.max(0, Math.min(finite(depth), l / 2)),
    volume = l ** 3,
    area = 6 * l * l,
    core = (l - 2 * d) ** 3;
  return {
    edge: l,
    depth: d,
    volume,
    area,
    areaPerVolume: area / volume,
    penetrated: volume - core,
    fraction: (volume - core) / volume,
  };
}
export const fixedStages: MitoticPhase[] = Array.from({ length: 50 }, (_, id) =>
  id < 34
    ? 'interphase'
    : id < 40
      ? 'prophase'
      : id < 44
        ? 'metaphase'
        : id < 47
          ? 'anaphase'
          : 'telophase',
);
/** Synthetic age positions, not measured stage durations. Keeping the SAME
 * period and boundaries while changing initial synchrony is a counterexample
 * to inferring duration from a snapshot fraction without population assumptions. */
export const SYNTHETIC_PHASE_BOUNDS = [0.68, 0.8, 0.88, 0.94, 1] as const;
export function syntheticStage(age: number): MitoticPhase {
  const remainder = finite(age) % 1,
    a = remainder < 0 ? remainder + 1 : remainder;
  return (['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase'] as const)[
    SYNTHETIC_PHASE_BOUNDS.findIndex((b) => a < b)
  ];
}
export function fixedRootField(field = 0, synchronized = false) {
  const f = Math.min(1, Math.max(0, Math.round(finite(field))));
  return Array.from({ length: 50 }, (_, id) => {
    const u = (((id * 17 + f * 7) % 50) + 0.5) / 50;
    // The second field is another explicitly synthetic age distribution, not
    // an asserted second experimental sample or a random-data generator.
    const age = synchronized ? 0.84 : f ? u ** 0.92 : u;
    return {
      id: id + f * 50,
      stage: syntheticStage(age),
      age,
      x: 20 + (id % 10) * 32,
      y: 20 + Math.floor(id / 10) * 38,
    };
  });
}
export function stageCounts(field = 0, synchronized = false) {
  return fixedRootField(field, synchronized).reduce(
    (a, c) => {
      a[c.stage]++;
      return a;
    },
    { interphase: 0, prophase: 0, metaphase: 0, anaphase: 0, telophase: 0, daughter: 0 },
  );
}
export const FIXED_FEATURES = [
  { stage: 'prophase', cell: 2, feature: '凝缩，尚未排齐' },
  { stage: 'metaphase', cell: 20, feature: '集中在中央' },
  { stage: 'anaphase', cell: 32, feature: '分成两组' },
  { stage: 'telophase', cell: 41, feature: '两核与细胞板' },
] as const;
export const DIVISION_CHAPTERS = [
  'replicate',
  'align',
  'segregate',
  'divide',
  'size',
  'prepare',
  'fixed',
] as const;
export const DIVISION_SECONDS = [23, 22, 24, 23, 25, 29, 50] as const;
/** Measured natural-speech direction, batch13. Times are chapter-local and
 * include the 0.45s narration lead-in. Published samples are selected directly:
 * no tween is presented as an intermediate recorded observation. */
export function divisionDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.min(6, Math.max(0, Math.round(finite(chapter)))),
    t = Math.max(0, finite(time)),
    en = locale === 'en';
  const recordStart = en ? 11.19 : 10.43,
    statisticsStart = en ? 25.49 : 20.29,
    featureTimes = en ? [1.59, 2.93, 4.39, 5.79] : [2.11, 3.03, 3.67, 5.33],
    recordTimes = en ? [17.97, 19.59, 20.3, 21.23] : [14.65, 15.73, 16.4, 17.2],
    recordIndex = recordTimes.filter((at) => t >= at).length;
  const plateStart = en ? 4.33 : 6.45,
    plateEnd = en ? 7.87 : 11.57;
  return {
    chapter: DIVISION_CHAPTERS[c],
    time: t,
    mitosis:
      c === 0
        ? phase(t, en ? 1.2 : 2.3, en ? 5.1 : 6.9)
        : c === 1
          ? 1 + 1.99 * phase(t, 0.45, en ? 9.6 : 9.1)
          : c === 2
            ? 3 + phase(t, 0.45, en ? 6.5 : 7.9)
            : 4 +
              0.4 * phase(t, 0.45, plateStart) +
              0.6 * phase(t, plateStart, plateEnd) +
              0.999 * phase(t, plateEnd, plateEnd + 1.5),
    depth: 0.5 * phase(t, en ? 4.85 : 4.37, en ? 8.17 : 9.5),
    preparation: phase(t, en ? 8.91 : 5.69, en ? 12.23 : 13.8),
    fixedShot:
      t < featureTimes[0]
        ? 'field'
        : t < recordStart
          ? 'features'
          : t < statisticsStart
            ? 'live-record'
            : 'counterexample',
    feature: Math.min(3, Math.max(0, featureTimes.filter((at) => t >= at).length - 1)),
    recordIndex,
    liveProgress: recordIndex / 4,
    synchronized: t >= (en ? 36.2 : 29.2),
  };
}

/** Published Fig6c WT cell, Pietra et al. Nature Communications 4:2779 (2013).
 * Original PDF p8 was visually read. Only times and qualitative DNA arrangements
 * are transcribed; this is not copied image data, inferred stage duration or an
 * entire cell cycle. Different species from the textbook onion preparation.
 * Five observation frames remain immutable; film time selects, never fabricates,
 * an intermediate recorded image. */
export const LIVE_DIVISION_RECORD = Object.freeze([
  Object.freeze({ cellId: 'WT-6c', minute: 0, kind: 'one-nucleus', description: '单个核区' }),
  Object.freeze({ cellId: 'WT-6c', minute: 20, kind: 'equatorial', description: 'DNA 集中在中央' }),
  Object.freeze({ cellId: 'WT-6c', minute: 33, kind: 'separated', description: 'DNA 分成两组' }),
  Object.freeze({
    cellId: 'WT-6c',
    minute: 38,
    kind: 'separated-late',
    description: '两组进一步分开',
  }),
  Object.freeze({ cellId: 'WT-6c', minute: 69, kind: 'two-nuclei', description: '两个核区' }),
]);
export function liveRecordAt(index: number) {
  return LIVE_DIVISION_RECORD[Math.min(4, Math.max(0, Math.round(finite(index))))];
}

/** A qualitative 2D envelope, not a volume model. Two equal ellipse interiors
 * form one connected cell until the neck closes. At closure, each daughter
 * has its own complete boundary. The existing nuclear/chromatid coordinates
 * remain inside this envelope; no lineage identity is changed. */
export function animalCytokinesis(progress: number) {
  const p = Math.max(0, Math.min(5.999, finite(progress))),
    d = mitoticState(p).division,
    split = p >= 5,
    shift = split ? 4 * clamp(p - 5) : 0,
    a = 70 * d + shift,
    rx = 163 - 93 * d,
    ry = 110 - 4 * d,
    cy = 130,
    lobes = [
      { cx: 185 - a, cy, rx, ry },
      { cx: 185 + a, cy, rx, ry },
    ],
    neck = ry * Math.sqrt(Math.max(0, 1 - (Math.min(a, rx) / rx) ** 2));
  const ellipsePath = (cx: number) =>
    `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  const path = split
    ? lobes.map((l) => ellipsePath(l.cx)).join(' ')
    : `M185 ${cy - neck}A${rx} ${ry} 0 1 0 185 ${cy + neck}A${rx} ${ry} 0 1 0 185 ${cy - neck}Z`;
  return {
    path,
    lobes,
    neckHalfHeight: neck,
    split,
    gap: Math.max(0, 2 * (a - rx)),
    nuclei: [115, 255].map((cx) => ({ cx, cy: 120, rx: 43, ry: 83, opacity: clamp(p - 4) })),
  };
}
