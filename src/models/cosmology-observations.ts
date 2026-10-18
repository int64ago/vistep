import { HUBBLE_RECORDS, PENZIAS_WILSON_RECORD } from './cosmology-observations-records';
export const LIGHT_SPEED = 299792458;
const PLANCK = 6.62607015e-34,
  BOLTZMANN = 1.380649e-23;
export const clampCosmo = (x: number, min: number, max: number, fallback = min) =>
  Math.max(min, Math.min(max, Number.isFinite(x) ? x : fallback));
const part = (x: number, start: number, end: number) =>
  clampCosmo((x - start) / (end - start), 0, 1);
export const SPECTRAL_TEMPLATE = Object.freeze([434.05, 486.13, 656.28]);
/** Rounded Balmer air-wavelength teaching template, not a galaxy observation. */
export function spectralPattern(ratio = 1.05) {
  const scale = clampCosmo(ratio, 1, 1.1, 1.05);
  return SPECTRAL_TEMPLATE.map((rest, id) => ({ id, rest, observed: rest * scale, ratio: scale }));
}
/** Legacy low-z model API, kept distinct from the fixed historical record. */
export function hubbleSpectrum(distance = 100, H0 = 70) {
  const d = clampCosmo(distance, 5, 200),
    h = clampCosmo(H0, 50, 90, 70),
    velocity = d * h;
  return {
    distance: d,
    H0: h,
    velocity,
    z: velocity / 299792.458,
    lines: spectralPattern(1 + velocity / 299792.458),
  };
}
/** A dimensionless constant-H spacetime example: local light speed xdot-Hx=c. */
export function wavePacket(time = 0, H = 0.3, lambda0 = 1, c = 1) {
  const t = clampCosmo(time, 0, 4),
    h = clampCosmo(H, 0, 0.5),
    lambda = clampCosmo(lambda0, 0.1, 2, 1),
    localSpeed = clampCosmo(c, 0, 2, 1),
    scale = Math.exp(h * t),
    travel = h < 1e-8 ? localSpeed * t : (localSpeed * Math.expm1(h * t)) / h;
  return {
    time: t,
    H: h,
    scale,
    wavelength: lambda * scale,
    localSpeed,
    crests: [-2, -1, 0, 1, 2].map((id) => {
      const x = scale * id * lambda + travel;
      return { id, x, relativeX: x - travel, velocity: h * x + localSpeed };
    }),
  };
}
export const GALAXY_COORDINATES = Object.freeze([
  Object.freeze({ id: 'A', x: -2, y: 0 }),
  Object.freeze({ id: 'B', x: -1, y: 0 }),
  Object.freeze({ id: 'C', x: 0, y: 0 }),
  Object.freeze({ id: 'D', x: 1, y: 0 }),
  Object.freeze({ id: 'E', x: 2, y: 0 }),
  Object.freeze({ id: 'F', x: -1, y: 1 }),
  Object.freeze({ id: 'G', x: 1, y: -1 }),
]);
/** Comoving grid. Bound galaxy glyphs do not scale. Distances in Mpc, speeds in km/s. */
export function expandingGalaxies(scale = 1, H = 70, origin = 2) {
  const a = clampCosmo(scale, 1, 2, 1),
    h = clampCosmo(H, 50, 90, 70),
    reference = GALAXY_COORDINATES[Math.round(clampCosmo(origin, 0, 4, 2))];
  return GALAXY_COORDINATES.map((g) => {
    const dx = a * (g.x - reference.x) * 50,
      dy = a * (g.y - reference.y) * 50;
    return {
      id: g.id,
      x: a * g.x,
      y: a * g.y,
      dx,
      dy,
      distance: Math.hypot(dx, dy),
      vx: h * dx,
      vy: h * dy,
      origin: reference.id,
    };
  });
}
/** Two one-parameter descriptions of RAW Table I, not Hubble's solar-corrected regression. */
export function hubbleCandidate(kind: 'constant' | 'proportional' = 'proportional') {
  const n = HUBBLE_RECORDS.length,
    constant = HUBBLE_RECORDS.reduce((s, r) => s + r.radialVelocityKmPerSecondMeasured, 0) / n,
    slope =
      HUBBLE_RECORDS.reduce(
        (s, r) => s + r.distanceMpcHistorical * r.radialVelocityKmPerSecondMeasured,
        0,
      ) / HUBBLE_RECORDS.reduce((s, r) => s + r.distanceMpcHistorical ** 2, 0),
    predict = (distance: number) =>
      kind === 'constant' ? constant : slope * clampCosmo(distance, 0, 10),
    rms = Math.sqrt(
      HUBBLE_RECORDS.reduce(
        (s, r) => s + (r.radialVelocityKmPerSecondMeasured - predict(r.distanceMpcHistorical)) ** 2,
        0,
      ) / n,
    );
  return { kind, constant, slope, rms, predict };
}
/** Original reported zenith account + a separately declared non-zenith airmass example. */
export function antennaTemperature(elevation = 90) {
  const angle = clampCosmo(elevation, 30, 90, 90),
    sky = PENZIAS_WILSON_RECORD.excessK,
    antenna = PENZIAS_WILSON_RECORD.antennaAndBacklobeK,
    atmosphere = PENZIAS_WILSON_RECORD.atmosphereK / Math.sin((angle * Math.PI) / 180);
  return { elevation: angle, sky, antenna, atmosphere, total: sky + antenna + atmosphere };
}
export function antennaBudget(subtract = 0) {
  const n = Math.round(clampCosmo(subtract, 0, 2)),
    r = PENZIAS_WILSON_RECORD;
  return {
    total: r.totalK,
    removedAtmosphere: n >= 1 ? r.atmosphereK : 0,
    removedAntenna: n >= 2 ? r.antennaAndBacklobeK : 0,
    remaining: r.totalK - (n >= 1 ? r.atmosphereK : 0) - (n >= 2 ? r.antennaAndBacklobeK : 0),
  };
}
export type CosmoPoint = { x: number; y: number };
/** The real horn axis, finite aperture, output and both selector routes share one geometry. */
export function hornGeometry(width = 268, height = 270, elevation = 60) {
  const w = clampCosmo(width, 240, 800, 268),
    h = clampCosmo(height, 240, 400, 270),
    phone = w < 400,
    angle = (clampCosmo(elevation, 30, 90, 60) * Math.PI) / 180,
    pivot = { x: phone ? w * 0.4 : 220, y: phone ? 130 : 140 },
    u = { x: -Math.cos(angle), y: -Math.sin(angle) },
    n = { x: -u.y, y: u.x },
    at = (s: number, side = 0): CosmoPoint => ({
      x: pivot.x + s * u.x + side * n.x,
      y: pivot.y + s * u.y + side * n.y,
    }),
    mouth = at(65),
    port = at(-26),
    selector = { x: phone ? w - 65 : w - 150, y: 163 },
    reference = { x: selector.x, y: 82 },
    receiver = { x: selector.x, y: h - 45 },
    throat = at(-8),
    incoming = at(100);
  return {
    pivot,
    u,
    n,
    mouth,
    port,
    selector,
    reference,
    receiver,
    throat,
    incoming,
    outline: [at(65, 27), at(-8, 8), at(-26, 8), at(-26, -8), at(-8, -8), at(65, -27)],
    skyRoute: [
      port,
      { x: selector.x - 21, y: port.y },
      { x: selector.x - 21, y: selector.y },
      selector,
      receiver,
    ],
    referenceRoute: [
      { x: reference.x, y: reference.y + 17 },
      { x: reference.x, y: selector.y - 17 },
      selector,
      receiver,
    ],
  };
}
/** Spectral radiance B_nu in MJy/sr. Frequency in Hz, thermodynamic T in kelvin. */
export function planckRadiance(frequencyHz: number, temperatureK: number) {
  const nu = clampCosmo(frequencyHz, 0, 1e15),
    T = clampCosmo(temperatureK, 0, 1e5);
  if (!nu || !T) return 0;
  const x = (PLANCK * nu) / (BOLTZMANN * T);
  return x > 700 ? 0 : ((2 * PLANCK * nu ** 3) / (LIGHT_SPEED ** 2 * Math.expm1(x))) * 1e20;
}
export function cooledRadiation(scale = 1) {
  const a = clampCosmo(scale, 1, 4, 1),
    temperature = 2.725 / a;
  return {
    scale: a,
    temperature,
    wavelengthRatio: a,
    photonEnergyRatio: 1 / a,
    peakFrequencyGHz: (2.8214393721220787 * BOLTZMANN * temperature) / PLANCK / 1e9,
    peakRadianceRatio: 1 / a ** 3,
    energyDensityRatio: 1 / a ** 4,
    spectrum: Array.from({ length: 181 }, (_, i) => ({
      frequencyGHz: i * 4,
      radiance: planckRadiance(i * 4e9, temperature),
    })),
  };
}
function longitudeAngle(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value >= -Math.PI && value <= Math.PI) return value;
  return ((((value + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
}
/** Synthetic low-order angular modes: explicitly not Planck observations. Zero monopole. */
export function skyFluctuation(longitude: number, latitude: number) {
  const lon = longitudeAngle(longitude),
    lat = clampCosmo(latitude, -Math.PI / 2, Math.PI / 2, 0),
    c = Math.cos(lat),
    s = Math.sin(lat);
  return (
    38 * c * c * Math.cos(2 * lon) +
    26 * c ** 3 * Math.sin(3 * lon) +
    (21 * (3 * s * s - 1)) / 2 +
    12 * c * s * Math.cos(lon)
  );
}
export function mollweide(longitude: number, latitude: number) {
  const lon = longitudeAngle(longitude),
    lat = clampCosmo(latitude, -Math.PI / 2, Math.PI / 2, 0);
  let theta = lat;
  if (Math.abs(lat) >= Math.PI / 2 - 1e-8) theta = (Math.sign(lat) * Math.PI) / 2;
  else
    for (let i = 0; i < 20; i++)
      theta -=
        (2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(lat)) / (2 + 2 * Math.cos(2 * theta));
  return { x: 170 + ((150 * lon) / Math.PI) * Math.cos(theta), y: 178 - 75 * Math.sin(theta) };
}
export type CosmoShot =
  | 'spectrum'
  | 'wave'
  | 'records'
  | 'field'
  | 'prediction'
  | 'horn'
  | 'airmass'
  | 'budget'
  | 'firas'
  | 'residual'
  | 'cooling'
  | 'map';
export type CosmoDirection = {
  shot: CosmoShot;
  progress: number;
  reveal: boolean;
  scale: number;
  origin: number;
  candidate: 'constant' | 'proportional';
  reference: boolean;
  elevation: number;
  subtract: number;
};
export const COSMO_CHAPTER_SECONDS = Object.freeze([38, 45, 33.5, 45, 50.5]);
/** Chapter-local seconds include the 0.45s speech lead-in. Independent ASR word timings,
 * batch-11-timed-speech/cosmology-observations-{zh,en}-{0..4}.json, bind these
 * events to zh07e19e06bd13 / en2a2f59e1d4ce. Fixed source records never use this clock. */
export const COSMO_MEASURED_CUTS = Object.freeze({
  zh: Object.freeze({
    thirdLine: 15.53,
    wave: 20.15,
    waveStart: 22.03,
    waveEnd: 25.27,
    candidate: 8.31,
    field: 19.91,
    fieldStart: 22.57,
    fieldEnd: 27.07,
    origin: 27.61,
    prediction: 30.45,
    distanceAnswer: 35.15,
    referenceOn: 4.55,
    referenceOff: 10.69,
    air: 15.09,
    lowerEnd: 19.53,
    zenithStart: 23.95,
    zenithEnd: 26.15,
    atmosphere: 5.39,
    antenna: 6.95,
    remainder: 10.31,
    firas: 23.01,
    residual: 37.29,
    thermalWaveStart: 4.69,
    thermalWaveEnd: 7.95,
    cooling: 10.79,
    coolingAnswer: 24.47,
    doubledScale: 26.49,
    today: 34.95,
    mapEnd: 45.87,
  }),
  en: Object.freeze({
    thirdLine: 16.47,
    wave: 20.85,
    waveStart: 22.59,
    waveEnd: 25.67,
    candidate: 8.91,
    field: 22.23,
    fieldStart: 24.69,
    fieldEnd: 29.41,
    origin: 29.41,
    prediction: 32.85,
    distanceAnswer: 38.53,
    referenceOn: 4.21,
    referenceOff: 10.45,
    air: 15.15,
    lowerEnd: 19.73,
    zenithStart: 24.93,
    zenithEnd: 27.85,
    atmosphere: 6.49,
    antenna: 8.39,
    remainder: 12.27,
    firas: 26.11,
    residual: 40.39,
    thermalWaveStart: 5.55,
    thermalWaveEnd: 9.73,
    cooling: 12.69,
    coolingAnswer: 29.31,
    doubledScale: 31.23,
    today: 40.79,
    mapEnd: 49.35,
  }),
});
export function cosmologyDirector(
  chapter = 0,
  chapterTime = 0,
  locale: 'zh' | 'en' = 'zh',
): CosmoDirection {
  const ch = Math.round(clampCosmo(chapter, 0, 4)),
    t = clampCosmo(chapterTime, 0, COSMO_CHAPTER_SECONDS[ch]),
    c = COSMO_MEASURED_CUTS[locale];
  const d: CosmoDirection = {
    shot: 'spectrum',
    progress: 0,
    reveal: false,
    scale: 1.05,
    origin: 2,
    candidate: 'proportional',
    reference: false,
    elevation: 90,
    subtract: 0,
  };
  if (ch === 0) {
    d.shot = t < c.wave ? 'spectrum' : 'wave';
    d.progress = part(t, c.waveStart, c.waveEnd);
    d.reveal = t >= c.thirdLine;
    d.scale = 1 + 0.5 * d.progress;
  } else if (ch === 1) {
    d.shot = t < c.field ? 'records' : t < c.prediction ? 'field' : 'prediction';
    d.candidate = t < c.candidate ? 'constant' : 'proportional';
    d.progress = part(t, c.fieldStart, c.fieldEnd);
    d.scale = 1 + 0.5 * d.progress;
    d.origin = t < c.origin ? 2 : 1;
    d.reveal = t >= c.distanceAnswer;
  } else if (ch === 2) {
    d.shot = t < c.air ? 'horn' : 'airmass';
    d.reference = t >= c.referenceOn && t < c.referenceOff;
    // The voiced intervention lowers the elevation; return to zenith only when
    // the unchanged historic 6.7 K zenith record is named.
    d.elevation =
      t < c.zenithStart
        ? 90 - 60 * part(t, c.air, c.lowerEnd)
        : 30 + 60 * part(t, c.zenithStart, c.zenithEnd);
    d.progress = t / COSMO_CHAPTER_SECONDS[ch];
  } else if (ch === 3) {
    d.shot = t < c.firas ? 'budget' : t < c.residual ? 'firas' : 'residual';
    d.subtract = t < c.atmosphere ? 0 : t < c.antenna ? 1 : 2;
    d.reveal = t >= c.remainder;
  } else {
    d.shot = t < c.cooling ? 'wave' : t < c.today ? 'cooling' : 'map';
    d.reveal = t >= c.coolingAnswer;
    d.progress = part(t, c.coolingAnswer, c.doubledScale);
    d.scale =
      t < c.cooling ? 1 + 0.5 * part(t, c.thermalWaveStart, c.thermalWaveEnd) : 1 + d.progress;
    if (t >= c.today) d.progress = part(t, c.today, c.mapEnd);
  }
  return d;
}
