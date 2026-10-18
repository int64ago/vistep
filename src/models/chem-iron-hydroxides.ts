const unit = (n: number) => Math.max(0, Math.min(1, n));
/** Amounts in mmol. Ideal textbook precipitation, then oxygen-limited oxidation. */
export function ironHydroxides(oh = 3, oxygen = 0.25, extent = 1, add = 1) {
  const hydroxide = Math.max(0, Math.min(4, oh)) * unit(add);
  const ferrousSolid = Math.min(1, hydroxide / 2);
  const ferricSolid = Math.min(1, hydroxide / 3);
  const oxidized = Math.min(ferrousSolid, 4 * Math.max(0, oxygen)) * unit(extent);
  return {
    hydroxide,
    ferricSolid,
    ferricDissolved: 1 - ferricSolid,
    ferrousDissolved: 1 - ferrousSolid,
    ferrousRemaining: ferrousSolid - oxidized,
    oxidized,
    oxygenUsed: oxidized / 4,
    waterUsed: oxidized / 2,
    fraction: ferrousSolid ? oxidized / ferrousSolid : 0,
    totalFerrousIron: 1 - ferrousSolid + ferrousSolid - oxidized + oxidized,
  };
}
export function hydroxideColour(fraction: number) {
  const p = unit(fraction),
    stops = [
      [227, 232, 215],
      [135, 154, 124],
      [161, 94, 60],
    ];
  const t = p < 0.25 ? p * 4 : (p - 0.25) / 0.75,
    i = p < 0.25 ? 0 : 1;
  return `rgb(${stops[i].map((a, j) => Math.round(a + (stops[i + 1][j] - a) * t)).join(',')})`;
}
export function hydroxideDirector(chapter: number, progress: number) {
  const p = unit(progress);
  return {
    oh: 3,
    oxygen: 0.25,
    extent: chapter === 0 ? 0 : chapter === 1 || chapter === 2 ? p : 1,
    add: chapter === 0 ? p : 1,
    micro: chapter === 2,
    compare: chapter === 3,
    progress: p,
  };
}
