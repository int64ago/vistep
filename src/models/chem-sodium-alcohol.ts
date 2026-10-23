export type ProticLiquid = 'ethanol' | 'water';
const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
const smooth = (x: number) => {
  const p = clamp(x, 0, 1);
  return p * p * (3 - 2 * p);
};
/** Net 2ROH+2Na -> 2RO−+2Na+ +H2. No measured kinetic rate is implied. */
export function sodiumProtic(liquid: ProticLiquid, progress: number, sodium = 2, donors = 2) {
  const initialSodium = clamp(sodium, 0, 4),
    initialDonors = clamp(donors, 0, 4),
    extent = Math.min(initialSodium, initialDonors) * clamp(progress, 0, 1),
    hydrogens = liquid === 'ethanol' ? 6 : 2;
  return {
    liquid,
    initialSodium,
    initialDonors,
    extent,
    sodiumRemaining: initialSodium - extent,
    donorsRemaining: initialDonors - extent,
    anion: extent,
    sodiumIon: extent,
    hydrogen: extent / 2,
    electrons: extent,
    atoms: {
      C: liquid === 'ethanol' ? 2 * initialDonors : 0,
      H: (initialDonors - extent) * hydrogens + extent * (hydrogens - 1) + extent,
      O: initialDonors,
      Na: initialSodium,
    },
    sodiumDensity: 0.97,
    liquidDensity: liquid === 'ethanol' ? 0.789 : 1,
    floats: liquid === 'water',
  };
}
export function compareSodium(time: number, sodium = 2, donors = 2) {
  const p = clamp(time, 0, 1);
  return {
    water: sodiumProtic('water', smooth(p * 2.5), sodium, donors),
    ethanol: sodiumProtic('ethanol', smooth(p), sodium, donors),
  };
}
export function hydrogenProductTest(hydrogen: number, burnFraction: number) {
  const burnt = clamp(hydrogen, 0, 100) * clamp(burnFraction, 0, 1);
  return { burnt, oxygen: burnt / 2, water: burnt, carbonDioxide: 0, calciumCarbonate: 0 };
}
export function sodiumAlcoholDirector(chapter: number, progress: number) {
  const c = clamp(Math.floor(chapter), 0, 5),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    reactionProgress: c === 0 ? smooth(p) : 1,
    burnProgress: c === 1 ? p : c > 1 ? 1 : 0,
    compareTime: c === 4 ? p * 0.65 : c === 5 ? 0.65 : 0,
  };
}

/** Fixed matched-medium records: Olmstead, Margolin & Bordwell (1980),
 * as reproduced in the ACS Organic Division Reich collection, ref 24.
 * These DMSO values are neither an aqueous table nor sodium-reaction rates. */
export const DMSO_ACIDITY = Object.freeze({
  medium: 'DMSO',
  year: 1980,
  ethanol: 29.8,
  water: 31.4,
  doi: '10.1021/jo01304a032',
});
export const ALCOHOL_SECONDS = [25, 29, 26, 30, 29, 64] as const;
export const PROTON_EXCHANGE_K = 10 ** (DMSO_ACIDITY.water - DMSO_ACIDITY.ethanol);
/** EtOH + OH− ⇌ EtO− + H2O; ideal dilute activities approximated by
 * normalized concentrations. Counterion, ion pairing and solvent response
 * are omitted. Adding up to 8 model units is still a dilute-solute thought
 * experiment in DMSO, not changing the medium into water. */
export function protonExchange(addedWater = 0) {
  const water0 = clamp(addedWater, 0, 8),
    K = PROTON_EXCHANGE_K;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 64; i++) {
    const x = (lo + hi) / 2;
    if (x * (water0 + x) > K * (1 - x) ** 2) hi = x;
    else lo = x;
  }
  const extent = (lo + hi) / 2;
  return {
    water0,
    K,
    extent,
    ethanol: 1 - extent,
    hydroxide: 1 - extent,
    ethoxide: extent,
    water: water0 + extent,
    charge: -1,
    atoms: { C: 2, H: 7 + 2 * water0, O: 2 + water0 },
  };
}
/** One selected formal proton-transfer event, not a transition-state geometry
 * or a trajectory sampled from the equilibrium population. R=ethyl is kept.
 * The departing O-H electron pair stays with its oxygen; the acceptor's pair
 * becomes its new O-H bond. Total explicit charge remains -1 including H+. */
