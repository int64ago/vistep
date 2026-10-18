export type ProticLiquid = 'ethanol' | 'water';
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
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
  const burnt = Math.max(0, hydrogen) * clamp(burnFraction, 0, 1);
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
