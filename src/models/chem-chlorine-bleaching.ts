export type BleachSpecimen = 'dry-paper' | 'wet-paper' | 'flower';
/** Qualitative classroom comparison; extent is a normalized completed reaction, not time or dose. */
export function chlorineBleaching(specimen: BleachSpecimen, extent: number, gasPresent = true) {
  const p = Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0));
  const waterAvailable = specimen !== 'dry-paper',
    changed = waterAvailable && gasPresent ? p : 0;
  return {
    waterAvailable,
    changed,
    colourRemaining: 1 - changed,
    gasPresent,
    units: Array.from({ length: 24 }, (_, i) => ({
      index: i,
      oxidized: (i + 0.5) / 24 <= changed,
    })),
  };
}
export function bleachColour(fraction: number) {
  const p = Math.max(0, Math.min(1, fraction)),
    start = [174, 105, 122],
    end = [234, 230, 212];
  return `rgb(${start.map((n, i) => Math.round(n * p + end[i] * (1 - p))).join(',')})`;
}
export function bleachingDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { flower: chapter === 1, micro: chapter === 2, extent: p, water: true };
}
