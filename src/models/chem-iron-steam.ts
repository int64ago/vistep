export const IRON_STEAM_MASS = { Fe: 55.845, H: 1.008, O: 15.999 } as const;
const { Fe: FE, H, O } = IRON_STEAM_MASS,
  WATER = 2 * H + O,
  MAGNETITE = 3 * FE + 4 * O;
const clamp = (x: number, low = 0, high = 1) =>
  Number.isFinite(x) ? Math.max(low, Math.min(high, x)) : low;
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
/** Selected textbook endpoint; not a phase diagram, kinetic model or measured yield. */
export function ironSteam(ironGrams = 1, waterGrams = 0.5, extent = 1, hot = true) {
  const iron = clamp(ironGrams, 0, 2) / FE,
    water = clamp(waterGrams, 0, 1) / WATER,
    p = clamp(extent),
    maximum = Math.min(iron / 3, water / 4),
    reaction = hot ? maximum * p : 0,
    ironLeft = iron - 3 * reaction,
    waterLeft = water - 4 * reaction,
    oxide = reaction,
    hydrogen = 4 * reaction,
    oxygenInSolidGrams = 4 * O * reaction,
    ironLeftGrams = ironLeft * FE,
    waterLeftGrams = waterLeft * WATER,
    oxideGrams = oxide * MAGNETITE,
    hydrogenGrams = hydrogen * 2 * H,
    solidTotalGrams = ironLeftGrams + oxideGrams;
  return {
    iron,
    water,
    ironLeft,
    waterLeft,
    oxide,
    hydrogen,
    convertedFraction: iron ? (3 * reaction) / iron : 0,
    oxideGrams,
    hydrogenGrams,
    ironLeftGrams,
    waterLeftGrams,
    oxygenInSolidGrams,
    reactedIronGrams: 3 * FE * reaction,
    reactedWaterGrams: 4 * WATER * reaction,
    solidTotalGrams,
    limitingReactant:
      iron === 0 || water === 0
        ? 'missing'
        : Math.abs(iron / 3 - water / 4) < 1e-12
          ? 'both'
          : iron / 3 < water / 4
            ? 'iron'
            : 'water',
    massBefore: iron * FE + water * WATER,
    massAfter: solidTotalGrams + waterLeftGrams + hydrogenGrams,
  };
}
export type SteamAtom = {
  id: string;
  element: 'Fe' | 'O' | 'H';
  x: number;
  y: number;
  r: number;
  highlighted: boolean;
};
/** Fifteen persistent atoms describe net allocation, not an elementary reaction trajectory. */
export function ironSteamAtoms(progress: number, width = 258, pairing?: number) {
  const w = clamp(width, 250, 800),
    narrow = w < 500,
    p = clamp(progress),
    fe = narrow
      ? [
          [54, 70],
          [82, 118],
          [120, 80],
        ]
      : [
          [w * 0.14, 70],
          [w * 0.23, 118],
          [w * 0.31, 80],
        ],
    dest = narrow
      ? [
          [33, 114],
          [64, 38],
          [100, 151],
          [129, 116],
        ]
      : [
          [w * 0.11, 114],
          [w * 0.19, 38],
          [w * 0.28, 151],
          [w * 0.36, 116],
        ],
    centers = [
      [w * 0.66, 54],
      [w * 0.89, 54],
      [w * 0.66, 139],
      [w * 0.89, 139],
    ],
    atoms: SteamAtom[] = fe.map(([x, y], i) => ({
      id: `Fe${i}`,
      element: 'Fe',
      x,
      y,
      r: 15,
      highlighted: false,
    }));
  // Each visible oxygen is followed in turn; these staged routes are reading order, not chemical kinetics.
  const local = centers.map((_, i) => clamp(p * 4 - i));
  const paired = local.map((u) =>
    pairing === undefined ? ramp(u, 0.55, 0.9) : Math.min(clamp(pairing), ramp(u, 0.55, 0.9)),
  );
  const quadratic = (start: number[], control: number[], end: number[], u: number) => {
    const t = smooth(u);
    return {
      x: (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0],
      y: (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1],
    };
  };
  centers.forEach(([cx, cy], i) => {
    const u = local[i],
      left = narrow ? 20 : w * 0.055;
    let point: { x: number; y: number };
    if (i === 0) {
      point =
        u < 0.36
          ? quadratic([cx, cy], [cx, 18], [w * 0.4, 18], u / 0.36)
          : u < 0.72
            ? quadratic([w * 0.4, 18], [left, 18], [left, 70], (u - 0.36) / 0.36)
            : quadratic([left, 70], [left, 114], dest[i], (u - 0.72) / 0.28);
    } else if (i === 1) {
      point =
        u < 0.22
          ? quadratic([cx, cy], [cx, 20], [cx, 20], u / 0.22)
          : quadratic([cx, 20], [w * 0.4, 20], dest[i], (u - 0.22) / 0.78);
    } else if (i === 2) {
      point = quadratic([cx, cy], [cx, 95], dest[i], u);
    } else {
      point = quadratic([cx, cy], [cx, 98], dest[i], u);
    }
    atoms.push({ id: `O${i}`, element: 'O', ...point, r: 12, highlighted: i === 0 });
    for (const side of [-1, 1])
      atoms.push({
        id: `H${2 * i + (side === 1 ? 1 : 0)}`,
        element: 'H',
        x: cx + side * (15 - 4 * paired[i]),
        y: cy + 21,
        r: 10,
        highlighted: false,
      });
  });
  const bonds = centers.flatMap((_, i) => [
    { from: `O${i}`, to: `H${i * 2}`, opacity: 1 - ramp(local[i], 0, 0.3) },
    { from: `O${i}`, to: `H${i * 2 + 1}`, opacity: 1 - ramp(local[i], 0, 0.3) },
    { from: `H${i * 2}`, to: `H${i * 2 + 1}`, opacity: paired[i] },
  ]);
  return {
    width: w,
    progress: p,
    atoms,
    bonds,
    complete: p >= 1 && paired.every((x) => x >= 1),
    counts: { Fe: 3, O: 4, H: 8 },
    solidRight: narrow ? 151 : w * 0.4,
  };
}
/** A single bookkeeping batch moves through an explicit transfer account. No residence-time claim. */
export function ironSteamMassFrame(progress: number, water = 0.5, hot = true) {
  const p = clamp(progress),
    m = ironSteam(1, water, 1, hot),
    departed = p >= 0.25,
    arrived = p >= 0.75,
    moving = departed && !arrived,
    solid = 1 + (arrived ? m.oxygenInSolidGrams : 0),
    liquid = clamp(water, 0, 1) - (departed ? m.reactedWaterGrams : 0),
    gas = arrived ? m.hydrogenGrams : 0,
    transfer = moving ? m.reactedWaterGrams : 0;
  return {
    progress: p,
    move: ramp(p, 0.25, 0.75),
    departed,
    arrived,
    moving: moving && m.reactedWaterGrams > 0,
    model: m,
    solid,
    liquid,
    gas,
    transfer,
    total: solid + liquid + gas + transfer,
  };
}
export function ironSteamPrediction(
  progress = 1,
  waterA = 0.3,
  waterB = 0.6,
  reveal = false,
  secondProgress = progress,
) {
  const p = clamp(progress),
    q = clamp(secondProgress);
  return {
    A: ironSteam(1, waterA, p),
    B: ironSteam(1, waterB, q),
    progress: p,
    secondProgress: q,
    reveal,
  };
}
export const IRON_STEAM_PLANNED_SECONDS = [26, 38, 30, 26, 36] as const;
/** Chapter-local seconds from the two recorded tracks; 0.45s leading silence is already included.
 * Atom ordering is a net-account reading sequence, never a kinetic claim. */
