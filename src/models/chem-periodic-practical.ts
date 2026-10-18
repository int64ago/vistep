export type Halogen = 'Cl' | 'Br' | 'I';
const rank: Record<Halogen, number> = { Cl: 3, Br: 2, I: 1 };
const unit = (n: number) => Math.max(0, Math.min(1, n));
/** X2 + 2Y- -> 2X- + Y2; dilute teaching conditions, secondary oxidation omitted. */
export function halogenDisplacement(
  oxidant: Halogen = 'Cl',
  halide: Halogen = 'Br',
  progress = 1,
  available = 0.5,
) {
  const input = Math.max(0, Math.min(0.5, available)),
    reaction = rank[oxidant] > rank[halide] ? Math.min(input, 0.5) * unit(progress) : 0;
  return {
    oxidant,
    halide,
    oxidantLeft: input - reaction,
    oxidantIon: 2 * reaction,
    halideLeft: 1 - 2 * reaction,
    product: reaction,
    electrons: 2 * reaction,
    initialOxidantAtoms: 2 * input,
    initialHalideAtoms: 1,
  };
}
export const HALOGEN_COLOURS: Record<Halogen, string> = {
  Cl: '#c8cf78',
  Br: '#ce914c',
  I: '#96703c',
};
export function magnesiumWater(hot = true, progress = 1) {
  const reacted = hot ? unit(progress) : 0;
  return {
    metal: 1 - reacted,
    hydroxide: reacted,
    hydrogen: reacted,
    waterUsed: 2 * reacted,
    pink: reacted === 0 ? 0 : 0.75 * (1 - Math.exp(-8 * reacted)),
  };
}
export type HydroxideMetal = 'Mg' | 'Al';
export type TestMedium = 'none' | 'acid' | 'base';
/** Initial precipitate is one relative amount. Pure net acid/base pathways. */
export function periodHydroxide(
  metal: HydroxideMetal = 'Al',
  medium: TestMedium = 'none',
  amount = 3,
  prepared = 1,
) {
  const solid = unit(prepared),
    input = Math.max(0, amount),
    per = medium === 'acid' ? (metal === 'Al' ? 3 : 2) : 1;
  const dissolved =
    medium === 'none' || (medium === 'base' && metal === 'Mg') ? 0 : Math.min(solid, input / per);
  return {
    metal,
    medium,
    prepared: solid,
    solid: solid - dissolved,
    dissolved,
    reagentUsed: dissolved * per,
    reagentLeft: input - dissolved * per,
    product: metal === 'Al' && medium === 'base' ? '[Al(OH)₄]⁻' : metal === 'Al' ? 'Al³⁺' : 'Mg²⁺',
  };
}
export function periodicDirector(chapter: number, progress: number) {
  const p = unit(progress);
  return {
    chapter,
    progress: p,
    mode: chapter < 3 ? 'halogen' : chapter < 5 ? 'magnesium' : 'hydroxide',
    oxidant: (chapter === 2 ? 'Br' : 'Cl') as Halogen,
    halide: (chapter === 0 ? 'Br' : 'I') as Halogen,
    available: 0.5,
    hot: chapter === 4,
    prepared: chapter === 5 ? p : 1,
    medium: (chapter === 6 ? 'acid' : chapter === 7 ? 'base' : 'none') as TestMedium,
    amount: chapter === 6 ? 3 * p : chapter === 7 ? p : 0,
  };
}
