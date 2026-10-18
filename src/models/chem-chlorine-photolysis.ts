/** Net textbook path 2 HOCl -> 2 H+ + 2 Cl- + O2; teaching scenario, not a kinetic fit. */
export function chlorinePhotolysis(extent: number, headspaceMl = 500, illuminated = true) {
  const p = illuminated ? Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0)) : 0;
  const liquidLitres = 0.1,
    initialHOCl = 0.018,
    initialH = 0.008,
    initialCl = 0.008;
  const decomposed = initialHOCl * liquidLitres * p,
    oxygen = decomposed / 2;
  const headspace = Math.max(50, Math.min(1000, headspaceMl)) / 1000;
  const initialGasMoles = headspace / (0.082057366 * 298.15),
    initialOxygen = initialGasMoles * 0.18;
  const hydrogen = initialH + decomposed / liquidLitres,
    chloride = initialCl + decomposed / liquidLitres;
  return {
    p,
    decomposed,
    oxygen,
    remainingHOCl: initialHOCl * liquidLitres - decomposed,
    hydrogen,
    chloride,
    pH: -Math.log10(hydrogen),
    chlorideMgL: chloride * 35.45 * 1000,
    oxygenPercent: (100 * (initialOxygen + oxygen)) / (initialGasMoles + oxygen),
    chlorineTotal:
      initialCl * liquidLitres + decomposed + (initialHOCl * liquidLitres - decomposed),
    initialHOClMoles: initialHOCl * liquidLitres,
    initialGasMoles,
  };
}
export function photolysisTrace(extent: number, headspaceMl = 500, illuminated = true) {
  return Array.from({ length: 61 }, (_, i) =>
    chlorinePhotolysis((Math.max(0, Math.min(1, extent)) * i) / 60, headspaceMl, illuminated),
  );
}
export function photolysisDirector(chapter: number, progress: number) {
  return {
    extent: chapter === 0 ? 0 : chapter === 1 ? Math.max(0, Math.min(1, progress)) : 1,
    light: chapter > 0,
    ledger: chapter === 2,
    headspace: 500,
  };
}
