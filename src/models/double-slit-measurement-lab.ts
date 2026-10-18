import { finiteClamp } from './modern-labs';
export function slitMeasurement(wavelengthNm = 589, separationMm = 0.18, distanceM = 1.2) {
  const wavelength = finiteClamp(wavelengthNm, 450, 650),
    d = finiteClamp(separationMm, 0.18, 0.36),
    L = finiteClamp(distanceM, 0.8, 1.5),
    spacing = (wavelength * 1e-3 * L) / d;
  return {
    wavelength,
    d,
    L,
    spacing,
    intensity: (xMm: number) => Math.cos((Math.PI * xMm) / spacing) ** 2,
  };
}
export function inferWavelength(
  firstMm: number,
  lastMm: number,
  brightCount = 6,
  d = 0.18,
  L = 1.2,
) {
  if (
    !Number.isFinite(firstMm + lastMm) ||
    brightCount < 2 ||
    !Number.isInteger(brightCount) ||
    d <= 0 ||
    L <= 0
  )
    return null;
  return (((Math.abs(lastMm - firstMm) / (brightCount - 1)) * d) / L) * 1e3;
}
/** A linear sensor averages intensity over each active pixel, not point samples. */
export function sensorArray(wavelength = 589, d = 0.18, L = 1.2, count = 160) {
  const s = slitMeasurement(wavelength, d, L),
    pitch = 40 / count;
  return Array.from({ length: count }, (_, j) => {
    const x = -20 + (j + 0.5) * pitch,
      k = (2 * Math.PI) / s.spacing,
      u = (k * pitch) / 2;
    return { x, value: 0.5 + 0.5 * Math.cos(k * x) * (Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u) };
  });
}
/** Ideal grazing mirror, scalar equal-amplitude paths; mm and m inputs. */
export function lloydMirror(yMm: number, heightMm = 0.3, wavelengthNm = 589, L = 1.2) {
  const y = Math.max(0, yMm) * 1e-3,
    a = finiteClamp(heightMm, 0.15, 0.6) * 1e-3,
    lambda = finiteClamp(wavelengthNm, 450, 650) * 1e-9,
    r1 = Math.hypot(L, y - a),
    r2 = Math.hypot(L, y + a),
    difference = (4 * y * a) / (r1 + r2),
    phase = (2 * Math.PI * difference) / lambda + Math.PI;
  return {
    difference,
    phase,
    intensity: (1 + Math.cos(phase)) / 2,
    reflectionX: (L * a) / (a + y),
    spacingMm: ((lambda * L) / (2 * a)) * 1000,
  };
}
