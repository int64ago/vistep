import { signalPathPoint } from './bio-chemical-signals';
export const cultureClamp = (n: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(n) ? n : a));
export function plateGeometry(w: number) {
  return { cx: w / 2, cy: 149, r: Math.min(102, w * 0.36) };
}
export function streakPaths(w: number) {
  const g = plateGeometry(w);
  return Array.from({ length: 5 }, (_, z) => {
    const points = Array.from({ length: 10 }, (_, i) => {
      const angle = ((-130 + z * 65 + (i % 2 ? 42 : 0)) * Math.PI) / 180,
        r = g.r * (0.78 - i * 0.035);
      return { x: g.cx + r * Math.cos(angle), y: g.cy + r * Math.sin(angle) };
    });
    return z ? points : points;
  });
}
export function streakState(progress: number, w: number, sterile = true) {
  const p = cultureClamp(progress),
    paths = streakPaths(w),
    zone = Math.min(4, Math.floor(p * 5)),
    q = p === 1 ? 1 : p * 5 - zone,
    g = plateGeometry(w),
    flame = { x: 25, y: 253 },
    cool = { x: g.cx, y: 40 };
  const previous = zone ? paths[zone - 1].at(-1)! : { x: w - 23, y: 255 },
    route = [previous, flame, cool, previous, ...paths[zone]];
  let loop;
  if (q < 0.12) loop = signalPathPoint([previous, flame], q / 0.12);
  else if (q < 0.22) loop = flame;
  else if (q < 0.38) loop = signalPathPoint([flame, cool], (q - 0.22) / 0.16);
  else if (q < 0.5) loop = signalPathPoint([cool, previous], (q - 0.38) / 0.12);
  else if (zone === 0 && q < 0.6) loop = signalPathPoint([previous, paths[0][0]], (q - 0.5) / 0.1);
  else
    loop =
      zone === 0
        ? signalPathPoint(paths[0], (q - 0.6) / 0.4)
        : signalPathPoint([previous, ...paths[zone]], (q - 0.5) / 0.5);
  const counts = sterile ? [64, 24, 9, 4, 2] : [64, 64, 64, 64, 64];
  const seeds = paths.flatMap((points, z) =>
    Array.from({ length: counts[z] }, (_, i) => {
      const t = (i + 0.5) / counts[z],
        point = signalPathPoint(z ? [paths[z - 1].at(-1)!, ...points] : points, t);
      return {
        id: `${z}-${i}`,
        zone: z,
        t,
        ...point,
        visible:
          z < zone ||
          (z === zone &&
            q >= (z === 0 ? 0.6 : 0.5) &&
            t <= (q - (z === 0 ? 0.6 : 0.5)) / (z === 0 ? 0.4 : 0.5)),
      };
    }),
  );
  return {
    paths,
    seeds,
    loop,
    zone,
    q,
    hot: sterile && q >= 0.12 && q < 0.25,
    cooling: sterile && q >= 0.25 && q < 0.38,
    depositing: q >= (zone === 0 ? 0.6 : 0.5),
    sterile,
    route,
  };
}
export function pureCulture(
  progress: number,
  w: number,
  sterile = true,
  blank = false,
  contaminated = false,
) {
  const s = streakState(1, w, sterile);
  return blank
    ? contaminated
      ? [{ id: 'blank-contaminant', x: w / 2 + 12, y: 145, r: 2 + 3 * cultureClamp(progress) }]
      : []
    : s.seeds.map((a) => ({ ...a, r: 0.6 + 2.4 * cultureClamp(progress) }));
}
export function dilutionTransfer(progress: number, initialExponent = 1) {
  const p = cultureClamp(progress),
    removed = cultureClamp(p / 0.3),
    delivered = cultureClamp((p - 0.7) / 0.3),
    stockGPerMl = 10 ** -initialExponent;
  return {
    sourceMl: 10 - removed,
    pipetteMl: removed - delivered,
    receiverMl: 9 + delivered,
    sourceG: (10 - removed) * stockGPerMl,
    pipetteG: (removed - delivered) * stockGPerMl,
    receiverG: delivered * stockGPerMl,
    finalGPerMl: stockGPerMl / 10,
  };
}
export function cfuEstimate(counts: string[], exponent: number, platedMl = 0.1) {
  if (
    counts.length < 3 ||
    counts.some((x) => x.trim() === '' || !Number.isInteger(+x) || +x < 0) ||
    !Number.isFinite(exponent) ||
    exponent < 0 ||
    exponent > 12 ||
    !Number.isFinite(platedMl) ||
    platedMl <= 0
  )
    return null;
  const values = counts.map(Number),
    acceptable = values.every((x) => x >= 30 && x <= 300),
    mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    mean,
    acceptable,
    cfuPerGram: mean / (platedMl * 10 ** -exponent),
    unitMass: platedMl * 10 ** -exponent,
  };
}
export function colonySites(count: number, w: number) {
  const g = plateGeometry(w),
    n = Math.round(cultureClamp(count, 0, 400));
  return Array.from({ length: n }, (_, i) => {
    const theta = i * 2.399963229728653,
      r = (g.r - 9) * Math.sqrt((i + 0.5) / n);
    return { id: i, x: g.cx + r * Math.cos(theta), y: g.cy + r * Math.sin(theta) };
  });
}
export const screeningWells = Array.from({ length: 24 }, (_, i) => {
  const id = `${'ABCD'[Math.floor(i / 6)]}${(i % 6) + 1}`,
    base = 0.45 + ((i * 7) % 13) * 0.065,
    initial = id === 'A4' ? 2.1 : id === 'B3' ? 3.4 : id === 'D5' ? 1.9 : base,
    retest =
      id === 'A4'
        ? [1.9, 2, 2.1]
        : id === 'B3'
          ? [0.8, 0.9, 0.7]
          : id === 'D5'
            ? [1.8, 2, 1.9]
            : [base * 0.92, base, base * 1.08];
  return {
    id,
    initial,
    biomass: id === 'B3' ? 3 : id === 'A4' ? 0.8 : 0.5 + ((i * 3) % 7) * 0.3,
    retest,
    mean: retest.reduce((a, b) => a + b, 0) / 3,
  };
});
export function screeningRank(retest = false, perBiomass = false) {
  return [...screeningWells].sort(
    (a, b) =>
      (retest ? b.mean : b.initial) / (perBiomass ? b.biomass : 1) -
      (retest ? a.mean : a.initial) / (perBiomass ? a.biomass : 1),
  );
}
export function samplingUnits(
  kind: 'air' | 'water' | 'milk' | 'soil',
  count: number,
  volume: number,
  dilution = 1,
  active = true,
) {
  if (
    ![count, volume, dilution].every(Number.isFinite) ||
    volume <= 0 ||
    count < 0 ||
    dilution <= 0
  )
    return null;
  if (kind === 'air')
    return active
      ? { value: count / (volume / 1000), unit: 'CFU/m³' }
      : { value: count, unit: 'CFU/plate/time' };
  return { value: (count * dilution) / volume, unit: kind === 'soil' ? 'CFU/g' : 'CFU/mL' };
}

