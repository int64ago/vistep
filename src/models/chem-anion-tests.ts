export type AnionTest = 'chloride' | 'sulfate';
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
/** Each comparison starts with 1 mmol anion. Endpoint net-stoichiometric allocation,
 * not a titration/equilibrium trajectory: acidAdded is H+ budget assigned to complete
 * CO3(2-) -> CO2 + H2O conversions. HCO3-, pH and small solubilities are not solved. */
export function anionEvidence(test: AnionTest, metalAdded: number, acidAdded: number) {
  const metal = clamp(metalAdded, 2),
    acid = clamp(acidAdded, 2);
  const carbonateMetalRatio = test === 'chloride' ? 2 : 1;
  const targetSolid = Math.min(1, metal);
  const carbonateConverted = Math.min(1, acid / 2);
  const carbonateSolid = Math.min(1 - carbonateConverted, metal / carbonateMetalRatio);
  return {
    metal,
    acidBudget: acid,
    targetDissolvedMetal: metal - targetSolid,
    targetSolid,
    carbonateSolid,
    carbonDioxide: carbonateConverted,
    dissolvedCarbonate: 1 - carbonateConverted - carbonateSolid,
    targetMetalInSolid: targetSolid,
    carbonateMetalInSolid: carbonateMetalRatio * carbonateSolid,
    carbonateDissolvedMetal: metal - carbonateMetalRatio * carbonateSolid,
    target: test === 'chloride' ? 'AgCl' : 'BaSO₄',
    carbonate: test === 'chloride' ? 'Ag₂CO₃' : 'BaCO₃',
    reagent: test === 'chloride' ? 'AgNO₃' : 'BaCl₂',
    acidName: test === 'chloride' ? 'HNO₃' : 'HCl',
    carbonTotal: carbonateSolid + (1 - carbonateConverted - carbonateSolid) + carbonateConverted,
  };
}
/** Finite representative carbon routes. Not a gas rate law or molecular count.
 * The same eight marker IDs travel once, then remain outside the open tube. */
export function anionCarbonRoute(index: number, acidProgress: number) {
  const i = Math.max(0, Math.min(7, Math.floor(Number.isFinite(index) ? index : 0)));
  const start = i * 0.075,
    p = clamp((clamp(acidProgress, 1) - start) / 0.4, 1);
  const s = p * p * (3 - 2 * p);
  return {
    id: `carbon-${i}`,
    x: 77 + ((i * 19) % 35),
    y: 225 - 203 * s,
    progress: p,
    phase: p === 0 ? 'carbonate' : p === 1 ? 'outside' : 'leaving',
  } as const;
}
/** Reconstruct a finite teaching event; these are presentation seconds, not titration data. */
export function anionDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.max(0, Math.min(5, Math.floor(Number.isFinite(chapter) ? chapter : 0)));
  const p = clamp(progress, 1),
    stage = c % 3;
  const t = Number.isFinite(chapterTime)
    ? Math.max(0, chapterTime!)
    : p * [25, 27, 26.5, 25, 27, 28][c];
  const metalTime =
    locale === 'en' ? (c < 3 ? [5.9, 9.2] : [7.4, 9.7]) : c < 3 ? [4.8, 7.6] : [6.1, 8.7];
  const acidTime =
    locale === 'en' ? (c < 3 ? [2.5, 8.7] : [2.5, 7.6]) : c < 3 ? [2.5, 8.8] : [2, 7.1];
  return {
    test: (c < 3 ? 'chloride' : 'sulfate') as AnionTest,
    metal: stage === 0 ? 2 * clamp((t - metalTime[0]) / (metalTime[1] - metalTime[0]), 1) : 2,
    acid:
      stage === 1
        ? 2 * clamp((t - acidTime[0]) / (acidTime[1] - acidTime[0]), 1)
        : stage === 2
          ? 2
          : 0,
    ledger: stage === 2,
    pulse: p,
  };
}
