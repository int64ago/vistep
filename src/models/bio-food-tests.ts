export type FoodAssay = 'fehling' | 'sudan' | 'biuret';
export type FoodSample = 'pear' | 'sucrose' | 'albumin' | 'peanut' | 'water';
const composition: Record<FoodSample, { reducing: boolean; protein: boolean; lipid: boolean }> = {
  pear: { reducing: true, protein: false, lipid: false },
  sucrose: { reducing: false, protein: false, lipid: false },
  albumin: { reducing: false, protein: true, lipid: false },
  peanut: { reducing: false, protein: true, lipid: true },
  water: { reducing: false, protein: false, lipid: false },
};
/** A qualitative assay state machine, not a concentration calibration or reaction-rate measurement. */
export function foodAssay(
  assay: FoodAssay,
  sample: FoodSample,
  stage: number,
  heated = true,
  alkaliFirst = true,
) {
  const s = Math.max(0, Math.min(4, stage));
  const material = composition[sample];
  const reagent = s >= 1,
    complete =
      assay === 'fehling' ? s >= 3 && heated : assay === 'biuret' ? s >= 2 && alkaliFirst : s >= 1;
  const positive =
    complete &&
    (assay === 'fehling'
      ? material.reducing
      : assay === 'biuret'
        ? material.protein
        : material.lipid);
  const development = positive
    ? Math.max(
        0,
        Math.min(1, (s - (assay === 'fehling' ? 2.8 : assay === 'biuret' ? 1.8 : 0.8)) / 1.2),
      )
    : 0;
  return {
    positive,
    complete,
    reagent,
    development,
    washed: assay === 'sudan' && s >= 3.95,
    washingProgress: assay === 'sudan' ? Math.max(0, s - 3) : 0,
    liquid:
      !reagent || (assay === 'biuret' && s < 2)
        ? '#d8dfc4'
        : assay === 'biuret' && positive
          ? '#9166b7'
          : assay === 'sudan'
            ? '#d9a357'
            : '#82b6c4',
    precipitate: assay === 'fehling' ? development : 0,
    lipidStain: assay === 'sudan' && positive ? development : 0,
    invalidOrder: assay === 'biuret' && !alkaliFirst && s >= 2,
  };
}
export function lipidDroplets() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 37 + ((i * 47) % 190),
    y: 54 + ((i * 31) % 110),
    r: 4 + (i % 4) * 1.8,
  }));
}
