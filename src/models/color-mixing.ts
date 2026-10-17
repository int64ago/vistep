export type LinearRgb = [number, number, number];
export const MIXING_PRIMARIES = ['#ff6d54', '#93d391', '#809fef'];
const valid = (v: LinearRgb) => {
  if (v.length !== 3 || v.some((x) => !Number.isFinite(x) || x < 0 || x > 1))
    throw new RangeError('RGB fractions must lie in [0,1]');
};
/** Relative linear-light sRGB channels; encoding is applied only for display. */
export function mixingEncode(v: number) {
  const q = Math.max(0, Math.min(1, v));
  return q <= 0.0031308 ? 12.92 * q : 1.055 * q ** (1 / 2.4) - 0.055;
}
export function mixingCss(v: LinearRgb) {
  return `rgb(${v.map((x) => Math.round(255 * mixingEncode(x))).join(' ')})`;
}
export function mixingAdd(lights: LinearRgb[]) {
  lights.forEach(valid);
  return [0, 1, 2].map((k) => lights.reduce((s, v) => s + v[k], 0)) as LinearRgb;
}
/** Ideal independent CMY filters: fractional rejection in the complementary RGB channel. */
export function mixingFilters(input: LinearRgb, amounts: LinearRgb) {
  valid(input);
  valid(amounts);
  let current = [...input] as LinearRgb;
  const stages = [current];
  for (let j = 0; j < 3; j++) {
    current = current.map((v, k) => v * (k === j ? 1 - amounts[j] : 1)) as LinearRgb;
    stages.push(current);
  }
  return { stages, output: current };
}
export function mixingLuminance(v: LinearRgb) {
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
/** A flat-topped circular beam with a smooth finite penumbra, coordinates normalized to radius. */
export function mixingBeam(distance: number) {
  if (distance <= 0.75) return 1;
  if (distance >= 1) return 0;
  const p = (distance - 0.75) / 0.25;
  return 1 - p * p * (3 - 2 * p);
}
export function mixingShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const lights: LinearRgb = chapter === 0 ? [1, p, 0] : chapter === 1 ? [1, 1, p] : [0.5, 0.5, 0.5];
  const filters: LinearRgb =
    chapter === 3 ? [p, 0, 0] : chapter === 4 ? [1, 0, p] : chapter === 5 ? [1, p, 1] : [1, 0, 1];
  const input: LinearRgb = chapter === 6 ? [1, 1 - p, 1 - p] : [1, 1, 1];
  return { subtract: chapter >= 3, lights, filters, input };
}