/** A closed, normalized nitrogen budget, not fitted growth kinetics.
 * U and A are nitrogen-equivalents in urea and available ammonia/ammonium.
 * B is newly assimilated biomass nitrogen. Carbon, energy and other needs
 * are held sufficient; transport/localization and cross-feeding are omitted.
 */
export function nitrogenPathway(
  progress: number,
  medium = 0,
  hydrolysis = true,
  assimilation = true,
) {
  const t = cultureClamp(progress) * 6;
  const initial = medium === 2 ? 0 : 2;
  const k = hydrolysis ? 1.2 : 0;
  const a = assimilation ? 0.8 : 0;
  let urea = medium === 0 ? initial * Math.exp(-k * t) : 0;
  let available = medium === 1 ? initial * Math.exp(-a * t) : 0;
  if (medium === 0) {
    available =
      k === 0
        ? 0
        : a === 0
          ? initial - urea
          : ((initial * k) / (a - k)) * (Math.exp(-k * t) - Math.exp(-a * t));
  }
  const biomass = Math.max(0, initial - urea - available);
  return { urea, available, biomass, total: initial, growth: biomass / 2 };
}

/** Apportion whole tenths together so a rounded display retains the exact
 * closed budget. This changes labels only, never the underlying simulation.
 */
export function nitrogenDisplay(pools: ReturnType<typeof nitrogenPathway>) {
  const raw = [pools.urea, pools.available, pools.biomass].map((v) => Math.max(0, v) * 10);
  const tenths = raw.map(Math.floor);
  const order = raw
    .map((v, i) => ({ i, remainder: v - tenths[i] }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const missing = Math.round(pools.total * 10) - tenths.reduce((a, b) => a + b, 0);
  for (let j = 0; j < missing; j++) tenths[order[j % order.length].i]++;
  return { urea: tenths[0] / 10, available: tenths[1] / 10, biomass: tenths[2] / 10 };
}

/** Two persistent tracer identities visualize a representative pathway.
 * Their staged movement is illustrative, not a count of molecules or an
 * independent simulation. Pool quantities come from nitrogenPathway above.
 */
export function nitrogenTracers(
  progress: number,
  medium = 0,
  hydrolysis = true,
  assimilation = true,
) {
  const p = cultureClamp(progress);
  return [0, 1].map((i) => {
    const released = medium === 1 ? 1 : hydrolysis ? cultureClamp((p - 0.08 - i * 0.06) / 0.25) : 0;
    const incorporated =
      assimilation && released === 1 ? cultureClamp((p - 0.43 - i * 0.06) / 0.3) : 0;
    return {
      id: `N${i + 1}`,
      visible: medium !== 2,
      stage: released < 1 ? 'urea' : incorporated < 1 ? 'available' : 'biomass',
      released,
      incorporated,
    };
  });
}

export type CultureSnapshot = {
  chapter: number;
  progress: number;
  nitrogenProgress: number;
  cultureGrowth: number;
  sterile: boolean;
  contaminated: boolean;
  blank: boolean;
  perBiomass: boolean;
  exponent: number;
  counts: string[];
  rep: number;
  medium: number;
  kind: 'air' | 'water' | 'milk' | 'soil';
  active: boolean;
  journal: string;
  hydrolysis: boolean;
  assimilation: boolean;
  compare: boolean;
  prediction: boolean;
};
export function cultureSpeechAnchors(locale: string) {
  return locale === 'en'
    ? {
        blank: 5.71,
        anomaly: 10.53,
        grown: 11.23,
        prediction: 15.03,
        compare: 20.57,
        nitrogen: [
          [0, 0],
          [2.55, 0.045],
          [6.17, 0.245],
          [9.99, 0.5],
          [11.19, 0.57],
          [15.03, 0.62],
          [20.57, 0.76],
          [31.59, 1],
        ],
      }
    : {
        blank: 5.55,
        anomaly: 10.27,
        grown: 11.35,
        prediction: 14.69,
        compare: 20.25,
        nitrogen: [
          [0, 0],
          [2.35, 0.045],
          [4.25, 0.11],
          [7.01, 0.245],
          [8.83, 0.38],
          [10.77, 0.57],
          [14.69, 0.62],
          [20.25, 0.76],
          [30.31, 1],
        ],
      };
}
/** Word timings from exact-PCM ASR plus the0.45s voice onset. These map a
 * narrated storyboard, not biological rates. Seek recomputes the same state.
 */
export function cultureSpeechProgress(chapter: number, seconds: number, locale: string) {
  const a = cultureSpeechAnchors(locale),
    en = locale === 'en';
  const keys =
    chapter === 5
      ? a.nitrogen
      : chapter === 2
        ? [
            [0, 0],
            [4.8, 0.38],
            [a.blank, 0.42],
            [a.anomaly, 0.67],
            [a.grown, 0.85],
            [23.4, 1],
          ]
        : chapter === 0
          ? [
              [0, 0],
              [en ? 5.55 : 6.09, 0.12],
              [en ? 12.87 : 12.65, 0.8],
              [20.5, 1],
            ]
          : chapter === 1
            ? [
                [0, 0],
                [en ? 3.47 : 3.31, 0],
                [en ? 13.69 : 13.65, 1],
              ]
            : null;
  if (!keys) return null;
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  for (let i = 1; i < keys.length; i++) {
    const [x0, y0] = keys[i - 1],
      [x1, y1] = keys[i];
    if (t <= x1) return cultureClamp(y0 + ((y1 - y0) * (t - x0)) / (x1 - x0));
  }
  return keys.at(-1)![1];
}
export function cultureDirector(
  chapter: number,
  progress: number,
  locale = 'zh',
  seconds?: number,
): CultureSnapshot {
  const p =
    seconds === undefined
      ? cultureClamp(progress)
      : (cultureSpeechProgress(chapter, seconds, locale) ?? cultureClamp(progress));
  return {
    chapter: Math.round(cultureClamp(chapter, 0, 11)),
    progress: p,
    nitrogenProgress: cultureClamp(p / 0.57),
    cultureGrowth:
      chapter === 2 ? (p >= 0.42 ? cultureClamp((p - 0.67) / 0.18) : cultureClamp(p / 0.38)) : p,
    sterile: true,
    blank: chapter === 2 && p >= 0.42,
    contaminated: chapter === 2 && p >= 0.67,
    perBiomass: chapter === 3 && p >= 0.56,
    exponent: 5,
    counts: ['96', '103', '101'],
    rep: Math.min(2, Math.floor(p * 3)),
    medium: 0,
    kind: chapter === 10 ? (p < 0.52 ? 'water' : 'milk') : chapter === 11 ? 'soil' : 'air',
    active: chapter !== 9 || p < 0.55,
    journal: '',
    hydrolysis: true,
    assimilation: true,
    compare: chapter === 5 && p >= 0.76,
    prediction: chapter === 5 && p >= 0.62 && p < 0.76,
  };
}
