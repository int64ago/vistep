/** Opaque diffuse-grey sphere in a much larger isothermal black enclosure. */
export const radiationConstants = {
  sigma: 5.670374419e-8,
  h: 6.62607015e-34,
  c: 299792458,
  k: 1.380649e-23,
  wien: 2.897771955e-3,
} as const;
export interface RadiationOptions {
  temperature?: number;
  surroundings?: number;
  emissivity?: number;
  area?: number;
}
export function heatRadiation(o: RadiationOptions = {}) {
  const temperature = o.temperature ?? 400,
    surroundings = o.surroundings ?? 300,
    emissivity = o.emissivity ?? 0.9,
    area = o.area ?? 0.02;
  if (
    ![temperature, surroundings, area].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(emissivity) ||
    emissivity < 0 ||
    emissivity > 1
  )
    throw new RangeError('Positive kelvin temperatures and area, emissivity in [0,1] required');
  const emitted = emissivity * area * radiationConstants.sigma * temperature ** 4,
    incident = area * radiationConstants.sigma * surroundings ** 4,
    absorbed = emissivity * incident,
    reflected = (1 - emissivity) * incident;
  return {
    temperature,
    surroundings,
    emissivity,
    area,
    emitted,
    incident,
    absorbed,
    reflected,
    netOut: emissivity * area * radiationConstants.sigma * (temperature ** 4 - surroundings ** 4),
    radius: Math.sqrt(area / (4 * Math.PI)),
    peak: radiationConstants.wien / temperature,
  };
}
/** Hemispherical spectral exitance, W/m² per metre of wavelength. */
export function spectralExitance(wavelength: number, temperature: number, emissivity = 1) {
  if (
    !Number.isFinite(wavelength) ||
    wavelength <= 0 ||
    !Number.isFinite(temperature) ||
    temperature <= 0 ||
    emissivity < 0 ||
    emissivity > 1 ||
    !Number.isFinite(emissivity)
  )
    throw new RangeError('Physical wavelength, temperature and emissivity required');
  const { h, c, k } = radiationConstants,
    exponent = (h * c) / (wavelength * k * temperature);
  if (exponent > 700) return 0;
  return (emissivity * 2 * Math.PI * h * c * c) / (wavelength ** 5 * Math.expm1(exponent));
}
export function radiationShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { temperature: 400, surroundings: 300, emissivity: 0.9, area: 0.02, spectrum: false };
  if (chapter === 1) return { ...base, surroundings: 300 + 100 * p };
  if (chapter === 2) return { ...base, temperature: 300 + 300 * p };
  if (chapter === 3) return { ...base, emissivity: 0.95 - 0.8 * p };
  if (chapter === 4) return { ...base, surroundings: 300 + 200 * p };
  if (chapter === 5) return { ...base, temperature: 300 + 300 * p, spectrum: true };
  return base;
}
