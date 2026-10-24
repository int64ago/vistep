export type Sugar = 'glucose' | 'sucrose' | 'maltose' | 'starch' | 'cellulose';
const clamp = (n: number, max = 1) => (Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0);
/** Endpoint-mixture teaching model; partial hydrolysis intermediates are omitted. */
export function sugarHydrolysis(sugar: Sugar, progress: number, degree = 1000) {
  const h = sugar === 'glucose' ? 0 : clamp(progress),
    n = Math.max(2, Math.round(clamp(degree, 10000))),
    poly = sugar === 'starch' || sugar === 'cellulose';
  const initial = {
    C: poly ? 6 * n : sugar === 'glucose' ? 6 : 12,
    H: poly ? 10 * n + 2 : sugar === 'glucose' ? 12 : 22,
    O: poly ? 5 * n + 1 : sugar === 'glucose' ? 6 : 11,
  };
  const glucose = sugar === 'glucose' ? 1 : poly ? n * h : sugar === 'maltose' ? 2 * h : h,
    fructose = sugar === 'sucrose' ? h : 0,
    remaining = sugar === 'glucose' ? 0 : 1 - h,
    waterUsed = poly ? (n - 1) * h : h;
  const hexoseUnits = poly ? n : sugar === 'glucose' ? 1 : 2;
  const reducing =
    (glucose + fructose + (sugar === 'maltose' || poly ? remaining : 0)) / hexoseUnits;
  return {
    sugar,
    hydrolysed: h,
    degree: n,
    glucose,
    fructose,
    remaining,
    waterUsed,
    hexoseUnits,
    reducing,
    iodine: sugar === 'starch' ? 1 - h : 0,
    atoms: {
      C: remaining * initial.C + 6 * (glucose + fructose),
      H: remaining * initial.H + 12 * (glucose + fructose),
      O: remaining * initial.O + 6 * (glucose + fructose),
    },
    initial,
  };
}
export function sugarReduction(
  sugar: Sugar,
  hydrolysis: number,
  progress: number,
  test: 'copper' | 'silver' = 'copper',
  alkaline = true,
  heated = true,
  amount = 1,
  metal = 2,
) {
  const sample = sugarHydrolysis(sugar, hydrolysis),
    a = clamp(amount, 4),
    initialMetal = clamp(metal, 8);
  const capable = sample.reducing * a,
    extent = alkaline && heated ? Math.min(capable, initialMetal / 2) * clamp(progress) : 0;
  return {
    sample,
    extent,
    initialMetal,
    metalRemaining: initialMetal - 2 * extent,
    metalReduced: 2 * extent,
    copperOxide: test === 'copper' ? extent : 0,
    silver: test === 'silver' ? 2 * extent : 0,
    electrons: 2 * extent,
    availableReducing: capable,
    remainingReducing: capable - extent,
    valid: alkaline,
    heated,
    visible: extent >= 0.02,
    fraction: initialMetal ? (2 * extent) / initialMetal : 0,
  };
}
export function sugarSolubility(sugar: Sugar, progress: number, warm = false) {
  const p = clamp(progress);
  return {
    dissolved: sugar === 'glucose' || sugar === 'sucrose' || sugar === 'maltose' ? p : 0,
    granules: sugar === 'starch' ? 1 - (warm ? 0.7 * p : 0) : sugar === 'cellulose' ? 1 : 1 - p,
    gel: sugar === 'starch' && warm ? p : 0,
  };
}
export function sugarDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 11)),
    p = clamp(progress);
  const sugar: Sugar =
    c === 6 || c === 7
      ? 'sucrose'
      : c === 3 || c === 4 || c === 5
        ? 'starch'
        : c === 8 || c === 9
          ? 'maltose'
          : c === 10 || c === 11
            ? 'cellulose'
            : 'glucose';
  return {
    chapter: c,
    progress: p,
    sugar,
    hydrolysis: c === 4 || c === 10 ? p : c === 5 || c === 7 || c === 11 ? 1 : 0,
    test: c === 1 ? ('silver' as const) : ('copper' as const),
  };
}

