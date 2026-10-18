export const textbookCultureLifespans = [
  { source: 'fetal', min: 50, max: 50 },
  { source: 'middle', min: 20, max: 20 },
  { source: 'older', min: 2, max: 4 },
] as const;
export function cultureRemaining(passages: number) {
  return textbookCultureLifespans.map((s) => ({
    ...s,
    remainingMin: Math.max(0, s.min - passages),
    remainingMax: Math.max(0, s.max - passages),
  }));
}
export function carrotCulture(progress: number, suitable = true) {
  const p = Math.min(1, Math.max(0, progress)),
    effective = suitable ? p : Math.min(0.22, p);
  return {
    progress: effective,
    proliferation: Math.min(1, effective / 0.45),
    root: Math.max(0, Math.min(1, (effective - 0.4) / 0.25)),
    shoot: Math.max(0, Math.min(1, (effective - 0.6) / 0.4)),
    conditional: suitable,
  };
}
/** This is the textbook's stated comparison, deliberately not a universal biological predictor. */
export function textbookNuclearSwap(youngNucleus: boolean, youngCytoplasm: boolean) {
  return {
    youngNucleus,
    youngCytoplasm,
    textbookProliferation: youngNucleus ? 'vigorous' : 'absent',
    generalizes: false,
  };
}
export const nuclearEvidenceLimits = [
  { year: 1976, doi: '10.1016/0014-4827(76)90269-X', finding: 'limited-division' },
  { year: 1983, pmid: '6301866', finding: 'cytoplasmic-inhibition', minimumInhibition: 0.4 },
] as const;
export function wormCellFates(progress: number, ced3Functional = true, ced4Functional = true) {
  const formed = 1090,
    scheduled = 131,
    completed = Math.floor(Math.min(1, Math.max(0, progress)) * scheduled),
    dead = ced3Functional && ced4Functional ? completed : 0;
  return {
    formed,
    scheduled,
    dead,
    retained: formed - dead,
    execution: ced3Functional && ced4Functional,
  };
}
export const illustrativeLineage = Array.from({ length: 15 }, (_, id) => ({
  id,
  parent: id === 0 ? null : Math.floor((id - 1) / 2),
  level: Math.floor(Math.log2(id + 1)),
  scheduledDeath: id === 10 || id === 13,
}));
