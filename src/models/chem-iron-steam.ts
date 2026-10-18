const FE = 55.845,
  H = 1.008,
  O = 15.999,
  WATER = 2 * H + O,
  MAGNETITE = 3 * FE + 4 * O;
/** Stoichiometric textbook path, without kinetic or equilibrium prediction. */
export function ironSteam(ironGrams = 1, waterGrams = 0.5, extent = 1, hot = true) {
  const iron = Math.max(0, Math.min(2, ironGrams)) / FE,
    water = Math.max(0, Math.min(1, waterGrams)) / WATER,
    p = Math.max(0, Math.min(1, extent));
  const reaction = hot ? Math.min(iron / 3, water / 4) * p : 0;
  const ironLeft = iron - 3 * reaction,
    waterLeft = water - 4 * reaction,
    oxide = reaction,
    hydrogen = 4 * reaction;
  return {
    ironLeft,
    waterLeft,
    oxide,
    hydrogen,
    convertedFraction: iron ? (3 * reaction) / iron : 0,
    oxideGrams: oxide * MAGNETITE,
    hydrogenGrams: hydrogen * 2 * H,
    massBefore: iron * FE + water * WATER,
    massAfter: ironLeft * FE + waterLeft * WATER + oxide * MAGNETITE + hydrogen * 2 * H,
  };
}
export function ironSteamDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    hot: chapter > 0,
    extent: chapter === 0 ? 0 : chapter === 1 ? p : 1,
    water: 0.5,
    iron: 1,
    test: chapter === 2,
    progress: p,
  };
}
export function steamPoint(points: [number, number][], p: number) {
  const lengths = points
    .slice(1)
    .map((v, i) => Math.hypot(v[0] - points[i][0], v[1] - points[i][1]));
  let n = Math.max(0, Math.min(1, p)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (n <= lengths[i])
      return {
        x: points[i][0] + ((points[i + 1][0] - points[i][0]) * n) / lengths[i],
        y: points[i][1] + ((points[i + 1][1] - points[i][1]) * n) / lengths[i],
      };
    n -= lengths[i];
  }
  return { x: points.at(-1)![0], y: points.at(-1)![1] };
}
