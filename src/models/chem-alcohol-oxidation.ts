/** Stoichiometric teaching accounts, not kinetic or microscopic pathways. */
const clamp = (x: number, max = 1) => (Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0);
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export function copperAlcoholCycle(
  time: number,
  air = true,
  ethanol = true,
  initialOxide = 0,
  ethanolUnits = 4,
) {
  const t = clamp(time, 4);
  const storedOxygen = clamp(initialOxide),
    availableEthanol = clamp(ethanolUnits, 4);
  let oxide = storedOxygen,
    oxygenAtoms = 0,
    aldehyde = 0;
  for (let i = 0; i < Math.ceil(t); i++) {
    const phase = clamp(t - i);
    const oxidized = air ? (1 - oxide) * smooth((phase - 0.15) / 0.3) : 0;
    oxide += oxidized;
    oxygenAtoms += oxidized;
    const reduced = ethanol
      ? Math.min(oxide, Math.max(0, availableEthanol - aldehyde)) * smooth((phase - 0.6) / 0.4)
      : 0;
    oxide -= reduced;
    aldehyde += reduced;
  }
  const phase = t > 0 && t === Math.floor(t) ? 1 : t % 1;
  const travel = phase < 0.15 ? 1 - smooth(phase / 0.15) : smooth((phase - 0.45) / 0.15);
  return {
    time: t,
    initialOxide: storedOxygen,
    ethanolRemaining: availableEthanol - aldehyde,
    electronsToCopper: 2 * aldehyde,
    electronsToOxygen: 2 * oxygenAtoms,
    phase,
    copper: 1 - oxide,
    oxide,
    oxygen: oxygenAtoms / 2,
    ethanolUsed: aldehyde,
    aldehyde,
    water: aldehyde,
    x: 80 + 140 * travel,
    y: 150 + 35 * travel,
    heating: phase >= 0.15 && phase <= 0.45,
    copperTotal: 1,
  };
}
export function dichromateAlcohol(progress: number, ethanol = 3, dichromate = 2, acid = 16) {
  const e = clamp(ethanol, 10),
    d = clamp(dichromate, 10),
    h = clamp(acid, 100);
  const extent = Math.min(e / 3, d / 2, h / 16) * clamp(progress);
  const remainingDichromate = d - 2 * extent,
    chromiumIII = 4 * extent;
  const fraction = d ? chromiumIII / (2 * d) : 0;
  const color = d
    ? [214 + (113 - 214) * fraction, 156 + (150 - 156) * fraction, 82 + (113 - 82) * fraction].map(
        Math.round,
      )
    : [223, 232, 222];
  return {
    initial: { ethanol: e, dichromate: d, acid: h },
    extent,
    ethanol: e - 3 * extent,
    dichromate: remainingDichromate,
    acid: h - 16 * extent,
    aceticAcid: 3 * extent,
    chromiumIII,
    water: 11 * extent,
    electrons: 12 * extent,
    fraction,
    color: `rgb(${color.join(',')})`,
  };
}
/** A formal oxidation-number account; markers are not orbitals or a surface pathway. */
export function ethanolAtomAccount(progress: number) {
  const p = smooth(progress);
  return {
    progress: p,
    atoms: [
      { id: 'C-methyl', element: 'CH₃', x: 45, y: 84, origin: 'ethanol' },
      { id: 'C-alpha', element: 'C', x: 115, y: 84, origin: 'ethanol' },
      { id: 'O-ethanol', element: 'O', x: 191, y: 84, origin: 'ethanol' },
      { id: 'H-alpha-removed', element: 'H', x: 115 + 51 * p, y: 25 + 134 * p, origin: 'ethanol' },
      { id: 'H-hydroxyl', element: 'H', x: 255 - 9 * p, y: 84 + 75 * p, origin: 'ethanol' },
      { id: 'H-alpha-retained', element: 'H', x: 115, y: 141, origin: 'ethanol' },
      { id: 'O-oxide', element: 'O', x: 206, y: 209 - 25 * p, origin: 'oxide' },
    ],
    initialCarbonOxidation: -1,
    finalCarbonOxidation: 1,
    electronEquivalents: 2,
    initialCopperOxidation: 2,
    finalCopperOxidation: 0,
    // Endpoints are balanced independently; interpolated geometry is not a chemical species.
    endpoints: { carbon: 2, hydrogen: 6, oxygen: 2, copper: 1 },
  };
}
export const ALCOHOL_OXIDATION_SECONDS = [26, 29, 48.5, 42, 28, 54.5] as const;
// Chapter-local times include the 0.45 s voiced lead-in. Measured against v02 PCM.
export const ALCOHOL_MEASURED_CUTS = {
  zh: {
    ledger: 6.37,
    cancel: 10.89,
    stock: 19.93,
    copperAnswer: 29.55,
    copperUnit: 31.21,
    atoms: 16.39,
    atomMove: 19.93,
    water: 26.85,
    four: 14.59,
    six: 20.25,
    match: 21.63,
    double: 26.41,
    acidAnswer: 34.35,
    acidUnit: 38.09,
  },
  en: {
    ledger: 7.25,
    cancel: 10.53,
    stock: 20.55,
    copperAnswer: 29.17,
    copperUnit: 31.11,
    atoms: 18.69,
    atomMove: 23.85,
    water: 31.75,
    four: 16.83,
    six: 23.73,
    match: 25.43,
    double: 30.63,
    acidAnswer: 39.33,
    acidUnit: 43.31,
  },
} as const;
export function alcoholOxidationDirector(
  chapter: number,
  progress: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.floor(clamp(chapter, 5)),
    p = clamp(progress),
    t = p * ALCOHOL_OXIDATION_SECONDS[c];
  const cut = ALCOHOL_MEASURED_CUTS[locale];
  const prediction = (c === 2 && t >= cut.stock) || (c === 5 && t >= cut.double);
  const answer = !prediction || t >= (c === 2 ? cut.copperAnswer : cut.acidAnswer);
  const shot =
    c === 2
      ? t < cut.ledger
        ? 'cycle'
        : t < cut.stock
          ? 'cancel'
          : 'prediction'
      : c === 3
        ? t < cut.atoms
          ? 'electrons'
          : 'atoms'
        : c === 5
          ? t < cut.match
            ? 'ladder'
            : t < cut.double
              ? 'match'
              : 'prediction'
          : 'observation';
  return {
    chapter: c,
    progress: p,
    localTime: t,
    shot,
    answer,
    ledgerCancelled: t >= cut.cancel,
    ethanolEquivalentsVisible: c === 5 && t >= cut.four,
    dichromateEquivalentsVisible: c === 5 && t >= cut.six,
    matchVisible: c === 5 && t >= cut.match,
    cycleTime:
      c === 0
        ? 0.15 + 0.3 * p
        : c === 1
          ? 0.45 + 0.55 * p
          : c === 2
            ? t < cut.stock
              ? 1 + 2 * smooth((t - 0.45) / 5.6)
              : answer
                ? 0.6 +
                  0.4 * smooth((t - cut.copperAnswer) / (cut.copperUnit - cut.copperAnswer)) +
                  smooth((t - cut.copperUnit) / 6)
                : 0
            : 1,
    initialOxide: prediction && c === 2 ? 1 : 0,
    air: !(prediction && c === 2),
    ethanolUnits: 4,
    atomProgress: c === 3 ? smooth((t - cut.atomMove) / (cut.water - cut.atomMove)) : 0,
    oxidationProgress:
      c === 4
        ? smooth(p)
        : c === 5 && answer
          ? smooth((t - cut.acidAnswer) / (cut.acidUnit - cut.acidAnswer))
          : 0,
    ethanol: c === 5 && prediction ? 6 : 3,
    oxidant: 2,
    acid: 16,
  };
}
