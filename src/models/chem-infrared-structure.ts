export type IRSample = 'ethanol' | 'ether';
export type Mode = 'oh' | 'od' | 'nitrogen';
const u = 1.6605390666e-27,
  c = 2.99792458e10;
export function harmonicMode(mode: Mode) {
  const m1 = mode === 'nitrogen' ? 14 : 16,
    m2 = mode === 'oh' ? 1 : mode === 'od' ? 2 : 14,
    k = mode === 'nitrogen' ? 2294 : 700,
    mu = ((m1 * m2) / (m1 + m2)) * u;
  return {
    m1,
    m2,
    k,
    mu,
    wavenumber: Math.sqrt(k / mu) / (2 * Math.PI * c),
    dipoleDerivative: mode === 'nitrogen' ? 0 : 1,
  };
}
export function drivenMode(mode: Mode, wn: number, phase: number) {
  const a = harmonicMode(mode),
    r = wn / a.wavenumber,
    coupling = a.dipoleDerivative,
    response = (coupling * 0.16) / Math.sqrt((1 - r * r) ** 2 + (0.16 * r) ** 2),
    displacement = (5 + 18 * response) * Math.sin(phase);
  return {
    ...a,
    response,
    displacement,
    left: 150 - (displacement * a.m2) / (a.m1 + a.m2),
    right: 225 + (displacement * a.m1) / (a.m1 + a.m2),
    absorption: (coupling * 0.16 * 0.16 * r * r) / ((1 - r * r) ** 2 + 0.16 * 0.16 * r * r),
  };
}
const gaussian = (x: number, center: number, sigma: number) =>
  Math.exp(-0.5 * ((x - center) / sigma) ** 2);
/** Deliberately synthetic band positions/shapes, no claim of reproducing an acquired spectrum. */
export function absorbance(sample: IRSample, wn: number, column = 1, water = 0) {
  const common =
      0.3 * gaussian(wn, 2970, 45) + 0.19 * gaussian(wn, 2870, 40) + 0.24 * gaussian(wn, 1450, 35),
    specific =
      sample === 'ethanol'
        ? 1.05 * gaussian(wn, 3350, 180) +
          1.05 * gaussian(wn, 1050, 38) +
          0.16 * gaussian(wn, 1380, 30)
        : 0.98 * gaussian(wn, 1100, 45) + 0.2 * gaussian(wn, 2820, 35),
    contamination = water * (1.15 * gaussian(wn, 3400, 190) + 0.48 * gaussian(wn, 1640, 45));
  return Math.max(0, column) * (common + specific) + contamination;
}
export function transmission(sample: IRSample, wn: number, column = 1, water = 0) {
  const A = absorbance(sample, wn, column, water),
    T = 10 ** -A;
  return { A, T, absorbed: 1 - T, fieldRatio: Math.sqrt(T) };
}
export const waveX = (wn: number) => 48 + ((4000 - wn) / 3500) * 310;
export function infraredTrace(sample: IRSample, column: number, water: number, scan = 500) {
  return Array.from({ length: 351 }, (_, i) => {
    const wn = 4000 - i * 10,
      a = transmission(sample, wn, column, water);
    return { wn, x: waveX(wn), y: 25 + (1 - a.T) * 125, T: a.T };
  }).filter((v) => v.wn >= scan);
}
export function beamWave(T: number, phase: number, progress = 1) {
  return Array.from({ length: 281 }, (_, i) => {
    const x = 20 + i,
      amplitude = 11 * Math.max(0, T) ** (Math.max(0, Math.min(1, (x - 147) / 24)) / 2);
    return { x, y: 70 + amplitude * Math.sin(i / 11 - phase) };
  }).filter((v) => v.x <= 20 + 280 * Math.max(0, Math.min(1, progress)));
}
