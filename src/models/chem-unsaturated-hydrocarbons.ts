export type UnsaturatedGas = 'ethene' | 'ethyne';
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** Stoichiometric endpoint book: no time-rate prediction or solution side reactions. */
export function bromineAddition(gas: UnsaturatedGas, bromine = 2, progress = 1) {
  const capacity = gas === 'ethene' ? 1 : 2,
    available = clamp(bromine, 0, 3),
    used = Math.min(capacity, available) * clamp(progress, 0, 1);
  const first = Math.min(1, used),
    second = Math.max(0, used - 1);
  return {
    gas,
    capacity,
    available,
    used,
    first,
    second,
    remaining: available - used,
    bondOrder: capacity + 1 - used,
    products: capacity === 1 ? [1 - first, first] : [1 - first, first - second, second],
    organicAtoms: { C: 2, H: gas === 'ethene' ? 4 : 2, Br: 2 * used },
    totalBromineAtoms: 2 * available,
  };
}
/** One unit carbide; separate trace H2S impurity, scrubber Cu2+ and CuS ledger. */
export function ethynePreparation(progress = 1, copperCapacity = 0.12) {
  const reacted = clamp(progress, 0, 1),
    copper = clamp(copperCapacity, 0, 0.2),
    ethyne = reacted,
    impurity = 0.08 * ethyne,
    captured = Math.min(copper, impurity);
  return {
    reacted,
    carbide: 1 - reacted,
    water: 2.2 - 2 * reacted,
    calciumHydroxide: reacted,
    ethyne,
    impurity,
    captured,
    outletImpurity: impurity - captured,
    copperRemaining: copper - captured,
    copperInitial: copper,
    precipitate: captured,
    acidFormed: 2 * captured,
  };
}
/** Acidic MnO4− requires five electrons per Mn2+. Exposure is an illustrative electron supply. */
export function permanganateEvidence(exposure: number, impurityElectrons = 0) {
  const electrons = Math.max(0, exposure) * 5 + Math.max(0, impurityElectrons),
    reduced = Math.min(1, electrons / 5);
  return { initial: 1, remaining: 1 - reduced, manganeseII: reduced, electronsUsed: reduced * 5 };
}
export function hydrocarbonDirector(chapter: number, progress: number) {
  const c = clamp(Math.floor(chapter), 0, 7),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    gas: (c < 4 ? 'ethene' : 'ethyne') as UnsaturatedGas,
    exposure:
      c === 0 || c === 7
        ? p
        : c === 1 || c === 2
          ? p
          : c === 3
            ? p
            : c === 4
              ? p
              : c === 5
                ? 0.4 + 0.6 * p
                : p,
  };
}
export function completeCombustion(gas: UnsaturatedGas) {
  return {
    fuel: 1,
    oxygen: gas === 'ethene' ? 3 : 2.5,
    carbonDioxide: 2,
    water: gas === 'ethene' ? 2 : 1,
  };
}
