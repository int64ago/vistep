/** Qualitative population accounts; coefficients are chosen teaching parameters. */
export type ProteinTreatment = 'salt' | 'heat' | 'silver' | 'ethanol' | 'lead';
const clamp = (n: number, max = 1) => (Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0);
export function proteinPopulation(
  treatment: ProteinTreatment,
  exposure: number,
  addedWater = 0,
  total = 1,
) {
  const p = clamp(exposure),
    water = clamp(addedWater, 5),
    stock = clamp(total, 5),
    volume = 1 + water;
  const saltAmount = treatment === 'salt' ? p : 0,
    saltConcentration = saltAmount / volume;
  const native = treatment === 'salt' ? stock : stock * (1 - p),
    denatured = stock - native;
  const solubility = 1.4 * Math.exp(0.8 * saltConcentration - 3 * saltConcentration ** 2);
  const aggregation = { salt: 0, heat: 0.85, silver: 0.9, ethanol: 0.8, lead: 0.92 }[treatment];
  const precipitated =
    treatment === 'salt' ? Math.max(0, stock - solubility * volume) : denatured * aggregation;
  return {
    treatment,
    exposure: p,
    total: stock,
    volume,
    saltAmount,
    saltConcentration,
    solubility,
    native,
    denatured,
    precipitated,
    dissolved: stock - precipitated,
    precipitatedFraction: stock ? precipitated / stock : 0,
    unfoldedFraction: stock ? denatured / stock : 0,
    concentration: stock / volume,
    peptideInventory: stock,
  };
}
export function proteinColour(progress: number, reactiveFraction = 1) {
  const p = clamp(progress),
    sites = clamp(reactiveFraction) * 3,
    reacted = sites * clamp((p - 0.35) / 0.65);
  return {
    progress: p,
    whitePrecipitate: clamp(p * 3),
    sites,
    reacted,
    sitesRemaining: sites - reacted,
    nitricAcidConsumed: reacted,
    waterFormed: reacted,
    yellowFraction: reacted / 3,
  };
}
export function proteinDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 7)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    exposure: c === 0 || c === 2 || c === 3 || c === 5 ? p : 1,
    addedWater: c === 1 || c === 4 ? 3 * p : 0,
  };
}
export function proteinSymbol(index: number, aggregation: number, unfolding: number) {
  const q = clamp(aggregation * 8 - index),
    u = clamp(unfolding),
    x0 = 65 + (index % 4) * 60,
    y0 = 142 + Math.floor(index / 4) * 48,
    x1 = 112 + (index % 4) * 28,
    y1 = 168 + Math.floor(index / 4) * 18;
  const points = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 17) * Math.PI * 3.2;
    const folded = [Math.cos(a) * (12 + i * 0.18), Math.sin(a) * (11 - i * 0.2)],
      open = [(i / 17 - 0.5) * 36, Math.sin(i * 0.9) * 6];
    return [
      x0 + (x1 - x0) * q + folded[0] * (1 - u) + open[0] * u,
      y0 + (y1 - y0) * q + folded[1] * (1 - u) + open[1] * u,
    ];
  });
  return { index, aggregated: q, unfolding: u, points };
}
