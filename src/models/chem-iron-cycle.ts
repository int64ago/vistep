/** Ideal dilute two-complex distribution, 25 °C, I→0 constants from
 * de Berg et al. (2017), DOI 10.1016/j.ica.2017.06.017.
 * Hydration, activity corrections and Fe(II) complexation are omitted.
 * Colours and transition paths are explanatory, not fitted spectra or kinetics. */
export const IRON_SCN_K1 = 10 ** 2.85;
export const IRON_SCN_K2 = 10 ** 1.51;
const bounded = (v: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const ironEase = (p: number) => {
  const q = bounded(p);
  return q * q * (3 - 2 * q);
};
export const ironRamp = (t: number, a: number, b: number) => ironEase((t - a) / (b - a));
export function ironThiocyanate(ironTotal: number, ligandTotal: number) {
  const fe = bounded(ironTotal, 0, 0.02),
    scn = bounded(ligandTotal, 0, 0.1);
  let lo = 0,
    hi = scn;
  for (let i = 0; i < 80; i++) {
    const l = (lo + hi) / 2;
    const den = 1 + IRON_SCN_K1 * l + IRON_SCN_K1 * IRON_SCN_K2 * l * l;
    const bound = (fe * (IRON_SCN_K1 * l + 2 * IRON_SCN_K1 * IRON_SCN_K2 * l * l)) / den;
    if (l + bound > scn) hi = l;
    else lo = l;
  }
  const ligand = (lo + hi) / 2;
  const freeIron = fe / (1 + IRON_SCN_K1 * ligand + IRON_SCN_K1 * IRON_SCN_K2 * ligand ** 2);
  const mono = freeIron * IRON_SCN_K1 * ligand,
    bis = mono * IRON_SCN_K2 * ligand;
  return {
    freeIron,
    ligand,
    mono,
    bis,
    complex: mono + bis,
    ironTotal: fe,
    ligandTotal: scn,
    red: 1 - Math.exp(-(mono + bis) / 0.0015),
  };
}
export type IronMixture = ReturnType<typeof ironThiocyanate>;
export function ironQuotient(m: Pick<IronMixture, 'freeIron' | 'ligand' | 'mono' | 'bis'>) {
  const d1 = m.freeIron * m.ligand,
    d2 = m.mono * m.ligand;
  return {
    first: d1 > 0 ? m.mono / d1 / IRON_SCN_K1 : null,
    second: d2 > 0 ? m.bis / d2 / IRON_SCN_K2 : null,
  };
}
/** A conservative compositional path, explicitly NOT a rate law. */
export function ironEquilibriumPath(
  kind: 'remove' | 'add',
  perturbation: number,
  relaxation: number,
  amount = kind === 'remove' ? 0.5 : 0.001,
) {
  const reference = ironThiocyanate(0.0025, 0.001),
    p = bounded(perturbation),
    q = bounded(relaxation);
  const reduced = kind === 'remove' ? reference.freeIron * bounded(amount, 0, 0.9) * p : 0;
  const added = kind === 'add' ? bounded(amount, 0, 0.04) * p : 0;
  const instant = {
    ...reference,
    freeIron: reference.freeIron - reduced,
    ligand: reference.ligand + added,
    ironTotal: reference.ironTotal - reduced,
    ligandTotal: reference.ligandTotal + added,
  };
  const endpoint = ironThiocyanate(instant.ironTotal, instant.ligandTotal);
  const state = {
    ...instant,
    freeIron: mix(instant.freeIron, endpoint.freeIron, q),
    ligand: mix(instant.ligand, endpoint.ligand, q),
    mono: mix(instant.mono, endpoint.mono, q),
    bis: mix(instant.bis, endpoint.bis, q),
    complex: 0,
    red: 0,
  };
  state.complex = state.mono + state.bis;
  state.red = 1 - Math.exp(-state.complex / 0.0015);
  const feII = 1.5 * reduced,
    metalConsumed = 0.5 * reduced,
    potassium = added;
  const charge =
    3 * state.freeIron + 2 * state.mono + state.bis - state.ligand + 2 * feII + potassium;
  return {
    reference,
    instant,
    endpoint,
    state,
    feII,
    metalConsumed,
    potassium,
    reduced,
    added,
    charge,
    quotient: ironQuotient(state),
    totalIron: state.ironTotal + feII,
  };
}
export function ironRedox(reduction: number, oxidation: number) {
  const r = bounded(reduction),
    o = bounded(oxidation),
    initialFe3 = 0.0025;
  const metalConsumed = (initialFe3 * r) / 2,
    reducedFe2 = initialFe3 * r + metalConsumed,
    oxidized = reducedFe2 * o;
  return {
    fe3: initialFe3 * (1 - r) + oxidized,
    fe2: reducedFe2 - oxidized,
    metalConsumed,
    chlorineConsumed: oxidized / 2,
    totalDissolvedIron: initialFe3 + metalConsumed,
  };
}
/** Explicit limited-dose NET counterexample; no elementary order or rate claim. */
export function ironOxidantComparison(metalPresent: boolean) {
  return metalPresent
    ? {
        initialFeII: 2,
        initialMetal: 1,
        chlorine: 1,
        feIII: 0,
        feII: 3,
        chloride: 2,
        metal: 0,
        electrons: 2,
        charge: 4,
      }
    : {
        initialFeII: 2,
        initialMetal: 0,
        chlorine: 1,
        feIII: 2,
        feII: 0,
        chloride: 2,
        metal: 0,
        electrons: 2,
        charge: 4,
      };
}
export type IronPoint = { x: number; y: number };
function curved(a: IronPoint, b: IronPoint, p: number, rise = 24) {
  const q = ironEase(p);
  return { x: mix(a.x, b.x, q), y: mix(a.y, b.y, q) - Math.sin(Math.PI * q) * rise };
}
/** Persistent atoms/electron credits. Charges include credits while in transit.
 * These credits are bookkeeping, not freely flying electrons in aqueous solution. */
export function ironElectronFrame(
  direction: 'reduce' | 'oxidize',
  progress: number,
  width = 280,
  compact = false,
) {
  const p = bounded(progress),
    w = bounded(width, 240, 760),
    narrow = w < 500;
  const points =
    direction === 'reduce'
      ? [
          { x: w * 0.28, y: 58 },
          { x: w * 0.72, y: 58 },
          { x: w * 0.5, y: 184 },
        ]
      : [
          { x: w * 0.28, y: 58 },
          { x: w * 0.72, y: 58 },
          { x: w * 0.4, y: 175 },
          { x: w * 0.6, y: 175 },
        ];
  if (compact && direction === 'reduce') {
    points[0] = { x: w * 0.2, y: 72 };
    points[1] = { x: w * 0.46, y: 72 };
    points[2] = { x: w * 0.33, y: 184 };
  }
  if (!compact && !narrow && direction === 'reduce') {
    points[0] = { x: w * 0.22, y: 95 };
    points[1] = { x: w * 0.78, y: 95 };
  }
  const electrons = [0, 1].map((i) => {
    const departure = direction === 'reduce' ? 0.14 : 0.14 + 0.08 * i,
      arrival = 0.58 + 0.12 * i;
    const phase = p < departure ? 'donor' : p < arrival ? 'transfer' : 'receiver';
    const start =
      direction === 'reduce'
        ? { x: points[2].x + (i ? 9 : -9), y: points[2].y - 18 }
        : { x: points[i].x, y: points[i].y + 23 };
    const end =
      direction === 'reduce'
        ? { x: points[i].x, y: points[i].y + 23 }
        : { x: points[i + 2].x, y: points[i + 2].y - 23 };
    return {
      id: `e-${i}`,
      phase,
      ...curved(start, end, bounded((p - departure) / (arrival - departure)), i ? -17 : 17),
    };
  });
  const departing = electrons.filter((e) => e.phase !== 'donor').length,
    arriving = electrons.filter((e) => e.phase === 'receiver').length,
    inTransit = departing - arriving;
  const donorMove = direction === 'reduce' ? ironRamp(p, 0.14, 0.65) : 0;
  const atoms =
    direction === 'reduce'
      ? points.map((point, i) => ({
          id: i === 2 ? 'metal-Fe' : `solution-Fe-${i}`,
          element: 'Fe',
          charge: i === 2 ? departing : 3 - Number(electrons[i].phase === 'receiver'),
          phase: i === 2 ? (p < 0.14 ? 'metal' : 'aqueous') : 'aqueous',
          x: point.x,
          y: i === 2 ? mix(point.y, 118, donorMove) : point.y,
        }))
      : points.map((point, i) => ({
          id: i < 2 ? `solution-Fe-${i}` : `Cl-${i - 2}`,
          element: i < 2 ? 'Fe' : 'Cl',
          charge:
            i < 2
              ? 2 + Number(electrons[i].phase !== 'donor')
              : -Number(electrons[i - 2].phase === 'receiver'),
          phase: 'aqueous',
          ...point,
        }));
  return {
    atoms,
    electrons,
    donorMove,
    inTransit,
    deposited: arriving,
    departed: departing,
    charge: atoms.reduce((s, a) => s + a.charge, 0) - inTransit,
    aqueousIron: atoms.filter((a) => a.element === 'Fe' && a.phase === 'aqueous').length,
    totalIron: direction === 'reduce' ? 3 : 2,
    chlorineBond: direction === 'oxidize' && arriving === 0,
  };
}
/** Representative tagged aliquot; identities are not mole-count markers. */
export function ironAliquot(progress: number, width = 280) {
  const w = bounded(width, 240, 760),
    p = bounded(progress);
  return [0, 1, 2].map((i) => {
    const q = ironEase(p);
    return {
      id: i === 2 ? 'metal-Fe' : `solution-Fe-${i}`,
      charge: 2,
      phase: p === 0 ? 'source' : p === 1 ? 'receiver' : 'transfer',
      x: mix(w * 0.25, w * 0.75, q) + (i - 1) * 24,
      y: 150 + (i === 1 ? -24 : 0) - Math.sin(Math.PI * q) * 65,
    };
  });
}
/** N-end connectivity only: schematic positions, not crystallographic coordinates. */
export function ironCoordination(first: number, second: number, width = 280) {
  const w = bounded(width, 240, 760),
    p = bounded(first),
    q = bounded(second),
    cx = w / 2;
  const ligands = [p, q].map((a, i) => {
    const side = i ? -1 : 1,
      u = ironEase(a),
      y = i ? 150 : 100;
    const nitrogen = {
      x: cx + side * mix(Math.min(120, w / 2 - 54), 55, u),
      y: mix(i ? 183 : 45, 125, u),
    };
    return {
      id: `SCN-${i}`,
      progress: a,
      bound: a === 1,
      nitrogen,
      carbon: { x: nitrogen.x + side * 21, y: nitrogen.y },
      sulfur: { x: nitrogen.x + side * 42, y: nitrogen.y },
      water: {
        id: `water-${i}`,
        x: mix(cx + side * 43, cx + side * Math.min(110, w / 2 - 22), u),
        y: mix(125, y, u),
      },
    };
  });
  return {
    center: { id: 'Fe-centre', x: cx, y: 125, oxidationState: 3 },
    ligands,
    bound: Number(p === 1) + Number(q === 1),
    complexCharge: 3 - Number(p === 1) - Number(q === 1),
    ligandChargeOutside: -(Number(p < 1) + Number(q < 1)),
    totalCharge: 1,
  };
}
export const IRON_CYCLE_SECONDS = [31, 34, 28, 35, 29, 33.5, 32.5, 38] as const;
/** Measured bilingual word anchors, including the 0.45 s cue lead-in.
 * Presentation seconds select conservative model states, not reaction kinetics. */
export function ironCycleFilm(chapter: number, time: number, locale = 'zh') {
  const c = Math.round(bounded(chapter, 0, 7)),
    t = bounded(time, 0, IRON_CYCLE_SECONDS[c]),
    en = locale === 'en';
  const thresholds = (
    en
      ? [
          [4.95, 13.75, 17.47],
          [6.4, 14, 21.69],
          [11.31, 18.43],
          [14.5, 20.65, 24.15],
          [5.4, 17.2],
          [4.25, 14.07, 20.3],
          [8.65, 13.4, 16.43],
          [7.75, 11.7, 13.63],
        ]
      : [
          [5, 14.4, 19.95],
          [5.5, 12.5, 22.5],
          [11.8, 21.7],
          [13.1, 18.2, 24.43],
          [5.9, 16.75],
          [6.3, 15.07, 22.7],
          [10.17, 16.35, 20.57],
          [6.85, 11.35, 17.03],
        ]
  )[c];
  return {
    chapter: c,
    time: t,
    beat: thresholds.filter((v) => t >= v).length,
    progress: t / IRON_CYCLE_SECONDS[c],
    action:
      c === 0
        ? ironRamp(t, en ? 6.6 : 5.3, en ? 10.2 : 10.5)
        : c === 1
          ? ironRamp(t, en ? 6.4 : 5.5, en ? 14 : 12.5)
          : c === 2
            ? ironRamp(t, 0.8, en ? 4.85 : 5.8)
            : c === 3
              ? ironRamp(t, en ? 4.4 : 1.4, en ? 13.4 : 10.6)
              : c === 7
                ? ironRamp(t, en ? 7.8 : 6.9, en ? 11.5 : 10.75)
                : 0,
    binding: c === 3 ? ironRamp(t, en ? 14.5 : 13.1, en ? 19.8 : 17.7) : 0,
    exchange: c === 4 ? ironRamp(t, en ? 10.5 : 12.2, en ? 13.75 : 16.1) : 0,
    reveal: [0, 3, 6, 7].includes(c) ? t >= thresholds[2] : true,
    perturb:
      c === 5 ? ironRamp(t, 0.8, en ? 4.2 : 6.2) : c === 6 ? ironRamp(t, 1, en ? 3.1 : 5.1) : 0,
    relax:
      c === 5
        ? ironRamp(t, en ? 14.07 : 15.07, en ? 19.7 : 22.1)
        : c === 6
          ? ironRamp(t, en ? 8.65 : 10.17, en ? 12.95 : 15.7)
          : 0,
    second: c === 7 ? ironRamp(t, en ? 25.75 : 28.6, en ? 28.4 : 32.5) : 0,
  };
}
/** Legacy public API preserved for callers outside this scene. */
export function ironCycleDirector(chapter: number, progress: number) {
  const c = Math.round(bounded(chapter, 0, 7)),
    p = bounded(progress);
  return {
    mode: [
      'test',
      'reduce',
      'decant',
      'oxidize',
      'equilibrium',
      'equilibrium',
      'equilibrium',
      'coordination',
    ][c],
    reduction: c === 1 ? Math.min(1, p / 0.65) : c === 2 || c === 3 ? 1 : 0,
    oxidation: c === 3 ? p : 0,
    ligand: c === 0 ? 0.0075 * p : 0.0075,
    remove: c === 5 ? p : c >= 6 ? 1 : 0,
    extra: c === 6 ? 0.02 * p : 0,
    progress: p,
  };
}
export function ironEquilibriumSamples(remove = 0, extra = 0) {
  return {
    reference: ironThiocyanate(0.0025, 0.001),
    removed: ironThiocyanate(0.0025 * (1 - bounded(remove)), 0.001),
    added: ironThiocyanate(0.0025, 0.001 + bounded(extra, 0, 0.04)),
  };
}

/** Representative ligand route: supply→free solution→binding, or binding→free.
 * Marker position is not a mole counter; solution amounts come from the mixture model. */
export function ironLigandRoute(
  kind: 'remove' | 'add',
  perturbation: number,
  relaxation: number,
  width = 280,
) {
  const w = bounded(width, 240, 760),
    a = bounded(perturbation),
    r = a > 0 ? ironEase(relaxation) : 0,
    cx = w * 0.42;
  const bound = { x: cx + 70, y: 110 },
    free = { x: cx + 100, y: 164 };
  const entry = { x: mix(w - 32, free.x, ironEase(a)), y: mix(53, free.y, ironEase(a)) };
  return {
    id: 'tracked-equilibrium-SCN',
    x: kind === 'remove' ? mix(bound.x, free.x, r) : mix(entry.x, bound.x, r),
    y: kind === 'remove' ? mix(bound.y, free.y, r) : mix(entry.y, bound.y, r),
    bond: kind === 'remove' ? 1 - r : r,
    potassium: { x: mix(w - 91, w * 0.65, ironEase(a)), y: mix(53, 151, ironEase(a)) },
    phase:
      kind === 'add' && a === 0
        ? 'supply'
        : r === 1
          ? kind === 'add'
            ? 'bound'
            : 'free'
          : r === 0
            ? kind === 'add'
              ? 'free'
              : 'bound'
            : 'redistributing',
  };
}
