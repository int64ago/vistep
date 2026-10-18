const clamp = (x: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : lo));
export const precipitationPhase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
/** Dilute ideal equilibria at 25 C; activities replaced by concentrations. */
export function bariumSulfate(bariumMilliMoles: number) {
  const ba = clamp(bariumMilliMoles, 0, 2) / 1000,
    so4 = 0.001,
    volume = 0.1,
    ksp = 1.1e-10;
  let lo = 0,
    hi = Math.min(ba, so4);
  const initialQ = (ba * so4) / volume ** 2;
  if (initialQ > ksp) {
    for (let i = 0; i < 80; i++) {
      const x = (lo + hi) / 2,
        q = ((ba - x) * (so4 - x)) / volume ** 2;
      if (q > ksp) lo = x;
      else hi = x;
    }
  } else hi = 0;
  const precipitated = (lo + hi) / 2;
  return {
    precipitate: precipitated * 1000,
    barium: (ba - precipitated) * 1000,
    sulfate: (so4 - precipitated) * 1000,
    sodium: 2,
    chloride: ba * 2000,
    ksp,
    initialQ,
    equilibriumQ: ((ba - precipitated) * (so4 - precipitated)) / volume ** 2,
  };
}
export function magnesiumAcid(acidMolar: number) {
  const total = 0.01,
    ksp = 1.5e-11,
    kw = 1e-14,
    acid = clamp(acidMolar, 0, 0.04);
  let lo = -14,
    hi = 0;
  for (let i = 0; i < 100; i++) {
    const logH = (lo + hi) / 2,
      h = 10 ** logH,
      oh = kw / h,
      mg = Math.min(total, ksp / oh ** 2);
    if (2 * mg + h - oh - acid > 0) hi = logH;
    else lo = logH;
  }
  const h = 10 ** ((lo + hi) / 2),
    oh = kw / h,
    dissolved = Math.min(total, ksp / oh ** 2);
  return {
    pH: -Math.log10(h),
    dissolved,
    solid: total - dissolved,
    hydrogen: h,
    hydroxide: oh,
    acid,
    ksp,
    chargeResidual: 2 * dissolved + h - oh - acid,
  };
}
/** A causal, nonkinetic relaxation: acid is mixed at fixed final volume before solid dissolves.
 * Every frame conserves Mg, charge and Kw. Only settled states need satisfy the solid's Ksp. */
export function magnesiumAcidPerturbation(beforeAcid: number, afterAcid: number, progress: number) {
  const before = magnesiumAcid(beforeAcid),
    after = magnesiumAcid(afterAcid),
    p = ease(progress);
  const dissolved = before.dissolved + (after.dissolved - before.dissolved) * p,
    acid = after.acid;
  const r = acid - 2 * dissolved,
    root = Math.hypot(r, 2e-7);
  const hydrogen = r >= 0 ? (r + root) / 2 : 2e-14 / (root - r),
    hydroxide = 1e-14 / hydrogen;
  const Q = dissolved * hydroxide ** 2;
  return {
    dissolved,
    solid: Math.max(0, 0.01 - dissolved),
    acid,
    hydrogen,
    hydroxide,
    Q,
    ksp: after.ksp,
    saturation: Q / after.ksp,
    chargeResidual: 2 * dissolved + hydrogen - hydroxide - acid,
    magnesiumTotal: 0.01,
    progress: clamp(progress),
    settled: clamp(progress) === 1,
  };
}
export type SilverState = {
  agCl: number;
  agI: number;
  ag2S: number;
  aqueousAg: number;
  aqueousI: number;
  aqueousCl: number;
  aqueousS: number;
  initialSilver: number;
  iodideAdded: number;
  sulfideAdded: number;
  silverTotal: number;
  chlorideReleased: number;
  iodideReleased: number;
};
function silverState(
  agCl: number,
  agI: number,
  ag2S: number,
  total: number,
  I: number,
  S: number,
): SilverState {
  const aqueousAg = Math.max(0, total - agCl - agI - 2 * ag2S),
    aqueousI = Math.max(0, I - agI),
    aqueousCl = Math.max(0, total - agCl),
    aqueousS = Math.max(0, S - ag2S);
  return {
    agCl,
    agI,
    ag2S,
    aqueousAg,
    aqueousI,
    aqueousCl,
    aqueousS,
    initialSilver: total,
    iodideAdded: I,
    sulfideAdded: S,
    silverTotal: agCl + agI + 2 * ag2S + aqueousAg,
    chlorideReleased: aqueousCl,
    iodideReleased: aqueousI,
  };
}
/** Near-complete net inventory limit, NOT a full three-phase equilibrium or reaction-rate model.
 * Trace dissolution is omitted. Silver sulfide formation is taken as effectively complete under
 * the illustrated alkaline-sulfide conditions; released I must be allowed to re-form AgI. */
