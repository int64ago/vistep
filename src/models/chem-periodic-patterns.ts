const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, finite(v, lo)));
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
export const ELEMENT_SYMBOLS =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(
    ' ',
  );
export const PERIOD_LENGTHS = [2, 8, 8, 18, 18, 32, 32];
export type PeriodicBlock = 's' | 'p' | 'd' | 'ds' | 'f';
/** Teaching geometry uses a 14-cell f insertion. This does not settle group-3 conventions. */
export function periodicCell(z: number, expanded = 0) {
  const n = Math.round(clamp(z, 1, 118));
  let period = 0,
    offset = n - 1;
  while (offset >= PERIOD_LENGTHS[period]) offset -= PERIOD_LENGTHS[period++];
  const f = period >= 5 && offset >= 2 && offset < 16;
  const d = period >= 3 && offset >= (period >= 5 ? 16 : 2) && offset < (period >= 5 ? 26 : 12);
  const block: PeriodicBlock =
    offset < 2 ? 's' : f ? 'f' : d ? (offset >= (period >= 5 ? 24 : 10) ? 'ds' : 'd') : 'p';
  let compactX: number,
    compactY = period;
  if (period === 0) compactX = offset === 0 ? 0 : 17;
  else if (period < 3) compactX = offset < 2 ? offset : offset + 10;
  else if (period < 5) compactX = offset;
  else if (f) {
    compactX = offset + 1;
    compactY = period + 3;
  } else compactX = offset < 2 ? offset : offset - 14;
  const wideX =
    period === 0
      ? offset === 0
        ? 0
        : 31
      : period < 3
        ? offset < 2
          ? offset
          : offset + 24
        : period < 5
          ? offset < 2
            ? offset
            : offset + 14
          : offset;
  const t = clamp(expanded);
  return {
    z: n,
    symbol: ELEMENT_SYMBOLS[n - 1],
    period: period + 1,
    block,
    x: compactX * (1 - t) + wideX * t,
    y: compactY * (1 - t) + period * t,
    columns: 18 + 14 * t,
  };
}
export const PERIOD_3 = [
  { z: 11, symbol: 'Na', en: 0.9, ie: 5.13907696, s: 1, p: 0 },
  { z: 12, symbol: 'Mg', en: 1.2, ie: 7.646236, s: 2, p: 0 },
  { z: 13, symbol: 'Al', en: 1.5, ie: 5.985769, s: 2, p: 1 },
  { z: 14, symbol: 'Si', en: 1.8, ie: 8.15168, s: 2, p: 2 },
  { z: 15, symbol: 'P', en: 2.1, ie: 10.486686, s: 2, p: 3 },
  { z: 16, symbol: 'S', en: 2.5, ie: 10.3600167, s: 2, p: 4 },
  { z: 17, symbol: 'Cl', en: 3.0, ie: 12.967633, s: 2, p: 5 },
  { z: 18, symbol: 'Ar', en: null, ie: 15.7596119, s: 2, p: 6 },
];
export const GROUP_1 = [
  { symbol: 'Li', en: 1.0, ie: 5.391714996 },
  { symbol: 'Na', en: 0.9, ie: 5.13907696 },
  { symbol: 'K', en: 0.8, ie: 4.34066373 },
  { symbol: 'Rb', en: 0.8, ie: 4.1771281 },
  { symbol: 'Cs', en: 0.7, ie: 3.893905 },
];
export const GROUP_17 = [
  { symbol: 'F', en: 4.0, ie: 17.42282 },
  { symbol: 'Cl', en: 3.0, ie: 12.967633 },
  { symbol: 'Br', en: 2.8, ie: 11.81381 },
  { symbol: 'I', en: 2.5, ie: 10.451236 },
];
for (const list of [PERIOD_3, GROUP_1, GROUP_17]) {
  list.forEach(Object.freeze);
  Object.freeze(list);
}
/** Hund/Pauli occupancy display for a single subshell; no electron trajectories. */
export function orbitalOccupancy(electrons: number, orbitals: number) {
  const slots = Math.round(clamp(orbitals, 1, 7));
  const n = Math.round(clamp(electrons, 0, slots * 2));
  return Array.from({ length: slots }, (_, i) => (n > i ? 1 : 0) + (n > slots + i ? 1 : 0));
}
export function trendData(group: 'period' | 'alkali' | 'halogen', metric: 'en' | 'ie') {
  const data = group === 'period' ? PERIOD_3 : group === 'alkali' ? GROUP_1 : GROUP_17;
  return data.map((e) => ({
    symbol: e.symbol,
    value: metric === 'en' ? e.en : e.ie * 96.48533212,
  }));
}

