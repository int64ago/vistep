/** Population models and a spatial counting-chamber exercise. None of the synthetic
 * observations below are claimed to be textbook raw experimental records. */
export const growthClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function binaryPopulation(minutes: number, initial = 1, generationMinutes = 20) {
  const generations = Math.floor(
    growthClamp(minutes, 0, 4320) / growthClamp(generationMinutes, 1, 120),
  );
  return { generations, population: growthClamp(initial, 0, 1e9) * 2 ** generations };
}
export function logisticPopulation(days: number, initial = 5, carryingCapacity = 375, rate = 1.8) {
  const n = growthClamp(initial, 0, 1e6),
    k = growthClamp(carryingCapacity, 1, 1e6),
    r = growthClamp(rate, 0, 10),
    t = growthClamp(days, 0, 100);
  const value = n === 0 ? 0 : k / (1 + (k / n - 1) * Math.exp(-r * t));
  return { value, slope: r * value * (1 - value / k), capacity: k };
}
export const chamber = { sideMm: 0.2, depthMm: 0.1, cultureMl: 10 } as const;
export function chamberConcentration(
  count: number | null,
  dilution = 10,
  areaMm2 = 0.04,
  depthMm = 0.1,
) {
  if (
    count === null ||
    !Number.isFinite(count) ||
    count < 0 ||
    dilution < 1 ||
    !Number.isFinite(dilution) ||
    areaMm2 <= 0 ||
    depthMm <= 0 ||
    !Number.isFinite(areaMm2 * depthMm)
  )
    return null;
  const volumeMl = (areaMm2 * depthMm) / 1000;
  return {
    volumeMl,
    cellsPerMl: (count * dilution) / volumeMl,
    cultureCells: ((count * dilution) / volumeMl) * chamber.cultureMl,
  };
}
// Fixed illustrative observations, independent of the logistic model. Day zero included.
export const yeastExampleCounts = [4, 7, 15, 28, 35, 33, 22, 14];
export function yeastCount(day: number, replicate = 0) {
  return (
    yeastExampleCounts[Math.round(growthClamp(day, 0, 7))] +
    [-1, 0, 1][Math.round(growthClamp(replicate, 0, 2))]
  );
}
export type YeastCell = { id: number; x: number; y: number };
export const inCountingSquare = (c: YeastCell) => c.x >= 0 && c.x < 1 && c.y >= 0 && c.y < 1;
export function yeastCells(day: number, replicate = 0): YeastCell[] {
  const n = yeastCount(day, replicate);
  // Cell centers specify the boundary convention. All interior cells have fixed distinct slots.
  const cells = Array.from({ length: n - 2 }, (_, id) => ({
    id,
    x: 0.09 + (id % 6) * 0.155,
    y: 0.09 + Math.floor(id / 6) * 0.155,
  }));
  return [
    ...cells,
    { id: 101, x: 0, y: 0.34 },
    { id: 102, x: 0.34, y: 0 },
    { id: 103, x: 1, y: 0.67 },
    { id: 104, x: 0.67, y: 1 },
  ];
}
export function flaskCells(mix: number) {
  const p = growthClamp(mix);
  return Array.from({ length: 32 }, (_, id) => {
    const targetY = 158 + (id % 8) * 9,
      targetX = ((((id * 13) % 31) - 15) * (targetY - 90)) / 70;
    const startX = -42 + (id % 16) * 5.6,
      startY = 225 + Math.floor(id / 16) * 7;
    return { id, x: startX + (targetX - startX) * p, y: startY + (targetY - startY) * p };
  });
}
export function chamberFill(progress: number) {
  return growthClamp((progress - 0.25) / 0.55);
}
export const canopyClosure = [0, 0.2, 0.4, 0.6, 0.8, 1];
export const canopyEvidence = [
  {
    zh: '一年蓬',
    en: 'Annual fleabane',
    values: [15.3, 13.5, 10.8, 7.4, 4.3, 2.4],
    color: '#738d68',
  },
  {
    zh: '加拿大一枝黄花',
    en: 'Canada goldenrod',
    values: [10.4, 9.5, 6.1, 5.6, 3, 1.2],
    color: '#b49a57',
  },
  { zh: '刺儿菜', en: 'Creeping thistle', values: [3.7, 4.3, 8.5, 4.4, 2.2, 1], color: '#a17f9b' },
];
export function recordedMeans(records: (number | null)[][]) {
  return records.map((row) => {
    const valid = row.filter((n): n is number => n !== null && Number.isFinite(n) && n >= 0);
    return {
      n: valid.length,
      mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
    };
  });
}

