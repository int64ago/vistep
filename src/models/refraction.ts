/** Isotropic lossless interface; angles are measured from the normal, in degrees. */
export function refraction(angle = 45, n1 = 1, n2 = 1.5, wavelength = 550) {
  if (
    ![angle, n1, n2, wavelength].every(Number.isFinite) ||
    Math.abs(angle) >= 90 ||
    n1 <= 0 ||
    n2 <= 0 ||
    wavelength <= 0
  )
    throw new RangeError('Invalid interface parameters');
  const radians = (angle * Math.PI) / 180,
    sine = (n1 / n2) * Math.sin(radians),
    total = Math.abs(sine) > 1;
  const transmitted = total ? null : (Math.asin(Math.max(-1, Math.min(1, sine))) * 180) / Math.PI;
  return {
    angle,
    n1,
    n2,
    transmitted,
    total,
    wavelength1: wavelength / n1,
    wavelength2: wavelength / n2,
    speedRatio: n1 / n2,
    tangential: n1 * Math.sin(radians),
  };
}
export function refractionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  if (chapter === 0) return { angle: 25 + 30 * p, n1: 1, n2: 1.5 };
  if (chapter === 1) return { angle: 45 * (1 - Math.min(1, p * 2)), n1: 1, n2: 1.5 };
  if (chapter === 2) return { angle: 45, n1: 1, n2: 1.1 + 0.7 * p };
  if (chapter === 3) return { angle: 30, n1: 1.5, n2: 1 };
  if (chapter === 4) return { angle: 45, n1: 1, n2: 1.5 };
  return { angle: 35 + 20 * p, n1: 1, n2: 1.5 };
}