export function ironSteamFilm(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const ch = Math.round(clamp(chapter, 0, 4)),
    t = clamp(chapterTime, 0, IRON_STEAM_PLANNED_SECONDS[ch]),
    en = locale === 'en',
    routeArrival = en ? 15.8 : 15.1,
    firstO = ramp(t, en ? 10.1 : 9.9, en ? 13.8 : 12.7),
    otherO = ramp(t, en ? 14.1 : 12.8, en ? 17 : 15.1);
  return {
    chapter: ch,
    time: t,
    route:
      t < routeArrival
        ? 0.6 * ramp(t, en ? 12 : 11.8, routeArrival)
        : 0.6 + 0.4 * ramp(t, routeArrival, en ? 18.4 : 17.2),
    atoms: ch === 1 ? 0.25 * firstO + 0.75 * otherO : 1,
    pairing: ramp(t, en ? 17.15 : 15.15, en ? 20.1 : 17.7),
    mass: t < 4 ? 0 : t < 7.8 ? 0.25 + 0.5 * ramp(t, 4, 7.8) : 1,
    massFocus:
      t < 4
        ? 'initial'
        : t < 7.8
          ? 'transfer'
          : t < (en ? 15.83 : 13.15)
            ? 'solid'
            : t < (en ? 20.47 : 17.75)
              ? 'gas'
              : t < (en ? 23.39 : 20.79)
                ? 'water'
                : 'total',
    evidence:
      t < (en ? 6.63 : 6.33) ? 'bubble' : t < (en ? 14.37 : 13.63) ? 'combustible' : 'combined',
    prediction: ramp(t, en ? 12.11 : 10.95, en ? 14.35 : 12.6),
    predictionB: ramp(t, en ? 16.39 : 13.71, en ? 18.65 : 15.85),
    reveal: ch === 4 && t >= (en ? 20.37 : 17.73),
    phase:
      ch === 0
        ? 'path'
        : ch === 1
          ? 'atoms'
          : ch === 2
            ? 'mass'
            : ch === 3
              ? 'evidence'
              : 'prediction',
  };
}
/** Legacy valid-call contract retained for cover/dependent consumers. */
export function ironSteamDirector(chapter: number, progress: number) {
  const p = clamp(progress);
  return {
    hot: chapter > 0,
    extent: chapter === 0 ? 0 : chapter === 1 ? p : 1,
    water: 0.5,
    iron: 1,
    test: chapter === 2,
    progress: p,
  };
}
export function steamPoint(points: [number, number][], progress: number) {
  const safe = points.filter((p) => p.every(Number.isFinite));
  if (!safe.length) return { x: 0, y: 0 };
  const lengths = safe.slice(1).map((v, i) => Math.hypot(v[0] - safe[i][0], v[1] - safe[i][1]));
  let n = clamp(progress) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (lengths[i] === 0) continue;
    if (n <= lengths[i])
      return {
        x: safe[i][0] + ((safe[i + 1][0] - safe[i][0]) * n) / lengths[i],
        y: safe[i][1] + ((safe[i + 1][1] - safe[i][1]) * n) / lengths[i],
      };
    n -= lengths[i];
  }
  return { x: safe.at(-1)![0], y: safe.at(-1)![1] };
}
