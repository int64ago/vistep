export type AnionTest = 'chloride' | 'sulfate';
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
/** Each comparison starts with 1 mmol target anion; near-complete precipitation, not a Ksp solver. */
export function anionEvidence(test: AnionTest, metalAdded: number, acidAdded: number) {
  const metal = clamp(metalAdded, 2),
    acid = clamp(acidAdded, 2);
  const carbonateMetalRatio = test === 'chloride' ? 2 : 1;
  const targetSolid = Math.min(1, metal);
  const carbonateConverted = Math.min(1, acid / 2);
  const carbonateSolid = Math.min(1 - carbonateConverted, metal / carbonateMetalRatio);
  return {
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
export function anionDirector(chapter: number, progress: number) {
  const p = clamp(progress, 1),
    stage = chapter % 3;
  return {
    test: (chapter < 3 ? 'chloride' : 'sulfate') as AnionTest,
    metal: stage === 0 ? 2 * p : 2,
    acid: stage === 1 ? 2 * p : stage === 2 ? 2 : 0,
    ledger: stage === 2,
    pulse: p,
  };
}
