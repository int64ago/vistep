import { finiteClamp } from './modern-labs';
import { microscopeBessel } from './microscope';
/** Paraxial Fresnel integral of a uniformly illuminated one-dimensional slit. SI inside. */
export function fresnelSlit(
  xMm: number,
  widthUm = 100,
  wavelengthNm = 550,
  distance = 1,
  steps = 192,
) {
  const a = finiteClamp(widthUm, 30, 800) * 1e-6,
    x = xMm * 1e-3,
    lambda = finiteClamp(wavelengthNm, 450, 650) * 1e-9,
    L = finiteClamp(distance, 0.5, 2);
  let re = 0,
    im = 0;
  for (let j = 0; j <= steps; j++) {
    const u = a * (j / steps - 0.5),
      phase = (Math.PI * (x - u) ** 2) / (lambda * L),
      w = j === 0 || j === steps ? 1 : j % 2 ? 4 : 2;
    re += w * Math.cos(phase);
    im += w * Math.sin(phase);
  }
  const scale = a / (3 * steps * Math.sqrt(lambda * L));
  return (re * re + im * im) * scale * scale;
}
/** Circular Fresnel aperture field, then Babinet complement for an opaque disk. */
export function fresnelCircle(
  radiusMm: number,
  obstacleRadiusMm = 0.6,
  wavelengthNm = 550,
  distance = 1,
  disk = true,
  steps = 192,
) {
  const r = Math.abs(radiusMm) * 1e-3,
    a = finiteClamp(obstacleRadiusMm, 0.1, 1) * 1e-3,
    lambda = finiteClamp(wavelengthNm, 450, 650) * 1e-9,
    L = finiteClamp(distance, 0.5, 2),
    K = Math.PI / (lambda * L);
  let re = 0,
    im = 0;
  for (let j = 0; j <= steps; j++) {
    const rho = (a * j) / steps,
      w = j === 0 || j === steps ? 1 : j % 2 ? 4 : 2,
      b = microscopeBessel(0, 2 * K * r * rho),
      phase = K * rho * rho;
    re += w * rho * b * Math.cos(phase);
    im += w * rho * b * Math.sin(phase);
  }
  const scale = (a / (3 * steps)) * 2 * K,
    ph = K * r * r,
    c = Math.cos(ph),
    s = Math.sin(ph),
    ar = scale * (re * s + im * c),
    ai = scale * (-re * c + im * s);
  return disk ? (1 - ar) ** 2 + ai * ai : ar * ar + ai * ai;
}
export function slitProfile(width = 100, white = false, wavelength = 550) {
  return Array.from({ length: 301 }, (_, j) => {
    const x = ((j / 300) * 2 - 1) * 15;
    const values = (white ? [650, 530, 460] : [wavelength]).map((w) => fresnelSlit(x, width, w));
    return { x, values };
  });
}
export function diffractionDisplayColor(values: number[]) {
  const brightness = (n: number) => Math.round(255 * (1 - Math.exp(-2.5 * Math.max(0, n))) ** 0.55);
  if (values.length === 3) return `rgb(${values.map(brightness).join(',')})`;
  const b = brightness(values[0]);
  return `rgb(${Math.round(b * 0.65)},${b},${Math.round(b * 0.75)})`;
}
