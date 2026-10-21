const finite = (x: number, fallback = 0) => (Number.isFinite(x) ? x : fallback);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, finite(x, a)));
const smooth = (x: number) => {
  const q = clamp(x, 0, 1);
  return q * q * (3 - 2 * q);
};
/** Chosen event order demonstrates repeated substitution; it is not a yield or kinetic model. */
export const methaneEventOrder = [
  0, 1, 0, 2, 3, 0, 1, 0, 4, 2, 1, 2, 5, 4, 3, 2, 6, 5, 4, 3, 7, 6, 5, 4, 1, 7, 6, 5, 3, 7, 6, 7,
];
export function methaneSubstitution(progress: number, illuminated = true, chlorineUnits = 8) {
  const chlorine = clamp(chlorineUnits, 0, 32),
    used = illuminated ? clamp(progress, 0, 1) * chlorine : 0;
  const sites = Array(8).fill(0) as number[];
  for (let i = 0; i < 32; i++) sites[methaneEventOrder[i]] += clamp(used - i, 0, 1);
  const products = Array(5).fill(0) as number[];
  for (const s of sites) {
    const low = Math.floor(s),
      f = s - low;
    products[low] += 1 - f;
    if (f > 0) products[low + 1] += f;
  }
  const organicH = sites.reduce((sum, s) => sum + 4 - s, 0),
    organicCl = used,
    hcl = used,
    remainingChlorine = chlorine - used;
  const heavier = products[2] + products[3] + products[4];
  // Only a visual trend: no vapour-liquid, dissolution or hydrostatic calculation.
  const levelRise = (hcl + heavier) / (8 + Math.max(8, chlorine));
  return {
    progress: clamp(progress, 0, 1),
    illuminated,
    chlorine,
    used,
    sites,
    products,
    organicH,
    organicCl,
    hcl,
    remainingChlorine,
    heavier,
    levelRise,
    colour: chlorine > 0 ? remainingChlorine / chlorine : 0,
    atoms: {
      C: products.reduce((a, b) => a + b, 0),
      H: organicH + hcl,
      Cl: organicCl + hcl + 2 * remainingChlorine,
    },
  };
}
export function substitutionStep(replacements: number) {
  const r = clamp(Math.floor(replacements), 0, 3);
  return {
    before: { C: 1, H: 4 - r, Cl: r },
    after: { C: 1, H: 3 - r, Cl: r + 1 },
    chlorineReactant: 2,
    hcl: { H: 1, Cl: 1 },
  };
}

export const METHANE_IDS = [
  'same-mixture-light-control',
  'chlorine-colour-fades',
  'droplets-and-liquid-rise',
  'track-substitution-atoms',
  'mixture-not-single-product',
] as const;
export const METHANE_SECONDS = [27, 35, 31, 52, 50] as const;
export const METHANE_OBSERVATIONS = Object.freeze({
  freshDark: 'no-visible-change',
  light: Object.freeze(['chlorine-fades', 'wall-droplets', 'liquid-rises']),
});
export const METHANE_FORMULAS = ['CH₄', 'CH₃Cl', 'CH₂Cl₂', 'CHCl₃', 'CCl₄'];
export type LightCondition = 'light' | 'pulse' | 'dark';
type Point = { x: number; y: number };
type Atom = Point & { id: string; element: 'C' | 'H' | 'Cl'; radical: boolean };
type Bond = { a: string; b: string; opacity: number };

/** Selected chain, not kinetics: one methane, three Cl2, two substitutions,
 * then the two remaining Cl radicals recombine. All eleven atom IDs persist.
 * Positions interpolate endpoint connectivity; no transition-state trajectory is claimed. */
