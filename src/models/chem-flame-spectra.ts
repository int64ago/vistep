export type SpectrumElement = 'Na' | 'K' | 'Li' | 'He' | 'Hg';
export type SpectralLine = { nm: number; weight: number };
/** Selected neutral-atom AIR wavelengths in nm from NIST, not a complete line list. */
export const ATOMIC_LINES: Record<SpectrumElement, SpectralLine[]> = {
  Na: [
    { nm: 588.995, weight: 1 },
    { nm: 589.5924, weight: 0.5 },
  ],
  K: [
    { nm: 404.414, weight: 0.7 },
    { nm: 404.721, weight: 0.7 },
    { nm: 766.48991, weight: 1 },
    { nm: 769.89645, weight: 1 },
  ],
  Li: [
    { nm: 460.2898, weight: 0.15 },
    { nm: 610.3654, weight: 0.4 },
    { nm: 670.7775, weight: 0.5 },
    { nm: 670.7926, weight: 1 },
  ],
  He: [
    { nm: 447.1479, weight: 0.4 },
    { nm: 501.5678, weight: 0.2 },
    { nm: 587.56148, weight: 1 },
    { nm: 667.81517, weight: 0.4 },
    { nm: 706.51771, weight: 0.2 },
  ],
  Hg: [
    { nm: 404.6563, weight: 0.4 },
    { nm: 435.8328, weight: 1 },
    { nm: 546.0735, weight: 0.5 },
    { nm: 576.9598, weight: 0.15 },
    { nm: 579.0663, weight: 0.15 },
  ],
};
export const photonEnergyEv = (wavelengthNm: number) => 1239.841984 / Math.max(1, wavelengthNm);
/** Qualitative cobalt-glass passbands; not a measured commercial-filter calibration. */
export function cobaltTransmission(nm: number) {
  return Math.min(
    1,
    0.02 + 0.75 * Math.exp(-(((nm - 430) / 70) ** 2)) + 0.4 * Math.exp(-(((nm - 760) / 75) ** 2)),
  );
}
export function flameLines(element: SpectrumElement, sodiumInterference = 0, filter = false) {
  const extra =
    element === 'K'
      ? ATOMIC_LINES.Na.map((x) => ({
          ...x,
          weight: x.weight * Math.max(0, Math.min(1, sodiumInterference)) * 5,
        }))
      : [];
  return [...ATOMIC_LINES[element], ...extra].map((x) => ({
    ...x,
    transmission: filter ? cobaltTransmission(x.nm) : 1,
    observed: x.weight * (filter ? cobaltTransmission(x.nm) : 1),
  }));
}
export function wavelengthColour(nm: number) {
  if (nm < 440) return '#b79ce9';
  if (nm < 490) return '#87b8f1';
  if (nm < 530) return '#93d2bb';
  if (nm < 570) return '#c6d785';
  if (nm < 600) return '#edcf7c';
  if (nm < 640) return '#e8ae7f';
  return '#d58e91';
}
export function flameDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 3 ? 'flame' : chapter < 5 ? 'energy' : 'spectrum',
    element: (chapter === 0
      ? 'Na'
      : chapter < 3
        ? 'K'
        : chapter < 5
          ? 'Na'
          : (['Li', 'He', 'Hg'] as const)[Math.min(2, Math.floor(p * 3))]) as SpectrumElement,
    filter: chapter === 2,
    interference: chapter === 0 ? 0 : chapter === 1 ? 0.5 * p : 0.5,
    absorption: chapter === 4 || chapter === 6,
    progress: p,
  };
}