export function silverExchange(
  iodideAdded: number,
  sulfideAdded: number,
  initialSilver = 1,
): SilverState {
  const T = clamp(initialSilver),
    I = clamp(iodideAdded),
    S = clamp(sulfideAdded, 0, 0.5);
  const ag2S = Math.min(S, T / 2),
    agI = Math.min(I, Math.max(0, T - 2 * ag2S)),
    agCl = Math.max(0, T - 2 * ag2S - agI);
  return silverState(agCl, agI, ag2S, T, I, S);
}
export function silverSequenceStages(iodideAdded: number, sulfideAdded: number, initialSilver = 1) {
  const T = clamp(initialSilver),
    I = clamp(iodideAdded),
    S = clamp(sulfideAdded, 0, 0.5),
    boundI = Math.min(T, I);
  const converted = Math.min(T, 2 * S),
    fromI = Math.min(boundI, converted),
    fromCl = converted - fromI;
  const initial = silverState(T, 0, 0, T, I, 0),
    afterI = silverState(T - boundI, boundI, 0, T, I, 0);
  const beforeS = silverState(afterI.agCl, afterI.agI, 0, T, I, S);
  const intermediate = silverState(
    Math.max(0, T - boundI - fromCl),
    boundI - fromI,
    converted / 2,
    T,
    I,
    S,
  );
  const endpoint = silverExchange(I, S, T),
    reformed = endpoint.agI - intermediate.agI;
  return { initial, afterI, beforeS, intermediate, endpoint, fromI, fromCl, reformed };
}
/** Discrete representative inventory parcels, not molecular rates or residence times.
 * Each moving marker has one place: its source at local=0, water at 0<local<1,
 * and its destination at local=1. Sulfide parcels travel as pairs. */
export function silverTransferSlots(amountAg: number, paired: boolean, progress: number) {
  const amount = clamp(amountAg),
    count = Math.ceil((amount - 1e-10) / 0.1),
    perGroup = paired ? 2 : 1;
  const groups = Math.max(1, Math.ceil(count / perGroup)),
    p = clamp(progress);
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const group = Math.floor(i / perGroup);
    const raw =
      groups === 1
        ? clamp(p / 0.85)
        : group === 0
          ? clamp(p / 0.4)
          : clamp(((p - 0.4) / 0.6) * groups - (group - 1));
    const local = raw < 1e-10 ? 0 : raw > 1 - 1e-10 ? 1 : raw;
    return {
      amount: Math.min(0.1, Math.max(0, amount - i * 0.1)),
      local,
      phase: local === 0 ? 'source' : local === 1 ? 'target' : 'water',
    } as const;
  });
}
export function silverTransferLedger(
  start: SilverState,
  end: SilverState,
  progress: number,
): SilverState {
  const outI = Math.max(0, start.agI - end.agI),
    outCl = Math.max(0, start.agCl - end.agCl),
    outS = Math.max(0, 2 * (start.ag2S - end.ag2S));
  const slots = silverTransferSlots(outI + outCl + outS, end.ag2S > start.ag2S, progress);
  const departed = slots.filter((s) => s.phase !== 'source').reduce((v, s) => v + s.amount, 0),
    arrived = slots.filter((s) => s.phase === 'target').reduce((v, s) => v + s.amount, 0);
  const spentI = Math.min(outI, departed),
    spentCl = Math.min(outCl, Math.max(0, departed - spentI)),
    spentS = Math.max(0, departed - spentI - spentCl);
  const agI = start.agI - spentI + (end.agI > start.agI ? arrived : 0),
    agCl = start.agCl - spentCl + (end.agCl > start.agCl ? arrived : 0),
    ag2S = start.ag2S - spentS / 2 + (end.ag2S > start.ag2S ? arrived / 2 : 0);
  return silverState(
    Math.max(0, agCl),
    Math.max(0, agI),
    Math.max(0, ag2S),
    start.initialSilver,
    Math.max(start.iodideAdded, end.iodideAdded),
    Math.max(start.sulfideAdded, end.sulfideAdded),
  );
}
/** Conditional instability test, ONLY if a residual AgCl phase buffers dissolved Ag.
 * Ratio [I]/[Cl] uses same-volume amounts; these are not computed free-ion concentrations. */
