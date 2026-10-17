/** Normal incidence, lossless nondispersive film. Wavelength and thickness are nm. */
export function thinFilm(
  thickness: number,
  wavelength = 550,
  filmIndex = 1.33,
  substrateIndex = 1,
) {
  if (
    ![thickness, wavelength, filmIndex, substrateIndex].every(Number.isFinite) ||
    thickness < 0 ||
    wavelength <= 0 ||
    filmIndex <= 0 ||
    substrateIndex <= 0
  )
    throw new RangeError('Invalid film parameters');
  const r01 = (1 - filmIndex) / (1 + filmIndex);
  const r12 = (filmIndex - substrateIndex) / (filmIndex + substrateIndex);
  const opticalPath = 2 * filmIndex * thickness;
  const propagation = (2 * Math.PI * opticalPath) / wavelength;
  const reflectionPhase = (r12 < 0 ? Math.PI : 0) - (r01 < 0 ? Math.PI : 0);
  const phase = propagation + reflectionPhase;
  const numerator = r01 * r01 + r12 * r12 + 2 * r01 * r12 * Math.cos(propagation);
  const denominator = 1 + (r01 * r12) ** 2 + 2 * r01 * r12 * Math.cos(propagation);
  const backReal = r12 * Math.cos(propagation),
    backImaginary = r12 * Math.sin(propagation),
    denominatorReal = 1 + r01 * backReal,
    denominatorImaginary = r01 * backImaginary,
    reflectedReal =
      ((r01 + backReal) * denominatorReal + backImaginary * denominatorImaginary) / denominator,
    reflectedImaginary =
      (backImaginary * denominatorReal - (r01 + backReal) * denominatorImaginary) / denominator;
  return {
    opticalPath,
    propagation,
    reflectionPhase,
    phase,
    contrast: (1 + Math.cos(phase)) / 2,
    reflectance: numerator / denominator,
    r01,
    r12,
    // The second contribution sums every wave returning from inside the layer.
    fields: [
      { real: r01, imaginary: 0 },
      { real: reflectedReal - r01, imaginary: reflectedImaginary },
      { real: reflectedReal, imaginary: reflectedImaginary },
    ],
  };
}
/** Three sampled wavelengths: illustrative spectral swatch, not colorimetry. */
export function filmSwatch(thickness: number, substrateIndex = 1) {
  return `rgb(${[650, 530, 460]
    .map((w) =>
      Math.round(255 * Math.sqrt(thinFilm(thickness, w, 1.33, substrateIndex).reflectance / 0.15)),
    )
    .map((v) => Math.min(255, v))
    .join(',')})`;
}
export function filmShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const d = [40, 0, 550 / (4 * 1.33), 550 / (2 * 1.33), 550 / (4 * 1.33), 20 + p * 650][
    Math.min(chapter, 5)
  ];
  return {
    thickness: chapter === 0 ? 40 + 120 * p : chapter === 1 ? 160 * (1 - Math.min(1, p * 2)) : d,
    substrate: chapter === 4 ? 1.5 : 1,
    white: chapter === 5,
  };
}