/** A deliberately phenomenological birth/death decomposition, in day⁻¹.
 * For N/K ≤ 2 (the displayed domain), b − d = r(1 − N/K), so the
 * independently solved logistic curve and the two rate meters agree.
 * These are expected rates, NOT Gause's measured births or mortality. */
export function densityRates(population: number, capacity = 375, rate = 1.8) {
  const n = growthClamp(population, 0, 1e6),
    k = growthClamp(capacity, 1, 1e6);
  const r = growthClamp(rate, 0, 10),
    z = n / k,
    baseline = 0.4;
  const birthRate = Math.max(0, baseline + r - (r * z) / 2);
  const deathRate = baseline + (r * z) / 2;
  return {
    population: n,
    capacity: k,
    density: z,
    birthRate,
    deathRate,
    births: n * birthRate,
    deaths: n * deathRate,
    net: n * (birthRate - deathRate),
    logisticDomain: z <= 2,
  };
}
/** An environmental change does not instantaneously change the population.
 * It changes its subsequent rates. K is a model input, never a historical datum. */
export function changedCapacity(days: number, nextCapacity = 600, switchAt = 5, initial = 5) {
  const t = growthClamp(days, 0, 20),
    at = growthClamp(switchAt, 0, 20);
  const before = logisticPopulation(at, initial, 375);
  const current =
    t <= at
      ? logisticPopulation(t, initial, 375)
      : logisticPopulation(t - at, before.value, nextCapacity);
  return {
    ...current,
    switchPopulation: before.value,
    rates: densityRates(current.value, t <= at ? 375 : nextCapacity),
  };
}
/** Four persistent representative individuals; one seeded, possible short interval.
 * The competing-risk rule uses the same b/d rates as the expected population.
 * This small realization is NOT a population estimate or an exact rate measurement. */
export function renewalCohort(progress: number, density = 1) {
  const p = growthClamp(progress),
    rates = densityRates(100 * growthClamp(density, 0, 2), 100);
  const total = rates.birthRate + rates.deathRate;
  const probability = 1 - Math.exp(-total * 0.3);
  const eventUniforms = [0.12, 0.3, 0.76, 0.91],
    typeUniforms = [0.3, 0.65, 0.3, 0.8];
  const events = eventUniforms.map((u, i) => {
    const type =
      u >= probability ? 'stay' : typeUniforms[i] < rates.birthRate / total ? 'birth' : 'death';
    const start = -Math.log(1 - u) / total / 0.3;
    const phase = type === 'stay' ? 0 : growthClamp((p - start * 0.5) / 0.35);
    return { parent: `P${i + 1}`, daughters: [`P${i + 1}a`, `P${i + 1}b`], type, phase };
  });
  const births = events.filter((e) => e.type === 'birth' && e.phase === 1).length;
  const deaths = events.filter((e) => e.type === 'death' && e.phase === 1).length;
  return { events, births, deaths, count: 4 + births - deaths, rates, probability };
}
export type CountObservation = Readonly<{ count: number; dilution: number }>;
export function observation(count: number | null, dilution: number): CountObservation | null {
  if (chamberConcentration(count, dilution) === null) return null;
  return Object.freeze({ count: count!, dilution });
}
/** Convert each recorded aliquot with its OWN dilution before combining repeats. */
export function concentrationRecord(records: readonly (readonly (CountObservation | null)[])[]) {
  return records.map((row) => {
    const values = row.flatMap((item) => {
      const c = item ? chamberConcentration(item.count, item.dilution) : null;
      return c ? [c.cellsPerMl] : [];
    });
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return {
      n: values.length,
      mean,
      cultureCells: mean === null ? null : mean * chamber.cultureMl,
    };
  });
}
export const practiceObservations: readonly (readonly CountObservation[])[] = Object.freeze(
  yeastExampleCounts.map((n) =>
    Object.freeze([n - 1, n, n + 1].map((count) => observation(count, 10)!)),
  ),
);
/** Count field is a FIXED exercise at tenfold dilution. It is never retrospectively
 * altered by the dilution of a newly entered personal sample. */
