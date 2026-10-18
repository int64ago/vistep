/** Ideal two-complex speciation at 25 C, using zero-ionic-strength constants from DOI 10.1016/j.ica.2017.06.017. */
export const IRON_SCN_K1 = 10 ** 2.85,
  IRON_SCN_K2 = 10 ** 1.51;
export function ironThiocyanate(ironTotal: number, ligandTotal: number) {
  const fe = Math.max(0, Math.min(0.02, ironTotal)),
    scn = Math.max(0, Math.min(0.1, ligandTotal));
  let lo = 0,
    hi = scn;
  for (let i = 0; i < 75; i++) {
    const l = (lo + hi) / 2,
      den = 1 + IRON_SCN_K1 * l + IRON_SCN_K1 * IRON_SCN_K2 * l * l,
      bound = (fe * (IRON_SCN_K1 * l + 2 * IRON_SCN_K1 * IRON_SCN_K2 * l * l)) / den;
    if (l + bound > scn) hi = l;
    else lo = l;
  }
  const ligand = (lo + hi) / 2,
    freeIron = fe / (1 + IRON_SCN_K1 * ligand + IRON_SCN_K1 * IRON_SCN_K2 * ligand ** 2),
    mono = freeIron * IRON_SCN_K1 * ligand,
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
export function ironRedox(reduction: number, oxidation: number) {
  const r = Math.max(0, Math.min(1, reduction)),
    o = Math.max(0, Math.min(1, oxidation)),
    initialFe3 = 0.0025,
    metalConsumed = (initialFe3 * r) / 2,
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
export function ironCycleDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode:
      chapter === 0
        ? 'test'
        : chapter === 1
          ? 'reduce'
          : chapter === 2
            ? 'decant'
            : chapter === 3
              ? 'oxidize'
              : chapter < 7
                ? 'equilibrium'
                : 'coordination',
    reduction: chapter === 1 ? Math.min(1, p / 0.65) : chapter === 2 || chapter === 3 ? 1 : 0,
    oxidation: chapter === 3 ? p : 0,
    ligand: chapter === 0 ? 0.0075 * p : 0.0075,
    remove: chapter === 5 ? p : chapter >= 6 ? 1 : 0,
    extra: chapter === 6 ? 0.02 * p : 0,
    progress: p,
  };
}

/** Ligand-limited illustrative starting mixture makes the concentration shift observable. */
export function ironEquilibriumSamples(remove = 0, extra = 0) {
  const initialLigand = 0.001;
  return {
    reference: ironThiocyanate(0.0025, initialLigand),
    removed: ironThiocyanate(0.0025 * (1 - Math.max(0, Math.min(1, remove))), initialLigand),
    added: ironThiocyanate(0.0025, initialLigand + Math.max(0, extra)),
  };
}
