/** Ideal reaction extents and illustrative transport; no food-safety prediction. */
export const fermentClamp = (x: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
export function fermentationState(wine = 0, vinegar = 0, oxygen = true) {
  const x = fermentClamp(wine),
    y = Math.min(x, fermentClamp(vinegar)) * (oxygen ? 1 : 0);
  // Start with one mol glucose. Oxygen is supplied externally in stage two.
  const glucose = 1 - x,
    ethanol = 2 * (x - y),
    co2 = 2 * x,
    acetate = 2 * y,
    oxygenUsed = 2 * y,
    water = 2 * y;
  return {
    glucose,
    ethanol,
    co2,
    acetate,
    oxygenUsed,
    water,
    carbon: glucose * 6 + ethanol * 2 + co2 + acetate * 2,
    massIn: 180 + oxygenUsed * 32,
    massOut: glucose * 180 + ethanol * 46 + co2 * 44 + acetate * 60 + water * 18,
  };
}
export function pickleState(days: number, salt = 5, sealed = true) {
  const t = fermentClamp(days, 0, 30),
    inhibition = Math.exp(-Math.max(0, fermentClamp(salt, 5, 20) - 5) / 5);
  // Selected homofermentative pathway, normalized carbon pools; not calibrated growth.
  const extent = 1 - Math.exp(-0.16 * t * inhibition);
  return {
    sugar: 1 - extent,
    lactate: extent,
    oxygenExposure: sealed ? 0 : 1,
    relativeRate: inhibition,
  };
}
export function jarGeometry(w: number) {
  const cx = w / 2,
    half = Math.min(78, w * 0.3),
    left = cx - half,
    right = cx + half;
  return {
    cx,
    half,
    left,
    right,
    water: 142,
    bottom: 252,
    neckLeft: cx - 30,
    neckRight: cx + 30,
    body: `M${cx - 30} 87V110Q${left} 115 ${left} 151V230Q${left} 252 ${left + 22} 252H${right - 22}Q${right} 252 ${right} 230V151Q${right} 115 ${cx + 30} 110V87`,
    gas: [
      { x: cx, y: 220 },
      { x: cx, y: 102 },
      { x: cx, y: 64 },
      { x: cx + 30, y: 64 },
      { x: cx + 30, y: 88 },
      { x: cx + 49, y: 88 },
      { x: cx + 49, y: 49 },
    ],
  };
}
export function nitriteResult(
  absorbance: string,
  blank = 0.02,
  slope = 0.04,
  volumeMl = 50,
  massG = 10,
  dilution = 2,
) {
  if (
    absorbance.trim() === '' ||
    !Number.isFinite(Number(absorbance)) ||
    ![blank, slope, volumeMl, massG, dilution].every(Number.isFinite) ||
    slope <= 0 ||
    massG <= 0 ||
    volumeMl <= 0 ||
    dilution < 1
  )
    return null;
  const a = Number(absorbance);
  if (a < blank || a > 0.42) return null;
  const extractMgL = (a - blank) / slope;
  return { extractMgL, foodMgKg: ((extractMgL * volumeMl) / massG) * dilution };
}
export function sampleMotion(progress: number, w: number) {
  const p = fermentClamp(progress),
    x0 = w * 0.24,
    x1 = w * 0.76,
    amount = 5;
  const removed = amount * fermentClamp(p / 0.25),
    delivered = amount * fermentClamp((p - 0.75) / 0.25);
  let x = x0,
    y = 184;
  if (p >= 0.25 && p < 0.4) y = 184 - (84 * (p - 0.25)) / 0.15;
  if (p >= 0.4 && p < 0.65) {
    x = x0 + ((x1 - x0) * (p - 0.4)) / 0.25;
    y = 100;
  }
  if (p >= 0.65 && p < 0.75) {
    x = x1;
    y = 100 + (56 * (p - 0.65)) / 0.1;
  }
  if (p >= 0.75) {
    x = x1;
    y = 156;
  }
  return { x, y, source: 50 - removed, pipette: removed - delivered, sample: delivered, total: 50 };
}
export function reactorState(time: number, aeration = 1, stir = 1, cooling = true) {
  const t = fermentClamp(time, 0, 20),
    air = fermentClamp(aeration),
    mix = fermentClamp(stir),
    kla = air * (0.08 + 0.52 * mix);
  let oxygen = 6,
    temp = 28,
    transferred = 0,
    consumed = 0,
    heatRemoved = 0;
  const dt = t / 400;
  for (let i = 0; i < 400; i++) {
    const transfer = kla * (8 - oxygen) * dt,
      use = Math.min(oxygen + transfer, ((0.65 * oxygen) / (0.5 + oxygen)) * dt);
    oxygen += transfer - use;
    transferred += transfer;
    consumed += use;
    const loss = (cooling ? 0.32 : 0.025) * (temp - 26) * dt;
    temp += 0.7 * dt - loss;
    heatRemoved += loss;
  }
  return {
    oxygen,
    temp,
    kla,
    transferred,
    consumed,
    heatRemoved,
    heatInput: 0.7 * t,
    air,
    mix,
    cooling,
  };
}
export function scaleGeometry(length: number) {
  const l = fermentClamp(length, 0.1, 10);
  return { area: 6 * l * l, volume: l * l * l, areaPerVolume: 6 / l };
}

/** PEP Elective 3 p8, PDF17: approximate readings of printed squares, ±1 mg/kg.
 * Exercise data, not measurements made by this app or universal fermentation days. */
export const PICKLE_TEXTBOOK_SERIES = Object.freeze(
  [
    { id: 'book-d3', day: 3, mgKg: 5 },
    { id: 'book-d5', day: 5, mgKg: 22 },
    { id: 'book-d7', day: 7, mgKg: 16 },
    { id: 'book-d9', day: 9, mgKg: 8 },
    { id: 'book-d11', day: 11, mgKg: 5 },
    { id: 'book-d13', day: 13, mgKg: 4 },
  ].map((x) => Object.freeze(x)),
);
const finitePositive = (x: number, max = 100) => fermentClamp(x, 0, max);
/** Closed N-equivalent sub-account A→B→C. Rates per model-time, NOT fermentation days.
 * C combines other N-containing products; no complete chemical or microbial mechanism. */
export function nitritePools(time: number, formation = 0.32, removal = 0.48) {
  const t = finitePositive(time),
    a = finitePositive(formation, 5),
    b = finitePositive(removal, 5);
  const nitrate = Math.exp(-a * t);
  const nitrite =
    a === 0
      ? 0
      : Math.abs(a - b) < 1e-8
        ? a * t * Math.exp(-a * t)
        : (a * (Math.exp(-a * t) - Math.exp(-b * t))) / (b - a);
  const other = Math.max(0, 1 - nitrate - nitrite);
  return {
    nitrate,
    nitrite,
    other,
    formed: 1 - nitrate,
    removed: other,
    inRate: a * nitrate,
    outRate: b * nitrite,
    total: nitrate + nitrite + other,
  };
}
/** One labelled N portion; wait quantiles are reproducible examples, not pool percentages. */
export function nitrogenMarker(
  index: number,
  time: number,
  formation = 0.32,
  removal = 0.48,
  w = 280,
) {
  const i = Math.round(fermentClamp(index, 0, 11)),
    a = finitePositive(formation, 5),
    b = finitePositive(removal, 5),
    t = finitePositive(time);
  const enter = a > 0 ? -Math.log(1 - (i + 0.5) / 12) / a : Infinity;
  const leave = b > 0 ? enter - Math.log(1 - (((i * 7) % 12) + 0.5) / 12) / b : Infinity;
  const left = w * 0.15,
    middle = w * 0.5,
    right = w * 0.85;
  const gap = leave - enter,
    halfIn = Number.isFinite(enter)
      ? Math.min(0.3, enter / 3, Number.isFinite(gap) ? gap / 3 : 0.3)
      : 0.3,
    halfOut = Number.isFinite(gap) ? Math.min(0.3, gap / 3) : 0.3;
  const travel = (at: number, from: number, to: number, half: number) => {
    const q = Number.isFinite(at) ? fermentClamp((t - at + half) / (2 * half)) : 0;
    return from + (to - from) * q;
  };
  const x =
    t < enter + halfIn
      ? travel(enter, left, middle, halfIn)
      : travel(leave, middle, right, halfOut);
  return {
    id: `N-${i + 1}`,
    x,
    y: 62 + (i % 4) * 29 + (Math.floor(i / 4) - 1) * 3,
    pool: t < enter ? 'nitrate' : t < leave ? 'nitrite' : 'other',
    enter,
    leave,
  };
}
/** Store the dilution with each independent result; an absent value is not zero. */
export function nitriteRecord(id: string, day: string, absorbance: string, dilution: number) {
  if (day.trim() === '' || !Number.isFinite(+day) || +day < 0) return null;
  const result = nitriteResult(absorbance, 0.02, 0.04, 50, 10, dilution);
  return Object.freeze({
    id,
    day: +day,
    absorbance: absorbance.trim() === '' ? null : +absorbance,
    dilution,
    result: result?.foodMgKg ?? null,
  });
}
/** Carbon-only net mapping. No interpolated geometry denotes a chemical intermediate. */
export function fermentationCarbon(
  kind: 'lactate' | 'ethanol' | 'acetate',
  progress: number,
  w = 280,
) {
  const p = fermentClamp(progress),
    q = p * p * (3 - 2 * p),
    gap = Math.min(29, (w - 38) / 7),
    cx = w / 2;
  return Array.from({ length: 6 }, (_, i) => {
    const n = i + 1,
      sx = cx + (i - 2.5) * gap,
      sy = 90;
    let tx = 0,
      ty = 0,
      product = '';
    if (kind === 'lactate') {
      tx = cx + (i < 3 ? -1 : 1) * w * 0.24 + ((i % 3) - 1) * gap;
      ty = 190;
      product = `lactate-${i < 3 ? 1 : 2}`;
    } else if (n === 3 || n === 4) {
      tx = cx + (n === 3 ? -1 : 1) * w * 0.23;
      ty = 40;
      product = `co2-${n === 3 ? 1 : 2}`;
    } else {
      const second = n > 4;
      tx = cx + (second ? 1 : -1) * w * 0.23 + (n === 1 || n === 5 ? -0.5 : 0.5) * gap;
      ty = 190;
      product = `${kind}-${second ? 2 : 1}`;
    }
    return { id: `C${n}`, n, x: sx + (tx - sx) * q, y: sy + (ty - sy) * q, product, p };
  });
}
export type ReactorEvent = { at: number; air?: number; mix?: number; cool?: boolean };
/** Piecewise controls change future rates, never recompute an already acquired stock. */
export function reactorHistory(
  time: number,
  options: {
    airOffAt?: number;
    coolOnAt?: number;
    air?: number;
    mix?: number;
    cool?: boolean;
    events?: ReactorEvent[];
  } = {},
) {
  const t = finitePositive(time, 40),
    a = fermentClamp(options.air ?? 1),
    initialMix = fermentClamp(options.mix ?? 1),
    on = options.coolOnAt ?? 0;
  const events: ReactorEvent[] = [
    ...(Number.isFinite(options.airOffAt) ? [{ at: Math.max(0, options.airOffAt!), air: 0 }] : []),
    ...(on > 0 && Number.isFinite(on) ? [{ at: on, cool: options.cool ?? true }] : []),
    ...(options.events ?? []),
  ]
    .filter((e) => Number.isFinite(e.at) && e.at >= 0)
    .sort((x, y) => x.at - y.at);
  const drivers = (at: number) => {
    let air = a,
      mix = initialMix,
      cooling = (options.cool ?? true) && on <= 0;
    for (const e of events) {
      if (e.at > at + 1e-9) break;
      if (e.air !== undefined) air = fermentClamp(e.air);
      if (e.mix !== undefined) mix = fermentClamp(e.mix);
      if (e.cool !== undefined) cooling = e.cool;
    }
    return { air, mix, cooling };
  };
  let oxygen = 6,
    temp = 28,
    transferred = 0,
    consumed = 0,
    heatRemoved = 0,
    shaftPhase = 0,
    at = 0;
  while (at < t - 1e-10) {
    let dt = Math.min(0.01, t - at);
    for (const e of events) if (e.at > at + 1e-9 && e.at < at + dt) dt = e.at - at;
    const { air, mix, cooling } = drivers(at),
      kla = air * (0.08 + 0.52 * mix);
    const transfer = kla * (8 - oxygen) * dt,
      use = Math.min(oxygen + transfer, ((0.65 * oxygen) / (0.5 + oxygen)) * dt),
      loss = (cooling ? 0.32 : 0.025) * (temp - 26) * dt;
    oxygen += transfer - use;
    temp += 0.7 * dt - loss;
    transferred += transfer;
    consumed += use;
    heatRemoved += loss;
    shaftPhase += mix * 1.2 * dt;
    at += dt;
  }
  const state = drivers(t);
  return {
    oxygen,
    temp,
    transferred,
    consumed,
    heatInput: 0.7 * t,
    heatRemoved,
    ...state,
    kla: state.air * (0.08 + 0.52 * state.mix),
    time: t,
    shaftPhase,
  };
}
export const FERMENT_CHAPTER_GROUPS = [0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4] as const;
/** Chapter-local anchors include the measured 0.45s speech lead-in. */
export function fermentationSpeechAnchors(locale = 'zh') {
  return locale === 'en'
    ? {
        sampleStart: 10.35,
        sampleDuration: 5.2,
        sampleEnd: 16.15,
        modelStart: 4.75,
        flowStart: 12.25,
        riseEnd: 14.85,
        fallAt: 15.3,
        predictionStart: 17.25,
        rerunStart: 22.3,
      }
    : {
        sampleStart: 8.85,
        sampleDuration: 5.2,
        sampleEnd: 14.45,
        modelStart: 5.7,
        flowStart: 11.7,
        riseEnd: 14.65,
        fallAt: 15.15,
        predictionStart: 17.6,
        rerunStart: 22.95,
      };
}
export function fermentationDirector(chapter: number, time: number, locale = 'zh') {
  const c = Math.round(fermentClamp(chapter, 0, 11)),
    t = finitePositive(time, 120),
    mode = FERMENT_CHAPTER_GROUPS[c],
    local = c - [0, 2, 4, 7, 9][mode],
    english = locale === 'en',
    a = fermentationSpeechAnchors(locale);
  const p = fermentClamp((t - 2) / 15),
    airStopAt = english ? 2.2 : 2.6,
    coolingOnAt = 3.3,
    vinegarStopAt = english ? 10.15 : 9.75;
  let shot = 'apparatus',
    process = p,
    rate = 0.48,
    showPrediction = false;
  if (c === 1 || c === 4) {
    shot = 'carbon';
    process = fermentClamp((t - 0.45) / (c === 1 ? 3 : 6));
  }
  if (c === 2) {
    shot = t < a.sampleStart ? 'records' : t < a.sampleEnd ? 'sample' : 'records';
    process = fermentClamp((t - a.sampleStart) / a.sampleDuration);
  }
  if (c === 3) {
    shot =
      t < a.modelStart
        ? 'calibration'
        : t < a.predictionStart
          ? 'nitrogen'
          : t < a.rerunStart
            ? 'prediction'
            : 'nitrogen';
    // Hold the original labelled portions while they are introduced; then pass
    // the analytical peak between the spoken formation/removal comparisons.
    const modelTime =
      t >= a.rerunStart
        ? 4 * fermentClamp((t - a.rerunStart) / 1.4) +
          8 * fermentClamp((t - a.rerunStart - 1.4) / 7)
        : 2.3 * fermentClamp((t - a.flowStart) / (a.riseEnd - a.flowStart)) +
          0.5 * fermentClamp((t - a.riseEnd) / (a.fallAt - a.riseEnd)) +
          3.2 * fermentClamp((t - a.fallAt) / (a.predictionStart - a.fallAt));
    process = modelTime / 12;
    showPrediction = t >= a.rerunStart;
    rate = showPrediction ? 0.96 : 0.48;
  }
  return {
    chapter: c,
    mode,
    local,
    t,
    p,
    shot,
    process,
    rate,
    showPrediction,
    airStopAt,
    coolingOnAt,
    vinegarStopAt,
    saltComparison: c === 1 && t >= (english ? 6.8 : 6.1),
    sealed: c !== 0 || t < (english ? 9.4 : 9.85),
    oxygen: c === 6 ? t < vinegarStopAt : c !== 10 || t < airStopAt,
    cooling: c !== 11 || t >= coolingOnAt,
    reactorTime: c === 10 || c === 11 ? t : Math.min(20, t),
    scale: 1 + fermentClamp((t - 0.5) / 3.3),
    recordsShown: c === 2 ? Math.min(6, Math.floor(t / 1.7) + 1) : 6,
  };
}
/** Selected net extent accumulates only while air is supplied; already formed acid remains. */
export function vinegarHistory(time: number, events: ReactorEvent[] = []) {
  const t = finitePositive(time, 40),
    schedule = events
      .filter((e) => Number.isFinite(e.at) && e.at >= 0 && e.air !== undefined)
      .sort((a, b) => a.at - b.at);
  let at = 0,
    air = 1,
    extent = 0;
  for (const e of [...schedule, { at: t, air: undefined }]) {
    const end = Math.min(t, e.at);
    if (end > at) extent += Math.max(0, end - Math.max(at, 4)) * 0.14 * air;
    at = end;
    if (e.at <= t && e.air !== undefined) air = fermentClamp(e.air);
    if (at >= t) break;
  }
  return { extent: fermentClamp(extent), air };
}

/** Integer labels for continuous pools; largest remainders keep the displayed account at100%. */
export function nitrogenPercentages(pools: { nitrate: number; nitrite: number; other: number }) {
  const raw = [pools.nitrate, pools.nitrite, pools.other].map((x) => fermentClamp(x) * 100),
    out = raw.map(Math.floor);
  const order = raw.map((x, i) => ({ i, r: x - out[i] })).sort((a, b) => b.r - a.r || a.i - b.i);
  const remainder = 100 - out.reduce((a, b) => a + b, 0);
  for (let n = 0; n < Math.min(3, remainder); n++) out[order[n].i]++;
  return out;
}