export function methaneChain(
  step: number,
  progress: number,
  width = 320,
  condition: LightCondition = 'light',
) {
  const requested = Math.round(clamp(step, 0, 6)),
    c = condition === 'dark' ? 0 : requested,
    p = condition === 'dark' ? 0 : clamp(progress, 0, 1),
    q = smooth(p),
    w = clamp(width, 260, 660),
    cx = w < 420 ? w * 0.29 : w * 0.3,
    rx = w < 420 ? w * 0.72 : w * 0.73;
  const base: Record<string, Point> = {
    C: { x: cx, y: 103 },
    H0: { x: cx + 38, y: 103 },
    H1: { x: cx, y: 145 },
    H2: { x: cx - 36, y: 111 },
    H3: { x: cx + 4, y: 61 },
    Cl0: { x: rx - 18, y: 45 },
    Cl1: { x: rx + 18, y: 45 },
    Cl2: { x: rx - 18, y: 105 },
    Cl3: { x: rx + 18, y: 105 },
    Cl4: { x: cx - 18, y: 194 },
    Cl5: { x: cx + 18, y: 194 },
  };
  const positions = [base];
  const next = (patch: Record<string, Point>) => {
    positions.push({ ...positions.at(-1)!, ...patch });
  };
  next({ Cl0: { x: rx - 27, y: 36 }, Cl1: { x: w - 22, y: 23 } });
  next({ H0: { x: rx - 18, y: 65 }, Cl0: { x: rx + 18, y: 65 } });
  next({ Cl2: base.H0, Cl3: { x: rx - 12, y: 139 } });
  next({ H1: { x: rx - 18, y: 154 }, Cl3: { x: rx + 18, y: 154 } });
  next({ Cl4: base.H1, Cl5: { x: rx - 12, y: 194 } });
  next({ Cl1: { x: rx - 18, y: 26 }, Cl5: { x: rx + 18, y: 26 } });
  const bonds: string[][][] = [
    [
      ['C', 'H0'],
      ['C', 'H1'],
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'Cl1'],
      ['Cl2', 'Cl3'],
      ['Cl4', 'Cl5'],
    ],
    [
      ['C', 'H0'],
      ['C', 'H1'],
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl2', 'Cl3'],
      ['Cl4', 'Cl5'],
    ],
    [
      ['C', 'H1'],
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'H0'],
      ['Cl2', 'Cl3'],
      ['Cl4', 'Cl5'],
    ],
    [
      ['C', 'H1'],
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'H0'],
      ['C', 'Cl2'],
      ['Cl4', 'Cl5'],
    ],
    [
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'H0'],
      ['C', 'Cl2'],
      ['Cl3', 'H1'],
      ['Cl4', 'Cl5'],
    ],
    [
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'H0'],
      ['C', 'Cl2'],
      ['Cl3', 'H1'],
      ['C', 'Cl4'],
    ],
    [
      ['C', 'H2'],
      ['C', 'H3'],
      ['Cl0', 'H0'],
      ['C', 'Cl2'],
      ['Cl3', 'H1'],
      ['C', 'Cl4'],
      ['Cl1', 'Cl5'],
    ],
  ];
  const radicals = [
    [],
    ['Cl0', 'Cl1'],
    ['C', 'Cl1'],
    ['Cl3', 'Cl1'],
    ['C', 'Cl1'],
    ['Cl5', 'Cl1'],
    [],
  ];
  const from = Math.max(0, c - 1),
    start = positions[from],
    end = positions[c],
    current = c === 0 || p < 0.5 ? from : c;
  const atoms: Atom[] = Object.entries(base).map(([id]) => ({
    id,
    element: id === 'C' ? 'C' : id.startsWith('H') ? 'H' : 'Cl',
    x: start[id].x + (end[id].x - start[id].x) * q,
    y: start[id].y + (end[id].y - start[id].y) * q,
    radical: radicals[current].includes(id),
  }));
  // The returning radical uses a clear outer lane; it never crosses an existing HCl molecule.
  if (c === 6) {
    const a = atoms.find((x) => x.id === 'Cl5')!,
      lane = w - 17;
    if (q < 0.2) {
      a.x = start.Cl5.x + (lane - start.Cl5.x) * smooth(q / 0.2);
      a.y = start.Cl5.y;
    } else if (q < 0.85) {
      a.x = lane;
      a.y = start.Cl5.y + (end.Cl5.y - start.Cl5.y) * smooth((q - 0.2) / 0.65);
    } else {
      a.x = lane + (end.Cl5.x - lane) * smooth((q - 0.85) / 0.15);
      a.y = end.Cl5.y;
    }
  }
  const bondKeys = new Set([...bonds[from], ...bonds[c]].map((x) => x.join('|')));
  const links: Bond[] = [...bondKeys].map((k) => {
    const [a, b] = k.split('|'),
      was = bonds[from].some((x) => x.join('|') === k),
      is = bonds[c].some((x) => x.join('|') === k);
    return { a, b, opacity: was && is ? 1 : is ? q : 1 - q };
  });
  // Radical counts label completed connectivity only; intermediate interpolation is explicitly a transition.
  const complete = p === 0 || p === 1 || c === 0,
    ledgerStage = current;
  return {
    width: w,
    step: c,
    progress: p,
    condition,
    atoms,
    bonds: links,
    transition: !complete && p > 0,
    ledgerStage,
    radicalIds: radicals[ledgerStage],
    radicalCount: radicals[ledgerStage].length,
    atomCount: { C: 1, H: 4, Cl: 6 },
    charge: 0,
    products: {
      organicCl: ledgerStage >= 5 ? 2 : ledgerStage >= 3 ? 1 : 0,
      hcl: ledgerStage >= 4 ? 2 : ledgerStage >= 2 ? 1 : 0,
      chlorine:
        ledgerStage === 0
          ? 3
          : ledgerStage === 6
            ? 1
            : ledgerStage >= 5
              ? 0
              : ledgerStage >= 3
                ? 1
                : 2,
    },
    lampOn: condition === 'light' || (condition === 'pulse' && c === 1 && p < 0.55),
    photonVisible: c === 1 && p < 0.55 && condition !== 'dark',
    boundary: 'selected elementary-event endpoints; interpolation is not measured molecular motion',
  };
}

