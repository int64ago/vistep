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

/** Equal amounts of three illustrative proteins; site counts are not real sequences. */
export type ProteinColourSample = 'many' | 'few' | 'none';
export type AromaticResidue = 'tyrosine' | 'phenylalanine';
export const proteinSiteCounts: Record<ProteinColourSample, number> = { many: 3, few: 1, none: 0 };
const smooth = (n: number) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
export function proteinNitration(
  progress: number,
  sample: ProteinColourSample = 'many',
  residue: AromaticResidue = 'tyrosine',
  acid = true,
  warmed = true,
) {
  const p = clamp(progress);
  // An extent, not a rate law. Phe is a negative qualitative comparison under the
  // usual test conditions; this does not assert that phenylalanine cannot nitrate.
  const sites = proteinSiteCounts[sample];
  const extent =
    sites > 0 && acid && warmed && residue === 'tyrosine' ? smooth((p - 0.35) / 0.3) : 0;
  const reacted = sites * extent;
  const ring = Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    return {
      id: `aromatic-C${i + 1}`,
      x: 145 + 48 * Math.cos(angle),
      y: 108 + 48 * Math.sin(angle),
    };
  });
  return {
    progress: p,
    sample,
    residue,
    acid,
    warmed,
    sites,
    extent,
    reacted,
    remaining: sites - reacted,
    // Formal mononitration account Ar–H + HNO3 → Ar–NO2 + H2O.
    nitricAcidConsumed: reacted,
    waterFormed: reacted,
    proteinAmount: 1,
    peptideBondsCleaved: 0,
    whitePrecipitate: acid ? smooth(p / 0.14) : 0,
    yellowFraction: reacted / 3,
    ring,
    aromaticHydrogen: { id: 'aromatic-H', x: 222 + 50 * extent, y: 65 + 111 * extent },
    nitro: { id: 'incoming-NO2', x: 271 - 39 * extent, y: 22 + 39 * extent },
    shot: p < 0.18 ? 'precipitate' : p < 0.7 ? 'site' : p < 0.88 ? 'compare' : 'boundary',
  };
}

export function proteinBurnAccount(progress: number) {
  const p = clamp(progress),
    converted = smooth((p - 0.2) / 0.65);
  // One conserved material account, not a prediction of real pyrolysis products.
  return {
    originalMaterial: 1 - converted,
    residue: converted * 0.5,
    volatileProducts: converted * 0.5,
    converted,
  };
}
export function proteinDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 7)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    exposure: c === 5 ? clamp(p / 0.55) : c === 0 || c === 2 || c === 3 ? p : 1,
    addedWater: c === 5 ? 3 * clamp((p - 0.65) / 0.25) : c === 1 || c === 4 ? 3 * p : 0,
  };
}

/** Local measured speech landmarks. Map the film clock to the same exploration
 * progress coordinate; no independent timer and no audio-duration stretching. */
export function proteinMeasuredDirector(
  chapter: number,
  progress: number,
  localTime: number,
  en: boolean,
) {
  const d = proteinDirector(chapter, progress),
    time = Number.isFinite(localTime) ? Math.max(0, localTime) : 0;
  if (d.chapter === 5)
    return {
      ...d,
      exposure: smooth((time - 1) / 5.8),
      addedWater: 3 * smooth((time - (en ? 20.1 : 20.4)) / 2.6),
    };
  if (d.chapter !== 6) return d;
  const landmarks = en
    ? [
        [0, 0],
        [3.2, 0.18],
        [11.8, 0.35],
        [17.1, 0.65],
        [24.1, 0.7],
        [31.4, 0.88],
        [41, 1],
      ]
    : [
        [0, 0],
        [4.1, 0.18],
        [9.9, 0.35],
        [17.2, 0.65],
        [22.8, 0.7],
        [30.4, 0.88],
        [39.5, 1],
      ];
  let mapped = 1;
  for (let i = 1; i < landmarks.length; i++) {
    const [start, a] = landmarks[i - 1],
      [end, b] = landmarks[i];
    if (time <= end) {
      mapped = a + (b - a) * clamp((time - start) / (end - start));
      break;
    }
  }
  return { ...d, progress: mapped };
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
