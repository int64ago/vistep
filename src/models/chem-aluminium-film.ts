export type AluminiumMedium = 'acid' | 'base';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** mmol; sequential ideal oxide removal then metal dissolution, no kinetic clock. */
export function aluminiumFilm(
  medium: AluminiumMedium = 'base',
  film = 0.1,
  reagent = 1.2,
  progress = 1,
) {
  const oxide = Math.max(0, Math.min(0.3, film)),
    initialMetal = 1,
    perOxide = medium === 'acid' ? 6 : 2,
    perMetal = medium === 'acid' ? 3 : 1;
  const initialReagent = Math.max(0, reagent),
    demand = oxide * perOxide + initialMetal * perMetal;
  const budget = Math.min(initialReagent, demand * clamp(progress));
  const oxideConsumed = Math.min(oxide, budget / perOxide),
    oxideLeft = Math.max(0, oxide - oxideConsumed);
  const metalConsumed =
    oxideLeft > 1e-12
      ? 0
      : Math.min(initialMetal, Math.max(0, budget - oxideConsumed * perOxide) / perMetal);
  const reagentUsed = oxideConsumed * perOxide + metalConsumed * perMetal;
  return {
    oxideLeft,
    oxideConsumed,
    metalLeft: 1 - metalConsumed,
    metalConsumed,
    hydrogen: 1.5 * metalConsumed,
    dissolvedAl: 2 * oxideConsumed + metalConsumed,
    reagentUsed,
    reagentLeft: initialReagent - reagentUsed,
    initialAl: 1 + 2 * oxide,
    finalAl: 1 - metalConsumed + 2 * oxideLeft + 2 * oxideConsumed + metalConsumed,
    oxideFraction: oxide ? oxideLeft / oxide : 0,
    film,
    medium,
  };
}
export function aluminiumDirector(chapter: number, progress: number, variant = 'acid') {
  const p = clamp(progress),
    isBase = chapter >= 2 || variant === 'base';
  return {
    medium: (isBase ? 'base' : 'acid') as AluminiumMedium,
    film: 0.1,
    reagent: isBase ? 1.2 : 3.6,
    progress: chapter === 0 ? p / 6 : chapter === 1 ? 1 / 6 + (p * 5) / 6 : chapter === 2 ? p : 1,
    compare: chapter === 2,
    species: chapter === 3,
  };
}
