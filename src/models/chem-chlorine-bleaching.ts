const unit = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
export type BleachSpecimen = 'dry-paper' | 'wet-paper' | 'flower';
/** Qualitative classroom comparison; extent is a normalized completed reaction, not time or dose. */
export function chlorineBleaching(specimen: BleachSpecimen, extent: number, gasPresent = true) {
  const p = unit(extent);
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
      change: unit(changed * 24 - i),
    })),
  };
}
export function bleachColour(fraction: number) {
  const p = unit(fraction),
    start = [174, 105, 122],
    end = [234, 230, 212];
  return `rgb(${start.map((n, i) => Math.round(n * p + end[i] * (1 - p))).join(',')})`;
}
/** Presentation time only; no measured pigment rate law is implied. */
export function bleachingDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.max(0, Math.min(2, Math.floor(Number.isFinite(chapter) ? chapter : 0)));
  const p = unit(progress),
    t = Number.isFinite(chapterTime) ? Math.max(0, chapterTime!) : p * [28, 27, 34][c];
  const limits =
    locale === 'en'
      ? [
          [5.4, 9],
          [1.2, 3.8],
          [10.5, 15.5],
        ]
      : [
          [7, 11.5],
          [3.5, 5.9],
          [10.5, 16.3],
        ];
  const [start, end] = limits[c];
  return {
    flower: c === 1,
    micro: c === 2,
    extent: unit((t - start) / (end - start)),
    water: true,
    gas: true,
  };
}