export function protonExchangeGeometry(progress: number, width = 320) {
  const p = clamp(progress, 0, 1),
    w = clamp(width, 280, 720);
  const move = smooth((p - 0.22) / 0.56),
    donor = { x: w * 0.28, y: 88 },
    acceptor = { x: w * 0.73, y: 88 };
  const start = { x: donor.x + 47, y: 88 },
    end = { x: acceptor.x - 43, y: 88 };
  const transfer = p <= 0.22 ? 'donor' : p >= 0.78 ? 'acceptor' : 'in-transit';
  const atoms = [
    { id: 'O-ethanol', element: 'O', ...donor, charge: transfer === 'donor' ? 0 : -1 },
    { id: 'O-hydroxide', element: 'O', ...acceptor, charge: transfer === 'acceptor' ? 0 : -1 },
    {
      id: 'H-proton',
      element: 'H',
      x: start.x + (end.x - start.x) * move,
      y: 88 - 25 * Math.sin(Math.PI * move),
      charge: transfer === 'in-transit' ? 1 : 0,
    },
    { id: 'H-acceptor', element: 'H', x: acceptor.x + 12, y: 140, charge: 0 },
  ];
  const pairs = [
    {
      id: 'pair-old-bond',
      x: donor.x + 25 - 14 * smooth(p / 0.25),
      y: 88 - 26 * smooth(p / 0.25),
      owner: 'O-ethanol',
    },
    { id: 'pair-new-bond', x: acceptor.x - 18 - 4 * move, y: 60 + 28 * move, owner: 'O-hydroxide' },
  ];
  return {
    width: w,
    progress: p,
    transfer,
    atoms,
    pairs,
    donorBond: 1 - smooth(p / 0.22),
    acceptorBond: smooth((p - 0.78) / 0.22),
    charge: atoms.reduce((sum, a) => sum + a.charge, 0),
    hydrogenOxidation: 1,
    hydrogenGas: 0,
    ethyl: { id: 'ethyl', x: donor.x - 56, y: 88, C: 2, H: 5 },
  };
}
export type AlcoholFilmState = ReturnType<typeof sodiumAlcoholDirector> & {
  time: number;
  exchangeProgress: number;
  showRecords: boolean;
  showBalance: boolean;
  question: boolean;
  reveal: boolean;
  addedWater: number;
  source: 'provisional' | 'measured-candidate';
  showStructures?: boolean;
  reverse?: boolean;
  reverseProgress?: number;
  pairFocus?: 'old' | 'new' | 'none';
};
export function alcoholFilmState(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
): AlcoholFilmState {
  const c = clamp(Math.floor(chapter), 0, 5),
    t = clamp(chapterTime, 0, ALCOHOL_SECONDS[c]);
  const base = sodiumAlcoholDirector(c, t / ALCOHOL_SECONDS[c]);
  // Preserve the established five retained cues and their exact state shape.
  // Chapter 5 receives measured candidate cuts below.
  const cuts =
    locale === 'en'
      ? { transfer: 8, arrive: 20, records: 23, base: 32, question: 40, reveal: 48, end: 55 }
      : { transfer: 8, arrive: 20, records: 23, base: 32, question: 40, reveal: 48, end: 55 };
  const legacy = {
    ...base,
    compareTime:
      c === 4 ? (t < 18 ? (0.45 * t) / 18 : 0.45 + 0.55 * smooth((t - 18) / 7)) : base.compareTime,
    time: t,
    exchangeProgress: smooth((t - cuts.transfer) / (cuts.arrive - cuts.transfer)),
    showRecords: t >= cuts.records,
    showBalance: t >= cuts.base,
    question: t >= cuts.question && t < cuts.reveal,
    reveal: t >= cuts.reveal,
    addedWater: t < cuts.reveal ? 0 : 8 * smooth((t - cuts.reveal) / (cuts.end - cuts.reveal)),
    source: 'provisional' as const,
  };
  // Keep every output of the five retained chapters byte-for-byte compatible.
  if (c !== 5) return legacy;
  // No-hint ASR word times on the root candidate PCM; .45 s cue offset included.
  // These direct the formal account. They do not change acid-base calculations.
  const measured =
    locale === 'en'
      ? {
          structures: 6.43,
          start: 9.81,
          release: 10.83,
          arrive: 12.17,
          oldPair: 12.37,
          oldPairEnd: 15.31,
          newBond: 15.55,
          complete: 18.67,
          records: 24.91,
          balance: 32.35,
          question: 36.07,
          reveal: 41.61,
          reverseReleased: 42.77,
          reverseArrived: 44.85,
          reverseEnd: 45.29,
        }
      : {
          structures: 4.79,
          start: 7.05,
          release: 7.83,
          arrive: 9.37,
          oldPair: 9.81,
          oldPairEnd: 12.99,
          newBond: 13.45,
          complete: 16.17,
          records: 22.43,
          balance: 32.13,
          question: 35.37,
          reveal: 40.1,
          reverseReleased: 41.13,
          reverseArrived: 43.23,
          reverseEnd: 44.0,
        };
  const easeBetween = (a: number, b: number) => smooth((t - a) / (b - a));
  const exchangeProgress =
    t < measured.release
      ? 0.22 * easeBetween(measured.start, measured.release)
      : t < measured.arrive
        ? 0.22 + 0.56 * easeBetween(measured.release, measured.arrive)
        : t < measured.newBond
          ? 0.78
          : 0.78 + 0.22 * easeBetween(measured.newBond, measured.complete);
  const reverse = t >= measured.reveal && t < measured.reverseEnd;
  const reverseProgress =
    t < measured.reverseReleased
      ? 1 - 0.22 * easeBetween(measured.reveal, measured.reverseReleased)
      : t < measured.reverseArrived
        ? 0.78 - 0.56 * easeBetween(measured.reverseReleased, measured.reverseArrived)
        : 0.22 * (1 - easeBetween(measured.reverseArrived, measured.reverseEnd));
  const pairFocus: 'old' | 'new' | 'none' = reverse
    ? t < measured.reverseReleased
      ? 'new'
      : t >= measured.reverseArrived
        ? 'old'
        : 'none'
    : t >= measured.oldPair && t <= measured.oldPairEnd
      ? 'old'
      : t >= measured.newBond && t <= measured.complete
        ? 'new'
        : 'none';
  return {
    ...legacy,
    exchangeProgress,
    showStructures: t < measured.structures,
    showRecords: t >= measured.records,
    showBalance: t >= measured.balance,
    question: t >= measured.question && t < measured.reveal,
    reveal: t >= measured.reveal,
    addedWater: t < measured.reveal ? 0 : 8 * easeBetween(measured.reveal, measured.reverseEnd),
    reverse,
    reverseProgress,
    pairFocus,
    source: 'measured-candidate' as const,
  };
}
