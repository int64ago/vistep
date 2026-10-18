const clamp = (n: number, a = 0, b = 1) => (Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a);
/** PEP table, grams benzoic acid per 100 g water. Linear interpolation only within 25–75°C. */
export function benzoicSolubility(temperature: number) {
  const t = clamp(temperature, 25, 75);
  return t <= 50 ? 0.34 + ((t - 25) / 25) * (0.85 - 0.34) : 0.85 + ((t - 50) / 25) * (2.2 - 0.85);
}
export function benzoicBatch(
  water = 50,
  filterTemperature = 75,
  coolTemperature = 25,
  wash = 5,
  purity = 0.9,
) {
  const V = clamp(water, 20, 120),
    Tf = clamp(filterTemperature, 25, 75),
    Tc = clamp(coolTemperature, 25, Tf),
    W = clamp(wash, 0, 20),
    initialAcid = clamp(purity, 0.75, 0.99),
    initialSalt = (1 - initialAcid) * 0.7,
    sand = (1 - initialAcid) * 0.3,
    filteredAcid = Math.min(initialAcid, (benzoicSolubility(Tf) * V) / 100),
    hotCakeAcid = initialAcid - filteredAcid,
    dissolved = Math.min(filteredAcid, (benzoicSolubility(Tc) * V) / 100),
    crystals = filteredAcid - dissolved,
    hold = crystals > 1e-10 ? 2 : 0,
    motherAcid = (dissolved * (V - hold)) / V,
    motherSalt = (initialSalt * (V - hold)) / V,
    heldAcid = (dissolved * hold) / V,
    heldSalt = (initialSalt * hold) / V,
    washDissolved = Math.min(crystals + heldAcid, (benzoicSolubility(25) * (hold + W)) / 100),
    crystalsAfterWash = crystals + heldAcid - washDissolved,
    washedOffCrystals = Math.max(0, washDissolved - heldAcid),
    retainedWater = crystalsAfterWash > 1e-10 ? hold : 0,
    retainedFraction = hold + W ? retainedWater / (hold + W) : 0,
    productAcid = crystalsAfterWash + washDissolved * retainedFraction,
    productSalt = heldSalt * retainedFraction,
    washAcid = washDissolved * (1 - retainedFraction),
    washSalt = heldSalt * (1 - retainedFraction),
    productMass = productAcid + productSalt;
  return {
    V,
    Tf,
    Tc,
    W,
    initialAcid,
    initialSalt,
    sand,
    filteredAcid,
    hotCakeAcid,
    dissolved,
    crystals,
    hold,
    motherAcid,
    motherSalt,
    washedOffCrystals,
    productAcid,
    productSalt,
    washAcid,
    washSalt,
    productMass,
    recovery: productMass,
    purity: productMass ? productAcid / productMass : 0,
    acidRecovery: productAcid / initialAcid,
    motherWater: V - hold,
    washWater: hold + W - retainedWater,
    dryingWater: retainedWater,
    chloridePrecipitate: (productSalt / 58.44) * 143.32,
  };
}
export function heatingState(temperature: number, water = 50) {
  const t = clamp(temperature, 25, 75),
    dissolved = Math.min(0.9, (benzoicSolubility(t) * clamp(water, 20, 120)) / 100);
  return { temperature: t, dissolved, solid: 0.9 - dissolved, salt: 0.07, sand: 0.03 };
}
export function benzoicDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 7)),
    p = clamp(progress);
  return {
    chapter: c,
    p,
    temperature: c === 1 ? 25 + 50 * p : c === 3 ? 75 - 50 * p : c >= 4 ? 25 : 75,
    filterTemperature: 75,
    water: 50,
    wash: c === 5 ? 5 * p : c >= 6 ? 5 : 0,
    dry: c >= 6 ? 1 : 0,
  };
}
