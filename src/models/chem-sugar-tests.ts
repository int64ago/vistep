export type Sugar = 'glucose' | 'sucrose' | 'maltose' | 'starch' | 'cellulose';
const clamp = (n: number, max = 1) => (Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0);
/** Endpoint-mixture teaching model; partial hydrolysis intermediates are omitted. */
export function sugarHydrolysis(sugar: Sugar, progress: number, degree = 1000) {
  const h = sugar === 'glucose' ? 0 : clamp(progress),
    n = Math.max(2, Math.round(clamp(degree, 10000))),
    poly = sugar === 'starch' || sugar === 'cellulose';
  const initial = {
    C: poly ? 6 * n : sugar === 'glucose' ? 6 : 12,
    H: poly ? 10 * n + 2 : sugar === 'glucose' ? 12 : 22,
    O: poly ? 5 * n + 1 : sugar === 'glucose' ? 6 : 11,
  };
  const glucose = sugar === 'glucose' ? 1 : poly ? n * h : sugar === 'maltose' ? 2 * h : h,
    fructose = sugar === 'sucrose' ? h : 0,
    remaining = sugar === 'glucose' ? 0 : 1 - h,
    waterUsed = poly ? (n - 1) * h : h;
  const hexoseUnits = poly ? n : sugar === 'glucose' ? 1 : 2;
  const reducing =
    (glucose + fructose + (sugar === 'maltose' || poly ? remaining : 0)) / hexoseUnits;
  return {
    sugar,
    hydrolysed: h,
    degree: n,
    glucose,
    fructose,
    remaining,
    waterUsed,
    hexoseUnits,
    reducing,
    iodine: sugar === 'starch' ? 1 - h : 0,
    atoms: {
      C: remaining * initial.C + 6 * (glucose + fructose),
      H: remaining * initial.H + 12 * (glucose + fructose),
      O: remaining * initial.O + 6 * (glucose + fructose),
    },
    initial,
  };
}
export function sugarReduction(
  sugar: Sugar,
  hydrolysis: number,
  progress: number,
  test: 'copper' | 'silver' = 'copper',
  alkaline = true,
  heated = true,
  amount = 1,
  metal = 2,
) {
  const sample = sugarHydrolysis(sugar, hydrolysis),
    a = clamp(amount, 4),
    initialMetal = clamp(metal, 8);
  const capable = sample.reducing * a,
    extent = alkaline && heated ? Math.min(capable, initialMetal / 2) * clamp(progress) : 0;
  return {
    sample,
    extent,
    initialMetal,
    metalRemaining: initialMetal - 2 * extent,
    metalReduced: 2 * extent,
    copperOxide: test === 'copper' ? extent : 0,
    silver: test === 'silver' ? 2 * extent : 0,
    electrons: 2 * extent,
    availableReducing: capable,
    remainingReducing: capable - extent,
    valid: alkaline,
    heated,
    visible: extent >= 0.02,
    fraction: initialMetal ? (2 * extent) / initialMetal : 0,
  };
}
export function sugarSolubility(sugar: Sugar, progress: number, warm = false) {
  const p = clamp(progress);
  return {
    dissolved: sugar === 'glucose' || sugar === 'sucrose' || sugar === 'maltose' ? p : 0,
    granules: sugar === 'starch' ? 1 - (warm ? 0.7 * p : 0) : sugar === 'cellulose' ? 1 : 1 - p,
    gel: sugar === 'starch' && warm ? p : 0,
  };
}
export function sugarDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 11)),
    p = clamp(progress);
  const sugar: Sugar =
    c === 6 || c === 7
      ? 'sucrose'
      : c === 3 || c === 4 || c === 5
        ? 'starch'
        : c === 10 || c === 11
          ? 'cellulose'
          : 'glucose';
  return {
    chapter: c,
    progress: p,
    sugar,
    hydrolysis: c === 4 || c === 10 ? p : c === 5 || c === 7 || c === 11 ? 1 : 0,
    test: c === 1 ? ('silver' as const) : ('copper' as const),
  };
}