function choose(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let v = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) v = (v * (n - i + 1)) / i;
  return v;
}
/** Exact equal-site finite combinatorics. All remaining C-H sites are assumed equally likely;
 * actual chloromethane reactivities differ, so these are NOT experimental yields or rates. */
export function methaneDistribution(methaneUnits: number, chlorineUnits: number) {
  const n = Math.round(clamp(methaneUnits, 1, 32)),
    m = Math.round(clamp(chlorineUnits, 0, 4 * n)),
    den = choose(4 * n, m),
    probabilities = Array.from(
      { length: 5 },
      (_, k) => (choose(4, k) * choose(4 * n - 4, m - k)) / den,
    ),
    expected = probabilities.map((p) => n * p),
    multiple = expected.slice(2).reduce((a, b) => a + b, 0);
  return {
    methane: n,
    chlorine: m,
    probabilities,
    expected,
    multiple,
    hcl: m,
    organicH: 4 * n - m,
    organicCl: m,
    atoms: { C: n, H: 4 * n, Cl: 2 * m },
    assumption: 'equal remaining C-H sites; not yield or kinetics',
  };
}
/** A fixed permutation supplies one reproducible realization, independent of the expectation.
 * Full site IDs remain visible across added chlorine and progress changes. */
export function methanePopulation(
  methaneUnits: number,
  chlorineUnits: number,
  progress = 1,
  illuminated = true,
) {
  const d = methaneDistribution(methaneUnits, chlorineUnits),
    order = Array.from({ length: d.methane * 4 }, (_, i) => i),
    hash = (i: number) => {
      let x = ((i + 1) * 2654435761) >>> 0;
      x ^= x >>> 16;
      x = Math.imul(x, 2246822519) >>> 0;
      return x;
    };
  order.sort((a, b) => hash(a) - hash(b));
  const completed = illuminated
      ? Math.min(d.chlorine, Math.floor(clamp(progress, 0, 1) * d.chlorine + 1e-9))
      : 0,
    chosen = new Set(order.slice(0, completed)),
    carbons = Array.from({ length: d.methane }, (_, i) => ({
      id: 'C' + i,
      sites: Array.from({ length: 4 }, (_, j) => ({
        id: `C${i}-H${j}`,
        replaced: chosen.has(i * 4 + j),
      })),
      count: 0,
    }));
  for (const c of carbons) c.count = c.sites.filter((s) => s.replaced).length;
  const counts = Array(5).fill(0) as number[];
  for (const c of carbons) counts[c.count]++;
  return {
    ...d,
    carbons,
    counts,
    completed,
    hcl: completed,
    organicH: 4 * d.methane - completed,
    organicCl: completed,
    remainingChlorine: d.chlorine - completed,
    order: order.map((i) => `C${Math.floor(i / 4)}-H${i % 4}`),
    atoms: { C: d.methane, H: 4 * d.methane, Cl: 2 * d.chlorine },
  };
}