export const PATTERN_IDS = [
  'period-rows',
  'table-forms',
  'valence-filling',
  'configuration-exceptions',
  'period-electronegativity',
  'alkali-trend',
  'halogen-trend',
  'ionization-dips',
] as const;
export const PATTERN_SECONDS = [25, 26, 29, 28, 25, 24, 30, 49] as const;
export const EV_TO_KJ_MOL = 96.48533212;
export type IonElement = 'Mg' | 'Al' | 'P' | 'S';
export const IONIZATION_RECORDS = Object.freeze([
  Object.freeze({
    symbol: 'Mg' as const,
    z: 12,
    ie: 7.646236,
    s: 2,
    p: 0,
    remove: '3s',
    slot: 0,
    spin: 1,
  }),
  Object.freeze({
    symbol: 'Al' as const,
    z: 13,
    ie: 5.985769,
    s: 2,
    p: 1,
    remove: '3p',
    slot: 0,
    spin: 0,
  }),
  Object.freeze({
    symbol: 'P' as const,
    z: 15,
    ie: 10.486686,
    s: 2,
    p: 3,
    remove: '3p',
    slot: 2,
    spin: 0,
  }),
  Object.freeze({
    symbol: 'S' as const,
    z: 16,
    ie: 10.3600167,
    s: 2,
    p: 4,
    remove: '3p',
    slot: 0,
    spin: 1,
  }),
]);
/** A selected energy-allowed ionization, NOT a cross section or probability model.
 * Initial atom/ion in ground state, free electron with negligible recoil. Below
 * threshold this channel is unavailable, not a statement about all excitation.
 * Arrow movement is an identity/occupancy ledger, not an electron trajectory.
 */
