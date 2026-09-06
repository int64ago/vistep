/**
 * Cover artwork is drawn in a 400×230 viewBox and shown at card size, so one decimal is already
 * far below a device pixel. Rounding and thinning the sampled model output keeps the catalog page
 * small without changing which geometry the covers are derived from.
 */
export function svgNumber(value: number, decimals = 1) {
  const scale = 10 ** decimals,
    rounded = Math.round(value * scale) / scale;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}
export const svgPoint = (point: readonly number[], decimals = 1, separator = ',') =>
  point.map((value) => svgNumber(value, decimals)).join(separator);
export const svgPolyline = (points: readonly (readonly number[])[], decimals = 1) =>
  points.map((point, i) => `${i ? 'L' : 'M'}${svgPoint(point, decimals)}`).join(' ');
/** Every `step`-th sample plus the last one, so open curves keep both ends. */
export function thin<T>(points: readonly T[], step: number): T[] {
  if (step <= 1) return [...points];
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}
/**
 * Rendered cover markup still carries full float precision from model output in attributes that
 * were never routed through `svgNumber`. Three decimals keep every cover transform (largest scale
 * factor 79) well under a device pixel while cutting most of the digits.
 */
export const compactSvg = (svg: string) =>
  svg.replace(/-?\d*\.\d{4,}(?:e[-+]?\d+)?/g, (value) => svgNumber(Number(value), 3));