export function silverIodideSaturationRatio(iodide: number, chloride: number) {
  const I = clamp(iodide),
    Cl = clamp(chloride);
  if (I === 0) return 0;
  return ((1.8e-10 / 8.5e-17) * I) / Math.max(Cl, 1e-12);
}
export type SilverRoute = 'iodide' | 'sulfide' | 'reform';
export function silverTransfer(
  iodide: number,
  sulfide: number,
  route: SilverRoute,
  progress: number,
) {
  const stages = silverSequenceStages(iodide, sulfide);
  const start =
    route === 'iodide'
      ? stages.initial
      : route === 'sulfide'
        ? stages.beforeS
        : stages.intermediate;
  const end =
    route === 'iodide'
      ? stages.afterI
      : route === 'sulfide'
        ? stages.intermediate
        : stages.endpoint;
  return {
    start,
    end,
    state: silverTransferLedger(start, end, progress),
    stages,
    route,
    progress: clamp(progress),
  };
}
/** Ten labelled representative Ag units, one instance of each ID in every view.
 * Exploration doses use tenths of a mmol Ag, so selected groups have integral marker counts.
 * The markers show identity, not concentrations or actual crystal formula units. */
export function silverTransferGeometry(
  width: number,
  iodide: number,
  sulfide: number,
  route: SilverRoute,
  progress: number,
  short = false,
) {
  const w = clamp(width, 240, 1000),
    compact = w < 560,
    p = clamp(progress);
  const nI = Math.round(clamp(iodide) * 10),
    nS = Math.round(clamp(sulfide, 0, 0.5) * 20);
  const initial = Array.from({ length: 10 }, () => 0),
    afterI = initial.map((_, i) => (i < nI ? 1 : 0));
  const intermediate = afterI.map((v, i) => (i < nS ? 2 : v)),
    endpoint = intermediate.slice();
  let remaining = Math.max(0, nI - intermediate.filter((x) => x === 1).length);
  for (let i = 0; i < 10 && remaining > 0; i++)
    if (endpoint[i] === 0) {
      endpoint[i] = 1;
      remaining--;
    }
  const from = route === 'iodide' ? initial : route === 'sulfide' ? afterI : intermediate;
  const to = route === 'iodide' ? afterI : route === 'sulfide' ? intermediate : endpoint;
  // A short screen still needs one explicit 2 Ag : 1 S formula unit.
  // Reserve its lower atom without shrinking the markers or moving the Ag rows.
  const height = compact ? (short ? 202 : 248) : 280,
    centres = [w * 0.17, w * 0.5, w * 0.83];
  const point = (phase: number, id: number) => ({
    x: centres[phase] + (0.5 - (id % 2)) * (compact ? 24 : 30),
    y:
      height -
      (short ? 49 : phase === 2 ? 53 : 31) -
      Math.floor(id / 2) * (short ? 26 : phase === 2 ? 36 : 25),
  });
  const movingIds = from.map((v, i) => (v !== to[i] ? i : -1)).filter((i) => i >= 0);
  const slots = silverTransferSlots(movingIds.length * 0.1, route === 'sulfide', p);
  const tokens = from.map((source, id) => {
    const target = to[id],
      a = point(source, id),
      b = point(target, id),
      moving = source !== target,
      local = moving ? slots[movingIds.indexOf(id)].local : 0,
      t = ease(local);
    const x = a.x + (b.x - a.x) * t,
      y = moving
        ? a.y +
          (b.y - a.y) * t -
          Math.sin(Math.PI * t) * Math.min(short ? 12 : 100, Math.min(a.y, b.y) - 20)
        : a.y;
    return {
      id: 'Ag-' + id,
      source,
      target,
      x,
      y,
      moving,
      phase: !moving ? source : local === 0 ? source : local === 1 ? target : 'water',
      localProgress: local,
      tracked: id === 0 || (route === 'reform' && id === nS),
    };
  });
  return { width: w, height, centres, tokens, compact };
}
/** Distinguishes Fe(OH)3 from free OH- and from hydroxide released by Mg(OH)2. */
export function magnesiumIron(
  ironMilliMoles: number,
  freeHydroxide: number,
  preparedMagnesium = 1,
) {
  const magnesium = clamp(preparedMagnesium);
  const iron = clamp(ironMilliMoles),
    oh = clamp(freeHydroxide, 0, 3);
  const direct = Math.min(iron, oh / 3),
    exchange = Math.min(iron - direct, (2 * magnesium) / 3);
  return {
    ironHydroxide: direct + exchange,
    magnesiumHydroxide: magnesium - 1.5 * exchange,
    dissolvedMagnesium: 1.5 * exchange,
    direct,
    exchange,
    freeHydroxide: oh - 3 * direct,
    freeIron: iron - direct - exchange,
  };
}
export type PrecipitationMode = 'barium' | 'acid' | 'silver' | 'iron';
export const PRECIPITATION_CHAPTER_IDS = [
  'barium',
  'spectators',
  'water-control',
  'acid',
  'silver-chloride',
  'silver-iodide',
  'silver-sulfide',
  'magnesium',
  'iron',
  'iron-pathways',
] as const;
/** Measured 2026-10-18 tracks. Seconds are relative to chapter start, including0.45s cue lead-in.
 * Event ranges align each language independently; movement speed remains explanatory, not kinetics. */