export function nutrientPrediction(fed: boolean, cause: 'nutrient' | 'other', progress: number) {
  const p = growthClamp(progress);
  // Selected budding events, not a fitted growth rate or experimental result.
  const events = Array.from({ length: 4 }, (_, i) => ({
    id: `Y${i + 1}`,
    daughter: `Y${i + 1}b`,
    bud: fed && cause === 'nutrient' ? growthClamp((p - 0.2 - i * 0.09) / 0.35) : 0,
  }));
  return {
    events,
    births: events.filter((e) => e.bud === 1).length,
    count: 4 + events.filter((e) => e.bud === 1).length,
    cause,
    fed,
  };
}
/** Old eight chapters use measured retained-word times (+0.45 s cue inset).
 * Rewritten chapters3/7 use independently measured candidate speech (+0.45 s).
 * Root must verify final MP3 byte identity before using these anchors. */
export function populationDirector(
  chapter: number,
  time: number,
  duration: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(growthClamp(chapter, 0, 9)),
    t = growthClamp(time, 0, 300);
  const p = growthClamp(t / Math.max(1, duration)),
    en = locale === 'en';
  const group = c < 2 ? 0 : c < 4 ? 1 : c < 8 ? 2 : 3;
  const local = c - [0, 2, 4, 8][group];
  const state = {
    chapter: c,
    group,
    local,
    p,
    lineageGeneration: (en ? [7.2, 8.05, 11.6, 13.4, 15.2] : [6.25, 7.15, 10.7, 12.8, 15]).filter(
      (at) => t >= at,
    ).length,
    exponentGeneration:
      t < (en ? 4.8 : 4.6)
        ? 0
        : t < (en ? 5.7 : 5.2)
          ? 1
          : t < (en ? 6.8 : 5.9)
            ? 2
            : t < 15
              ? 3
              : 4,
    extrapolationReveal: t >= (en ? 12 : 11.8),
    lateObservation: growthClamp((t - (en ? 7.9 : 8.4)) / 0.6),
    mixing: growthClamp((t - 3.5) / 6),
    drop: growthClamp((t - 1.8) / 1.8),
    fill: growthClamp((t - 3.8) / (en ? 2 : 2.7)),
    countVolume: t >= (en ? 9.2 : 8.2),
    countConversion: t >= (en ? 15.2 : 13.4),
    countResult: t >= (en ? 18.2 : 17.8),
    shot:
      c === 3
        ? t < 4
          ? 'curve'
          : t < 12
            ? 'food'
            : t < 20
              ? 'rates'
              : t < 28
                ? 'renewal'
                : 'prediction'
        : c === 7
          ? t < 13
            ? 'record'
            : t < 20
              ? 'split'
              : 'prediction'
          : 'main',
    growthDay: growthClamp(t / 4) * 5,
    crowded: t >= 16,
    foodCrowded: t >= 8,
    foodProgress: growthClamp((t - (t >= 8 ? 8 : 4)) / 3),
    renewal: growthClamp((t - 20) / 6),
    prediction: growthClamp((t - (c === 3 ? 31 : 23)) / 7),
    recordDay: Math.min(7, Math.floor(t / 1.5)),
    initial: 5,
    capacity: c === 3 && t >= 31 ? 600 : 375,
    species: t < 5.8 ? 0 : t < (en ? 8.7 : 8.4) ? 1 : 2,
    rateDensity: t >= 16 ? 1 : 0.25,
    reveal: t >= 31,
  };
  const phase = (start: number, end: number) => growthClamp((t - start) / (end - start));
  const keyed = (knots: readonly (readonly [number, number])[]) => {
    if (t <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i++)
      if (t <= knots[i][0]) {
        const [a, x] = knots[i - 1],
          [b, y] = knots[i];
        return x + ((y - x) * (t - a)) / (b - a);
      }
    return knots[knots.length - 1][1];
  };
  if (c === 3) {
    const food = en ? 2.3 : 2.7,
      crowd = en ? 4.6 : 5.15,
      rates = en ? 7.5 : 8.75,
      renewal = en ? 22.15 : 24.83,
      prediction = en ? 28.15 : 30.77,
      change = en ? 32.3 : 34.4,
      grow = en ? 33.8 : 36.2;
    return {
      ...state,
      shot:
        t < food
          ? 'curve'
          : t < rates
            ? 'food'
            : t < renewal
              ? 'rates'
              : t < prediction
                ? 'renewal'
                : 'prediction',
      growthDay: 5,
      foodCrowded: t >= crowd,
      foodProgress: t < crowd ? phase(food, en ? 4.15 : 4.7) : phase(crowd, en ? 6.8 : 8.1),
      rateDensity: 0.25 + 0.75 * phase(en ? 9.85 : 11.1, en ? 18 : 20.9),
      crowded: t >= (en ? 18 : 20.9),
      renewal: keyed(
        en
          ? [
              [22.15, 0],
              [23.91, 0.08],
              [25.2, 0.433],
              [26.45, 0.58],
              [27.8, 1],
            ]
          : [
              [24.83, 0],
              [26.37, 0.08],
              [27.35, 0.433],
              [28.6, 0.58],
              [30.1, 1],
            ],
      ),
      prediction: phase(grow, en ? 36.6 : 39.3),
      capacity: t >= change ? 600 : 375,
      reveal: t >= change,
    };
  }
  if (c === 7)
    return {
      ...state,
      shot: t < (en ? 13.2 : 14.3) ? 'record' : t < (en ? 22.3 : 22.6) ? 'split' : 'prediction',
      prediction: phase(en ? 24.9 : 25.3, en ? 29.5 : 29.9),
      recordDay: Math.min(7, Math.floor(7 * phase(0.8, 5.3))),
    };
  return state;
}
/** A finite-supply allocation counterfactual, not a feeding-kinetics experiment.
 * Exactly the same 24 resource identities are allocated among a chosen number of
 * consumers. Its declining mean share motivates, but does NOT derive, b(N)/d(N). */