export function ionizationEvent(symbol: IonElement, energyEV: number, progress: number) {
  const record = IONIZATION_RECORDS.find((x) => x.symbol === symbol) ?? IONIZATION_RECORDS[0];
  const energy = clamp(energyEV, 0, 20),
    p = clamp(progress),
    allowed = energy >= record.ie;
  const move = allowed ? smooth((p - 0.15) / 0.65) : 0;
  const phase = move === 0 ? 'bound' : move === 1 ? 'free' : 'transfer';
  const electrons = (['3s', '3p'] as const).flatMap((shell) =>
    orbitalOccupancy(shell === '3s' ? record.s : record.p, shell === '3s' ? 1 : 3).flatMap(
      (n, slot) =>
        Array.from({ length: n }, (_, spin) => ({
          id: `${record.symbol}-${shell}-${slot}-${spin}`,
          shell,
          slot,
          spin,
          tracked: shell === record.remove && slot === record.slot && spin === record.spin,
        })),
    ),
  );
  return {
    record,
    energy,
    progress: p,
    allowed,
    move,
    phase,
    electrons,
    boundElectrons: record.z - (phase === 'bound' ? 0 : 1),
    transferElectrons: phase === 'transfer' ? 1 : 0,
    freeElectrons: phase === 'free' ? 1 : 0,
    residualCharge: phase === 'bound' ? 0 : 1,
    emittedCharge: phase === 'bound' ? 0 : -1,
    kineticEV: allowed ? Math.max(0, energy - record.ie) : null,
    thresholdKJ: record.ie * EV_TO_KJ_MOL,
  };
}
/** One continuous selected-token geometry. All positions are ledger positions. */
export function ionizationGeometry(
  symbol: IonElement,
  energy: number,
  progress: number,
  width: number,
) {
  const w = clamp(width, 260, 760),
    state = ionizationEvent(symbol, energy, progress);
  const slotWidth = 32,
    gap = 5,
    start = 94,
    free = { x: w - 26, y: 27 };
  const electrons = state.electrons.map((e) => {
    const x =
        (e.shell === '3s' ? 36 : start) + e.slot * (slotWidth + gap) + (e.spin === 0 ? 10 : 23),
      y = 70;
    const q = e.tracked ? state.move : 0;
    // Leave the occupied box vertically, then cross the clear counting lane.
    // This avoids visually occupying a different subshell during departure.
    const gx = q < 0.3 ? x : x + (free.x - x) * smooth((q - 0.3) / 0.5);
    const gy =
      q < 0.3
        ? y + (40 - y) * smooth(q / 0.3)
        : q < 0.8
          ? 40
          : 40 + (free.y - 40) * smooth((q - 0.8) / 0.2);
    return { ...e, x: gx, y: gy, phase: e.tracked ? state.phase : 'bound' };
  });
  return { ...state, width: w, start, slotWidth, gap, free, electrons };
}
export function configurationComparison(symbol: 'Cr' | 'Cu') {
  const s = symbol === 'Cu' ? 'Cu' : 'Cr',
    d = s === 'Cr' ? 5 : 10;
  return {
    symbol: s,
    core: 18,
    observed: { d, s: 1 },
    mnemonic: { d: d - 1, s: 2 },
    total: 18 + d + 1,
  };
}
/** Fixed source values are copied out. Prediction changes visibility only. */
export function halogenPrediction(reveal: boolean) {
  return GROUP_17.map((r, i) => ({
    symbol: r.symbol,
    value: i === 3 && !reveal ? null : r.en,
    hidden: i === 3 && !reveal,
    source: 'textbook-figure-1-23',
  }));
}
/** First six cuts follow independently decoded retained cue words, plus the 0.45 s lead-in.
 * Chapters six/seven remain provisional until the changed audio is measured. */
export const RETAINED_PATTERN_CUTS = {
  zh: {
    firstColumn: [0, 3.33, 3.73, 16.75],
    unfold: [1.8, 6.27],
    periodThree: [0, 4.25, 6.41, 9.85, 10.75, 11.65, 12.35, 13.23],
    copper: 4.95,
    periodEndpoints: 8.09,
    missingArgon: 16.55,
    alkaliNames: [0, 1.55, 2.07, 2.67, 3.21],
    roundedTie: 7.07,
  },
  en: {
    firstColumn: [0, 3.09, 4.07, 13.21],
    unfold: [1.5, 5.83],
    periodThree: [0, 4.51, 6.75, 10.45, 11.15, 12.25, 13.0, 13.55],
    copper: 6.79,
    periodEndpoints: 9.45,
    missingArgon: 16.23,
    alkaliNames: [0, 1.49, 2.47, 3.59, 4.41],
    roundedTie: 8.23,
  },
} as const;
export const MEASURED_PATTERN_CUTS = {
  zh: {
    iodineQuestion: 11.39,
    iodineReveal: 16.59,
    mgAlStart: 4.09,
    psStart: 11.31,
    mgMove: [4.3, 6.25],
    alMove: [6.6, 9.1],
    sMove: [17.77, 20.7],
    energyQuestion: 25.71,
    energyAnswer: 30.45,
    answerMove: [32.5, 36.3],
  },
  en: {
    iodineQuestion: 11.27,
    iodineReveal: 15.89,
    mgAlStart: 4.47,
    psStart: 12.45,
    mgMove: [4.9, 7.1],
    alMove: [7.9, 10.8],
    sMove: [18.55, 21.6],
    energyQuestion: 27.17,
    energyAnswer: 34.63,
    answerMove: [37.79, 41.1],
  },
} as const;
const eventProgress = (time: number, interval: readonly [number, number]) =>
  time <= interval[0]
    ? 0
    : time >= interval[1]
      ? 1
      : 0.15 + 0.65 * ((time - interval[0]) / (interval[1] - interval[0]));