/** Measured chapter-relative cuts, including the 0.45 s leading silence.
 * These are presentation times for the final 195 s bilingual tracks, not reaction rates.
 * Chapter 0 and 2 retain their existing 27 s / 31 s spans and observation progress. */
export const METHANE_MEASURED_CUTS = {
  zh: {
    zoom: 3.3,
    initiation: [4.9, 9.8],
    darkControl: [14.5, 18.9],
    chain: [
      [4.1, 9.1],
      [10.9, 17.4],
      [22.6, 25.4],
      [25.4, 27.6],
      [27.8, 32.5],
    ],
    population: [1, 13.7],
    question: 14.7,
    answer: 32.0,
  },
  en: {
    zoom: 3.2,
    initiation: [5.8, 10.9],
    darkControl: [15.1, 20.0],
    chain: [
      [3.8, 10.6],
      [11.9, 19.3],
      [23.4, 26.9],
      [26.9, 29.1],
      [29.1, 34.2],
    ],
    population: [1, 13.7],
    question: 14.3,
    answer: 33.5,
  },
} as const;
export function methaneDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(clamp(chapter, 0, 4)),
    t = Number.isFinite(chapterTime)
      ? clamp(chapterTime!, 0, METHANE_SECONDS[c])
      : clamp(progress, 0, 1) * METHANE_SECONDS[c],
    p = t / METHANE_SECONDS[c],
    cuts = METHANE_MEASURED_CUTS[locale === 'en' ? 'en' : 'zh'];
  let shot = 'control',
    step = 0,
    event = 0,
    reveal = true,
    condition: LightCondition = 'light';
  const interval = (a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
  if (c === 1) {
    shot =
      t < cuts.zoom
        ? 'fading'
        : t < cuts.darkControl[0]
          ? 'initiation'
          : t < cuts.darkControl[1]
            ? 'dark-control'
            : 'dark-question';
    step = 1;
    event = interval(cuts.initiation[0], cuts.initiation[1]);
    reveal = t >= cuts.darkControl[1];
    condition = t >= cuts.darkControl[1] ? 'pulse' : 'light';
  }
  if (c === 2) shot = 'physical-evidence';
  if (c === 3) {
    shot = 'chain';
    condition = 'pulse';
    // Each new event starts at the exact previous endpoint; no carrier/atom is replaced.
    const index = cuts.chain.findLastIndex(([start]) => t >= start);
    const selected = Math.max(0, index);
    step = selected + 2;
    event = interval(cuts.chain[selected][0], cuts.chain[selected][1]);
  }
  if (c === 4) {
    shot = t < cuts.question ? 'population' : t < cuts.answer ? 'ratio-question' : 'ratio-answer';
    reveal = t >= cuts.answer;
    event = interval(cuts.population[0], cuts.population[1]);
  }
  return {
    chapter: c,
    time: t,
    progress: p,
    shot,
    step,
    event,
    reveal,
    condition,
    reactionProgress:
      c === 0 ? 0 : c === 1 ? Math.min(1, t / 7) * 0.65 : c === 2 ? 0.65 + 0.35 * p : 1,
    ratioQuestion: t >= cuts.question,
    ratioReveal: t >= cuts.answer,
  };
}