export function foodShareFrame(progress: number, consumers = 3, width = 272) {
  const p = growthClamp(progress),
    n = Math.round(growthClamp(consumers, 1, 24)),
    w = growthClamp(width, 240, 1200);
  // Layout dimensions provide room for distinct supply tokens; they are not cell-size data.
  const cells = Array.from({ length: n }, (_, i) => {
    const portions = Math.ceil((24 - i) / n),
      columns = Math.min(5, Math.ceil(Math.sqrt(portions))),
      rows = Math.ceil(portions / columns);
    return {
      id: `C${i + 1}`,
      x: w * 0.52 + (i % 4) * (w * 0.105),
      y: 75 + Math.floor(i / 4) * (n <= 12 ? 32 : 23),
      portions,
      columns,
      rows,
      rx: Math.max(n <= 12 ? 12 : 8, (columns - 1) * 3 + 6),
      ry: Math.max(n <= 12 ? 15 : 11, (rows - 1) * 3 + 9),
    };
  });
  const foods = Array.from({ length: 24 }, (_, i) => {
    const target = cells[i % n],
      x0 = 22 + (i % 4) * 17,
      y0 = 67 + Math.floor(i / 4) * 19;
    const q = growthClamp((p - 0.015 * i) / 0.42),
      slot = Math.floor(i / n),
      endX = target.x + ((slot % target.columns) - (target.columns - 1) / 2) * 6,
      endY = target.y + (Math.floor(slot / target.columns) - (target.rows - 1) / 2) * 6;
    return {
      id: `F${i + 1}`,
      consumer: target.id,
      progress: q,
      x: x0 + (endX - x0) * q,
      y: y0 + (endY - y0) * q,
    };
  });
  return {
    cells,
    foods,
    averageShare: 24 / n,
    arrived: foods.filter((f) => f.progress === 1).length,
  };
}
