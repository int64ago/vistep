export type CarbonateSalt = 'carbonate' | 'bicarbonate';
export const CARBONATE_MOLAR_MASS = {
  bicarbonate: 84.0066,
  carbonate: 105.9888,
  water: 18.0153,
  carbonDioxide: 44.0091,
} as const;
/** Stoichiometry only. Extent is controlled, not inferred from fictional elapsed seconds. */
export function carbonateHeating(salt: CarbonateSalt, initialGrams: number, extent: number) {
  const initial = Math.max(0, Math.min(5, initialGrams)),
    x = salt === 'bicarbonate' ? Math.max(0, Math.min(1, extent)) : 0;
  const reactedMoles = (initial / CARBONATE_MOLAR_MASS.bicarbonate) * x;
  const productMoles = reactedMoles / 2;
  const carbonateGrams = productMoles * CARBONATE_MOLAR_MASS.carbonate;
  const waterGrams = productMoles * CARBONATE_MOLAR_MASS.water;
  const carbonDioxideGrams = productMoles * CARBONATE_MOLAR_MASS.carbonDioxide;
  const unreactedGrams = initial * (1 - x);
  return {
    extent: x,
    initialGrams: initial,
    carbonateGrams,
    waterGrams,
    carbonDioxideGrams,
    gasMoles: productMoles,
    unreactedGrams,
    residueGrams: unreactedGrams + carbonateGrams,
  };
}
/** Room-temperature endpoint approximation. Initial hydration is qualitative only. */
export function carbonateDissolving(salt: CarbonateSalt, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    waterGrams = 0.15 * Math.min(1, p / 0.35) + 5 * Math.max(0, (p - 0.35) / 0.65);
  const solubility = salt === 'carbonate' ? 17 / 83 : 0.096;
  const dissolvedGrams = Math.min(1, solubility * waterGrams);
  return {
    waterGrams,
    dissolvedGrams,
    residualGrams: 1 - dissolvedGrams,
    hydration:
      salt === 'carbonate' ? Math.min(1, p / 0.35) * (1 - Math.max(0, (p - 0.35) / 0.65)) : 0,
    heatDirection: salt === 'carbonate' ? 1 : -1,
    // Indicator tones represent textbook observations, not calibrated concentration.
    indicatorTone: salt === 'carbonate' ? 0.65 : 0.13,
  };
}
export function carbonateDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 2 ? 'dissolve' : 'heat',
    stage: chapter === 0 ? p : 1,
    indicator: chapter === 1,
    salt: (chapter === 2 ? 'carbonate' : 'bicarbonate') as CarbonateSalt,
    extent: chapter === 2 ? 0 : chapter === 3 ? Math.max(0, (p - 0.15) / 0.85) : 1,
    balance: chapter === 4,
  };
}