export const PRECIPITATION_DURATIONS = [22, 25.5, 25.5, 33, 19, 27, 24.5, 23, 29, 26.5] as const;
export const PRECIPITATION_SPEECH_EVENTS = {
  zh: {
    bariumMicro: 4.23,
    bariumTransfer: [6.11, 10.95],
    bariumLimited: 16.55,
    extraBarium: [14.13, 18.5],
    waterSurface: 4.13,
    waterReturn: 19.99,
    neutral: [0.7, 4.5],
    acidQ: 5.05,
    acidDissolve: [9.35, 14.6],
    acidCompare: 15.15,
    acidComplete: [17.5, 20.2],
    acidTotal: 22.57,
    silverSurface: [7.77, 13.63],
    iodideFirst: [0.75, 4.0],
    iodideContinue: [5.55, 13.8],
    iodideExpand: [18.29, 21.25],
    sulfideFirst: [0.65, 3.25],
    sulfideContinue: [8.9, 13.1],
    ironBegin: 2.65,
    ironMgFocus: 10.75,
    ironEnd: 13.8,
    ironNet: 14.77,
  },
  en: {
    bariumMicro: 3.81,
    bariumTransfer: [5.93, 10.6],
    bariumLimited: 16.03,
    extraBarium: [11.29, 15.0],
    waterSurface: 5.21,
    waterReturn: 21.31,
    neutral: [0.75, 5.75],
    acidQ: 6.1,
    acidDissolve: [10.59, 15.65],
    acidCompare: 16.27,
    acidComplete: [18.43, 21.5],
    acidTotal: 22.17,
    silverSurface: [4.99, 11.99],
    iodideFirst: [0.75, 3.9],
    iodideContinue: [4.91, 13.4],
    iodideExpand: [16.93, 20.57],
    sulfideFirst: [0.65, 3.6],
    sulfideContinue: [8.5, 13.5],
    ironBegin: 2.3,
    ironMgFocus: 11.63,
    ironEnd: 15.8,
    ironNet: 16.39,
  },
} as const;
export function precipitationDirector(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.floor(clamp(chapter, 0, 9)),
    duration = PRECIPITATION_DURATIONS[c],
    t = clamp(chapterTime, 0, duration),
    p = t / duration,
    id = PRECIPITATION_CHAPTER_IDS[c],
    e = PRECIPITATION_SPEECH_EVENTS[locale];
  const range = (r: readonly [number, number]) => precipitationPhase(t, r[0], r[1]);
  const mode: PrecipitationMode = c < 2 ? 'barium' : c < 4 ? 'acid' : c < 7 ? 'silver' : 'iron';
  // First0.4 of the explanatory transfer moves one inventory parcel. The remaining
  // parcels wait until the voice explicitly explains old-solid replenishment.
  let silverProgress = 0,
    silverIodide = 1;
  if (c === 5) {
    const expanded = t >= e.iodideExpand[0];
    silverIodide = expanded ? 1 : 0.4;
    silverProgress = expanded
      ? 0.58 + 0.42 * range(e.iodideExpand)
      : t < e.iodideContinue[0]
        ? 0.4 * range(e.iodideFirst)
        : 0.4 + 0.6 * range(e.iodideContinue);
  } else if (c === 6)
    silverProgress =
      t < e.sulfideContinue[0] ? 0.4 * range(e.sulfideFirst) : 0.4 + 0.6 * range(e.sulfideContinue);
  return {
    id,
    chapter: c,
    chapterTime: t,
    duration,
    progress: p,
    mode,
    dose:
      c === 0
        ? t >= e.bariumLimited
          ? 0.6
          : precipitationPhase(t, 0.3, 2.5)
        : 1 + range(e.extraBarium),
    bariumMicro: c === 0 && t >= e.bariumMicro,
    bariumTransfer: range(e.bariumTransfer),
    bariumLimited: c === 0 && t >= e.bariumLimited,
    spectators: c === 1,
    waterSamples: t < e.waterSurface || t >= e.waterReturn,
    waterExchange: Math.sin((Math.max(0, t - e.waterSurface) * Math.PI) / 3),
    acidShot: t < e.acidQ ? 'neutralize' : t < e.acidCompare ? 'dissolve' : 'compare',
    neutralProgress: range(e.neutral),
    acidRelax: range(e.acidDissolve),
    acidFinal: range(e.acidComplete),
    acidTotal: t >= e.acidTotal,
    silverRoute: (c === 6 ? 'sulfide' : 'iodide') as SilverRoute,
    silverProgress,
    silverIodide,
    silverSurface: c === 4,
    surfaceProgress: range(e.silverSurface),
    ironProgress: precipitationPhase(t, e.ironBegin, e.ironEnd),
    ironCompare: c === 9,
    ironNet: t >= e.ironNet,
    ironAmount: c === 7 ? 0 : 0.4,
    extraOH: 0,
  };
}
