import { finiteClamp } from './modern-labs';
/** Symmetric, lossless three-layer film at normal incidence; nm throughout. */
export function symmetricFilm(thickness: number, wavelength = 589, index = 1.333, outer = 1) {
  const d = finiteClamp(thickness, 0, 200000),
    w = finiteClamp(wavelength, 380, 780),
    r = (outer - index) / (outer + index),
    s = Math.sin((2 * Math.PI * index * d) / w) ** 2;
  return (4 * r * r * s) / ((1 - r * r) ** 2 + 4 * r * r * s);
}
export function soapThickness(y: number, drain = 1) {
  return (30 + 1250 * finiteClamp(y, 0, 1)) * finiteClamp(drain, 0.15, 1.2);
}
export function wedgeThickness(xMm: number, sheets = 2) {
  return (Math.max(0, xMm) / 80) * 40 * finiteClamp(sheets, 1, 2) * 1000;
}
export function wedgeSpacing(wavelength = 589, sheets = 2) {
  return wavelength / (2 * ((40 * finiteClamp(sheets, 1, 2) * 1000) / 80));
}
export function filmColor(
  thickness: number,
  white = false,
  wavelength = 589,
  index = 1.333,
  outer = 1,
) {
  const ref = (w: number) => symmetricFilm(thickness, w, index, outer),
    max =
      (4 * ((outer - index) / (outer + index)) ** 2) /
      (1 + ((outer - index) / (outer + index)) ** 2) ** 2;
  if (white)
    return `rgb(${[650, 530, 460].map((w) => Math.round(240 * Math.sqrt(ref(w) / max))).join(',')})`;
  const rgb =
    wavelength > 575 ? [232, 189, 80] : wavelength > 500 ? [122, 190, 122] : [100, 140, 229];
  return `rgb(${rgb.map((c) => Math.round(10 + c * Math.sqrt(ref(wavelength) / max))).join(',')})`;
}