const selectedCut = (time: number, cuts: readonly number[]) =>
  cuts.reduce((last, at, i) => (time >= at ? i : last), 0);
export function periodicDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(clamp(chapter, 0, 7)),
    p = clamp(progress),
    t = chapterTime === undefined ? p * PATTERN_SECONDS[c] : clamp(chapterTime, 0, 600);
  const cuts = RETAINED_PATTERN_CUTS[locale];
  const z = 11 + selectedCut(t, cuts.periodThree);
  const first = [3, 11, 19, 1];
  const exception = t < cuts.copper ? 'Cr' : 'Cu';
  const recordFocus =
    c === 4
      ? t >= cuts.missingArgon
        ? ['Ar']
        : t >= cuts.periodEndpoints
          ? ['Na', 'Cl']
          : []
      : c === 5
        ? t >= cuts.roundedTie
          ? ['K', 'Rb']
          : [GROUP_1[selectedCut(t, cuts.alkaliNames)].symbol]
        : [];
  // Word anchors include the 0.45 s lead-in. These are editorial times, not reaction rates.
  const last = MEASURED_PATTERN_CUTS[locale];
  const shot =
    c === 7
      ? t < last.mgAlStart
        ? 'observed-dips'
        : t < last.psStart
          ? 's-to-p'
          : t < last.energyQuestion
            ? 'paired-p'
            : t < last.energyAnswer
              ? 'energy-predict'
              : 'energy-answer'
      : c === 6
        ? t < last.iodineQuestion
          ? 'known-halogen'
          : t < last.iodineReveal
            ? 'iodine-predict'
            : 'iodine-answer'
        : c === 3
          ? exception === 'Cr'
            ? 'chromium'
            : 'copper'
          : c === 1
            ? 'table-unfold'
            : c === 2
              ? 'valence-fill'
              : c === 0
                ? 'same-column'
                : 'fixed-data';
  const ionPair = c === 7 && t >= last.psStart && t < last.energyQuestion ? 'PS' : 'MgAl';
  const ionProgressByElement = { Mg: 0, Al: 0, P: 0, S: 0 };
  if (c === 7) {
    if (shot === 's-to-p') {
      ionProgressByElement.Mg = eventProgress(t, last.mgMove);
      ionProgressByElement.Al = eventProgress(t, last.alMove);
    } else if (shot === 'paired-p') {
      // P is the neutral three-single-occupancy reference; only S is ionized here.
      ionProgressByElement.S = eventProgress(t, last.sMove);
    } else if (shot === 'energy-answer') {
      ionProgressByElement.Al = eventProgress(t, last.answerMove);
    }
  }
  return {
    chapter: c,
    progress: p,
    time: t,
    shot,
    z: c === 0 ? first[selectedCut(t, cuts.firstColumn)] : c === 1 ? 58 : z,
    expanded: c === 1 ? smooth((t - cuts.unfold[0]) / (cuts.unfold[1] - cuts.unfold[0])) : 0,
    group: (c === 5 ? 'alkali' : c === 6 ? 'halogen' : 'period') as 'period' | 'alkali' | 'halogen',
    metric: (c === 7 ? 'ie' : 'en') as 'en' | 'ie',
    exception: exception as 'Cr' | 'Cu',
    recordFocus,
    reveal: c !== 6 || t >= last.iodineReveal,
    ionPair,
    ionProgressByElement,
    energy: c === 7 && t >= last.energyQuestion ? 6.5 : null,
    answerVisible: c === 7 && t >= last.energyAnswer,
  };
}