const smooth = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
/** One selected glucose, not the population distribution. Net connectivity only:
 * C1–O5 opens while C1–O1 becomes carbonyl; proton transfers/stereochemistry omitted.
 * Carbon and oxygen identities survive every seek. The chain C1..C6 never breaks.
 */
export function glucoseRingOpening(progress: number) {
  const q = smooth(progress);
  const ring = [
    [242, 78],
    [222, 140],
    [155, 156],
    [85, 136],
    [77, 67],
    [28, 25],
    [157, 36],
    [292, 78],
  ];
  const chain = [
    [257, 65],
    [211, 119],
    [165, 65],
    [119, 119],
    [73, 65],
    [27, 119],
    [73, 20],
    [293, 25],
  ];
  const ids = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'O5', 'O1'];
  return {
    progress: q,
    atoms: ids.map((id, i) => ({
      id,
      x: ring[i][0] + (chain[i][0] - ring[i][0]) * q,
      y: ring[i][1] + (chain[i][1] - ring[i][1]) * q,
    })),
    ringBond: 1 - q,
    carbonyl: q,
    formula: 'C6H12O6',
  };
}

/** Measured chapter-relative speech landmarks, including the 0.45s speech lead-in.
 * Separate languages share the canonical chapter window; no physical rate is inferred.
 * Silver: follow C1 → open ring → oxidise/accept electrons → replenish.
 * Copper: revisit the aldehyde → two accepting centres → valid/invalid conditions.
 */
export const SUGAR_SPEECH_CUTS = {
  zh: {
    silver: {
      follow: 2.0,
      open: 6.3,
      opened: 8.0,
      redox: 8.4,
      loss: 9.1,
      gained: 10.85,
      prediction: 11.29,
    },
    copper: {
      follow: 4.8,
      open: 4.8,
      opened: 6.4,
      redox: 6.6,
      loss: 6.81,
      gained: 11.65,
      prediction: 12.5,
    },
  },
  en: {
    silver: {
      follow: 2.5,
      open: 6.3,
      opened: 9.03,
      redox: 9.2,
      loss: 10.15,
      gained: 12.35,
      prediction: 12.77,
    },
    copper: {
      follow: 4.1,
      open: 4.1,
      opened: 5.67,
      redox: 5.85,
      loss: 5.87,
      gained: 11.95,
      prediction: 12.3,
    },
  },
} as const;
export function glucoseTestSequence(
  progress: number,
  silver = true,
  locale: 'zh' | 'en' = 'zh',
  duration = 23,
) {
  const t = clamp(progress) * Math.max(1, duration),
    cuts = SUGAR_SPEECH_CUTS[locale][silver ? 'silver' : 'copper'];
  return {
    opening: clamp((t - cuts.open) / (cuts.opened - cuts.open)),
    oxidation: clamp((t - cuts.loss) / (cuts.gained - cuts.loss)),
    product: t >= cuts.gained,
    replenishment: clamp((t - cuts.prediction) / Math.max(1, duration - cuts.prediction)),
    shot:
      t < cuts.follow
        ? 'observation'
        : t < cuts.redox
          ? 'opening'
          : t < cuts.prediction
            ? 'redox'
            : 'prediction',
  } as const;
}

/** Net alkaline aldehyde half reaction. R is the unchanged five-carbon residue.
 * RCHO + 3OH− → RCOO− + 2H2O + 2e−; combined with two one-electron metal reductions.
 * No claim of a single elementary transfer or of atom-specific solvent oxygen.
 */
export function glucoseOxidationAccount(extent: number) {
  const x = clamp(extent, 4);
  return {
    extent: x,
    hydroxideUsed: 3 * x,
    waterProduced: 2 * x,
    electrons: 2 * x,
    carboxylate: x,
    carbonOxidationBefore: 1,
    carbonOxidationAfter: 3,
  };
}
