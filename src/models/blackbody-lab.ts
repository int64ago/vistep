import { H, C_LIGHT, BOLTZMANN, finiteClamp } from './modern-labs';

/** Spectral radiance per micrometre, W m⁻² sr⁻¹ µm⁻¹. Inputs are a disclosed teaching domain. */
export function blackbodySpectrum(wavelengthUM: number, temperature: number) {
  const um = finiteClamp(wavelengthUM, 0.05, 10000);
  const kelvin = finiteClamp(temperature, 100, 20000);
  const wavelength = um * 1e-6;
  const quantum = (H * C_LIGHT) / wavelength;
  const thermal = BOLTZMANN * kelvin;
  const x = quantum / thermal;
  const suppression = x > 700 ? 0 : x / Math.expm1(x);
  const classical = ((2 * C_LIGHT * thermal) / wavelength ** 4) * 1e-6;
  return {
    wavelengthUM: um,
    temperature: kelvin,
    quantum,
    thermal,
    x,
    classical,
    planck: classical * suppression,
    suppression,
    excitationProbability: Math.exp(-x),
    meanEnergy: thermal * suppression,
  };
}
export const blackbodyPeakUM = (temperature: number) =>
  2897.771955 / finiteClamp(temperature, 100, 20000);
export const heatPlotScale = blackbodySpectrum(blackbodyPeakUM(6500), 6500).planck;
export const historyPlotScale = blackbodySpectrum(blackbodyPeakUM(1600), 1600).planck;

/**
 * Approximate readings of the OPEN CIRCLES in supplied PEP textbook, elective 3,
 * printed p68, Fig4.1-3 (PDF p73). Independently read from the 920×1300 page render.
 * x origin353px, scale45.5px/µm; y baseline1044px, plotted peak840px.
 * These are a textbook illustration of experimental results, NOT an original
 * laboratory dataset, uncertainty estimate, or samples generated from Planck's law.
 * The ordinate is relative; one common peak-reference multiplier is applied to
 * both theoretical curves. This only compares trends, not absolute calibration.
 */
export const textbookFigurePixels = [
  [384, 1028],
  [388, 1023],
  [393, 1008],
  [399, 961],
  [405, 923],
  [412, 882],
  [420, 855],
  [429, 842],
  [437, 840],
  [445, 842],
  [457, 856],
  [470, 886],
  [483, 912],
  [498, 937],
  [508, 948],
  [524, 965],
  [538, 978],
  [555, 993],
  [564, 999],
  [586, 1011],
  [607, 1020],
] as const;
export const textbookSpectrum = textbookFigurePixels.map(([x, y]) => ({
  wavelengthUM: (x - 353) / 45.5,
  relative: (1044 - y) / 204,
}));
export interface BlackbodyState {
  chapter: number;
  temperature: number;
  probeUM: number;
  reveal: number;
  classical: boolean;
  quantum: boolean;
  history: boolean;
  reference: boolean;
}
const ease = (x: number) => {
  const p = finiteClamp(x, 0, 1);
  return p * p * (3 - 2 * p);
};
/** Chapter-relative seconds follow the measured bilingual narration; direct seeks are deterministic. */
export function blackbodyShot(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
): BlackbodyState {
  const c = Math.round(finiteClamp(chapter, 0, 3)),
    p = finiteClamp(progress, 0, 1),
    t = finiteClamp(chapterTime ?? p * [34, 28, 28, 58][c], 0, [34, 28, 28, 58][c]);
  if (c === 0)
    return {
      chapter: c,
      temperature: 1600,
      probeUM: 6 - 5.35 * ease((t - 20.5) / 5.3),
      reveal: 1,
      classical: false,
      quantum: false,
      history: true,
      reference: false,
    };
  if (c === 1)
    return {
      chapter: c,
      temperature: Math.round(3000 + 3000 * ease((p - 0.12) / 0.7)),
      probeUM: 1,
      reveal: 1,
      classical: false,
      quantum: false,
      history: false,
      reference: true,
    };
  if (c === 2)
    return {
      chapter: c,
      temperature: 6000,
      probeUM: blackbodyPeakUM(6000),
      reveal: 1,
      classical: false,
      quantum: false,
      history: false,
      reference: true,
    };
  return {
    chapter: c,
    temperature: 1600,
    probeUM:
      Math.round(
        (6 - 5 * ease((t - (locale === 'en' ? 28.8 : 32.7)) / (locale === 'en' ? 4.2 : 3.4))) * 100,
      ) / 100,
    reveal: 1,
    classical: true,
    quantum: t >= (locale === 'en' ? 18.3 : 20.3),
    history: true,
    reference: false,
  };
}
export function blackbodyTrial(s: BlackbodyState, patch: Partial<BlackbodyState>): BlackbodyState {
  const next = { ...s, ...patch };
  return {
    ...next,
    chapter: Math.round(finiteClamp(next.chapter, 0, 3)),
    temperature: finiteClamp(next.temperature, 1600, 6500),
    probeUM: finiteClamp(next.probeUM, 0.2, 8),
    reveal: finiteClamp(next.reveal, 0, 1),
    // Historical dots describe one temperature only; never move with a slider.
    history: next.history && next.temperature === 1600,
  };
}
export function spectrumPath(
  temperature: number,
  classical: boolean,
  maxUM: number,
  scale: number,
  width: number,
  height: number,
  left = 28,
  top = 18,
) {
  return Array.from({ length: 241 }, (_, i) => {
    const um = 0.05 + ((maxUM - 0.05) * i) / 240;
    const y = blackbodySpectrum(um, temperature)[classical ? 'classical' : 'planck'] / scale;
    return `${i ? 'L' : 'M'}${(left + (um / maxUM) * width).toFixed(3)} ${(top + height * (1 - Math.min(2, y))).toFixed(3)}`;
  }).join(' ');
}
