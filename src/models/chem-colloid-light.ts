/** A dilute, nonabsorbing Rayleigh-sphere analogy; not a fit to iron hydroxide. */
export function colloidOptics(radiusNm = 18, volumePpm = 120, wavelengthNm = 633, pathCm = 10) {
  const radius = Math.max(1, Math.min(24, radiusNm)) * 1e-9;
  const fraction = Math.max(0, Math.min(500, volumePpm)) * 1e-6;
  const wavelength = Math.max(450, Math.min(680, wavelengthNm)) * 1e-9;
  const length = Math.max(0, Math.min(30, pathCm)) / 100;
  const mediumIndex = 1.333,
    particleIndex = 1.59;
  const relativeIndex = particleIndex / mediumIndex;
  const polarizability = ((relativeIndex ** 2 - 1) / (relativeIndex ** 2 + 2)) ** 2;
  const crossSection =
    ((8 * Math.PI) / 3) *
    ((2 * Math.PI * mediumIndex) / wavelength) ** 4 *
    radius ** 6 *
    polarizability;
  const numberDensity = fraction / ((4 * Math.PI * radius ** 3) / 3);
  const coefficient = numberDensity * crossSection;
  const opticalDepth = coefficient * length;
  const transmitted = Math.exp(-opticalDepth);
  return {
    crossSection,
    numberDensity,
    coefficient,
    opticalDepth,
    transmitted,
    scattered: -Math.expm1(-opticalDepth),
    sizeParameter: (2 * Math.PI * mediumIndex * radius) / wavelength,
  };
}
export function rayleighSideIntensity(angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return (1 + Math.cos(angle) ** 2) / 2;
}
export function colloidDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    prepared: chapter > 0 ? 1 : Math.min(1, p / 0.65),
    light: chapter > 0,
    microscopic: chapter === 2,
    radiusNm: 18,
    volumePpm: chapter === 3 ? 120 * (1 - 0.85 * p) : 120,
    wavelengthNm: 633,
  };
}
