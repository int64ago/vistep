export const plantClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
/** Declared evidence reconstruction. A cell-free filtrate preserves a soluble influence. */
export function gibberellinEvidence(progress: number, filtrate = true) {
  const p = plantClamp(progress);
  return {
    progress: p,
    organismsInFiltrate: 0,
    solubleInfluence: filtrate ? 1 : 0,
    shootLength: 75 + p * (filtrate ? 92 : 42),
    controlLength: 75 + p * 42,
  };
}
export function filtrateTracers(progress: number) {
  const p = plantClamp(progress);
  return Array.from({ length: 8 }, (_, id) => {
    const q = plantClamp((p - id * 0.035) / 0.65);
    const y =
      q < 0.5
        ? 88 + q * 2 * 112
        : q < 0.65
          ? 200 + ((q - 0.5) / 0.15) * 20
          : 220 + ((q - 0.65) / 0.35) * 35;
    const x =
      q < 0.5 ? (-35 + id * 10) * (1 - q * 2) : q < 0.65 ? 0 : ((-28 + id * 8) * (q - 0.65)) / 0.35;
    return { id, x, y, phase: q };
  });
}
export const preliminaryDoses = [0, 0.1, 1, 10];
export const refinedDoses = [0, 0.5, 1, 1.5];
/** Synthetic classroom specimen generator; dose units are arbitrary, not a product rate. */
export function expectedRootCount(dose: number) {
  const d = plantClamp(dose, 0, 100);
  return 2 + 10 * d * Math.exp(1 - d);
}
export function rootTrialCounts(dose: number) {
  const mean = expectedRootCount(dose);
  return [-1, 1, 0].map((delta) => Math.max(0, Math.round(mean + delta)));
}
export function rootTrialSummary(rows: (number | null)[][], doses: number[]) {
  const summaries = rows.map((row, i) => {
    const values = row.map((v) => (v === null ? null : plantClamp(v, 0, 30))),
      present = values.filter((v): v is number => v !== null),
      mean = present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
    const sd =
      present.length > 1 && mean !== null
        ? Math.sqrt(present.reduce((a, b) => a + (b - mean) ** 2, 0) / (present.length - 1))
        : 0;
    return { dose: doses[i], values, mean, sd };
  });
  const max = Math.max(...summaries.map((r) => r.mean ?? -Infinity));
  return {
    rows: summaries,
    best: summaries
      .filter((r) => r.mean !== null && Math.abs(r.mean - max) < 1e-8)
      .map((r) => r.dose),
  };
}
export function cuttingRootGeometry(count: number, progress: number) {
  const n = Math.round(plantClamp(count, 0, 30)),
    p = plantClamp(progress);
  return Array.from({ length: n }, (_, id) => {
    const grown = plantClamp((p - 0.12 - id * 0.007) / 0.65);
    const angle = -1.05 + (2.1 * (id + 0.5)) / Math.max(1, n),
      length = (45 + ((id * 19) % 31)) * grown;
    return {
      id,
      grown,
      x: Math.sin(angle) * length * 0.45,
      y: Math.cos(angle) * length,
      path: `M0 0Q${Math.sin(angle) * length * 0.15} ${length * 0.35} ${Math.sin(angle) * length * 0.45} ${Math.cos(angle) * length}`,
    };
  });
}
/** Dimensionless illustrative ethephon/ethylene/ripening kinetics, no food-treatment recommendation. */
export function ethyleneRipening(progress: number, treated = true, ph = 6, initialMaturity = 0.08) {
  const p = plantClamp(progress),
    n = 240,
    dt = p / n,
    releaseRate = 0.03 + 1.8 / (1 + Math.exp(-3 * (plantClamp(ph, 2, 8) - 4.2)));
  let precursor = treated ? 1 : 0,
    external = 0,
    endogenous = 0.02,
    maturity = plantClamp(initialMaturity);
  for (let i = 0; i < n; i++) {
    const release = Math.min(precursor, releaseRate * precursor * dt);
    precursor -= release;
    external += release;
    const eProduction = 0.35 * maturity * (0.3 + endogenous);
    endogenous += eProduction * dt;
    maturity += 1.4 * (0.06 + external + endogenous) * (1 - maturity) * dt;
  }
  return {
    progress: p,
    precursor,
    external,
    endogenous,
    maturity,
    firmness: 1 - 0.7 * maturity,
    releaseRate,
    totalPrecursor: precursor + external,
  };
}
