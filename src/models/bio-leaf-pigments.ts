import spectra from './bio-pigment-spectra.json';
export type PigmentKey = 'a' | 'b' | 'carotene';
export const pigmentBands = [
  { id: 'carotene', name: '胡萝卜素', color: '#d49b38', rf: 0.93, amount: 0.12 },
  { id: 'xanthophyll', name: '叶黄素', color: '#d6bd45', rf: 0.68, amount: 0.13 },
  { id: 'a', name: '叶绿素a', color: '#4b8c7a', rf: 0.45, amount: 0.5 },
  { id: 'b', name: '叶绿素b', color: '#96a44d', rf: 0.26, amount: 0.25 },
] as const;
/** Illustrative partition factors in one solvent; front follows capillary sqrt(t). */
export function chromatography(progress: number, immersed = false, lineWidth = 1) {
  const p = Math.min(1, Math.max(0, progress)),
    front = 170 * Math.sqrt(p);
  return {
    front,
    valid: !immersed,
    bands: pigmentBands.map((b) => ({
      ...b,
      distance: immersed ? 0 : b.rf * front,
      width: Math.max(1, lineWidth) * 2 + 2 * Math.sqrt(p),
      retained: immersed ? Math.exp(-p * 6) : 1,
    })),
    dissolved: immersed ? 1 - Math.exp(-p * 6) : 0,
  };
}
export function pigmentTransmission(
  pigment: PigmentKey,
  wavelength: number,
  microMolar = 5,
  pathCm = 1,
) {
  const series = spectra[pigment].extinctionPerMolarCm,
    position = Math.max(0, Math.min(60, (wavelength - 400) / 5)),
    i = Math.floor(position),
    epsilon = series[i] + ((series[i + 1] ?? series[i]) - series[i]) * (position - i),
    absorbance = epsilon * Math.max(0, microMolar) * 1e-6 * Math.max(0, pathCm),
    transmitted = 10 ** -absorbance;
  return { epsilon, absorbance, transmitted, absorbed: 1 - transmitted };
}
export function spectralColor(nm: number) {
  const stops = [
      [400, 113, 88, 170],
      [450, 81, 114, 177],
      [500, 82, 155, 125],
      [550, 133, 170, 73],
      [600, 205, 152, 63],
      [650, 182, 94, 68],
      [700, 138, 63, 65],
    ],
    p = Math.max(0, Math.min(5.999, (nm - 400) / 50)),
    i = Math.floor(p),
    f = p - i,
    a = stops[i],
    b = stops[i + 1];
  return `rgb(${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)},${Math.round(a[3] + (b[3] - a[3]) * f)})`;
}
