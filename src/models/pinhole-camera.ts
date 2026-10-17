export type PinholeOptions = {
  aperture?: number;
  objectDistance?: number;
  screenDistance?: number;
  wavelength?: number;
};
/** Distances and aperture in mm; wavelength in nm. Incoherent geometric blur and a far-field diffraction scale. */
export function pinhole(options: PinholeOptions = {}) {
  const {
    aperture: d = 0.35,
    objectDistance: a = 600,
    screenDistance: b = 100,
    wavelength = 550,
  } = options;
  if (
    ![d, a, b, wavelength].every(Number.isFinite) ||
    d <= 0 ||
    a <= 0 ||
    b <= 0 ||
    wavelength <= 0
  )
    throw new RangeError('Invalid pinhole geometry');
  const lambda = wavelength * 1e-6,
    magnification = -b / a;
  const geometric = d * (1 + b / a),
    diffraction = (2.44 * lambda * b) / d;
  return {
    aperture: d,
    objectDistance: a,
    screenDistance: b,
    magnification,
    geometric,
    diffraction,
    illustrativeWidth: Math.hypot(geometric, diffraction),
    throughput: d * d,
    fresnelNumber: ((d / 2) ** 2 / lambda) * (1 / a + 1 / b),
    balanceAperture: Math.sqrt((2.44 * lambda * b) / (1 + b / a)),
  };
}
export function pinholeImage(objectHeight: number, options: PinholeOptions = {}) {
  return objectHeight * pinhole(options).magnification;
}
/** Exact straight-ray landing position for an aperture crossing height. */
export function pinholeRay(objectHeight: number, holeHeight: number, options: PinholeOptions = {}) {
  const s = pinhole(options);
  return holeHeight + ((holeHeight - objectHeight) * s.screenDistance) / s.objectDistance;
}
export function pinholeShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    aperture: [0.35, 2 - 1.6 * p, 0.4 - 0.3 * p, 0.1 - 0.07 * p, 0.35, 0.35][Math.min(chapter, 5)],
    screenDistance: chapter === 5 ? 80 + 100 * p : 100,
  };
}
