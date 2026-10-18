const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** Chosen event order demonstrates repeated substitution; it is not a yield or kinetic model. */
export const methaneEventOrder = [
  0, 1, 0, 2, 3, 0, 1, 0, 4, 2, 1, 2, 5, 4, 3, 2, 6, 5, 4, 3, 7, 6, 5, 4, 1, 7, 6, 5, 3, 7, 6, 7,
];
export function methaneSubstitution(progress: number, illuminated = true, chlorineUnits = 8) {
  const chlorine = clamp(chlorineUnits, 0, 32),
    used = illuminated ? clamp(progress, 0, 1) * chlorine : 0;
  const sites = Array(8).fill(0) as number[];
  for (let i = 0; i < 32; i++) sites[methaneEventOrder[i]] += clamp(used - i, 0, 1);
  const products = Array(5).fill(0) as number[];
  for (const s of sites) {
    const low = Math.floor(s),
      f = s - low;
    products[low] += 1 - f;
    if (f > 0) products[low + 1] += f;
  }
  const organicH = sites.reduce((sum, s) => sum + 4 - s, 0),
    organicCl = used,
    hcl = used,
    remainingChlorine = chlorine - used;
  const heavier = products[2] + products[3] + products[4];
  // Only a visual trend: no vapour-liquid, dissolution or hydrostatic calculation.
  const levelRise = (hcl + heavier) / (8 + Math.max(8, chlorine));
  return {
    progress: clamp(progress, 0, 1),
    illuminated,
    chlorine,
    used,
    sites,
    products,
    organicH,
    organicCl,
    hcl,
    remainingChlorine,
    heavier,
    levelRise,
    colour: chlorine > 0 ? remainingChlorine / chlorine : 0,
    atoms: {
      C: products.reduce((a, b) => a + b, 0),
      H: organicH + hcl,
      Cl: organicCl + hcl + 2 * remainingChlorine,
    },
  };
}
export function substitutionStep(replacements: number) {
  const r = clamp(Math.floor(replacements), 0, 3);
  return {
    before: { C: 1, H: 4 - r, Cl: r },
    after: { C: 1, H: 3 - r, Cl: r + 1 },
    chlorineReactant: 2,
    hcl: { H: 1, Cl: 1 },
  };
}
export function methaneDirector(chapter: number, progress: number) {
  const c = clamp(Math.floor(chapter), 0, 4),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    reactionProgress: c === 0 ? 0 : c === 1 ? p * 0.65 : c === 2 ? 0.65 + 0.35 * p : 1,
    replacement: c === 3 ? Math.min(3, Math.floor(p * 4)) : 0,
    substitutionPhase: c === 3 ? (p * 4) % 1 : 0,
  };
}
